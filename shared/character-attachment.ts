import art from './character-animation.json';
/** The opaque neck on each modular head is registered against the costume neck socket.
 * Three world pixels of overlap hide the old double neck cap and avoid a floating head.
 * Fallen head art keeps its separately painted/registered orientation.
 */
export function headAttachment(head:number,neck:{x:number;y:number},pose:string){
 if(pose==='fallen')return{x:neck.x,y:neck.y+53};
 const sockets=(art as unknown as {headSockets?:Record<string,{x:number;y:number}>}).headSockets;
 const pivot=sockets?.[String(head)]??{x:0,y:-53.5};
 return{x:neck.x-pivot.x,y:neck.y+3-pivot.y};
}
