from pathlib import Path
from PIL import Image
import json
import numpy as np
root=Path(__file__).resolve().parents[1];im=Image.open(root/'docs/art/items/basic-source.png').convert('RGBA');out=root/'public/art/items';sheet=Image.new('RGBA',(384,384));frames={}
# Align row cuts to the actual transparent gutters rather than equal image fractions.
alpha=(np.array(im)[:,:,3]>128).sum(1);cuts=[0]
for row in range(1,6):
 centre=round(im.height*row/6);lo=centre-45;hi=centre+45;cuts.append(lo+int(alpha[lo:hi].argmin()))
cuts.append(im.height)
for i in range(36):
 x=i%6;y=i//6;cell=im.crop((round(x*im.width/6),cuts[y],round((x+1)*im.width/6),cuts[y+1]));box=cell.getbbox()
 if box:cell=cell.crop(box)
 cell.thumbnail((58,58),Image.Resampling.LANCZOS);sheet.alpha_composite(cell,(x*64+(64-cell.width)//2,y*64+(64-cell.height)//2));frames[str(i)]={'frame':{'x':x*64,'y':y*64,'w':64,'h':64},'rotated':False,'trimmed':False,'spriteSourceSize':{'x':0,'y':0,'w':64,'h':64},'sourceSize':{'w':64,'h':64}}
sheet.save(out/'basic.webp',lossless=True);(out/'basic.json').write_text(json.dumps({'frames':frames,'meta':{'image':'basic.webp','size':{'w':384,'h':384}}}))
