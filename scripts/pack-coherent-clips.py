"""Pack complete, continuously authored motion strips and their literal colored glove layers."""
from pathlib import Path
import json,runpy,math,sys
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'docs/art/coherent-clips';OUT=ROOT/'public/art/final-frames';OUT.mkdir(exist_ok=True)
u=runpy.run_path(str(ROOT/'scripts/coherent-registration.py'));pack=runpy.run_path(str(ROOT/'scripts/painted-art-utils.py'))['atlas'];RACES=['muspel','alf','jotun','vanir','nid','skug'];FAMILIES=['one','two','bow','walk'];SIZE=192
# Preserve only the old fallen/recoil resources needed by the legacy death transition.
legacy=json.loads((ROOT/'shared/final-animation.json').read_text());frames=[];stats={};evidence=[]
review=ROOT/'artifacts/coherent-source';review.mkdir(parents=True,exist_ok=True)
only=sys.argv[1] if len(sys.argv)>1 else None
for sex,gender in enumerate(['male','female']):
 for race_i,race in enumerate(RACES):
  if only and race+'-'+gender!=only:continue
  missing=[SRC/f'{race}-{gender}-{family}.png' for family in FAMILIES if not (SRC/f'{race}-{gender}-{family}.png').exists()]
  if missing:raise SystemExit('Missing approved strip: '+str(missing[0]))
  old_spec=json.loads((OUT/f'{race}-{gender}.json').read_text())['frames'];old_image=Image.open(OUT/f'{race}-{gender}.webp').convert('RGBA');entries=[]
  for facing in range(8):
   body=facing*12+sex*6+race_i
   for pose in [14,15]:
    idx=body*24+pose
    for prefix in ['body-','hands-']:
     key=prefix+str(idx);spec=old_spec[key];b=spec['frame'];p=spec['spriteSourceSize'];im=Image.new('RGBA',(SIZE,SIZE));im.alpha_composite(old_image.crop((b['x'],b['y'],b['x']+b['w'],b['y']+b['h'])),(p['x'],p['y']));entries.append((key,im))
  for fam_i,family in enumerate(FAMILIES):
   source=Image.open(SRC/f'{race}-{gender}-{family}.png').convert('RGBA');guide=json.loads((SRC/(family+'-guide.json')).read_text());registered=[]
   for facing in range(8):
    row=[]
    for phase in range(8):
     try:
      raw=u['read_cell'](source,phase,facing);item=u['register'](raw,family,guide[facing*8+phase]);row.append(item)
     except Exception as error:raise ValueError(f'{race}-{gender}-{family} facing={facing} phase={phase}: {error}') from error
    if family!='walk':row[7]=row[0]
    registered.append(row)
   lengths=[row[0]['root'][1]-row[0]['neck'][1] for row in registered];scale=112/float(np.median(lengths))
   for facing,row in enumerate(registered):
    body=facing*12+sex*6+race_i
    # Walk uses one stable root for the entire strip; supporting feet move through its ground plane.
    fixed_root=np.median(np.array([item['root'] for item in row]),axis=0)
    for phase,item in enumerate(row):
     idx=(body*4+fam_i)*8+phase;root=fixed_root if family=='walk' else item['root'];tx=96-root[0]*scale;ty=188-root[1]*scale
     def canvas(im):
      im=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),Image.Resampling.LANCZOS);out=Image.new('RGBA',(SIZE,SIZE));out.alpha_composite(im,(round(tx),round(ty)));return out
     body_image=canvas(item['body']);main=canvas(item['hands']['main']);off=canvas(item['hands']['off']);entries.extend([(f'clip-{idx}',body_image),(f'main-{idx}',main),(f'off-{idx}',off)])
     def point(p):return {'x':round((p[0]*scale+tx-96)/2,4),'y':round((p[1]*scale+ty-192)/2,4)}
     info=guide[facing*8+phase];right=point(item['right']);left=point(item['left']);axis=item['axis'];lower=bool(np.dot(item['left']-item['right'],axis)>0) if family=='two' else False
     raw_projection=item['weaponLength']*scale/2/(32 if family!='walk' else 29);projection=float(np.clip(raw_projection,.3,1.1)) if family not in ['bow','walk'] else 1
     m={'id':idx,'body':body,'race':race,'gender':gender,'facing':facing,'family':family,'phase':phase,'neck':point(item['neck']),'palms':{'right':right,'left':left},'headRotation':round(item['headAngle'],5),'headScale':.86,'headOverlap':.8,'weaponAngle':round(item['angle'],5),'projection':round(projection,4),'gripLower':lower,'mainBehind':info['mainBehind'] or item['mainHidden'],'offBehind':info['offBehind'] or item['offHidden'],'mainHidden':item['mainHidden'],'offHidden':item['offHidden'],'frameKey':f'clip-{idx}','mainHandKey':f'main-{idx}','offHandKey':f'off-{idx}','headPose':'normal','headTurn':'none','rightBehindBody':info['mainBehind'] or item['mainHidden'],'source':f'{race}-{gender}-{family}.png','evidence':item['evidence']}
     frames.append(m);evidence.append({'id':idx,'source':m['source'],'facing':facing,'phase':phase,**item['evidence']})
     if family=='one' and phase==0:
      portrait=Image.new('RGBA',(SIZE,SIZE))
      for im in [off if m['offBehind'] else None,main if m['mainBehind'] else None,body_image,off if not m['offBehind'] else None,main if not m['mainBehind'] else None]:
       if im is not None:portrait.alpha_composite(im)
      portrait.resize((384,384),Image.Resampling.LANCZOS).crop((64,0,320,384)).save(OUT/f'{race}-{gender}-{facing}.webp',lossless=True,method=6)
  stats[race+'-'+gender]=pack(entries,OUT,race+'-'+gender,SIZE)
  print('PACKED',race,gender,flush=True)
if only:
 (review/(only+'-metadata.json')).write_text(json.dumps(frames,separators=(',',':'))+'\n')
else:
 frames.sort(key=lambda f:f['id']);assert len(frames)==3072
 manifest={'version':2,'frameSize':SIZE,'families':FAMILIES,'phases':8,'outfits':12,'directions':8,'frames':frames,'atlas':stats};(ROOT/'shared/coherent-animation.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n');(OUT/'coherent-manifest.json').write_text(json.dumps({k:v for k,v in manifest.items() if k!='frames'},indent=2)+'\n');(OUT/'coherent-registration.json').write_text(json.dumps(evidence,indent=2)+'\n');print('Packed coherent painted motion strips with separate literal glove layers')

if not only:runpy.run_path(str(ROOT/'scripts/finish-coherent-atlases.py'))
