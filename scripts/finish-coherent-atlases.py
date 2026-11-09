"""Clear residual antialiased technical colors and compose matching idle portraits."""
from pathlib import Path
from PIL import Image
import numpy as np,json
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'public/art/final-frames'
for path in out.glob('*.webp'):
 if path.stem.rsplit('-',1)[-1].isdigit():continue
 a=np.array(Image.open(path).convert('RGBA'));r,g,b=[a[:,:,i].astype(float) for i in range(3)]
 technical=((g>155)&(g>r+70)&(g>b+70))|((r>175)&(b>175)&(r>g+80)&(b>g+80))|((g>160)&(b>160)&(g>r+80)&(b>r+80))|((b>170)&(b>r+115)&(b>g+115))|((r>200)&(r>g+140)&(r>b+140))
 count=int((technical&(a[:,:,3]>0)).sum());a[technical]=0;Image.fromarray(a).save(path,lossless=True,method=6);print(path.name,count,flush=True)
 # Portraits must include both actual glove layers, in the same depth order as the runtime.
 spec=json.load(open(path.with_suffix('.json')))['frames'];meta=json.load(open(ROOT/'shared/coherent-animation.json'))['frames'];atlas=Image.fromarray(a)
 for f in meta:
  if f['race']+'-'+f['gender']!=path.stem or f['family']!='one' or f['phase']!=0:continue
  def frame(key):
   s=spec[key];b=s['frame'];p=s['spriteSourceSize'];im=Image.new('RGBA',(192,192));im.alpha_composite(atlas.crop((b['x'],b['y'],b['x']+b['w'],b['y']+b['h'])),(p['x'],p['y']));return im
  body=frame(f['frameKey']);main=frame(f['mainHandKey']);off=frame(f['offHandKey']);im=Image.new('RGBA',(192,192))
  for layer in [off if f['offBehind'] else None,main if f['mainBehind'] else None,body,off if not f['offBehind'] else None,main if not f['mainBehind'] else None]:
   if layer is not None:im.alpha_composite(layer)
  im.resize((384,384),Image.Resampling.LANCZOS).crop((64,0,320,384)).save(out/(path.stem+'-'+str(f['facing'])+'.webp'),lossless=True,method=6)
