from pathlib import Path
from PIL import Image
import numpy as np,json
root=Path(__file__).resolve().parents[1];im=Image.open(root/'docs/art/tower-guards-source.png').convert('RGBA');out=Image.new('RGBA',(192*4,288*2));heights=[];cells=[]
for row in range(2):
 group=[]
 for col in range(4):
  raw=im.crop((col*im.width//4,row*im.height//2,(col+1)*im.width//4,(row+1)*im.height//2));a=np.array(raw);a[a[:,:,3]<12,3]=0;raw=Image.fromarray(a);ys,xs=np.where(a[:,:,3]>100);heights.append(int(ys.max()-ys.min()));group.append(raw)
 cells.append(group)
scale=244/float(np.median(heights))
for row,group in enumerate(cells):
 a=np.array(group[0]);ys,xs=np.where(a[:,:,3]>100);sole=int(ys.max());band=np.where((a[:,:,3]>100)&(np.indices(a.shape[:2])[0]>sole-8));foot=float(band[1].mean());tx=96-foot*scale;ty=280-sole*scale
 for col,raw in enumerate(group):
  frame=Image.new('RGBA',(192,288));raw=raw.resize((round(raw.width*scale),round(raw.height*scale)),Image.Resampling.LANCZOS);frame.alpha_composite(raw,(round(tx),round(ty)));out.alpha_composite(frame,(col*192,row*288))
path=root/'public/art/npcs';path.mkdir(exist_ok=True);out.save(path/'tower-guards.webp',lossless=True,method=6,exact=True);(path/'tower-guards.json').write_text(json.dumps({'columns':4,'rows':2,'frameWidth':192,'frameHeight':288,'frames':8,'source':'docs/art/tower-guards-source.png'},indent=2)+'\n');print('Prepared 8 painted guard idle frames')
