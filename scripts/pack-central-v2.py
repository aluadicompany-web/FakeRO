"""Alpha-matte and pack original city sprites, preserving painted RGB and complete silhouettes."""
from pathlib import Path
from collections import deque
from PIL import Image
import numpy as np,json,math
root=Path(__file__).resolve().parents[1];src=root/'docs/art/central-v2';out=root/'public/art/world/central-v2';out.mkdir(exist_ok=True);entries=[]
def matte(im,low,high):
 a=np.array(im.convert('RGBA'));a[:,:,3]=np.clip((a[:,:,3].astype(float)-low)*255/(high-low),0,255).astype(np.uint8);return Image.fromarray(a)
def split(im,offset):
 a=np.array(im);alpha=a[:,:,3];h,w=alpha.shape;labels=np.zeros((h,w),np.int32);parts=[];number=0
 for y,x in zip(*np.where(alpha>90)):
  if labels[y,x]:continue
  number+=1;labels[y,x]=number;q=deque([(x,y)]);pts=[]
  while q:
   xx,yy=q.popleft();pts.append((xx,yy))
   for nx,ny in [(xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)]:
    if 0<=nx<w and 0<=ny<h and not labels[ny,nx] and alpha[ny,nx]>90:labels[ny,nx]=number;q.append((nx,ny))
  if len(pts)>=18:
   p=np.array(pts);slot=min(3,int(p[:,0].mean()/w*4))+min(2,int(p[:,1].mean()/h*3))*4;parts.append((number,slot,p))
 for slot in range(12):
  selected=[p for p in parts if p[1]==slot];assert selected,('Empty sprite',offset,slot);coords=np.concatenate([p[2]for p in selected]);x0,y0=coords.min(0);x1,y1=coords.max(0)+1;mask=np.isin(labels[y0:y1,x0:x1],[p[0]for p in selected]);wide=mask.copy()
  for dy in [-1,0,1]:
   for dx in [-1,0,1]:wide|=np.roll(np.roll(mask,dy,0),dx,1)
  cell=a[y0:y1,x0:x1].copy();cell[~wide,3]=0;pic=Image.fromarray(cell);pic.thumbnail((512 if slot==1 and offset==0 else 384,512),Image.Resampling.LANCZOS);entries.append((str(offset+slot),pic))
split(matte(Image.open(src/'landmarks-source.png'),235,253),0);split(matte(Image.open(src/'market-source.png'),242,251),12)
tree=matte(Image.open(src/'yggdrasil-source.png'),235,253);tree=tree.crop(tree.getbbox());tree.thumbnail((1400,900),Image.Resampling.LANCZOS);entries.append(('24',tree));entries.sort(key=lambda p:p[1].height,reverse=True)
width=2048;x=y=row=0;placed=[]
for key,im in entries:
 if x+im.width+4>width:x=0;y+=row;row=0
 placed.append((key,im,x+2,y+2));x+=im.width+4;row=max(row,im.height+4)
height=math.ceil((y+row)/256)*256;assert height<=4096;atlas=Image.new('RGBA',(width,height));frames={}
for key,im,x,y in placed:
 atlas.alpha_composite(im,(x,y));frames[key]={'frame':{'x':x,'y':y,'w':im.width,'h':im.height},'rotated':False,'trimmed':False,'spriteSourceSize':{'x':0,'y':0,'w':im.width,'h':im.height},'sourceSize':{'w':im.width,'h':im.height}}
atlas.save(out/'city.webp',lossless=True,method=6);(out/'city.json').write_text(json.dumps({'frames':frames,'meta':{'image':'city.webp','size':{'w':width,'h':height}}},separators=(',',':'))+'\n');Image.open(src/'surfaces-source.png').convert('RGB').resize((768,512),Image.Resampling.LANCZOS).save(out/'surfaces.webp',quality=94);print(json.dumps({'sprites':len(frames),'width':width,'height':height,'rgbaMiB':width*height*4/1024**2}))
