"""Read the repainted side carry/walk strips. Whole frames only; no limb transforms."""
from pathlib import Path
import numpy as np
from PIL import Image

def load_side_profiles(src,groups,clean):
 cache={}
 def read(name,sex,facing,pose):
  group='north' if name in ['muspel','alf','jotun'] else 'south';race=['muspel','alf','jotun','vanir','nid','skug'].index(name)%3
  source=src/'side-profiles'/(['male','female'][sex]+'-'+group+'.png')
  if source not in cache:cache[source]=Image.open(source).convert('RGBA')
  im=cache[source];row=race*2+(facing==4);raw=im.crop((round(pose*im.width/6),round(row*im.height/6),round((pose+1)*im.width/6),round((row+1)*im.height/6)));a=np.array(raw);r,g,b,al=[a[:,:,i].astype(float) for i in range(4)]
  masks={'neck':(g>145)&(g-r>30)&(g-b>35),'cyan':(g>125)&(b>125)&(g-r>35)&(b-r>35),'pink':(r>145)&(b>130)&(r-g>40)&(b-g>40)}
  points={};mask=np.zeros(al.shape,bool)
  for key,m in masks.items():
   m&=al>100;parts=[p for p in groups(m) if len(p)<150 and np.ptp(p[:,0])<16 and np.ptp(p[:,1])<16]
   if parts:
    p=max(parts,key=len);points[key]=tuple(p.mean(0))
   mask|=m
  wide=mask.copy()
  for dy in range(-2,3):
   for dx in range(-2,3):wide|=np.roll(np.roll(mask,dy,0),dx,1)
  painted=clean(a,wide)
  box=painted.getbbox();neck=points.get('neck',((box[0]+box[2])/2,box[1]+2))
  # Registration colours may be inconsistent on the far hand. The larger/more visible fist is the near arm.
  hands=[points[k] for k in ['cyan','pink'] if k in points]
  if not hands:raise ValueError(('No palm marker',source,row,pose))
  near=max(hands,key=lambda p:p[1]);far=min(hands,key=lambda p:p[1]) if len(hands)>1 else (neck[0]+(7 if facing==0 else -7),near[1]-7)
  if len(hands)>1 and abs(near[1]-far[1])<3:
   near=min(hands,key=lambda p:abs(p[0]-neck[0]));far=next(p for p in hands if p!=near)
  right,left=(near,far) if facing==0 else (far,near)
  return painted,neck,right,left,source.name,row,len(hands),'neck' in points
 return read
