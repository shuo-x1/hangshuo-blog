// Five broad, overlapping Bauhinia petals with a notched outline and fine stamens.
function randomSource(){let seed=90211;return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
function petal(random,index){
 const u=random(),v=random()*2-1,angle=index*Math.PI*2/5+Math.PI/2;
 const width=Math.pow(Math.sin(Math.PI*u),.7)*.81;
 const notch=1-.11*Math.exp(-v*v*30)*Math.pow(u,5);
 const radial=(.10+u*1.98)*notch,lateral=v*width;
 const x=Math.cos(angle)*radial-Math.sin(angle)*lateral,y=Math.sin(angle)*radial+Math.cos(angle)*lateral;
 const z=.13+u*u*.34-v*v*.23+Math.sin(u*6+index)*.035;
 return {x,y,z,tone:index===0?1:0,light:.43+random()*.55,phase:random()*Math.PI*2,size:.7+random()*.8,scatter:random(),bloom:u};
}
export function createFlower(count){
 const random=randomSource(),points=[];
 for(let i=0;i<count;i++){
  const index=i%5,point=petal(random,index);
  if(i%17===0){const t=random(),a=(i%7-3)*.15;point.x=Math.sin(a)*t*.9;point.y=-.12-t*.92;point.z=.55+Math.sin(t*Math.PI)*.35;point.tone=2;point.size=1+random()*.6}
  if(i%73===0){const a=random()*Math.PI*2;point.x=Math.cos(a)*.16;point.y=Math.sin(a)*.14;point.z=.6;point.tone=2;point.size=1.5}
  points.push(point);
 }
 return points;
}
