(function(root){
'use strict';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function move(el,dx,dy,w,h){return{x:clamp((el.x*w+dx)/w,.02,.98),y:clamp((el.y*h+dy)/h,.02,.98)}}
function snap(nx,ny,w,h,on=true,tolerance=14){
 let x=clamp(nx,.02,.98),y=clamp(ny,.02,.98),guideX=false,guideY=false;
 if(on&&Math.abs(x*w-w/2)<=tolerance){x=.5;guideX=true}
 if(on&&Math.abs(y*h-h/2)<=tolerance){y=.5;guideY=true}
 return{x,y,guideX,guideY};
}
function px(el,w,h){return{x:Math.round(el.x*w),y:Math.round(el.y*h)}}
root.UMBRAL_GEOMETRY={move,snap,px};
})(typeof window!=='undefined'?window:globalThis);
