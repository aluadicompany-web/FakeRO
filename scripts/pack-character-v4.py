"""Prepare original painted component sources: alpha crop, registration, semantic masks, trimmed atlases.
No outfit illustration is synthesized here. Reflected arms retain their anatomical costume identity.
"""
from pathlib import Path
from collections import deque
import json, math
import numpy as np
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/art/characters-v4';OUT.mkdir(exist_ok=True)
ART=ROOT/'docs/art';OLD=ROOT/'public/art/characters'
W,H=256,384
RACES=['muspel','alf','jotun','vanir','nid','skug']
VIEWS=['E','SE','S','SW','W','NW','N','NE']
PARTS=['body','cloth','armL','armR','gloveL','gloveR','legL','legR','bootL','bootR','upperArmL','upperArmR','forearmL','forearmR']
LEG_Y=[291,301,342,322,311,307]
def blank():return Image.new('RGBA',(W,H))
def cell(im,col,row,cols,rows):return im.crop((round(col*im.width/cols),round(row*im.height/rows),round((col+1)*im.width/cols),round((row+1)*im.height/rows)))
def components(im,threshold=80):
 a=np.array(im);keep=a[:,:,3]>=threshold;seen=np.zeros(keep.shape,bool);result=[]
 for y,x in zip(*np.where(keep)):
  if seen[y,x]:continue
  q=deque([(x,y)]);seen[y,x]=True;pts=[]
  while q:
   xx,yy=q.popleft();pts.append((xx,yy))
   for nx,ny in [(xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)]:
    if 0<=ny<im.height and 0<=nx<im.width and keep[ny,nx] and not seen[ny,nx]:seen[ny,nx]=True;q.append((nx,ny))
  if len(pts)<16:continue
  p=np.array(pts);mask=np.zeros(keep.shape,bool);mask[p[:,1],p[:,0]]=True
  # Retain antialiased boundary pixels near the connected silhouette.
  wide=mask.copy()
  for dy in [-1,0,1]:
   for dx in [-1,0,1]:wide|=np.roll(np.roll(mask,dy,axis=0),dx,axis=1)
  data=a.copy();data[~wide,3]=0;part=Image.fromarray(data);box=part.getbbox()
  result.append((len(pts),part.crop(box),box,(float(p[:,0].mean()),float(p[:,1].mean()))))
 return sorted(result,reverse=True,key=lambda c:c[0])
def single(im):
 found=components(im)
 if not found:raise ValueError('Missing sprite component')
 return found[0][1]
def mean_band(im,y0,y1):
 a=np.array(im);ys,xs=np.where(a[max(0,y0):min(im.height,y1),:,3]>80)
 return float(xs.mean()) if len(xs) else im.width/2

def paste_scaled(part,scale,x,y):
 out=blank();s=part.resize((max(1,round(part.width*scale)),max(1,round(part.height*scale))),Image.Resampling.LANCZOS);out.alpha_composite(s,(round(x),round(y)));return out

def world(p):return {'x':round(p[0]/4-32,3),'y':round(p[1]/4-96,3)}
def px(p):return ((p['x']+32)*4,(p['y']+96)*4)
def mirror_image(im):return im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
def translate(im,x,y):
 out=blank();out.alpha_composite(im,(round(x),round(y)));return out

def palm(im):
 box=im.getbbox();a=np.array(im);start=max(box[1],box[3]-11);ys,xs=np.where(a[start:box[3]-1,:,3]>80)
 point=world((float(xs.mean()),float(ys.mean()+start)));point['y']=round(point['y']-1,3);return point
def raw_parts(im,race):
 a=np.array(im);ys,xs=np.indices(a.shape[:2]);mode=np.zeros((H,W),int)
 mode[(ys>=177)&(ys< (265 if race==2 else 267))&(xs<101-np.maximum(0,ys-194)*.14)]=1
 mode[(ys>=177)&(ys<(265 if race==2 else 267))&(xs>157+np.maximum(0,ys-194)*.18)]=2
 result=[]
 for n in [0,1,2]:
  d=a.copy();d[mode!=n,3]=0;result.append(Image.fromarray(d))
 return result

def normalise_legacy(frame,race):
 source=cell(Image.open(OLD/'costumes.png').convert('RGBA'),frame%6,frame//6,6,4);box=source.getbbox();scale=224/(box[3]-box[1]);fx=mean_band(source,box[3]-9,box[3]);tx=128-fx*scale;ty=376-(box[3]-1)*scale
 torso,l,r=raw_parts(source,race)
 # L/R in the old file referred to screen space. Convert to anatomical sides.
 images={k:paste_scaled(v,scale,tx,ty) for k,v in zip(['centre','screenL','screenR'],[torso,l,r])}
 rear=frame>=12
 arms={'armR':images['screenR' if rear else 'screenL'],'armL':images['screenL' if rear else 'screenR']}
 points={}
 for name,screen in [('armR','R' if rear else 'L'),('armL','L' if rear else 'R')]:
  shoulder=world((tx+(168 if screen=='R' else 86)*scale,ty+184*scale));points[name]={'shoulder':shoulder,'palm':palm(arms[name])}
 return images['centre'],arms,points,world((tx+128*scale,ty+172*scale)),round(376-(376-LEG_Y[race])*scale)

component_source=Image.open(ART/'characters-v4-components-source.png').convert('RGBA');profile_source=Image.open(ART/'characters-v4-profile-source.png').convert('RGBA')
canonical={}
for facing,row_base in [(2,0),(0,1),(7,2)]:
 for gender in range(2):
  for race in range(6):
   c=cell(component_source,race,row_base+gender*3,6,6);chunks=components(c)
   if len(chunks)<3:raise ValueError(('Expected armless torso and 2 arms',facing,gender,race,len(chunks)))
   centre=chunks[0];arms=sorted(chunks[1:3],key=lambda p:p[3][0])
   torso=single(cell(profile_source,race,gender,6,2)) if facing==0 else centre[1]
   scale=224/torso.height;foot=mean_band(torso,torso.height-7,torso.height);neck=mean_band(torso,0,6);tx=128-foot*scale;ty=376-(torso.height-1)*scale;body=paste_scaled(torso,scale,tx,ty);socket=world((tx+neck*scale,ty+20))
   side_positions=[(-1,4),(2,3)] if facing==0 else [(-10.5,3),(10,3)]
   # Detached source left slot is anatomical right (red armour confirms this).
   for_rear=facing==7
   assigned={'armR':arms[0][1],'armL':arms[1][1]}
   painted={};points={}
   for name,offset in zip(['armR','armL'],side_positions):
    if for_rear:offset=(-offset[0],offset[1])
    shoulder={'x':round(socket['x']+offset[0],3),'y':round(socket['y']+offset[1],3)};part=assigned[name];target=px(shoulder);cap=mean_band(part,0,max(3,round(part.height*.12)));x=target[0]-cap*scale;y=target[1]-part.height*.12*scale
    painted[name]=paste_scaled(part,scale,x,y);points[name]={'shoulder':shoulder,'palm':palm(painted[name])}
   canonical[(facing,gender,race)]=(body,painted,points,socket,LEG_Y[race])
for facing,old_offset in [(1,0),(6,12)]:
 for gender in range(2):
  for race in range(6):canonical[(facing,gender,race)]=normalise_legacy(old_offset+gender*6+race,race)
for facing,base in [(3,1),(4,0),(5,7)]:
 for gender in range(2):
  for race in range(6):
   body,arms,points,socket,cut=canonical[(base,gender,race)];new_points={};new_arms={}
   for name,opposite in [('armR','armL'),('armL','armR')]:
    desired={'x':-points[opposite]['shoulder']['x'],'y':points[opposite]['shoulder']['y']};original=points[name]['shoulder'];dx=desired['x']+original['x'];dy=desired['y']-original['y'];new_arms[name]=translate(mirror_image(arms[name]),dx*4,dy*4)
    new_points[name]={key:{'x':round(-p['x']+dx,3),'y':round(p['y']+dy,3)} for key,p in points[name].items()}
   canonical[(facing,gender,race)]=(mirror_image(body),new_arms,new_points,{'x':-socket['x'],'y':socket['y']},cut)

body_frames=[];body_parts={p:[] for p in PARTS};costumes=[]
for facing in range(8):
 for gender in range(2):
  for race in range(6):
   torso,arms,anchors,socket,cut=canonical[(facing,gender,race)];a=np.array(torso);ys,xs=np.indices(a.shape[:2]);points=np.where((a[:,:,3]>80)&(ys>350));split=int(np.median(points[1])) if len(points[1]) else 128;split=max(64,min(192,split));leg_cut=max(275,min(351,cut));mode=np.zeros((H,W),np.int8)
   mode[(ys>=leg_cut)&(xs<split)]=1;mode[(ys>=leg_cut)&(xs>=split)]=2
   # Only free outer fabric is assigned to the back cloth layer; all source alpha remains covered.
   if race in [1,3,5]:mode[(ys>200)&(ys<leg_cut)&(abs(xs-(socket['x']+32)*4)>37)]=3
   pieces={}
   for name,n in [('body',0),('legL',1),('legR',2),('cloth',3)]:
    d=a.copy();d[mode!=n,3]=0;pieces[name]=Image.fromarray(d)
   for name in ['legL','legR']:
    d=np.array(pieces[name]);boot_start=max(leg_cut,H-46);boot=d.copy();boot[:boot_start,:,3]=0;d[boot_start:,:,3]=0;pieces[name]=Image.fromarray(d);pieces['boot'+name[-1]]=Image.fromarray(boot)
   for name in ['armL','armR']:
    arm=arms[name];hand=anchors[name]['palm'];glove_cut=round((hand['y']-5.5+96)*4);d=np.array(arm);glove=d.copy();glove[:glove_cut,:,3]=0;d[glove_cut:,:,3]=0;pieces[name]=Image.fromarray(d);pieces['glove'+name[-1]]=Image.fromarray(glove)
    sh=anchors[name]['shoulder'];anchors[name]['elbow']={'x':round((sh['x']+hand['x'])/2,3),'y':round((sh['y']+hand['y'])/2,3)};anchors[name]['gloveCut']=glove_cut/2
    elbow_cut=round((anchors[name]['elbow']['y']+96)*4);upper=np.array(pieces[name]);lower=upper.copy();upper[elbow_cut+3:,:,3]=0;lower[:elbow_cut-2,:,3]=0;pieces['upperArm'+name[-1]]=Image.fromarray(upper);pieces['forearm'+name[-1]]=Image.fromarray(lower)
   # Compose neutral in the same direction-dependent layer order used by the renderer.
   near='armR' if facing in [0,1,7] else 'armL';far='armL' if near=='armR' else 'armR';order=['cloth','legL','bootL','legR','bootR',far,'glove'+far[-1],'body',near,'glove'+near[-1]]
   if facing in [2,6]:order=['cloth','legL','bootL','legR','bootR','body','armL','gloveL','armR','gloveR']
   merged=blank()
   for name in order:merged.alpha_composite(pieces[name])
   costumes.append(merged)
   for name in PARTS:body_parts[name].append(pieces[name])
   torso_sum=sum(np.array(pieces[n])[:,:,3].astype(np.uint16) for n in ['body','cloth','legL','legR','bootL','bootR']);missing=int(np.count_nonzero(torso_sum!=a[:,:,3]));missing+=sum(int(np.count_nonzero(np.array(pieces[n])[:,:,3].astype(np.uint16)+np.array(pieces['glove'+n[-1]])[:,:,3].astype(np.uint16)!=np.array(arms[n])[:,:,3])) for n in ['armL','armR']);assert missing==0,('Coverage',facing,gender,race,missing)
   body_frames.append({'id':len(body_frames),'race':RACES[race],'gender':['male','female'][gender],'facing':facing,'paintedView':VIEWS[{3:1,4:0,5:7}.get(facing,facing)],'reflected':facing in [3,4,5],'neck':socket,'arms':anchors,'hips':{'legL':world((split-20,leg_cut)),'legR':world((split+20,leg_cut))},'feet':{'legL':world((split-20,376)),'legR':world((split+20,376))},'legCut':leg_cut/2,'legSplit':split/2,'nearArm':near,'bothArmsVisible':facing in [2,6],'layerOrder':order,'coverageMissing':missing})

# Head colour masks and face registration. Keep the ten approved styles; add three painted views.
new_heads=Image.open(ART/'characters-v4-heads-source.png').convert('RGBA')
old_head_files={p:Image.open(OLD/('heads-'+p+'.png')).convert('RGBA') for p in ['base','hair','eyes']}
head_can={};ref_heights={}
def skin(a):
 r,g,b,alpha=[a[:,:,i].astype(np.int16) for i in range(4)];return(alpha>100)&(r>120)&(r>g+15)&(g>b+5)
for gender in range(2):
 for hair in range(5):
  for facing,offset in [(1,0),(6,10)]:
   f=offset+gender*5+hair;parts={p:cell(im,f%5,f//5,5,4) for p,im in old_head_files.items()};head_can[(facing,gender,hair)]=parts
  a=np.array(head_can[(1,gender,hair)]['base']);yy,xx=np.where(skin(a));ref_heights[(gender,hair)]=int(yy.max()-yy.min()) if len(yy) else 76
for gender in range(2):
 for hair in range(5):
  front=single(cell(new_heads,hair,gender*3,5,6));yy,xx=np.where(skin(np.array(front)));height=yy.max()-yy.min() if len(yy) else front.height*.6;scale=max(.4,min(.85,ref_heights[(gender,hair)]/max(1,height)))
  for facing,row in [(2,gender*3),(0,gender*3+1),(7,gender*3+2)]:
   raw=single(cell(new_heads,hair,row,5,6));a=np.array(raw);yy,xx=np.where(skin(a));bottom=int(yy.max()) if len(yy) else raw.height-1;band=skin(a)&(np.indices(a.shape[:2])[0]>=bottom-7);neck=float(np.where(band)[1].mean()) if band.any() else raw.width/2;norm=paste_scaled(raw,scale,128-neck*scale,172-bottom*scale);a=np.array(norm);r,g,b,alpha=[a[:,:,i].astype(np.int16) for i in range(4)];hair_mask=(b>r*1.13)&(b-r>12)&(b>g*.94)&(alpha>0);neighbour=hair_mask.copy()
   for dy in range(-3,4):
    for dx in range(-3,4):neighbour|=np.roll(np.roll(hair_mask,dy,0),dx,1)
   neutral=(np.maximum.reduce([r,g,b])-np.minimum.reduce([r,g,b])<40)&((np.minimum.reduce([r,g,b])>135)|(np.maximum.reduce([r,g,b])<80));hair_mask|=neutral&neighbour;eye_mask=(r>45)&(r>g*1.35)&(b>g*1.25)&(r>=b*.8)&(~hair_mask)&(alpha>0);base=a.copy();base[hair_mask|eye_mask,3]=0;hm=np.zeros_like(a);em=np.zeros_like(a)
   lum=np.minimum(255,45+b*.77).astype(np.uint8)
   for ch in range(3):hm[:,:,ch]=lum
   hm[:,:,3]=np.where(hair_mask,alpha,0);lum=np.minimum(255,60+r*.75).astype(np.uint8)
   for ch in range(3):em[:,:,ch]=lum
   em[:,:,3]=np.where(eye_mask,alpha,0)
   head_can[(facing,gender,hair)]={'base':Image.fromarray(base),'hair':Image.fromarray(hm),'eyes':Image.fromarray(em)}
for facing,base in [(3,1),(4,0),(5,7)]:
 for gender in range(2):
  for hair in range(5):head_can[(facing,gender,hair)]={p:mirror_image(im) for p,im in head_can[(base,gender,hair)].items()}
head_frames=[];head_parts={p:[] for p in ['base','hair-front','hair-back','eyes','lids']}
closed=[];hurt=[]
for facing in range(8):
 for gender in range(2):
  for hair in range(5):
   parts=head_can[(facing,gender,hair)];base=np.array(parts['base']);hm=np.array(parts['hair']);eyes=parts['eyes'];yy,xx=np.indices((H,W));braid=gender==1 and hair==2;back_mask=(yy>157)&(hm[:,:,3]>0)&(not braid or facing>=5)
   front=hm.copy();back=hm.copy();front[back_mask,3]=0;back[~back_mask,3]=0
   # Move lower hair contour pixels with the back lock as well, keeping neck skin in the face layer.
   outlines=(yy>157)&(base[:,:,3]>0)&(~skin(base))&(not braid or facing>=5);back[outlines]=base[outlines];base[outlines,3]=0
   groups=components(eyes,25);rects=[];cl=blank();hu=blank()
   for count,part,box,centre in groups:
    if count<6:continue
    x0,y0,x1,y1=box;pad=4;x0=max(0,x0-pad);x1=min(W,x1+pad);y0=max(0,y0-pad);y1=min(H,y1+pad);rects.append([x0/2,y0/2,(x1-x0)/2,(y1-y0)/2]);sample=np.array(parts['base']);colours=sample[max(0,y1):min(H,y1+5),max(0,x0):min(W,x1),:];valid=colours[skin(colours)] if colours.size else np.zeros((0,4));colour=tuple(np.median(valid,axis=0).astype(int)[:3]) if len(valid) else (244,194,155)
    for image,fraction in [(cl,.5),(hu,.24)]:
     draw=ImageDraw.Draw(image);draw.rounded_rectangle((x0,y0,x1,y1),radius=5,fill=colour+(255,));line=y0+(y1-y0)*fraction;draw.line([(x0+2,line),(centre[0],line+2),(x1-2,line-1)],fill=(76,47,43,255),width=2)
   face_alpha=np.maximum(base[:,:,3],np.array(eyes)[:,:,3]);
   for lid in [cl,hu]:
    data=np.array(lid);data[:,:,3]=(data[:,:,3].astype(np.uint16)*face_alpha.astype(np.uint16)//255).astype(np.uint8);lid.paste(Image.fromarray(data))
   for p,im in [('base',Image.fromarray(base)),('hair-front',Image.fromarray(front)),('hair-back',Image.fromarray(back)),('eyes',eyes)]:head_parts[p].append(im)
   closed.append(cl);hurt.append(hu);head_frames.append({'id':len(head_frames),'gender':['male','female'][gender],'hair':hair,'facing':facing,'neck':{'x':0,'y':-53},'hairOverBody':facing>=5,'hasBackHair':bool(np.array(back)[:,:,3].any()),'eyes':rects,'hasEyes':bool(rects),'reflected':facing in [3,4,5]})
head_parts['lids']=closed+hurt

def grid(images,cols,path):
 c=Image.new('RGBA',(cols*128,math.ceil(len(images)/cols)*192))
 for i,im in enumerate(images):c.alpha_composite(im.resize((128,192),Image.Resampling.LANCZOS),((i%cols)*128,(i//cols)*192))
 c.save(OUT/(path+'.png'));c.save(OUT/(path+'.webp'),lossless=True,method=6,exact=True)

def atlas(groups,prefix):
 entries=[]
 for kind,images in groups.items():
  for i,im in enumerate(images):
   im=im.resize((128,192),Image.Resampling.LANCZOS);box=im.getbbox() or (0,0,1,1);entries.append((kind+'-'+str(i),im.crop(box),box))
 entries.sort(key=lambda e:e[1].height,reverse=True);width=2048;x=y=row=0;placed=[]
 for name,im,box in entries:
  if x+im.width+2>width:x=0;y+=row;row=0
  placed.append((name,im,box,x+1,y+1));x+=im.width+2;row=max(row,im.height+2)
 height=2**math.ceil(math.log2(max(1,y+row)));c=Image.new('RGBA',(width,height));frames={}
 for name,im,box,x,y in placed:
  c.alpha_composite(im,(x,y));frames[name]={'frame':{'x':x,'y':y,'w':im.width,'h':im.height},'rotated':False,'trimmed':True,'spriteSourceSize':{'x':box[0],'y':box[1],'w':im.width,'h':im.height},'sourceSize':{'w':128,'h':192}}
 c.save(OUT/(prefix+'.png'));c.save(OUT/(prefix+'.webp'),lossless=True,method=6,exact=True);(OUT/(prefix+'.json')).write_text(json.dumps({'frames':frames,'meta':{'image':prefix+'.webp','size':{'w':width,'h':height},'scale':'1'}},separators=(',',':'))+'\n');return{'width':width,'height':height,'frames':len(frames),'bytesRGBA':width*height*4}
grid(costumes,6,'costumes')
for p,images in head_parts.items():grid(images,5,'heads-'+p)
body_atlas=atlas(body_parts,'body-atlas');head_atlas=atlas(head_parts,'head-atlas')
manifest={'version':4,'frameWidth':128,'frameHeight':192,'bodyFrames':96,'headFrames':80,'bodyColumns':6,'headColumns':5,'paintedBodyViews':60,'paintedHeadViews':50,'bodyParts':PARTS,'headParts':list(head_parts),'atlas':{'body':body_atlas,'head':head_atlas},'bodies':body_frames,'heads':head_frames}
(ROOT/'shared/character-rig.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n');(OUT/'manifest.json').write_text(json.dumps({k:v for k,v in manifest.items() if k not in ['bodies','heads']},indent=2)+'\n')
print(json.dumps({'bodyFrames':96,'headFrames':80,'bodyAtlas':body_atlas,'headAtlas':head_atlas}))
