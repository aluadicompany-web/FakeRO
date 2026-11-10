"""Export unretouched temporal samples from the actual starter HeroRig fixture."""
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'artifacts/starter-continuity';OUT=ROOT/'docs/art/starter-review';OUT.mkdir(exist_ok=True)
for weapon in ['sword','greatsword','bow','walk']:
 frames=[]
 for phase in range(8):
  canvas=Image.new('RGB',(540,660),'#ece7d4');draw=ImageDraw.Draw(canvas)
  for row,gender in enumerate(['male','female']):
   for col,facing in enumerate([0,1,6]):
    im=Image.open(SRC/f'skug-{gender}-{weapon}-{facing}.png');canvas.paste(im.crop((phase*180,0,(phase+1)*180,330)),(col*180,row*330));draw.text((col*180+6,row*330+315),gender+' / '+['side','front','back'][col],fill='#42574e')
  frames.append(canvas)
 frames[0].save(OUT/(weapon+'-slow.gif'),save_all=True,append_images=frames[1:],duration=280 if weapon!='walk' else 180,loop=0,disposal=2,optimize=False)
 for facing in [0,1,6]:Image.open(SRC/f'skug-male-{weapon}-{facing}.png').save(OUT/f'{weapon}-{facing}.webp',lossless=True)
print('Exported starter temporal samples, including unchanged discrete source-pose transitions')
