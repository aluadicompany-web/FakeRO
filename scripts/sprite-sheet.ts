import {writeFileSync} from 'node:fs';
import {avatarSVG,HAIR_COLORS} from '../shared/appearance.js';
import {RACES} from '../shared/rules.js';
let sheet='<rect width="1320" height="660" fill="#f5f0de"/><text x="660" y="36" text-anchor="middle" font-family="Georgia" font-size="24" fill="#3b3750">ROOTS OF YGGDRASIL · SD PIXEL STARTER PREVIEW</text>';
for(const [i,r]of RACES.entries()){
 sheet+=`<text x="${110+i*220}" y="70" text-anchor="middle" fill="#3b3750" font-family="sans-serif" font-size="14">${r.name}</text>`;
 for(const [j,gender]of (['male','female'] as const).entries())sheet+=`<g transform="translate(${46+i*220},${92+j*240})">${avatarSVG(r.id,{gender,hair:i%5,eyes:i%5,hairColor:i})}<text x="64" y="212" text-anchor="middle" fill="#55536a" font-family="sans-serif" font-size="12">${gender.toUpperCase()}</text></g>`;
 sheet+=`<circle cx="${100+i*220}" cy="607" r="12" fill="${HAIR_COLORS[i].hex}"/><text x="${100+i*220}" y="639" text-anchor="middle" fill="#55536a" font-family="sans-serif" font-size="12">${HAIR_COLORS[i].name}</text>`;
}
writeFileSync('docs/art/style-v2-sprites.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="1320" height="660" viewBox="0 0 1320 660">${sheet}</svg>`);
