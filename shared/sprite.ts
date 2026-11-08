/** Original 64×96 SD sprite artwork. Integer color clusters, no borrowed game pixels. */
export function spriteSVG(race:string,a:{gender:'male'|'female';hair:number;eyes:number},outfit:{main:string;dark:string;trim:string},hair:string,eye:string,facing=2):string {
 const female=a.gender==='female';let art='';
 const shade=(hex:string,n:number)=>'#'+hex.slice(1).match(/../g)!.map(c=>Math.max(0,Math.min(255,parseInt(c,16)+n)).toString(16).padStart(2,'0')).join('');
 const rect=(x:number,y:number,w:number,h:number,c:string)=>{art+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;};
 const poly=(pts:string,c:string,stroke?:string)=>{art+=`<polygon points="${pts}" fill="${c}"${stroke?` stroke="${stroke}" stroke-width="1" stroke-linejoin="miter"`:''}/>`;};
 const line=(d:string,c:string,w=1)=>{art+=`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}"/>`;};
 const ink='#3b2937',skin='#f6caa1',skinShade='#c88e79',cream='#f7e8c0',leather='#785446';
 const hDark=shade(hair,-42),hLight=shade(hair,45),hShine=shade(hair,76),main=outfit.main,dark=outfit.dark,light=shade(main,32),trim=outfit.trim;
 art+='<ellipse cx="32" cy="89" rx="18" ry="4" fill="#214954" opacity=".23"/>';
 art+='<g data-part="back">';
 // Hair behind the head: long silhouettes must stay legible at sprite scale.
 if(female&&a.hair===1||!female&&a.hair===1)poly('20,16 43,14 48,32 46,53 40,58 35,47 25,53 18,48',hDark,ink);
 if(female&&a.hair===4)poly('21,13 43,15 48,24 46,33 49,42 46,51 42,55 38,49 24,53 17,45 19,35 16,28',hDark,ink);
 if(!female&&a.hair===2)poly('43,15 51,16 53,25 51,35 47,46 43,49 44,35 42,26',hDark,ink);
 if(female&&a.hair===3)poly('25,10 24,6 28,3 37,3 42,7 41,13',hair,ink);
 if(female&&a.hair===0)poly('20,16 44,17 47,31 44,40 39,42 24,42 18,36',hDark,ink);
 art+='</g><g data-part="legL">';
 poly('23,65 31,65 31,80 24,81 22,75','#646374',ink);poly('23,76 31,76 32,86 29,89 18,89 16,86 18,82 23,81',leather,ink);rect(23,78,7,2,'#c3a076');rect(18,86,10,1,'#b18c6a');rect(18,89,12,1,ink);
 art+='</g><g data-part="legR">';
 poly('34,65 42,64 44,79 36,81 33,76','#4c4c61',ink);poly('35,76 43,75 45,82 48,85 47,89 36,90 33,87',leather,ink);rect(36,78,7,2,'#b39371');rect(36,87,10,1,'#a88264');rect(36,90,11,1,ink);
 art+='</g><g data-part="armL">';
 poly('23,38 17,40 14,51 16,59 22,58 26,43',main,ink);rect(16,44,3,9,light);poly('16,55 21,55 22,63 19,67 15,65 14,61',skin,ink);line('M16 59 L21 59','#986a57',2);
 art+='</g><g data-part="armR">';
 poly('41,38 47,40 50,51 49,60 43,60 38,43',dark,ink);rect(45,44,3,9,main);poly('44,56 49,56 50,63 47,67 43,65',skinShade,ink);line('M44 60 L49 60','#986a57',2);
 art+='</g><g data-part="body">';
 const body=female?'24,37 39,37 42,47 40,55 44,67 38,72 31,70 23,73 20,66 24,54 22,45':'24,37 40,37 43,46 41,66 37,70 23,69 21,61 22,45';
 poly(body,main,ink);poly('24,40 29,40 28,61 24,67 22,62',light);poly('37,40 41,45 40,61 38,66 34,66',dark);
 if(race==='muspel'){
  poly('23,38 27,38 39,60 35,63',leather,ink);poly('40,38 46,40 48,45 40,46 37,43','#9cabb6',ink);rect(41,40,5,2,'#e4e6ce');
  poly('25,61 32,62 31,70 23,70',dark);line('M25 45 L25 54 M35 66 L38 66',trim);rect(33,49,2,2,trim);
 }else if(race==='alf'){
  poly('23,37 32,35 41,37 47,48 38,46 33,41 26,47 17,48',dark,ink);poly('23,38 31,37 29,43 20,46',light);poly('32,39 36,38 35,42 32,44',trim,ink);
  poly('27,48 36,47 38,62 27,64',cream);line('M29 51 L35 51 M29 55 L36 55','#c1ae7c');
 }else if(race==='jotun'){
  poly('24,38 40,38 42,57 47,78 40,83 30,82 19,80 22,64',main,ink);poly('29,40 35,40 38,80 29,81',cream);poly('24,37 28,38 27,61 23,65',trim,ink);poly('37,37 41,39 41,65 37,62',trim,ink);
  line('M22 76 L29 78 M39 77 L44 76',dark,2);line('M31 48 L31 57 M28 49 L31 52 34 49','#527eab');rect(24,67,2,2,cream);rect(41,68,2,2,cream);
 }else if(race==='vanir'){
  poly('25,37 29,37 40,66 35,76 29,70 22,73 22,65',dark,ink);line('M26 41 L30 50 28 54 M32 57 L35 64 33 68',trim);poly('40,54 46,55 46,67 40,68','#bba078',ink);rect(41,55,4,2,cream);rect(41,59,4,1,'#6b5360');
 }else if(race==='nid'){
  poly(body,cream,ink);poly('24,37 29,38 30,56 23,60 22,45',main,ink);poly('35,38 40,37 43,45 41,59 34,56',dark,ink);
  poly('24,57 41,57 42,74 23,74',leather,ink);rect(27,61,10,8,'#a17b4c');line('M29 62 L29 67 M34 62 L34 67','#d7c696',2);rect(39,50,2,2,trim);
 }else{
  poly('23,37 32,35 42,38 47,47 37,44 33,41 25,47 17,46',dark,ink);line('M23 39 L29 41 M38 40 L43 42',trim);
  poly('23,59 32,58 30,70 22,76 23,65',main,ink);poly('34,58 41,58 44,74 36,70',dark,ink);line('M25 48 L24 56 M39 48 L40 56',trim);rect(31,44,3,2,'#737e92');
 }
 if(facing>=5){poly(body,main,ink);line('M26 43 L37 43 M28 46 L36 46',trim);}
 // Belt, neck and face. Distinct three-quarter tapered anime face instead of round icon.
 poly('23,56 41,55 41,59 23,60',leather,ink);rect(31,56,5,4,trim);rect(32,57,3,2,leather);
 art+='</g><g data-part="head">';
 poly('28,31 37,31 37,38 34,41 28,37',skinShade,ink);poly('29,32 35,32 35,37 32,38 29,36',skin);
 poly('22,18 25,13 38,12 44,19 44,29 40,35 34,38 27,35 23,30',skin,ink);
 poly('23,23 25,24 26,31 31,35 35,36 34,38 27,35 23,30',skinShade);
 rect(24,21,3,2,'#ffe1b5');rect(28,18,11,2,'#ffe1b5');
 // Anime eyes: dark top lash, white sclera, tall iris with reflected light.
 rect(27,24,6,1,ink);rect(28,25,5,6,'#fff5dd');rect(29,25,3,5,eye);rect(30,26,1,4,'#202633');rect(29,25,1,2,'#ffffff');rect(29,29,2,1,shade(eye,50));
 rect(37,23,5,1,ink);rect(37,24,5,6,'#fff5dd');rect(38,24,3,5,eye);rect(39,25,1,4,'#202633');rect(38,24,1,2,'#ffffff');rect(38,28,2,1,shade(eye,50));
 if(female){rect(26,24,1,1,ink);rect(42,23,1,1,ink);}
 rect(34,30,1,1,'#bd8873');rect(33,34,4,1,'#a26866');rect(26,31,2,1,'#e4a58b');
 if(facing>=5){poly('22,18 25,13 38,12 44,19 44,30 39,36 30,37 23,31',hair,ink);line('M26 21 L27 31 M32 19 L33 34 M39 20 L39 30',hDark,2);}
 else if(facing===0||facing===4){poly('22,22 34,22 34,32 29,34 24,30',skinShade);}
 // Angular hair clumps with three shade bands. Five clearly different silhouettes per gender.
 const male=[
 '21,23 18,19 20,13 24,9 31,7 40,9 45,14 46,21 41,19 39,15 34,19 32,16 26,22 26,17',
 '20,27 17,22 19,13 25,9 35,7 43,12 46,20 44,30 41,25 40,16 34,14 29,18 24,21 23,31',
 '21,24 18,20 20,13 26,9 36,8 43,12 45,19 42,21 39,15 28,17 24,21 23,27',
 '21,25 18,20 17,16 21,14 20,11 26,11 28,7 32,10 36,7 39,11 44,11 44,16 47,19 44,23 40,18 36,20 33,16 28,20 25,18 24,26',
 '20,25 17,19 19,15 16,11 23,12 24,6 29,9 33,4 36,10 43,6 42,13 48,12 45,19 46,24 40,19 36,16 31,20 27,17 24,24'
 ];
 const fem=[
 '20,30 18,22 20,14 25,10 35,8 43,12 46,20 44,34 41,36 41,22 37,16 33,21 30,17 26,23 24,30 24,37',
 '20,31 18,22 20,14 26,9 36,8 43,13 46,21 44,34 41,26 40,16 35,15 30,20 26,19 24,26 24,35',
 '20,26 18,20 21,13 26,9 37,8 43,12 46,20 42,22 38,16 32,20 29,17 25,24 24,30',
 '21,25 18,20 21,13 27,9 36,9 43,13 45,20 42,23 38,17 33,16 29,20 25,22 23,29',
 '20,27 17,21 19,14 25,10 35,8 43,11 47,18 45,26 42,30 41,22 37,16 34,20 29,23 27,18 24,24 24,31'
 ];
 poly((female?fem:male)[a.hair],hair,ink);
 poly('22,15 26,11 32,10 39,12 40,14 32,12 27,14 23,20',hLight);
 line('M25 14 L29 12 35 12',hShine);line('M23 19 L25 16 M38 12 L42 16',hLight);
 line('M25 13 L24 18 M29 12 L27 17 M37 13 L35 17',hDark);
 if(female&&a.hair===2){for(let i=0;i<4;i++){poly(`${44+i%2},${31+i*5} ${48+i%2},${32+i*5} ${49-i%2},${36+i*5} ${45-i%2},${38+i*5} ${43},${35+i*5}`,hair,ink);rect(45,33+i*5,2,1,hLight);}rect(44,51,4,2,trim);}
 if(female&&a.hair===3){line('M27 8 L37 6',hLight,2);rect(26,11,15,2,trim);}
 if(a.hair===1){line('M20 30 L21 45 M44 31 L43 49',hair,2);line('M21 31 L22 43',hLight);}
 art+='</g>';
 return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="192" viewBox="0 0 64 96" shape-rendering="crispEdges" role="img" aria-label="${race} ${a.gender} SD sprite">${art}</svg>`;
}
