'use client';

import {useEffect, useRef, useState} from 'react';

type Point = {x:number;y:number;z:number;phase:number;scatter:number;light:number;size:number;tone:number};
type FlowerModule = {createFlower:(count:number)=>Point[]};
const colors = ['#af72aa','#c88dc3','#d8a5d1','#eabddb','#b386c8','#9860a1','#e8c3d2','#eed9be'];

function paint(canvas:HTMLCanvasElement, points:Point[], time:number) {
  const {width,height} = canvas.getBoundingClientRect();
  const ratio = Math.min(devicePixelRatio || 1,1.5);
  if(canvas.width!==Math.round(width*ratio)||canvas.height!==Math.round(height*ratio)){canvas.width=width*ratio;canvas.height=height*ratio;}
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);
  const scale=Math.min(width*.23,height*.23),angle=.1+Math.sin(time*.23)*.1;
  for(const point of points){
    const bloom=1+Math.sin(time*.45)*.025;
    const x=(point.x*Math.cos(angle)+point.z*Math.sin(angle))*scale*bloom+width*.52;
    const y=height*.49-(point.y*bloom+Math.sin(time*.65+point.phase)*.009)*scale;
    ctx.globalAlpha=Math.max(.08,Math.min(.98,point.light*.95));
    ctx.fillStyle=colors[point.tone===2?6+(point.scatter*2|0):point.tone===1?4+(point.scatter*2|0):(point.scatter*4|0)];
    ctx.fillRect(x,y,point.size,point.size);
  }
  ctx.globalAlpha=1;
}

export function Flower() {
  const canvas=useRef<HTMLCanvasElement>(null);
  const [paused,setPaused]=useState(false);
  useEffect(()=>{
    let frame=0,live=true,visible=false,last=0;
    let points:Point[]=[];
    const element=canvas.current;
    if(!element)return;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const draw=(now:number)=>{
      frame=0;if(!live||!visible||document.hidden)return;
      if(now-last>38){paint(element,points,reduced.matches?0:now/1000);last=now;}
      if(!paused&&!reduced.matches)frame=requestAnimationFrame(draw);
    };
    const wake=()=>{if(!frame&&live)frame=requestAnimationFrame(draw);};
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;wake();});observer.observe(element);
    const resize=new ResizeObserver(()=>{paint(element,points,0);wake();});resize.observe(element);
    const modulePath='/visuals/particle-shape.js';
    void import(/* webpackIgnore: true */ modulePath).then((module:FlowerModule)=>{if(live){points=module.createFlower(innerWidth<700?4500:10000);wake();}});
    reduced.addEventListener('change',wake);document.addEventListener('visibilitychange',wake);
    return()=>{live=false;cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();reduced.removeEventListener('change',wake);document.removeEventListener('visibilitychange',wake);};
  },[paused]);
  return <div className="relative min-h-[260px] w-full sm:min-h-[420px]">
    <canvas ref={canvas} className="absolute inset-0 h-full w-full" role="img" aria-label="粉紫色紫荆粒子花"/>
    <button className="absolute right-0 top-0 min-h-11 rounded-full border border-accent/20 px-4 text-xs text-muted" onClick={()=>setPaused(!paused)} aria-pressed={paused}>{paused?'继续动画':'暂停动画'}</button>
    <div className="absolute bottom-8 left-0 -rotate-3 rounded-2xl border border-white/80 bg-white/50 p-5 font-serif text-accent backdrop-blur-md">记录想法<span className="mt-2 block font-sans text-xs text-muted">也收藏普通的日常。</span></div>
  </div>;
}
