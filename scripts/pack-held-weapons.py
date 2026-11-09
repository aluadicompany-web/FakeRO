"""Prepare perspective sprite variants from FakeRO item art, preserving catalogue identities.
These are projected asset variants, not a claim that every weapon angle was separately hand drawn.
"""
from pathlib import Path
import json,math
import numpy as np
from PIL import Image,ImageFilter
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/art/held-weapons';OUT.mkdir(exist_ok=True);SIZE=200;C=100;RES=.5
GRIPS=json.loads((ROOT/'shared/weapon-grips.json').read_text())['grips'];entries=[];meta={}
def bbox(im):return Image.fromarray((np.array(im)[:,:,3]>80).astype(np.uint8)*255).getbbox()
def cell(im,c,r,cols,rows):return im.crop((round(c*im.width/cols),round(r*im.height/rows),round((c+1)*im.width/cols),round((r+1)*im.height/rows)))
def clean(im):
 a=np.array(im.convert('RGBA'));a[a[:,:,3]<12,3]=0;return Image.fromarray(a)
def raster(im,project,shade=1):
 a=np.array(im.resize((64,80),Image.Resampling.LANCZOS));ys,xs=np.where(a[:,:,3]>8);pts=np.array([project(float(x),float(y)) for x,y in zip(xs,ys)]);px=pts[:,0]+C;py=pts[:,1]+C;ix=np.floor(px).astype(int);iy=np.floor(py).astype(int);fx=px-ix;fy=py-iy;acc=np.zeros((SIZE,SIZE,4),np.float64);rgba=a[ys,xs].astype(float);alpha=rgba[:,3]/255
 for dx,dy,w in [(0,0,(1-fx)*(1-fy)),(1,0,fx*(1-fy)),(0,1,(1-fx)*fy),(1,1,fx*fy)]:
  x=ix+dx;y=iy+dy;ok=(x>=0)&(x<SIZE)&(y>=0)&(y<SIZE);weight=alpha*w
  for ch in range(3):np.add.at(acc[:,:,ch],(y[ok],x[ok]),rgba[ok,ch]*weight[ok]*shade)
  np.add.at(acc[:,:,3],(y[ok],x[ok]),weight[ok])
 result=np.zeros((SIZE,SIZE,4),np.uint8);hit=acc[:,:,3]>.005
 for ch in range(3):result[:,:,ch][hit]=np.clip(acc[:,:,ch][hit]/acc[:,:,3][hit],0,255)
 result[:,:,3]=np.clip(acc[:,:,3]*255,0,255);front=Image.fromarray(result);side=np.array(front);side[:,:,:3]=(side[:,:,:3]*.42).astype(np.uint8);back=Image.new('RGBA',(SIZE,SIZE));back.alpha_composite(Image.fromarray(side),(1,0));back.alpha_composite(front);return back

def point(project,p):x,y=project(*p);return{'x':round(x+C,3),'y':round(y+C,3)}
def add(key,im,project,grip,tip,ends=None,shade=1):
 result=raster(im,project,shade);entries.append((key,result));meta[key]={'grip':{'x':C,'y':C},'tip':point(project,tip),'ends':[point(project,p) for p in ends] if ends else None};return result
backs=Image.open(ROOT/'docs/art/weapon-holding/shield-backs-source.png').convert('RGBA');special=Image.open(ROOT/'docs/art/weapon-holding/special-weapons-source.png').convert('RGBA')
assets=[]
for rarity in ['white','blue']:
 source=Image.open(ROOT/f'public/art/weapons/{rarity}.webp').convert('RGBA')
 for frame in range(48):
  im=clean(cell(source,frame%8,frame//8,8,6));kind=['sword','greatsword','shield','staff','wand','dagger','bow','hammer'][frame%8];grip=GRIPS[rarity][frame];rear=im
  if kind=='shield':
   back=clean(cell(backs,frame//8,['white','blue'].index(rarity),6,2));back=back.crop(bbox(back));box=bbox(im);rear=Image.new('RGBA',(128,160));rear.alpha_composite(back.resize((box[2]-box[0],box[3]-box[1]),Image.Resampling.LANCZOS),(box[0],box[1]));rear.putalpha(Image.fromarray(np.minimum(np.array(rear)[:,:,3],np.array(im)[:,:,3])))
  assets.append((rarity+'-'+str(frame),kind,im,rear,(grip['x']*64,grip['y']*80-(4 if kind=='greatsword' else 0))))
for col,kind in enumerate(['axe','katana','greathammer','longbow','shortbow','dual_sword']):
 images=[]
 for row in range(2):
  raw=clean(cell(special,col,row,6,2));raw=raw.crop(bbox(raw));scale=146/raw.height;raw=raw.resize((max(1,round(raw.width*scale)),146),Image.Resampling.LANCZOS);im=Image.new('RGBA',(128,160));im.alpha_composite(raw,(64-raw.width//2,5));images.append(im)
 gy=.51 if 'bow' in kind else .77 if kind in ['axe','greathammer'] else .82
 grip_y=gy*80-(4 if kind in ['axe','greathammer'] else 0);centres=[]
 for image in images:
  a=np.array(image.resize((64,80),Image.Resampling.LANCZOS));yy,xx=np.where((a[:,:,3]>100)&(np.abs(np.indices(a.shape[:2])[0]-grip_y)<3));centres.append(float(xx.mean()) if len(xx) else 32)
 if abs(centres[1]-centres[0])>.2:
  aligned=Image.new('RGBA',(128,160));aligned.alpha_composite(images[1],(round((centres[0]-centres[1])*2),0));images[1]=aligned
 assets.append(('special-'+kind,kind,*images,(centres[0],grip_y)))
for key,kind,front,rear,grip in assets:
 a=np.array(front.resize((64,80),Image.Resampling.LANCZOS));ys,xs=np.where(a[:,:,3]>100);top=int(ys.min());bottom=int(ys.max());tip=(float(xs[ys<=top+1].mean()),float(top));gx,gy=grip
 if 'bow' in kind:
  ends=[]
  for low,high in [(top,top+2),(bottom-2,bottom)]:
   yy,xx=np.where((a[:,:,3]>100)&(np.indices(a.shape[:2])[0]>=low)&(np.indices(a.shape[:2])[0]<=high));ends.append((float(xx.mean()),float(yy.mean())))
  for facing in range(8):
   phi=facing*math.pi/4;cx=math.cos(phi);sx=math.sin(phi)*.55;cx=math.copysign(max(.14,abs(cx)),cx or 1)
   for draw in range(3):
    def project(x,y,cx=cx,sx=sx,draw=draw):
     dy=y-gy;t=min(1,abs(dy)/max(1,max(gy-top,bottom-gy)));dx=x-gx-4*draw*t**1.4;return(cx*dx,dy+sx*dx)
    add(key+':b'+str(facing)+'d'+str(draw),front,project,grip,grip,ends,shade=.9 if facing>=5 else 1)
 else:
  for view,(width,length,depth,shade) in enumerate([(1,1,0,1),(.7,1,0,.95),(.19,1,0,.8),(.7,1,0,.84),(1,1,0,.88),(.7,.56,.25,.9),(.66,.48,-.15,1.04)]):
   def project(x,y,width=width,length=length,depth=depth,kind=kind):
    dy=y-gy;blade=max(0,-dy-11);den=max(.5,1+depth*blade/65);wy=(dy+11)*length/den-11 if dy< -11 else dy;wx=width if kind=='shield' else max(.42,width) if kind in ['hammer','greathammer'] and dy< -11 else max(.48,width) if kind in ['staff','wand'] and dy< -11 else width if dy< -11 else max(.7,width);return((x-gx)*wx/den,wy)
   add(key+':v'+str(view),rear if view in [3,4] else front,project,grip,tip,shade=shade)
# Trim while retaining a fixed, true grip origin. Shelf pack by height.
entries.sort(key=lambda e:e[1].getbbox()[3]-e[1].getbbox()[1] if e[1].getbbox() else 0,reverse=True);x=y=row=0;placed=[];width=2048
for key,im in entries:
 box=im.getbbox() or (0,0,1,1);crop=im.crop(box)
 if x+crop.width+2>width:x=0;y+=row;row=0
 placed.append((key,crop,box,x+1,y+1));x+=crop.width+2;row=max(row,crop.height+2)
height=2**math.ceil(math.log2(y+row));assert height<=4096;atlas=Image.new('RGBA',(width,height));frames={}
for key,im,box,x,y in placed:
 atlas.alpha_composite(im,(x,y));frames[key]={'frame':{'x':x,'y':y,'w':im.width,'h':im.height},'rotated':False,'trimmed':True,'spriteSourceSize':{'x':box[0],'y':box[1],'w':im.width,'h':im.height},'sourceSize':{'w':SIZE,'h':SIZE}}
atlas.save(OUT/'poses.webp',lossless=True,method=6,exact=True);(OUT/'poses.json').write_text(json.dumps({'frames':frames,'meta':{'image':'poses.webp','size':{'w':width,'h':height}}},separators=(',',':'))+'\n');model={'version':1,'frameSize':SIZE,'nativeHeight':80,'views':['face','quarter','edge','back-quarter','back','tip-away','tip-near'],'catalogueItems':96,'specialItems':6,'frames':meta,'atlas':{'width':width,'height':height,'rgbaBytes':width*height*4}};(ROOT/'shared/held-weapon-art.json').write_text(json.dumps(model,separators=(',',':'))+'\n');print(json.dumps({'frames':len(frames),'atlas':model['atlas']}))
