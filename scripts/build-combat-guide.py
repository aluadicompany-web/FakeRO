"""Anatomical reference diagrams for painted clips; never used as runtime limb animation."""
from pathlib import Path
from PIL import Image,ImageDraw
import math,json
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/art/coherent-clips';OUT.mkdir(exist_ok=True)
WRISTS=[(10,6,35),(12,2,38),(15,-9,49),(12,3,48),(2,20,38),(-13,12,26),(-2,8,29),(10,6,35)]
ELBOWS=[(17,2,40),(19,-1,43),(21,-9,41),(19,1,44),(11,12,40),(-1,8,32),(6,2,32),(17,2,40)]
SWORD=[(2,9,28),(5,2,29),(8,-8,28),(6,6,29),(-8,28,8),(-20,15,-12),(-5,14,21),(2,9,28)]
LEANS=[0,-.02,-.05,0,.10,.14,.05,0];DIPS=[0,-1,-1,0,-3,-4,-1,0];SHIFTS=[0,2,4,2,-2,-4,-1,0]
YAW=[0,.12,.35,.15,-.25,-.45,-.15,0]
def add(a,b):return tuple(x+y for x,y in zip(a,b))
def facing_point(p,facing):
 t=facing*math.pi/4;x,y,z=p
 return (-math.sin(t)*x+math.cos(t)*y,math.cos(t)*.55*x+math.sin(t)*.55*y-z)
def project(p,facing,col,row):
 x,y=facing_point(p,facing);return(col*256+128+x*2.65,row*288+267+y*2.65)
def build(facings,name,family='one'):
 im=Image.new('RGB',(2048,288*len(facings)),'#ece8d8');d=ImageDraw.Draw(im);records=[]
 for row,facing in enumerate(facings):
  for col in range(8):
   shift=SHIFTS[col];dip=DIPS[col];lean=LEANS[col];yaw=YAW[col]
   phase=col*math.pi/4
   if family=='walk':shift=math.sin(phase)*.65;dip=-math.cos(phase*2)*.7;lean=.025;yaw=math.sin(phase)*.055
   if family=='bow':shift=0;dip=[0,0,-.5,-1,-.5,0,0,0][col];lean=[0,0,-.02,-.04,.025,.01,0,0][col];yaw=0
   def torso(p):
    x,y,z=p;c=math.cos(yaw);s=math.sin(yaw);return(x*c-y*s+shift*.25,x*s+y*c+lean*(z-25),z+dip)
   hip=torso((0,0,25));neck=torso((0,0,58));rshoulder=torso((9,0,48));lshoulder=torso((-9,0,48));rw=add(WRISTS[col],(shift*.25,lean*15,dip));re=add(ELBOWS[col],(shift*.25,lean*15,dip));lw=torso((-10,6,37+([0,1,2,2,1,-1,0,0][col])));le=torso((-17,3,41));vector=SWORD[col]
   if family=='two':
    rw=add([(4,9,34),(5,6,39),(2,0,54),(2,8,51),(-2,18,37),(-8,13,27),(-1,10,31),(4,9,34)][col],(shift*.25,lean*15,dip));vector=[(0,8,32),(3,1,32),(1,-12,31),(1,9,31),(-5,29,6),(-18,12,-10),(-4,15,25),(0,8,32)][col];vl=math.sqrt(sum(a*a for a in vector));lw=add(rw,tuple(-3.7*a/vl for a in vector));re=((rw[0]+rshoulder[0])/2+6,(rw[1]+rshoulder[1])/2-2,(rw[2]+rshoulder[2])/2-4);le=((lw[0]+lshoulder[0])/2-7,(lw[1]+lshoulder[1])/2,(lw[2]+lshoulder[2])/2-4)
   if family=='bow':
    rw=[(9,8,36),(9,12,42),(9,17,49),(9,20,52),(9,20,52),(9,17,46),(9,12,39),(9,8,36)][col];lw=[(-10,6,37),(-6,12,43),(4,15,49),(-9,0,59),(-13,-2,59),(-11,4,50),(-10,6,42),(-10,6,37)][col];re=(11,rw[1]*.55,(48+rw[2])*.5);le=(-18,lw[1]*.45,(48+lw[2])*.5-2)
   if family=='walk':
    rw=(10,5-math.cos(phase)*3,32+math.sin(phase)*.5+dip);lw=(-10,4+math.cos(phase)*4,33-math.sin(phase)*.5+dip);re=(17,1-math.cos(phase)*2,40+dip);le=(-17,1+math.cos(phase)*2,41+dip);vector=(3,5+math.sin(phase)*2,29)
   head=add(neck,(lean*5,lean*5,11));crown=add(neck,(lean*8,lean*8,23));tip=add(rw,vector);p=lambda v:project(v,facing,col,row)
   def bone(a,b,color,width):d.line([p(a),p(b)],fill=color,width=width)
   bone(hip,neck,'#68757b',21);bone(torso((-5,0,25)),torso((5,0,25)),'#68757b',17);bone(lshoulder,rshoulder,'#68757b',20)
   for sign in [-1,1]:
    foot=(sign*6,sign*2,0);
    if family=='walk':foot=(sign*6,sign*8*math.cos(phase),max(0,-sign*math.sin(phase))*3)
    knee=(sign*6,foot[1]*.5+2+lean*16,13+dip*.4+foot[2]*.4);bone(torso((sign*5,0,25)),knee,'#879195',12);bone(knee,foot,'#879195',12);x,y=p(foot);d.ellipse((x-10,y-5,x+10,y+4),fill='#38494e')
   for shoulder,elbow,wrist,color in [(lshoulder,le,lw,'#4b72b3'),(rshoulder,re,rw,'#d0833c')]:
    bone(shoulder,elbow,color,12);bone(elbow,wrist,color,11);x,y=p(wrist);d.ellipse((x-6,y-6,x+6,y+6),fill=color)
   nx,ny=p(neck);hx,hy=p(head);d.line([(nx,ny),(hx,hy)],fill='#ff00ff',width=15);d.ellipse((hx-23,hy-27,hx+23,hy+25),fill='#ff00ff',outline='#5f4059',width=2)
   # A real continuous sword axis and a visibly enclosed grip, not a free-floating dot.
   v=vector;length=math.sqrt(sum(a*a for a in v));unit=tuple(a/length for a in v)
   if family=='bow':
    arc=[add(rw,(0,5*(1-(z/25)**2),z)) for z in [-25,-18,-10,0,10,18,25]];d.line([p(v) for v in arc],fill='#24ed24',width=6);d.line([p(arc[0]),p(lw),p(arc[-1])],fill='#bec6b8',width=2);d.line([p(add(rw,(0,0,-3))),p(add(rw,(0,0,3)))],fill='#00ffff',width=6)
   else:
    d.line([p(rw),p(tip)],fill='#24ed24',width=7);pommel=add(rw,tuple(-(8 if family=='two' else 4)*a for a in unit));guard=add(rw,tuple(3*a for a in unit));d.line([p(pommel),p(guard)],fill='#00ffff',width=6)
   for wrist,color in [(rw,'#ff0000'),(lw,'#0000ff')]:
    x,y=p(wrist);d.ellipse((x-5,y-5,x+5,y+5),fill=color)
   d.text((col*256+8,row*288+8),str(col),fill='#465958');records.append({'facing':facing,'phase':col,'neck':p(neck),'right':p(rw),'left':p(lw),'tip':p(tip),'head':p(head),'root':p((0,0,0)),'headRoll':math.atan2(p(neck)[0]-p(hip)[0],p(hip)[1]-p(neck)[1])*.7,'mainBehind':math.cos(facing*math.pi/4)*rw[0]+math.sin(facing*math.pi/4)*rw[1]<-1,'offBehind':math.cos(facing*math.pi/4)*lw[0]+math.sin(facing*math.pi/4)*lw[1]<-1})
 im.save(OUT/(name+'.png'));(OUT/(name+'.json')).write_text(json.dumps(records,indent=2)+'\n')
for family in ['one','two','bow','walk']:build(list(range(8)),family+'-guide',family)
print('Built planted-foot right-handed continuous stroke guides')
