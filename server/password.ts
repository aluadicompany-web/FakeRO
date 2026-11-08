import {randomBytes,scrypt as derive,timingSafeEqual} from 'node:crypto';
const cost={N:16384,r:8,p:1,maxmem:64*1024*1024};
function scrypt(password:string,salt:string){return new Promise<Buffer>((resolve,reject)=>derive(password,salt,64,cost,(error,key)=>error?reject(error):resolve(key)));}
export function validUsername(value:unknown):value is string{return typeof value==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_.-]{2,23}$/.test(value);}
export function validPassword(value:unknown):value is string{return typeof value==='string'&&value.length>=10&&value.length<=128;}
export async function passwordHash(password:string){const salt=randomBytes(16).toString('hex'),key=await scrypt(password,salt);return `scrypt$${salt}$${key.toString('hex')}`;}
export async function passwordMatches(password:string,encoded?:string){const parts=encoded?.split('$'),valid=parts?.length===3&&parts[0]==='scrypt'&&/^[a-f0-9]{32}$/.test(parts[1])&&/^[a-f0-9]{128}$/.test(parts[2]);const salt=valid?parts![1]:'00000000000000000000000000000000',expected=valid?Buffer.from(parts![2],'hex'):Buffer.alloc(64);const actual=await scrypt(password,salt);return timingSafeEqual(actual,expected)&&!!valid;}
