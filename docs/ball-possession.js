(function(root){
'use strict';
const players=new Set(['attack','defense','keeper']);
function owner(list,ball){if(ball.carrierId){const p=list.find(o=>o.id===ball.carrierId&&players.has(o.type));return p||null}return list.filter(o=>players.has(o.type)&&Math.hypot(o.x-ball.x,o.y-ball.y)<=Math.max(21,25*(o.scale||1))).sort((a,b)=>Math.hypot(a.x-ball.x,a.y-ball.y)-Math.hypot(b.x-ball.x,b.y-ball.y))[0]||null}
function attach(list,ball){const candidate=owner(list,{...ball,carrierId:null});if(!candidate){delete ball.carrierId;delete ball.carrierOffset;return null}ball.carrierId=candidate.id;let x=ball.x-candidate.x,y=ball.y-candidate.y;if(Math.hypot(x,y)<10){x=16*(candidate.scale||1);y=-10*(candidate.scale||1);ball.x=candidate.x+x;ball.y=candidate.y+y}ball.carrierOffset={x,y};return candidate}
function prepare(list,player){for(const ball of list.filter(o=>o.type==='ball')){if(ball.carrierId===player.id){if(!ball.carrierOffset)ball.carrierOffset={x:ball.x-player.x,y:ball.y-player.y}}else if(!ball.carrierId&&owner(list,ball)?.id===player.id)attach(list,ball)}}
function follow(list,player){let changed=false;for(const ball of list.filter(o=>o.type==='ball'&&o.carrierId===player.id)){const p=ball.carrierOffset||{x:16,y:-10};ball.x=player.x+p.x;ball.y=player.y+p.y;changed=true}return changed}
function clean(list){for(const ball of list.filter(o=>o.type==='ball'&&o.carrierId))if(!list.some(p=>p.id===ball.carrierId&&players.has(p.type))){delete ball.carrierId;delete ball.carrierOffset}}
const api={owner,attach,prepare,follow,clean};if(typeof module!=='undefined')module.exports=api;else root.HandballPossession=api;
})(typeof window!=='undefined'?window:globalThis);
