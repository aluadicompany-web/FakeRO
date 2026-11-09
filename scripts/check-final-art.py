"""Check packed collars and real glove pixels, rather than accepting any torso pixel as a fist."""
from pathlib import Path
import json,runpy
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];u=runpy.run_path(str(ROOT/'scripts/painted-art-utils.py'))
edge=np.zeros((8,8),bool);edge[-1,4]=True;assert not u['dilate'](edge,1)[0].any(),'cell-edge dilation must not wrap'
art=json.loads((ROOT/'shared/coherent-animation.json').read_text());atlases={};images={};checked=0
for f in art['frames']:
 key=f['race']+'-'+f['gender']
 if key not in atlases:
  atlases[key]=json.loads((ROOT/'public/art/final-frames'/(key+'.json')).read_text())['frames'];images[key]=np.array(Image.open(ROOT/'public/art/final-frames'/(key+'.webp')).convert('RGBA'))[:,:,3]
 def alpha(frame):
  spec=atlases[key][frame];b=spec['frame'];p=spec['spriteSourceSize'];out=np.zeros((192,192),np.uint8);out[p['y']:p['y']+p['h'],p['x']:p['x']+p['w']]=images[key][b['y']:b['y']+b['h'],b['x']:b['x']+b['w']];return out
 body=alpha(f['frameKey']);x=round(f['neck']['x']*2+96);y=round(f['neck']['y']*2+192)
 assert (body[max(0,y-4):min(192,y+8),max(0,x-7):min(192,x+8)]>100).any(),f'collar gap {f["id"]}'
 for name,hand,hidden in [('mainHandKey','right','mainHidden'),('offHandKey','left','offHidden')]:
  glove=alpha(f[name]);p=f['palms'][hand];x=round(p['x']*2+96);y=round(p['y']*2+192)
  if not f[hidden]:assert (glove[max(0,y-5):min(192,y+6),max(0,x-5):min(192,x+6)]>100).any(),f'grip misses literal glove {f["id"]} {hand}'
 checked+=1
print(f'PASS {checked} packed collars and literal glove layers; cell dilation never wraps')
