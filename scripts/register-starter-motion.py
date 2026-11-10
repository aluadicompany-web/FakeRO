"""Measure starter torso lean from packed cloth. Leave already verified collar/palm registrations unchanged."""
from pathlib import Path
import json,math
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];cache={};rows=[]
frames=json.loads((ROOT/'shared/character-animation.json').read_text())['frames']+json.loads((ROOT/'shared/holding-bodies.json').read_text())['frames']
for f in frames:
 path=ROOT/'public/art'/('holding-bodies/'+f['gender'] if f['pose']>=16 else 'characters-v5/body-'+f['gender'])
 if path not in cache:cache[path]=(json.loads(path.with_suffix('.json').read_text())['frames'],np.array(Image.open(path.with_suffix('.webp')).convert('RGBA'))[:,:,3])
 spec,atlas=cache[path];s=spec['body-'+str(f['id'])];b=s['frame'];p=s['spriteSourceSize'];alpha=np.zeros((192,192),np.uint8);alpha[p['y']:p['y']+p['h'],p['x']:p['x']+p['w']]=atlas[b['y']:b['y']+b['h'],b['x']:b['x']+b['w']]
 nx=f['neck']['x']*2+96;ny=f['neck']['y']*2+192;centers=[]
 if f['headPose']!='fallen':
  region=alpha[max(0,round(ny)-3):min(192,round(ny)+9),max(0,round(nx)-7):min(192,round(nx)+8)]
  assert region.size and (region>160).any(),('starter collar gap',f['id'])
  # Sample the core waist, below the raised forearms, not the full cape/arm silhouette.
  for y in range(max(0,round(ny)+25),min(192,round(ny)+37)):
   xs=np.where(alpha[y]>180)[0];xs=xs[np.abs(xs-nx)<=27]
   if len(xs)>=8:centers.append(((float(xs.min())+float(xs.max()))/2,y))
 if centers:
  wx,wy=np.median(centers,axis=0);roll=float(np.clip(math.atan2(nx-wx,wy-ny)*.65,-.22,.22))
 else:roll=0
 rows.append({'id':f['id'],'headRotation':round(roll,5),'collarVerified':f['headPose']!='fallen','waistSamples':len(centers)})
rows.sort(key=lambda r:r['id']);assert [r['id'] for r in rows]==list(range(2304))
(ROOT/'shared/starter-motion.json').write_text(json.dumps({'version':1,'headScale':.9,'headOverlap':3,'frames':rows},separators=(',',':'))+'\n')
print('Registered',len(rows),'starter poses; verified 2208 standing collars; torso roll from packed waist cloth')
