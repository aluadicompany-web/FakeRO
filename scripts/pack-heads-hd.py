"""Preserve newly painted face/hair detail in 384px modular head frames.
Face, hair-front, hair-back, iris and eyelids remain separately tintable/occludable.
"""
from pathlib import Path
import json,runpy
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];u=runpy.run_path(str(ROOT/'scripts/painted-art-utils.py'));cell=u['cell'];components=u['components'];dilate=u['dilate'];atlas=u['atlas'];SRC=ROOT/'docs/art/heads-hd';OUT=ROOT/'public/art/heads-hd';OUT.mkdir(parents=True,exist_ok=True);SIZE=384
def skin(a):
 r,g,b,al=[a[:,:,i].astype(float) for i in range(4)];return(al>180)&(r>165)&(g>95)&(r-g>15)&(g-b>8)
def main_skin(a):
 mask=skin(a);parts=components(mask,8)
 if not parts:return mask
 p=max(parts,key=len);out=np.zeros(mask.shape,bool);out[p[:,1],p[:,0]]=True;return out
entries=[[],[]];meta=[None]*80;sockets={};gallery=Image.new('RGB',(5*256,2*384),'#e6e1ce')
for sex,gender in enumerate(['male','female']):
 sources=[Image.open(SRC/(gender+'-'+str(chunk)+'.png')).convert('RGBA') for chunk in [0,1]]
 heights=[]
 for hairstyle in range(5):
  sy,sx=np.where(main_skin(cell(sources[0],hairstyle,0,5,4)));heights.append(float(np.ptp(sy)))
 scale=(68 if sex else 64)/float(np.median(heights))
 for hair in range(5):
  seed=cell(sources[0],hair,0,5,4);ys,xs=np.where(skin(seed));assert len(ys),(gender,hair,'No face pixels')
  for chunk,facings in enumerate([[2,1,0,7],[6,5,4,3]]):
   for row,facing in enumerate(facings):
    a=cell(sources[chunk],hair,row,5,4);ys,xs=np.where(main_skin(a));assert len(ys),(gender,hair,facing,'No neck');bottom=int(ys.max());yy,xx=np.indices(a.shape[:2]);neck_region=main_skin(a)&(yy>=bottom-3);neck_x=float(np.where(neck_region)[1].mean());raw=Image.fromarray(a);im=raw.resize((max(1,round(raw.width*scale)),max(1,round(raw.height*scale))),Image.Resampling.LANCZOS);canvas=Image.new('RGBA',(SIZE,SIZE));canvas.alpha_composite(im,(round(192-neck_x*scale),round(170-bottom*scale)));a=np.array(canvas);r,g,b,al=[a[:,:,i].astype(float) for i in range(4)]
    # Blue hair and magenta irises are intentional source masks, not colors baked into the hero.
    hm=(b>r*1.12)&(b-r>10)&(b>g*.94)&(al>0);neutral=(np.maximum.reduce([r,g,b])-np.minimum.reduce([r,g,b])<40)&((np.minimum.reduce([r,g,b])>135)|(np.maximum.reduce([r,g,b])<80));hm|=neutral&dilate(hm,3)
    em=(r>55)&(r>g*1.35)&(b>g*1.2)&(r>=b*.8)&(~hm)&(al>0)
    base=a.copy();base[hm|em,3]=0;hair_pixels=np.zeros_like(a);eye_pixels=np.zeros_like(a)
    for data,mask,lum in [(hair_pixels,hm,np.minimum(255,45+b*.77)),(eye_pixels,em,np.minimum(255,60+r*.75))]:
     for channel in range(3):data[:,:,channel]=lum.astype(np.uint8)
     data[:,:,3]=np.where(mask,a[:,:,3],0)
    yy,xx=np.indices((SIZE,SIZE));back_mask=(yy>160)&(hair_pixels[:,:,3]>0)&(not(sex==1 and hair==2) or facing>=5);front=hair_pixels.copy();back=hair_pixels.copy();front[back_mask,3]=0;back[~back_mask,3]=0
    outlines=(yy>160)&(base[:,:,3]>0)&(~skin(base))&(not(sex==1 and hair==2) or facing>=5);back[outlines]=base[outlines];base[outlines,3]=0
    # Closed/hurt lids cover the sclera and iris using sampled skin; expressions are not painted over hair.
    closed=Image.new('RGBA',(SIZE,SIZE));hurt=Image.new('RGBA',(SIZE,SIZE));rects=[]
    for pts in components(em,6):
     x0,y0=pts.min(0);x1,y1=pts.max(0);x0=max(0,int(x0)-5);x1=min(SIZE-1,int(x1)+5);y0=max(0,int(y0)-5);y1=min(SIZE-1,int(y1)+5);rects.append([x0/4,y0/4,(x1-x0)/4,(y1-y0)/4]);samples=a[max(0,y1):min(SIZE,y1+7),x0:x1];valid=samples[skin(samples)] if samples.size else np.zeros((0,4));color=tuple(np.median(valid,axis=0).astype(int)[:3]) if len(valid) else (242,192,156)
     for target,fraction in [(closed,.5),(hurt,.25)]:
      draw=ImageDraw.Draw(target);draw.rounded_rectangle((x0,y0,x1,y1),radius=6,fill=color+(255,));line=y0+(y1-y0)*fraction;draw.line([(x0+2,line),(int(pts[:,0].mean()),line+2),(x1-2,line-1)],fill=(71,45,41,255),width=3)
    face_alpha=np.maximum(base[:,:,3],eye_pixels[:,:,3])
    for lids in [closed,hurt]:
     p=np.array(lids);p[:,:,3]=(p[:,:,3].astype(np.uint16)*face_alpha.astype(np.uint16)//255).astype(np.uint8);lids.paste(Image.fromarray(p))
    head=facing*10+sex*5+hair;layers={'base':Image.fromarray(base),'hair-front':Image.fromarray(front),'hair-back':Image.fromarray(back),'eyes':Image.fromarray(eye_pixels),'lids':closed,'hurt-lids':hurt}
    for name,image in layers.items():
     key=('lids-'+str(head+80)) if name=='hurt-lids' else name+'-'+str(head);entries[sex].append((key,image))
     for side,angle in [('left',90),('right',-90)]:entries[sex].append(('fallen-'+side+'-'+key,image.rotate(angle,Image.Resampling.BICUBIC,center=(192,170))))
     # Individual browser SVG layers keep the same crop/coordinate space as the portrait bodies.
     image.crop((64,0,320,384)).save(OUT/(key+'.webp'),lossless=True,method=6)
    meta[head]={'id':head,'gender':gender,'hair':hair,'facing':facing,'neck':{'x':0,'y':-53},'hairOverBody':facing>=5,'hasBackHair':bool(back[:,:,3].any()),'eyes':rects,'hasEyes':bool(rects),'reflected':False};sockets[str(head)]={'x':0,'y':-53.5}
    if facing==1:
     composite=Image.new('RGBA',(SIZE,SIZE));
     for key in ['hair-back','base','hair-front','eyes']:composite.alpha_composite(layers[key])
     thumb=composite.crop((64,0,320,384));gallery.paste(thumb,(hair*256,sex*384),thumb)
stat={gender:atlas(entries[sex],OUT,'head-'+gender,SIZE) for sex,gender in enumerate(['male','female'])};manifest={'version':1,'frameSize':SIZE,'heads':meta,'headSockets':sockets,'atlas':stat,'sourceViews':80,'separateHairAndEyes':True};(ROOT/'shared/heads-hd.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n');(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');gallery.save(SRC/'registered-preview.webp',quality=94);print(json.dumps({'heads':80,'atlas':stat}))
