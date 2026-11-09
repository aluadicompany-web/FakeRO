"""Normalize genuinely painted full-body poses. No limb transforms, IK, or v4 rig rendering.
The only image transforms are common sheet scaling, translation, trim, and head-sheet registration.
"""
from pathlib import Path
from collections import deque
import json,math
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'docs/art/characters-v5';OUT=ROOT/'public/art/characters-v5';OUT.mkdir(exist_ok=True)
RACES=['muspel','alf','jotun','vanir','nid','skug'];POSES=['idle','breathe','walk-left','pass-left','walk-right','pass-right','slash-windup','slash-contact','slash-follow','reverse','thrust','overhead','cast-gather','cast-release','hurt','fallen'];SIZE=192

def groups(mask):
 seen=np.zeros(mask.shape,bool);result=[]
 for y,x in zip(*np.where(mask)):
  if seen[y,x]:continue
  pts=[];q=deque([(x,y)]);seen[y,x]=True
  while q:
   x,y=q.popleft();pts.append((x,y))
   for nx,ny in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
    if 0<=ny<mask.shape[0] and 0<=nx<mask.shape[1] and mask[ny,nx] and not seen[ny,nx]:seen[ny,nx]=True;q.append((nx,ny))
  if len(pts)>=2:result.append(np.array(pts))
 return result

def cell(im,col,row,rows):
 raw=im.crop((round(col*im.width/16),round(row*im.height/rows),round((col+1)*im.width/16),round((row+1)*im.height/rows)));a=np.array(raw);parts=groups(a[:,:,3]>80)
 if parts:
  points=max(parts,key=len);keep=np.zeros(a.shape[:2],bool);keep[points[:,1],points[:,0]]=True;wide=keep.copy()
  for dy in range(-2,3):
   for dx in range(-2,3):wide|=np.roll(np.roll(keep,dy,axis=0),dx,axis=1)
  a[~wide,3]=0
 return Image.fromarray(a)
def markers(im):
 a=np.array(im);r,g,b,al=[a[:,:,i].astype(np.int16) for i in range(4)];lime=(r<195)&(g>150)&(b<150)&(g>r*1.15)&(g>b*1.25)&(al>160);cyan=(r<100)&(g>100)&(b>110)&(g>r*1.45)&(b>r*1.45)&(al>180)
 neck=sorted([p for p in groups(lime) if len(p)<150],key=lambda p:p[:,1].mean());hands=[p for p in groups(cyan) if 2<=len(p)<=120 and np.ptp(p[:,0])<13 and np.ptp(p[:,1])<13];hands=sorted(hands,key=len,reverse=True)[:2]
 mask=np.zeros(lime.shape,bool)
 for pts in neck[:1]+hands:mask[pts[:,1],pts[:,0]]=True
 wide=mask.copy()
 for dy in range(-2,3):
  for dx in range(-2,3):wide|=np.roll(np.roll(mask,dy,axis=0),dx,axis=1)
 return a,wide,(tuple(neck[0].mean(0)) if neck else None),[tuple(p.mean(0)) for p in hands]
def bbox(im):return Image.fromarray((np.array(im)[:,:,3]>80).astype(np.uint8)*255).getbbox()
def clean(a,mask):
 out=a.copy();out[out[:,:,3]<12,3]=0;out[out[:,:,3]>=245,3]=255;ys,xs=np.where(mask)
 for y,x in zip(ys,xs):
  for radius in [3,5,8]:
   y0=max(0,y-radius);y1=min(len(a),y+radius+1);x0=max(0,x-radius);x1=min(a.shape[1],x+radius+1);pixels=a[y0:y1,x0:x1];valid=(~mask[y0:y1,x0:x1])&(pixels[:,:,3]>180)
   if valid.any():out[y,x,:3]=np.median(pixels[valid,:3],axis=0);break
  else:out[y,x,3]=0
 return Image.fromarray(out)
def point(p,scale,tx,ty):return {'x':round((p[0]*scale+tx-SIZE/2)/2,3),'y':round((p[1]*scale+ty-SIZE)/2,3)}
def atlas(entries,prefix):
 # Shelf packing uses trimmed rectangles, never one GPU texture per costume/action.
 entries=sorted(entries,key=lambda e:e[1].getbbox()[3]-e[1].getbbox()[1] if e[1].getbbox() else 0,reverse=True);width=2048;x=y=row=0;placed=[]
 for name,im in entries:
  box=im.getbbox() or (0,0,1,1);crop=im.crop(box)
  if x+crop.width+2>width:x=0;y+=row;row=0
  placed.append((name,crop,box,x+1,y+1));x+=crop.width+2;row=max(row,crop.height+2)
 height=2**math.ceil(math.log2(max(1,y+row)));assert height<=8192,('Atlas too tall',prefix,height)
 sheet=Image.new('RGBA',(width,height));frames={}
 for name,im,box,x,y in placed:
  sheet.alpha_composite(im,(x,y));frames[name]={'frame':{'x':x,'y':y,'w':im.width,'h':im.height},'rotated':False,'trimmed':True,'spriteSourceSize':{'x':box[0],'y':box[1],'w':im.width,'h':im.height},'sourceSize':{'w':SIZE,'h':SIZE}}
 sheet.save(OUT/(prefix+'.webp'),lossless=True,method=6,exact=True);(OUT/(prefix+'.json')).write_text(json.dumps({'frames':frames,'meta':{'image':prefix+'.webp','size':{'w':width,'h':height}}},separators=(',',':'))+'\n')
 return {'width':width,'height':height,'frames':len(frames),'rgbaBytes':width*height*4}
def validate_rows(im,expected,name):
 active=(np.array(im)[:,:,3]>180).sum(axis=1)>max(12,im.width*.015);bands=[];start=None
 for y,hit in enumerate(active):
  if hit and start is None:start=y
  if start is not None and (not hit or y==len(active)-1):
   if y-start>20:bands.append((start,y))
   start=None
 assert len(bands)==expected,('Wrong painted row count',name,'expected',expected,'observed',bands)
source_cache={}
overrides=json.loads((SRC/'registration-overrides.json').read_text())
frames=[];entries=[[],[]];neutral={};missing=[]
for facing in range(8):
 for sex in range(2):
  for race,name in enumerate(RACES):
   if facing in [2,1,0,7,6]:source=SRC/(name+'-'+['male','female'][sex]+'-source.png');rows=5;row=[2,1,0,7,6].index(facing)
   else:source=SRC/(name+'-left-source.png');rows=6;row=[3,4,5].index(facing)+sex*3
   if source not in source_cache:
    source_cache[source]=Image.open(source).convert('RGBA');validate_rows(source_cache[source],rows,source.name)
   im=source_cache[source];seed=cell(im,0,row,rows);a,_,neck0,hands0=markers(seed);box=bbox(seed);neck0=neck0 or ((box[0]+box[2])/2,box[1]+2);scale=112/max(1,box[3]-neck0[1]);tx=96-neck0[0]*scale;ty=188-box[3]*scale
   for pose in range(16):
    raw=cell(im,pose,row,rows);a,mask,neck,hands=markers(raw);marker_neck=neck is not None;marker_hands=len(hands);box=bbox(raw);assert box,('Empty painted pose',source,row,pose)
    if neck is None:missing.append([name,sex,facing,pose,'neck']);neck=neck0 if pose!=15 else (box[0]+6 if facing in [3,4,5] else box[2]-6,(box[1]+box[3])/2)
    if len(hands)<2:missing.append([name,sex,facing,pose,'hands',len(hands)])
    baseline=list(hands0)
    if len(baseline)==1:baseline.append((2*neck0[0]-baseline[0][0],baseline[0][1]))
    if not baseline:baseline=[(neck0[0]-12,neck0[1]+55),(neck0[0]+12,neck0[1]+55)]
    base_right,base_left=sorted(baseline[:2],key=lambda p:p[0],reverse=facing>=5)
    if len(hands)>=2:
     off=min(range(2),key=lambda n:(hands[n][0]-base_left[0])**2+(hands[n][1]-base_left[1])**2);right,left=hands[1-off],hands[off]
     if pose in [0,1,2,3,4,5,12,14] and abs(hands[0][0]-hands[1][0])>4:right,left=sorted(hands,key=lambda p:p[0],reverse=facing>=5)
    elif len(hands)==1:
     if 6<=pose<=13:right=hands[0];left=(right[0]+3,right[1]+2) if pose in [8,11,12] else base_left
     elif abs(hands[0][0]-base_right[0])<=abs(hands[0][0]-base_left[0]):right,left=hands[0],base_left
     else:right,left=base_right,hands[0]
    else:right,left=base_right,base_left
    painted=clean(a,mask);painted=painted.resize((max(1,round(raw.width*scale)),max(1,round(raw.height*scale))),Image.Resampling.LANCZOS);canvas=Image.new('RGBA',(SIZE,SIZE));canvas.alpha_composite(painted,(round(tx),round(ty)));body=facing*12+sex*6+race;idx=body*16+pose;key='body-'+str(idx);entries[sex].append((key,canvas))
    palms={k:point(v,scale,tx,ty) for k,v in [('right',right),('left',left)]};override=overrides.get(str(idx),{});neck_world=point(neck,scale,tx,ty)
    for side in ['right','left']:
     if side+'Offset' in override:palms[side]={axis:round(neck_world[axis]+override[side+'Offset'][axis],3) for axis in ['x','y']}
    if pose!=15:
     palm=palms['right'];cx=round(palm['x']*2+96);cy=round(palm['y']*2+192);region=np.array(canvas)[max(0,cy-3):min(SIZE,cy+4),max(0,cx-3):min(SIZE,cx+4),3];assert region.size and (region>80).any(),('Floating right grip',idx)
    gloves=Image.new('RGBA',(SIZE,SIZE));alpha=np.zeros((SIZE,SIZE),np.uint8);yy,xx=np.indices(alpha.shape)
    for hand in palms.values():alpha[((xx-(hand['x']*2+96))**2+(yy-(hand['y']*2+192))**2)<(3.3*2)**2]=255
    glove=np.array(canvas);glove[:,:,3]=np.minimum(glove[:,:,3],alpha);entries[sex].append(('hands-'+str(idx),Image.fromarray(glove)))
    meta={'id':idx,'body':body,'pose':pose,'race':name,'gender':['male','female'][sex],'facing':facing,'neck':point(neck,scale,tx,ty),'palms':palms,'headPose':'fallen' if pose==15 else 'normal','headTurn':('left' if neck[0]<(box[0]+box[2])/2 else 'right') if pose==15 else 'none','source':source.name,'row':row,'column':pose,'markerHands':marker_hands,'markerNeck':marker_neck,'rightBehindBody':override.get('rightBehindBody',False)};frames.append(meta)
    if pose==0:neutral[body]=canvas
# Neutral grid powers the same creator/portrait as live frame-zero outfits.
grid=Image.new('RGBA',(6*SIZE,16*SIZE))
for body,im in neutral.items():grid.alpha_composite(im,(body%6*SIZE,body//6*SIZE))
grid.save(OUT/'costumes.webp',lossless=True,method=6,exact=True)
# The approved modular head art is reusable across body frames, as with classic ACT offsets.
old=ROOT/'public/art/characters-v4';heads=Image.open(old/'head-atlas.png').convert('RGBA');spec=json.loads((old/'head-atlas.json').read_text());head_entries=[]
for key,f in spec['frames'].items():
 box=f['frame'];pos=f['spriteSourceSize'];crop=heads.crop((box['x'],box['y'],box['x']+box['w'],box['y']+box['h']));canvas=Image.new('RGBA',(SIZE,SIZE));canvas.alpha_composite(crop,(pos['x']+32,pos['y']));head_entries.append((key,canvas));
 for side,angle in [('left',90),('right',-90)]:head_entries.append(('fallen-'+side+'-'+key,canvas.rotate(angle,Image.Resampling.BICUBIC,center=(96,86))))
frames.sort(key=lambda f:f['id']);stats={'male':atlas(entries[0],'body-male'),'female':atlas(entries[1],'body-female'),'head':atlas(head_entries,'head')};manifest={'version':5,'frameWidth':SIZE,'frameHeight':SIZE,'poses':POSES,'bodyFrames':len(frames),'paintedSourceFrames':len(frames),'directions':8,'outfits':12,'atlas':stats,'frames':frames}
(ROOT/'shared/character-animation.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n');(OUT/'manifest.json').write_text(json.dumps({k:v for k,v in manifest.items() if k!='frames'},indent=2)+'\n');(OUT/'registration-report.json').write_text(json.dumps({'frames':len(frames),'missingMarkers':missing},indent=2)+'\n');print(json.dumps({'frames':len(frames),'missingMarkers':len(missing),'atlas':stats}))
