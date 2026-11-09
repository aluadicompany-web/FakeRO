"""Pixel-level collar checks, including the cell-edge wrap regression."""
from pathlib import Path
import json,runpy
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];u=runpy.run_path(str(ROOT/'scripts/painted-art-utils.py'))
edge=np.zeros((8,8),bool);edge[-1,4]=True;assert not u['dilate'](edge,1)[0].any(),'dilation must not wrap a boot fragment into the next collar'
art=json.loads((ROOT/'shared/final-animation.json').read_text());atlases={};images={};checked=0;bad=[]
for f in art['frames']:
 if f['pose']>5:continue
 key=f['race']+'-'+f['gender']
 if key not in atlases:
  atlases[key]=json.loads((ROOT/'public/art/final-frames'/(key+'.json')).read_text())['frames'];images[key]=np.array(Image.open(ROOT/'public/art/final-frames'/(key+'.webp')).convert('RGBA'))[:,:,3]
 spec=atlases[key]['body-'+str(f['id'])];b=spec['frame'];p=spec['spriteSourceSize'];alpha=np.zeros((192,192),np.uint8);alpha[p['y']:p['y']+p['h'],p['x']:p['x']+p['w']]=images[key][b['y']:b['y']+b['h'],b['x']:b['x']+b['w']]
 x=round(f['neck']['x']*2+96);y=round(f['neck']['y']*2+192);region=alpha[max(0,y-3):min(192,y+7),max(0,x-6):min(192,x+7)];checked+=1
 if not region.size or not (region>160).any():bad.append({'id':f['id'],'race':f['race'],'gender':f['gender'],'facing':f['facing'],'pose':f['pose'],'neck':f['neck']})
if bad:
 print(json.dumps({'collars':checked,'gaps':bad},indent=2));raise SystemExit(1)
print(f'PASS {checked} painted idle/walk collars touch their registered neck; cell dilation never wraps')
