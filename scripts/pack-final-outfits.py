"""Register original headless turnarounds to the existing modular-head socket.
Only crop, shared per-outfit scale and translation; never invent missing views.
"""
from pathlib import Path
from collections import deque
import json
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'docs/art/final-outfits';OUT=ROOT/'public/art/final-outfits';OUT.mkdir(parents=True,exist_ok=True)
RACES=['muspel','alf','jotun','vanir','nid','skug'];VIEWS=['front','side','back']
manifest={'version':1,'status':'static-design-turnaround','width':256,'height':384,'neck':{'x':128,'y':144},'footY':376,'frames':[]}
contact=Image.new('RGB',(6*256,2*430),'#e6e1ce');draw=ImageDraw.Draw(contact)
for race_i,race in enumerate(RACES):
 source=Image.open(SRC/(race+'-source.png')).convert('RGBA')
 for sex,gender in enumerate(['male','female']):
  cells=[]
  for view_i,view in enumerate(VIEWS):
   raw=source.crop((round(view_i*source.width/3),round(sex*source.height/2),round((view_i+1)*source.width/3),round((sex+1)*source.height/2)))
   a=np.array(raw);mask=a[:,:,3]>245;seen=np.zeros(mask.shape,bool);groups=[]
   for y,x in zip(*np.where(mask)):
    if seen[y,x]:continue
    queue=deque([(x,y)]);seen[y,x]=True;points=[]
    while queue:
     xx,yy=queue.popleft();points.append((xx,yy))
     for nx,ny in [(xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)]:
      if 0<=ny<len(mask) and 0<=nx<mask.shape[1] and mask[ny,nx] and not seen[ny,nx]:seen[ny,nx]=True;queue.append((nx,ny))
    if len(points)>100:groups.append(points)
   assert groups,('Empty costume',race,gender,view)
   keep=np.zeros(mask.shape,bool)
   points=max(groups,key=len)
   for x,y in points:keep[y,x]=True
   # Remove generated low-opacity matte/glow, retain the painted silhouette edge.
   wide=keep.copy()
   for dy in [-1,0,1]:
    for dx in [-1,0,1]:wide|=np.roll(np.roll(keep,dy,axis=0),dx,axis=1)
   alpha=np.clip((a[:,:,3].astype(float)-220)*255/33,0,255).astype(np.uint8);alpha[~wide]=0;a[:,:,3]=alpha
   clean=Image.fromarray(a);box=clean.getbbox();assert box and box[3]-box[1]>raw.height*.55,(race,gender,view,box)
   # Highest central collar rim is the head socket, independent of cape width.
   ys,xs=np.where(keep);top=int(ys.min());band=(ys<=top+max(4,int((ys.max()-top)*.025)));neck_x=float(np.median(xs[band]));neck_y=float(top)
   cells.append((clean,box,neck_x,neck_y))
  # One scale shared by all three views of the same design. No independent limb resizing.
  scale=232/max(box[3]-ny for _,box,nx,ny in cells)
  for view,(clean,box,nx,ny) in zip(VIEWS,cells):
   image=clean.resize((round(clean.width*scale),round(clean.height*scale)),Image.Resampling.LANCZOS);canvas=Image.new('RGBA',(256,384));tx=round(128-nx*scale);ty=round(144-ny*scale);canvas.alpha_composite(image,(tx,ty));bbox=canvas.getbbox();assert bbox and bbox[0]>0 and bbox[2]<256 and bbox[3]<=380,('Clipped costume',race,gender,view,bbox)
   name=f'{race}-{gender}-{view}.webp';canvas.save(OUT/name,lossless=True,method=6)
   manifest['frames'].append({'id':f'final-{race}-{gender}','race':race,'gender':gender,'view':view,'asset':name,'neck':{'x':128,'y':144},'bounds':bbox,'scale':round(scale,6)})
   if view=='front':
    x=race_i*256;y=sex*430;contact.paste(canvas,(x,y),canvas);draw.text((x+10,y+392),race+' / '+gender,fill='#38494a')
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');contact.save(ROOT/'docs/art/final-outfits/lineup.webp',quality=92)
print('Packed 12 original outfits / 36 painted views; shared scale per outfit, registered head sockets')
