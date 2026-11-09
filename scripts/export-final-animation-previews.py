"""Export stable, in-engine preview loops after test:final-animation screenshots exist."""
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'artifacts/final-animation';OUT=ROOT/'docs/art/final-frames';RACES=['muspel','alf','jotun','vanir','nid','skug']
def tile(sheet,pose):
 x=(pose%8)*170;y=(pose//8)*260
 return sheet.crop((x,y,x+170,y+232)).convert('RGB')
def montage(poses):
 frames=[]
 for pose in poses:
  canvas=Image.new('RGB',(1020,520),'#ece7d4');draw=ImageDraw.Draw(canvas)
  for row,gender in enumerate(['male','female']):
   for col,race in enumerate(RACES):
    sheet=Image.open(SRC/f'{race}-{gender}-1.png');canvas.paste(tile(sheet,pose),(col*170,row*260));draw.text((col*170+9,row*260+236),race+' / '+gender,fill='#42574e')
  frames.append(canvas)
 return frames
walk=montage([2,3,4,5]);walk[0].save(OUT/'walking-preview.gif',save_all=True,append_images=walk[1:],duration=110,loop=0,disposal=2,optimize=False)
attack=montage([0,6,7,8,9,10,8,0]);attack[0].save(OUT/'combat-preview.gif',save_all=True,append_images=attack[1:],duration=[250,180,100,150,160,110,180,350],loop=0,disposal=2,optimize=False)
# A readable still from the real renderer accompanies the loops.
montage([0])[0].save(OUT/'in-engine-lineup.webp',quality=94)
print('Exported in-engine twelve-outfit walk/combat loops and lineup')
