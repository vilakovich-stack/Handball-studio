(function(root){
'use strict';
function points(o){const source=Array.isArray(o.pathPoints)&&o.pathPoints.length>1?o.pathPoints:[{x:0,y:0},{x:Number(o.dx)||0,y:Number(o.dy)||0}];return source.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>({x:p.x,y:p.y}))}
function path(list,smooth=true){if(!list.length)return '';const n=v=>Math.round(v*100)/100;let d=`M${n(list[0].x)} ${n(list[0].y)}`;if(!smooth||list.length<3)return d+list.slice(1).map(p=>`L${n(p.x)} ${n(p.y)}`).join('');for(let i=0;i<list.length-1;i++){const a=list[Math.max(0,i-1)],b=list[i],c=list[i+1],z=list[Math.min(list.length-1,i+2)];d+=`C${n(b.x+(c.x-a.x)/6)} ${n(b.y+(c.y-a.y)/6)} ${n(c.x-(z.x-b.x)/6)} ${n(c.y-(z.y-b.y)/6)} ${n(c.x)} ${n(c.y)}`}return d}
function distance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=dx||dy?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy))):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)}
function simplify(list,tolerance=3){if(list.length<3)return list;let index=0,max=0;for(let i=1;i<list.length-1;i++){const d=distance(list[i],list[0],list.at(-1));if(d>max){max=d;index=i}}return max>tolerance?[...simplify(list.slice(0,index+1),tolerance).slice(0,-1),...simplify(list.slice(index),tolerance)]:[list[0],list.at(-1)]}
function scale(value){return Math.max(.35,Math.min(2.5,Number(value)||1))}
const api={points,path,simplify,scale};if(typeof module!=='undefined')module.exports=api;else root.HandballTrajectory=api;
})(typeof window!=='undefined'?window:globalThis);
