"""Normalize new painted archery/two-hand bodies, with explicitly coloured anatomical anchors."""
from pathlib import Path
from collections import deque
import json,math
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'docs/art/weapon-holding';OUT=ROOT/'public/art/holding-bodies';OUT.mkdir(exist_ok=True);SIZE=192
RACES=['muspel','alf','jotun','vanir','nid','skug']
def components(mask):
 seen=np.zeros(mask.shape,bool);parts=[]
 for y,x in zip(*np.where(mask)):
  if seen[y,x]:continue
  q=deque([(x,y)]);seen[y,x]=True;pts=[]
  while q:
   x,y=q.popleft();pts.append((x,y))
   for nx,ny in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
    if 0<=nx<mask.shape[1] and 0<=ny<mask.shape[0] and mask[ny,nx] and not seen[ny,nx]:seen[ny,nx]=True;q.append((nx,ny))
  parts.append(np.array(pts))
 return parts

def cut(im,col,row):
 raw=im.crop((round(col*im.width/8),round(row*im.height/8),round((col+1)*im.width/8),round((row+1)*im.height/8)));a=np.array(raw);parts=components(a[:,:,3]>80);assert parts
 p=max(parts,key=len);m=np.zeros(a.shape[:2],bool);m[p[:,1],p[:,0]]=True;wide=m.copy()
 for dy in range(-2,3):
  for dx in range(-2,3):wide|=np.roll(np.roll(m,dy,0),dx,1)
 a[~wide,3]=0;return a

def marks(a,two=False):
 r,g,b,al=[a[:,:,i].astype(float) for i in range(4)];masks={'neck':(g>150)&(g>r*1.2)&(g>b*1.3)&(b<160),'right':(g>140)&(b>145)&(g-r>25)&(b-r>30),'left':(r>155)&(b>145)&(g<190)&(r-g>45)&(b-g>45)};choices={}
 for role,m in masks.items():
  parts=[p for p in components(m&(al>100)) if len(p)<160 and np.ptp(p[:,0])<18 and np.ptp(p[:,1])<18]
  score=lambda p:float((g[p[:,1],p[:,0]]-np.maximum(r[p[:,1],p[:,0]],b[p[:,1],p[:,0]])).max()) if role=='neck' else float((np.minimum(g[p[:,1],p[:,0]],b[p[:,1],p[:,0]])-r[p[:,1],p[:,0]]).max()) if role=='right' else float((np.minimum(r[p[:,1],p[:,0]],b[p[:,1],p[:,0]])-g[p[:,1],p[:,0]]).max())
  parts.sort(key=score,reverse=True);choices[role]=parts
 if two and choices['left'] and choices['right']:
  left=choices['left'][0].mean(0);choices['right'].sort(key=lambda p:float(np.linalg.norm(p.mean(0)-left)));choices['right']=[p for p in choices['right'] if np.linalg.norm(p.mean(0)-left)<24]
 out={};mask=np.zeros(al.shape,bool)
 # Remove all registration colours, including secondary dots not selected as anchors.
 for m in masks.values():mask|=m&(al>30)
 for role,parts in choices.items():
  if parts:p=parts[0];out[role]=tuple(p.mean(0));mask[p[:,1],p[:,0]]=True
 wide=mask.copy()
 for dy in range(-2,3):
  for dx in range(-2,3):wide|=np.roll(np.roll(mask,dy,0),dx,1)
 return out,wide

def clean(a,mask):
 out=a.copy();out[out[:,:,3]<12,3]=0
 for y,x in zip(*np.where(mask)):
  for radius in [3,5,8]:
   y0=max(0,y-radius);y1=min(len(a),y+radius+1);x0=max(0,x-radius);x1=min(a.shape[1],x+radius+1);p=a[y0:y1,x0:x1];v=(~mask[y0:y1,x0:x1])&(p[:,:,3]>180)
   if v.any():out[y,x,:3]=np.median(p[v,:3],axis=0);break
  else:out[y,x,3]=0
 return Image.fromarray(out)

def atlas(entries,name):
 entries.sort(key=lambda e:(e[1].getbbox() or (0,0,1,1))[3]-(e[1].getbbox() or (0,0,1,1))[1],reverse=True);x=y=row=0;placed=[];width=2048
 for key,im in entries:
  box=im.getbbox() or (0,0,1,1);part=im.crop(box)
  if x+part.width+2>width:x=0;y+=row;row=0
  placed.append((key,part,box,x+1,y+1));x+=part.width+2;row=max(row,part.height+2)
 height=math.ceil((y+row)/64)*64;assert height<=4096;sheet=Image.new('RGBA',(width,height));frames={}
 for key,im,b,x,y in placed:
  sheet.alpha_composite(im,(x,y));frames[key]={'frame':{'x':x,'y':y,'w':im.width,'h':im.height},'rotated':False,'trimmed':True,'spriteSourceSize':{'x':b[0],'y':b[1],'w':im.width,'h':im.height},'sourceSize':{'w':SIZE,'h':SIZE}}
 sheet.save(OUT/(name+'.webp'),lossless=True,method=6,exact=True);(OUT/(name+'.json')).write_text(json.dumps({'frames':frames,'meta':{'image':name+'.webp','size':{'w':width,'h':height}}},separators=(',',':'))+'\n');return{'width':width,'height':height,'rgbaBytes':width*height*4}
frames=[];entries=[[],[]];missing=[]
for sex,gender in enumerate(['male','female']):
 for race,name in enumerate(RACES):
  source=SRC/(name+'-'+gender+'-source.png');im=Image.open(source).convert('RGBA');active=(np.array(im)[:,:,3]>180).sum(1)>im.width*.015;bands=[];start=None
  for y,hit in enumerate(active):
   if hit and start is None:start=y
   if start is not None and (not hit or y==len(active)-1):
    if y-start>20:bands.append((start,y))
    start=None
  assert len(bands)==8,('Wrong row count',name,gender,bands)
  for facing in range(8):
   seed=cut(im,0,facing);seedmarks,_=marks(seed);ys,xs=np.where(seed[:,:,3]>80);neck0=seedmarks.get('neck',(float(np.median(xs)),float(ys.min()+2)));scale=112/(ys.max()-neck0[1]);tx=96-neck0[0]*scale;ty=188-ys.max()*scale;previous={}
   for slot in range(8):
    a=cut(im,slot,facing);points,mask=marks(a,slot>=4);occluded=facing>=5 and slot>=4 and 'right' not in points and 'left' not in points
    if slot>=4 and 'right' not in points and 'left' not in points:
     nk=points.get('neck',neck0);dy=24 if facing>=5 else {4:52,5:-8,6:32,7:52}[slot];points['right']=(nk[0]+3,nk[1]+dy);points['left']=(nk[0]+5,nk[1]+dy+7);missing.append([name,gender,facing,slot,'hidden-two-hand'])
    for role in ['neck','right','left']:
     if role in points:continue
     missing.append([name,gender,facing,slot,role])
     if role=='neck':points[role]=seedmarks.get('neck',neck0)
     elif slot>=4 and role=='right' and 'left' in points:points[role]=(points['left'][0]-2,points['left'][1]-7)
     elif slot>=4 and role=='left' and 'right' in points:points[role]=(points['right'][0]+2,points['right'][1]+7)
     else:points[role]=previous.get(role,seedmarks.get(role,(neck0[0]+(-12 if role=='right' else 12),neck0[1]+45)))
    previous=points.copy();paint=clean(a,mask);paint=paint.resize((round(paint.width*scale),round(paint.height*scale)),Image.Resampling.LANCZOS);canvas=Image.new('RGBA',(SIZE,SIZE));canvas.alpha_composite(paint,(round(tx),round(ty)))
    def world(p):return{'x':round((p[0]*scale+tx-96)/2,3),'y':round((p[1]*scale+ty-192)/2,3)}
    palms={k:world(points[k]) for k in ['right','left']}
    if slot<4:
     fx=math.cos(facing*math.pi/4);fy=math.sin(facing*math.pi/4)*.55;forward=lambda p:p['x']*fx+p['y']*fy
     if forward(palms['right'])<forward(palms['left']):palms['right'],palms['left']=palms['left'],palms['right']
    neck=world(points['neck']);body=facing*12+sex*6+race;idx=1536+body*8+slot;data=np.array(canvas)
    # Markers can sit just beyond an occluded glove; register to the nearest actual opaque pixel.
    for role,p in palms.items():
     x=round(p['x']*2+96);y=round(p['y']*2+192);patch=data[max(0,y-2):min(SIZE,y+3),max(0,x-2):min(SIZE,x+3),3]
     if not patch.size or not (patch>80).any():
      yy,xx=np.where(data[:,:,3]>100);score=(xx-x)**2+(yy-y)**2;n=int(np.argmin(score));assert score[n]<625,('Grip too far',name,gender,facing,slot,role);p['x']=round((int(xx[n])-96)/2,3);p['y']=round((int(yy[n])-192)/2,3);missing.append([name,gender,facing,slot,role+'-registered'])
    glove=data.copy();yy,xx=np.indices((SIZE,SIZE));keep=np.zeros((SIZE,SIZE),bool)
    for p in palms.values():keep|=(xx-(p['x']*2+96))**2+(yy-(p['y']*2+192))**2<6**2
    glove[~keep,3]=0;entries[sex].extend([('body-'+str(idx),canvas),('hands-'+str(idx),Image.fromarray(glove))]);frames.append({'id':idx,'body':body,'pose':slot+16,'neck':neck,'palms':palms,'headPose':'normal','headTurn':'none','rightBehindBody':occluded or facing in [5,6,7] and slot<4,'source':source.name,'facing':facing,'gender':gender,'race':name})
frames.sort(key=lambda f:f['id']);stats={g:atlas(entries[i],g) for i,g in enumerate(['male','female'])};model={'version':1,'poses':['bow-guard','bow-half','bow-full','bow-release','two-guard','two-windup','two-contact','two-follow'],'frames':frames,'atlas':stats};(ROOT/'shared/holding-bodies.json').write_text(json.dumps(model,separators=(',',':'))+'\n');(OUT/'registration-report.json').write_text(json.dumps({'missing':missing},indent=2)+'\n');print(json.dumps({'frames':len(frames),'missing':len(missing),'atlas':stats}))
