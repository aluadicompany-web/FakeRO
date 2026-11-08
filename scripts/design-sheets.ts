import {writeFileSync,mkdirSync} from 'node:fs';
import {avatarSVG,EYE_COLORS,HAIRSTYLES} from '../shared/appearance.js';
mkdirSync('docs/art',{recursive:true});
const labels={male:['Side part','Shoulder length','High ponytail','Short curls','Spiky'],female:['Short bob','Long straight','Side braid','High bun','Long waves']};
let content='<rect width="1200" height="850" fill="#eee5cf"/><text x="600" y="44" text-anchor="middle" fill="#30463d" font-family="Georgia" font-size="26">ROOTS OF YGGDRASIL · STARTER APPEARANCE</text>';
for(const [row,gender] of (['male','female'] as const).entries()){
 content+=`<text x="32" y="${85+row*310}" fill="#78654b" font-family="sans-serif" font-size="14">${gender.toUpperCase()} · 5 HAIRSTYLES</text>`;
 for(let i=0;i<5;i++)content+=`<g transform="translate(${32+i*235},${100+row*310})">${avatarSVG('jotun',{gender,hair:i,eyes:0})}<text x="90" y="260" text-anchor="middle" fill="#30463d" font-family="sans-serif" font-size="14">${i+1}. ${labels[gender][i]}</text><text x="90" y="280" text-anchor="middle" fill="#766c59" font-family="sans-serif" font-size="12">${HAIRSTYLES[gender][i]}</text></g>`;
}
content+='<text x="32" y="748" fill="#78654b" font-family="sans-serif" font-size="14">5 EYE COLORS · SHARED BY BOTH GENDERS</text>';
for(const [i,e]of EYE_COLORS.entries())content+=`<g transform="translate(${110+i*235},792)"><ellipse rx="25" ry="17" fill="#faf6ea" stroke="#5b5549"/><circle r="14" fill="${e.hex}"/><ellipse rx="5" ry="10" fill="#27312e"/><circle cx="5" cy="-6" r="4" fill="white"/><text y="38" text-anchor="middle" fill="#30463d" font-size="12" font-family="sans-serif">${e.name}</text></g>`;
writeFileSync('docs/art/hairstyles-and-eyes.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850" viewBox="0 0 1200 850">${content}</svg>`);
