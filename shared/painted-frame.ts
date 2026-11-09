export type Point={x:number;y:number};
export type ClipFamily='one'|'two'|'bow'|'walk';
export interface PaintedFrame {
 id:number;body:number;neck:Point;palms:{right:Point;left:Point};headPose:string;headTurn:string;rightBehindBody:boolean;
 family?:ClipFamily;phase?:number;headRotation?:number;headScale?:number;headOverlap?:number;weaponAngle?:number;projection?:number;gripLower?:boolean;mainBehind?:boolean;offBehind?:boolean;mainHidden?:boolean;offHidden?:boolean;frameKey?:string;mainHandKey?:string;offHandKey?:string;
}
