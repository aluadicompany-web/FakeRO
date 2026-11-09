"""Register actual painted gloves and guide weapons. Never infer a grip from old poses/cloth."""
from pathlib import Path
import runpy
import numpy as np
from PIL import Image,ImageDraw
from scipy.spatial import ConvexHull
U=runpy.run_path(str(Path(__file__).with_name('painted-art-utils.py')));components=U['components'];dilate=U['dilate']

def largest(mask,minimum=3):
 parts=components(mask,minimum)
 if not parts:raise ValueError('missing color component')
 p=max(parts,key=len);out=np.zeros(mask.shape,bool);out[p[:,1],p[:,0]]=True;return out

def points(mask):
 y,x=np.where(mask);return np.column_stack((x,y)).astype(float)

def hull(mask):
 p=points(mask)
 if len(p)<3 or np.linalg.matrix_rank(p-p.mean(0))<2:p=points(dilate(mask,1))
 out=Image.new('1',(mask.shape[1],mask.shape[0]));poly=p[ConvexHull(p).vertices];ImageDraw.Draw(out).polygon([tuple(v) for v in poly],fill=1);return np.array(out).astype(bool)

def line_fit(p):
 c=p.mean(0);vals,vecs=np.linalg.eigh(np.cov((p-c).T));v=vecs[:,np.argmax(vals)];return c,v

def read_cell(im,col,row):
 # Generated strips may have uneven gutters. Split at transparent valleys instead
 # of cutting a head or neighboring boot at a mathematically uniform grid line.
 if not hasattr(im,'clip_grid'):
  alpha=np.array(im.convert('RGBA'))[:,:,3]>205
  def cuts(axis,length):
   counts=alpha.sum(axis=axis);result=[0]
   for n in range(1,8):
    expected=n*length/8;lo=round(expected-length/8*.34);hi=round(expected+length/8*.34)
    scores=counts[lo:hi];minimum=scores.min();candidates=np.where(scores<=minimum+1)[0]+lo
    groups=np.split(candidates,np.where(np.diff(candidates)>1)[0]+1)
    centers=[float(np.median(g)) for g in groups if len(g)]
    result.append(round(min(centers,key=lambda x:abs(x-expected))))
   return result+[length]
  im.clip_grid=(cuts(0,im.width),cuts(1,im.height))
 xs,ys=im.clip_grid
 a=np.array(im.crop((xs[col],ys[row],xs[col+1],ys[row+1])).convert('RGBA'));a[a[:,:,3]<180,3]=0
 regions=components(a[:,:,3]>205,4)
 if not regions:raise ValueError('empty frame')
 main=max(regions,key=len);keep=np.zeros(a.shape[:2],bool);keep[main[:,1],main[:,0]]=True;near=dilate(keep,10)
 for group in regions:
  if near[group[:,1],group[:,0]].any():keep[group[:,1],group[:,0]]=True
 keep=dilate(keep,1);a[~keep,3]=0
 return a

def register(a,family,guide=None):
 r,g,b,al=[a[:,:,i].astype(float) for i in range(4)];opaque=al>205
 H=largest((r>150)&(b>150)&(r-g>120)&(b-g>120)&opaque,12)
 G=(g>110)&(g-r>90)&(g-b>90)&opaque
 C=(g>120)&(b>120)&(g-r>80)&(b-r>80)&(abs(g-b)<85)&opaque
 red=(r>145)&(r-g>125)&(r-b>125)&opaque
 blue=(b>145)&(b-r>110)&(b-g>110)&opaque
 headp=points(H);hc=headp.mean(0);bottom=headp[:,1].max();neck=headp[headp[:,1]>=bottom-2].mean(0)
 non_guide=opaque&~(H|G|C);body_parts=components(non_guide,20)
 if not body_parts:raise ValueError('missing body')
 body=max(body_parts,key=len);body_mask=np.zeros(H.shape,bool);body_mask[body[:,1],body[:,0]]=True
 bodyp=points(body_mask);foot_y=bodyp[:,1].max();sole=bodyp[bodyp[:,1]>=foot_y-3];root=np.array([float((np.quantile(sole[:,0],.1)+np.quantile(sole[:,0],.9))/2),float(foot_y)])
 body_height=max(30,float(root[1]-neck[1]));guide_scale=body_height/(guide['root'][1]-guide['neck'][1]) if guide else 1
 expected=lambda key:neck+(np.array(guide[key])-np.array(guide['neck']))*guide_scale if guide else neck.copy()
 gp=points(G);cp=points(C)
 # Isolate real red/blue painted glove components; no legacy pose or nearest-cloth fallback.
 def hand(mask,expected_point,shaft):
  choices=[]
  for group in components(mask,3):
   if np.ptp(group[:,0])>a.shape[1]*.27 or np.ptp(group[:,1])>a.shape[0]*.27:continue
   c=group.mean(0);dist=float(np.linalg.norm(shaft-c,axis=1).min()) if len(shaft) else float(np.linalg.norm(c-expected_point));purity=(r-g-b if mask is red else b-r-g)[group[:,1],group[:,0]].mean();choices.append((dist-purity*.014,group))
  out=np.zeros(H.shape,bool)
  if choices:
   group=min(choices,key=lambda v:v[0])[1];out[group[:,1],group[:,0]]=True
  return out
 R=hand(red,expected('right'),cp if len(cp) else gp);B=hand(blue,expected('left'),np.array([expected('left')]))
 main_hidden=not R.any();off_hidden=not B.any()
 if main_hidden and not guide:raise ValueError('right glove occluded: authored guide required')
 rc=points(R).mean(0) if R.any() else (cp.mean(0) if len(cp) else expected('right'))
 left=points(B).mean(0) if B.any() else expected('left')
 authored=np.array(guide['tip'])-np.array(guide['right']) if guide else np.array([0.,-1.]);authored/=max(.001,float(np.linalg.norm(authored)))
 axis_source='painted-shaft';axis=authored.copy();origin=rc.copy()
 if len(gp)>=5:
  near=gp[np.linalg.norm(gp-rc,axis=1)<=np.quantile(np.linalg.norm(gp-rc,axis=1),.7)];gc,axis=line_fit(near if len(near)>=5 else gp)
  if np.dot(gp.mean(0)-rc,axis)<0:axis=-axis
  origin=gc
 else:axis_source='authored-occluded-shaft'
 near_c=cp[np.linalg.norm(cp-rc,axis=1)<a.shape[0]*.19] if len(cp) else np.zeros((0,2))
 if len(near_c)>=3:
  c0,cv=line_fit(near_c);span=np.ptp(near_c@cv)
  if span>4 and (family!='bow' or abs(cv[1])>.3):
   axis=cv
   if family=='bow':
    if axis[1]>0:axis=-axis
   elif len(gp) and np.dot(gp.mean(0)-rc,axis)<0:axis=-axis
   elif not len(gp) and np.dot(authored,axis)<0:axis=-axis
  origin=near_c.mean(0)
 if family=='bow':
  # Bow's colored arc defines a chord, not a blade. Keep top-to-bottom orientation.
  if len(gp)>=5:origin0,axis=line_fit(gp)
  if axis[1]>0:axis=-axis
  origin=near_c.mean(0) if len(near_c) else rc.copy()
 if family=='walk':axis=authored.copy();origin=rc.copy();axis_source='authored-walk-carry'
 normal=np.array([-axis[1],axis[0]])
 # Locate the shaft crossing the literal right-glove convex hull. If only the distal
 # blade is visible, use the center of the painted fist (never a nearby torso pixel).
 grip=rc.copy();wrap=0
 if R.any():
  hp=points(hull(R));on_line=hp[np.abs((hp-origin)@normal)<=1.6]
  if len(on_line)>=2:
   grip=origin+axis*float(np.median((on_line-origin)@axis));wrap=len(on_line)
  else:axis_source+='-fist-center';wrap=len(points(R))
 if family=='two':
  # This is the actual line between the two painted fists, not a contact-time flip.
  hand_axis=grip-left;gap=float(np.linalg.norm(hand_axis))
  if gap>.5:
   hand_axis/=gap
   if np.dot(hand_axis,axis)<0:hand_axis=-hand_axis
   axis=hand_axis
  else:left=grip-axis*max(2,body_height*.055)
 normal=np.array([-axis[1],axis[0]])
 if family=='bow':angle=float(np.arctan2(axis[1],axis[0])+np.pi/2)
 else:angle=float(np.arctan2(axis[1],axis[0])+np.pi/2)
 measured=float(np.arctan2(hc[0]-neck[0],max(1,neck[1]-hc[1])));roll=.6*(guide['headRoll'] if guide else measured)+.4*measured;roll=float(np.clip(roll,-.28,.28))
 torso=opaque&~(H|G|C|R|B);tp=points(torso);head_width=float(np.ptp(headp[:,0]));near=tp[(abs(tp[:,0]-neck[0])<max(4,head_width*.27))&(tp[:,1]>=neck[1]-2)&(tp[:,1]<=neck[1]+9)]
 if len(near):neck=np.array([neck[0],float(near[:,1].min()+1)])
 distance=float(np.linalg.norm(tp-neck,axis=1).min())
 if distance>6:raise ValueError('head/collar disconnected in painted source')
 masks={}
 for name,m in [('main',R),('off',B)]:masks[name]=dilate(m,2)&opaque&~(H|G|C)
 technical=((r>g+65)&(b>g+65)&(abs(r-b)<90))|((g>r+65)&(g>b+65))|((g>r+65)&(b>r+65)&(abs(g-b)<95))|red|blue
 remove=dilate(technical|R|B,1)&(al>0);base=a.copy();base[remove,3]=0;body_alpha=base[:,:,3]>180
 # Restore narrow registration strokes inside real cloth, preserving the outside silhouette.
 for y,x in zip(*np.where(remove&~dilate(H,1))):
  x0=max(0,x-5);x1=min(a.shape[1],x+6);y0=max(0,y-5);y1=min(a.shape[0],y+6)
  opposing=(body_alpha[y,x0:x].any() and body_alpha[y,x+1:x1].any()) or (body_alpha[y0:y,x].any() and body_alpha[y+1:y1,x].any())
  if opposing:
   local=a[y0:y1,x0:x1];valid=body_alpha[y0:y1,x0:x1]
   if valid.any():base[y,x,:3]=np.median(local[valid,:3],axis=0);base[y,x,3]=255
 # Place the nape on surviving collar cloth, after the registration paint is removed.
 # Measuring before removal can mistake a string-hand near the cheek for the collar.
 solid=base[:,:,3]>180;sy,sx=np.where(solid);collar=(abs(sx-neck[0])<max(3,head_width*.18))&(sy>=bottom-1)&(sy<=bottom+22)
 if not collar.any():raise ValueError('no surviving painted collar')
 neck=np.array([neck[0],float(sy[collar].min()+1)])
 distance=float(np.min(np.hypot(sx-neck[0],sy-neck[1])))
 hands={}
 for name,m,channel in [('main',masks['main'],0),('off',masks['off'],2)]:
  out=np.zeros_like(a);lum=np.clip(a[:,:,channel].astype(float)/255,0,1);palette=np.array([100,82,74]);out[:,:,:3]=(palette[None,None,:]*(.25+.75*lum[:,:,None])).astype(np.uint8);out[:,:,3]=np.where(m,a[:,:,3],0);hands[name]=Image.fromarray(out)
 length=float(np.max((gp-grip)@axis)) if len(gp) and family!='bow' else body_height*.55
 return {'body':Image.fromarray(base),'hands':hands,'neck':neck,'headAngle':roll,'right':grip,'left':left,'angle':angle,'axis':axis,'weaponLength':abs(length),'root':root,'mainHidden':main_hidden,'offHidden':off_hidden,'evidence':{'rightColorPixels':int(R.sum()),'leftColorPixels':int(B.sum()),'hiltPixels':len(near_c),'registration':axis_source,'axisHullOverlap':wrap,'collarDistance':round(distance,3)},'masks':{'head':H,'right':R,'left':B,'weapon':G|C}}
