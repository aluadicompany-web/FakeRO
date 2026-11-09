"""Pack the approved twelve final costumes into 8-direction, 24-pose whole-frame atlases."""
from pathlib import Path
import json,runpy
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];utils=runpy.run_path(str(ROOT/'scripts/painted-art-utils.py'));cell=utils['cell'];marks=utils['marks'];clean=utils['clean_markers'];atlas=utils['atlas']
SRC=ROOT/'docs/art/final-frames';HOLD=ROOT/'docs/art/final-holding';OUT=ROOT/'public/art/final-frames';OUT.mkdir(parents=True,exist_ok=True);SIZE=192
RACES=['muspel','alf','jotun','vanir','nid','skug'];POSES=['idle','breathe','walk-left','pass-left','walk-right','pass-right','slash-windup','slash-contact','slash-follow','reverse','thrust','overhead','cast-gather','cast-release','hurt','fallen','bow-ready','bow-nock','bow-draw','bow-release','two-ready','two-overhead','two-contact','two-follow']
OVERRIDES=json.loads((SRC/'registration-overrides.json').read_text()) if (SRC/'registration-overrides.json').exists() else {}
frames=[];report=[];stats={};cache={}
legacy=json.loads((ROOT/'shared/character-animation.json').read_text());holding=json.loads((ROOT/'shared/holding-bodies.json').read_text())
def source(path):
 if path not in cache:cache[path]=Image.open(path).convert('RGBA')
 return cache[path]
def geometric_neck(a):
 ys,xs=np.where(a[:,:,3]>180);top=int(ys.min());band=ys<=top+4
 return (float(np.median(xs[band])),float(top+2))
def neutral_neck(a,points):
 geom=geometric_neck(a);hint=points.get('neck')
 return hint if hint and abs(hint[0]-geom[0])<a.shape[1]*.12 and abs(hint[1]-geom[1])<a.shape[0]*.075 else geom
def coord(p,scale,tx,ty):return {'x':round((p[0]*scale+tx-96)/2,3),'y':round((p[1]*scale+ty-192)/2,3)}
for sex,gender in enumerate(['male','female']):
 for race_i,race in enumerate(RACES):
  entries=[];neutral=[]
  for facing in range(8):
   body=facing*12+sex*6+race_i
   if facing in [2,1,0,7,6]:path=SRC/(race+'-'+gender+'-source.png');row=[2,1,0,7,6].index(facing);rows=5
   else:path=SRC/(race+'-left-source.png');row=[3,4,5].index(facing)+sex*3;rows=6
   im=source(path);seed=cell(im,0,row,16,rows);seed_points,_=marks(seed);ys,xs=np.where(seed[:,:,3]>180);neck0=neutral_neck(seed,seed_points);scale=112/max(1,ys.max()-neck0[1]);tx=96-neck0[0]*scale;ty=188-ys.max()*scale
   hold_im=source(HOLD/(race+'-'+gender+'-source.png'));hseed=cell(hold_im,0,facing,8,8);hpoints,_=marks(hseed);hy,hx=np.where(hseed[:,:,3]>180);hn=neutral_neck(hseed,hpoints);hs=112/max(1,hy.max()-hn[1]);htx=96-hn[0]*hs;hty=188-hy.max()*hs
   for pose in range(24):
    raw=cell(hold_im,pose-16,facing,8,8) if pose>=16 else cell(im,pose,row,16,rows);points,mask=marks(raw);s,px,py=(hs,htx,hty) if pose>=16 else (scale,tx,ty);body_id=body*24+pose;override=OVERRIDES.get(str(body_id),{})
    source_neck='neck' in points
    for key,value in override.get('sourcePoints',{}).items():
     points[key]=tuple(value);mx,my=map(round,value);mask[max(0,my-2):min(len(mask),my+3),max(0,mx-2):min(mask.shape[1],mx+3)]=True
    neck=neutral_neck(raw,points) if pose<=5 else points.get('neck',hn if pose>=16 else neck0);
    if pose==15 and 'neck' not in points:
     sy,sx=np.where(raw[:,:,3]>180);neck=(float(sx.min()+4 if facing in [3,4,5] else sx.max()-4),float((sy.min()+sy.max())/2))
    neck_world=coord(neck,s,px,py);old=holding['frames'][body*8+pose-16] if pose>=16 else legacy['frames'][body*16+pose]
    palms={}
    missing=[]
    for hand in ['right','left']:
     if hand in points:palms[hand]=coord(points[hand],s,px,py)
     else:
      # Occluded hands need an explicit review record; no fabricated painted limb.
      palms[hand]={k:round(neck_world[k]+old['palms'][hand][k]-old['neck'][k],3) for k in ['x','y']};missing.append(hand)
    if 'neck' not in points:missing.append('neck')
    for hand,value in override.get('palms',{}).items():palms[hand]=value
    if 'neck' in override:neck_world=override['neck']
    if pose<=5:
     for hand in ['right','left']:
      expected={k:neck_world[k]+old['palms'][hand][k]-old['neck'][k] for k in ['x','y']}
      if hand in points and np.hypot(palms[hand]['x']-expected['x'],palms[hand]['y']-expected['y'])>8:
       del points[hand];palms[hand]={k:round(v,3) for k,v in expected.items()};missing.append(hand+'-rejected-costume-pixel')

    painted=clean(raw,mask);painted=painted.resize((max(1,round(painted.width*s)),max(1,round(painted.height*s))),Image.Resampling.LANCZOS);canvas=Image.new('RGBA',(SIZE,SIZE));canvas.alpha_composite(painted,(round(px),round(py)))
    # Use manually approved registration for hidden palms; ensure every exposed grip actually touches art.
    a=np.array(canvas);on_art={}
    # Registration follows actual painted glove pixels; no moving or redrawing a limb.
    # Source marker omissions are recorded and shown on the review contact sheets.
    for hand in ['right','left']:
     if hand in override.get('palms',{}):continue
     if hand not in points and pose!=15:
      p=palms[hand]
      if hand=='right' and pose==9:
       aim=1 if facing in [0,1,7] else -1 if facing in [3,4,5] else 0;p={'x':neck_world['x']+aim*17,'y':neck_world['y']-8}
      cx=p['x']*2+96;cy=p['y']*2+192;yy0,xx0=np.indices(a.shape[:2]);solid=a[:,:,3]>160;dark=a[:,:,:3].max(2)<170;near=(xx0-cx)**2+(yy0-cy)**2<=24**2;candidates=solid&dark&near
      if not candidates.any():candidates=solid&near
      if not candidates.any():candidates=solid
      if candidates.any():
       ys,xs=np.where(candidates);light=a[ys,xs,:3].max(1).astype(float);score=(xs-cx)**2+(ys-cy)**2+light*.18;best=int(np.argmin(score));palms[hand]={'x':round((int(xs[best])-96)/2,3),'y':round((int(ys[best])-192)/2,3)}
    if pose>=20:
     r=np.array([palms['right']['x'],palms['right']['y']]);l=np.array([palms['left']['x'],palms['left']['y']]);gap=float(np.linalg.norm(r-l))
     if gap>10:
      # Some source sheets use cyan on both fists. Reject a purple robe/blue crop fringe
      # mistaken for the support marker; register the adjacent grip at the visible fist.
      expected=np.array([neck_world['x'],neck_world['y']+(-6 if pose==21 else 23)])
      anchor='right' if np.linalg.norm(r-expected)<=np.linalg.norm(l-expected) else 'left'
      old_r=np.array([old['palms']['right']['x'],old['palms']['right']['y']]);old_l=np.array([old['palms']['left']['x'],old['palms']['left']['y']]);axis=old_r-old_l;axis=axis/max(.01,float(np.linalg.norm(axis)))*3.5
      fixed=r-axis if anchor=='right' else l+axis;other='left' if anchor=='right' else 'right'
      palms[other]={'x':round(float(fixed[0]),3),'y':round(float(fixed[1]),3)}
      missing.append(other+'-adjacent-grip')
    if 16<=pose<=19 and all(h in points for h in ['right','left']):
     direction=np.array([np.cos(facing*np.pi/4),np.sin(facing*np.pi/4)*.55]);r=np.array([palms['right']['x'],palms['right']['y']]);l=np.array([palms['left']['x'],palms['left']['y']]);
     if np.dot(r-l,direction)<0:palms['right'],palms['left']=palms['left'],palms['right']

    for hand,p in palms.items():
     cx=round(p['x']*2+96);cy=round(p['y']*2+192);region=a[max(0,cy-3):min(SIZE,cy+4),max(0,cx-3):min(SIZE,cx+4),3];on_art[hand]=bool(region.size and (region>100).any())
    yy,xx=np.indices((SIZE,SIZE));cover=np.zeros((SIZE,SIZE),bool)
    for p in palms.values():cover|=((xx-(p['x']*2+96))**2+(yy-(p['y']*2+192))**2)<5.5**2
    gloves=a.copy();gloves[~cover,3]=0;entries.append(('body-'+str(body_id),canvas));entries.append(('hands-'+str(body_id),Image.fromarray(gloves)))
    m={'id':body_id,'body':body,'pose':pose,'race':race,'gender':gender,'facing':facing,'neck':neck_world,'palms':palms,'headPose':'fallen' if pose==15 else 'normal','headTurn':('left' if facing in [3,4,5] else 'right') if pose==15 else 'none','rightBehindBody':facing in [3,4,5] and pose<=5 or facing>=5 and (pose>=16 or pose in [6,10,12,13]),'source':(HOLD/(race+'-'+gender+'-source.png')).name if pose>=16 else path.name,'markerNeck':source_neck,'markerHands':sum(h in points for h in ['right','left']),'onArt':on_art}
    frames.append(m)
    if missing or not all(on_art.values()):report.append({'id':body_id,'race':race,'gender':gender,'facing':facing,'pose':pose,'missing':missing,'onArt':on_art,'manualOverride':bool(override.get('reviewed'))})
    if pose==0:
     # Creator/portrait use this same real frame zero, not separate concept paintings.
     portrait=canvas.resize((384,384),Image.Resampling.LANCZOS).crop((64,0,320,384));portrait.save(OUT/f'{race}-{gender}-{facing}.webp',lossless=True,method=6)
  stats[race+'-'+gender]=atlas(entries,OUT,race+'-'+gender,SIZE)
frames.sort(key=lambda f:f['id']);manifest={'version':1,'frameSize':SIZE,'outfits':12,'directions':8,'poses':POSES,'bodyFrames':len(frames),'atlas':stats,'frames':frames}
(ROOT/'shared/final-animation.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n');(OUT/'manifest.json').write_text(json.dumps({k:v for k,v in manifest.items() if k!='frames'},indent=2)+'\n');(OUT/'registration-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'frames':len(frames),'registrationNotes':len(report),'rgbaMiB':sum(s['rgbaBytes'] for s in stats.values())/2**20}))
