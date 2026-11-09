"""Shared lossless packing helpers. No articulation or invented action frames."""
from collections import deque
from pathlib import Path
import json,math
import numpy as np
from PIL import Image
try:
 from scipy import ndimage
except ImportError:
 ndimage=None

def components(mask,min_size=2):
 if ndimage is not None:
  labels,count=ndimage.label(mask);sizes=np.bincount(labels.ravel());out=[]
  for label,region in enumerate(ndimage.find_objects(labels),1):
   if region is None or sizes[label]<min_size:continue
   ys,xs=np.where(labels[region]==label);out.append(np.column_stack((xs+region[1].start,ys+region[0].start)))
  return out
 seen=np.zeros(mask.shape,bool);out=[]
 for y,x in zip(*np.where(mask)):
  if seen[y,x]:continue
  seen[y,x]=True;q=deque([(x,y)]);points=[]
  while q:
   x,y=q.popleft();points.append((x,y))
   for nx,ny in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
    if 0<=ny<mask.shape[0] and 0<=nx<mask.shape[1] and mask[ny,nx] and not seen[ny,nx]:seen[ny,nx]=True;q.append((nx,ny))
  if len(points)>=min_size:out.append(np.array(points))
 return out

def dilate(mask,radius):
 # Zero padding is essential: rolling a cell wraps neighbouring-row pixels into its collar.
 padded=np.pad(mask,radius);out=np.zeros(mask.shape,bool)
 for dy in range(2*radius+1):
  for dx in range(2*radius+1):out|=padded[dy:dy+mask.shape[0],dx:dx+mask.shape[1]]
 return out

def cell(source,col,row,cols,rows):
 raw=source.crop((round(col*source.width/cols),round(row*source.height/rows),round((col+1)*source.width/cols),round((row+1)*source.height/rows)));a=np.array(raw)
 # Generations can have a low-opacity matte. Keep painted foreground connected to its main silhouette.
 a[a[:,:,3]<120,3]=0;parts=components(a[:,:,3]>180,10)
 if not parts:raise ValueError(('Empty painted cell',col,row,cols,rows))
 pts=max(parts,key=len);keep=np.zeros(a.shape[:2],bool);keep[pts[:,1],pts[:,0]]=True;a[~dilate(keep,1),3]=0
 return a

def marks(a):
 r,g,b,alpha=[a[:,:,i].astype(float) for i in range(4)]
 masks={'neck':(g>110)&(g-r>15)&(g-b>65),'right':(g>85)&(b>85)&(g-r>50)&(b-r>50)&(abs(g-b)<45),'left':(r>85)&(b>85)&(r-g>55)&(b-g>55)}
 points={};mask=np.zeros(alpha.shape,bool)
 for name,m in masks.items():
  groups=[p for p in components(m&(alpha>100)) if len(p)<=180 and np.ptp(p[:,0])<20 and np.ptp(p[:,1])<20]
  if groups:
   # Actual marker color is more saturated than blue-white or violet costume trim.
   saturation=lambda p:float((np.maximum.reduce([r,g,b])-np.minimum.reduce([r,g,b]))[p[:,1],p[:,0]].mean())
   groups.sort(key=saturation,reverse=True)
   if name=='neck':
    upper=[p for p in groups if p[:,1].mean()<a.shape[0]*.35]
    if upper:groups=sorted(upper,key=lambda p:p[:,1].mean())
   points[name]=tuple(groups[0].mean(0));p=groups[0];mask[p[:,1],p[:,0]]=True
 return points,dilate(mask,1)

def clean_markers(a,mask):
 out=a.copy()
 for y,x in zip(*np.where(mask)):
  for radius in [2,4,7]:
   y0=max(0,y-radius);y1=min(len(a),y+radius+1);x0=max(0,x-radius);x1=min(a.shape[1],x+radius+1);p=a[y0:y1,x0:x1];valid=(~mask[y0:y1,x0:x1])&(p[:,:,3]>180)
   if valid.any():out[y,x,:3]=np.median(p[valid,:3],axis=0);break
  else:out[y,x,3]=0
 out[out[:,:,3]<140,3]=0;out[out[:,:,3]>245,3]=255
 return Image.fromarray(out)

def atlas(entries,out,prefix,size,limit=4096):
 width=2048;x=y=row=0;placed=[]
 entries=sorted(entries,key=lambda e:(e[1].getbbox() or (0,0,1,1))[3]-(e[1].getbbox() or (0,0,1,1))[1],reverse=True)
 for key,im in entries:
  box=im.getbbox() or (0,0,1,1);crop=im.crop(box)
  if x+crop.width+2>width:x=0;y+=row;row=0
  placed.append((key,crop,box,x+1,y+1));x+=crop.width+2;row=max(row,crop.height+2)
 height=2**math.ceil(math.log2(max(1,y+row)));assert height<=limit,(prefix,'Atlas exceeds texture limit',height)
 sheet=Image.new('RGBA',(width,height));frames={}
 for key,im,box,x,y in placed:
  sheet.alpha_composite(im,(x,y));frames[key]={'frame':{'x':x,'y':y,'w':im.width,'h':im.height},'rotated':False,'trimmed':True,'spriteSourceSize':{'x':box[0],'y':box[1],'w':im.width,'h':im.height},'sourceSize':{'w':size,'h':size}}
 out.mkdir(parents=True,exist_ok=True);sheet.save(out/(prefix+'.webp'),lossless=True,method=6,exact=True);(out/(prefix+'.json')).write_text(json.dumps({'frames':frames,'meta':{'image':prefix+'.webp','size':{'w':width,'h':height}}},separators=(',',':'))+'\n')
 return {'width':width,'height':height,'rgbaBytes':width*height*4,'frames':len(entries)}
