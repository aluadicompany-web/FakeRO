"""Export unretouched, fixed-scale renderer frames in temporal order (test:final-animation first)."""
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'artifacts/final-animation';OUT=ROOT/'docs/art/final-frames';OUT.mkdir(exist_ok=True);RACES=['muspel','alf','jotun','vanir','nid','skug']
def tile(sheet,phase):return sheet.crop((phase*180,20,(phase+1)*180,310)).convert('RGB')
def montage(family,phase):
 canvas=Image.new('RGB',(1080,660),'#ece7d4');draw=ImageDraw.Draw(canvas)
 for row,gender in enumerate(['male','female']):
  for col,race in enumerate(RACES):
   sheet=Image.open(SRC/f'{race}-{gender}-{family}-1.png');canvas.paste(tile(sheet,phase),(col*180,row*330));draw.text((col*180+8,row*330+300),race+' / '+gender,fill='#42574e')
 return canvas
for family,name in [('walk','walking-preview'),('one','combat-preview'),('two','two-hand-preview'),('bow','bow-preview')]:
 route=list(range(8)) if family=='walk' else list(range(8))+list(range(7,-1,-1))
 frames=[montage(family,p) for p in route];frames[0].save(OUT/(name+'.gif'),save_all=True,append_images=frames[1:],duration=180 if family=='walk' else 280,loop=0,disposal=2,optimize=False)
montage('one',0).save(OUT/'in-engine-lineup.webp',quality=94)
# Large side/back sequential contact sheets make source anatomy reviewable without a fast loop.
for family in ['one','two','bow','walk']:
 for facing in [0,1,6]:
  Image.open(SRC/f'skug-male-{family}-{facing}.png').save(OUT/f'continuity-{family}-{facing}.webp',lossless=True)
print('Exported fixed-scale continuous walk, forward/return cuts, two-hand and bow loops plus side/back contact sheets')
