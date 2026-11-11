'use client';

import {useEffect, useRef, useState} from 'react';

type Renderer = (canvas:HTMLCanvasElement,timing:{time:number;duration:number;reduced:boolean})=>void;
const labels=['春草','夏花','秋枫','冬雪'];
const clock=(value:number)=>Math.floor(value/60)+':'+String(Math.floor(value%60)).padStart(2,'0');

export function MusicPlayer() {
  const audio=useRef<HTMLAudioElement>(null),small=useRef<HTMLCanvasElement>(null),large=useRef<HTMLCanvasElement>(null),dialog=useRef<HTMLDialogElement>(null);
  const renderer=useRef<Renderer>();
  const [ready,setReady]=useState(false);
  const [open,setOpen]=useState(false),[playing,setPlaying]=useState(false),[time,setTime]=useState(0),[duration,setDuration]=useState(32),[error,setError]=useState('');
  useEffect(()=>{
    let live=true;
    const path='/visuals/music-disc.js';
    void import(/* webpackIgnore: true */ path).then((module:{createMusicDisc:()=>Renderer})=>{
      if(live){renderer.current=module.createMusicDisc();setReady(true);}
    }).catch(()=>{if(live)setError('四季动画暂时无法加载。');});
    return()=>{live=false;};
  },[]);
  useEffect(()=>{
    if(!ready)return;
    let frame=0,last=0;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const draw=(now:number)=>{
      frame=0;const canvas=open?large.current:small.current;
      if(!canvas||document.hidden)return;
      if(!playing||now-last>38){renderer.current?.(canvas,{time:audio.current?.currentTime || time,duration,reduced:reduced.matches});last=now;}
      if(playing&&!reduced.matches)frame=requestAnimationFrame(draw);
    };
    const wake=()=>{if(!frame)frame=requestAnimationFrame(draw);};
    const resize=new ResizeObserver(wake);if(small.current)resize.observe(small.current);if(large.current)resize.observe(large.current);
    wake();reduced.addEventListener('change',wake);document.addEventListener('visibilitychange',wake);
    return()=>{cancelAnimationFrame(frame);resize.disconnect();reduced.removeEventListener('change',wake);document.removeEventListener('visibilitychange',wake);};
  },[open,playing,time,duration,ready]);
  async function toggle(){if(!audio.current)return;if(!audio.current.paused){audio.current.pause();return;}setError('');try{await audio.current.play();}catch{setError('暂时无法播放，请重试。');}}
  function seek(value:number){if(audio.current)audio.current.currentTime=value;setTime(value);}
  function expand(){dialog.current?.showModal();setOpen(true);}
  const season=Math.min(3,Math.floor(time/duration*4));
  return <section className="mt-5 max-w-sm rounded-2xl border border-white/80 bg-white/55 p-2 text-left shadow-sm">
    <audio ref={audio} src="/island.wav" preload="none" loop onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onTimeUpdate={()=>setTime(audio.current?.currentTime || 0)} onLoadedMetadata={()=>{const value=audio.current?.duration;if(value&&Number.isFinite(value))setDuration(value);}}/>
    <div className="flex items-center gap-3">
      <button onClick={expand} className="flex flex-1 items-center gap-3 text-left" aria-label="放大四季唱片"><canvas ref={small} className="h-14 w-[86px] rounded-xl bg-slate-900" aria-hidden="true"/><span><small className="text-xs text-muted">四季唱片 · {labels[season]}</small><strong className="block font-serif text-lg text-ink">小岛午后</strong></span></button>
      <button onClick={()=>void toggle()} className="icon-control bg-accent text-white" aria-label={playing?'暂停音乐':'播放音乐'}>{playing?'Ⅱ':'▶'}</button>
    </div>
    {error&&<p role="status" className="p-2 text-sm text-muted">{error}</p>}
    <dialog ref={dialog} onClose={()=>setOpen(false)} className="w-[min(620px,calc(100%_-_28px))] rounded-3xl border border-white bg-page p-5 text-ink backdrop:bg-slate-900/50 backdrop:backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-2xl">小岛午后</h2><button onClick={()=>dialog.current?.close()} className="icon-control" aria-label="关闭播放器">×</button></div>
      <canvas ref={large} className="aspect-[1.55] w-full rounded-2xl bg-slate-900" role="img" aria-label="春草、夏花、秋枫与冬雪的动态微缩景观"/>
      <div className="my-3 grid grid-cols-4 gap-2">{labels.map((label,index)=><button key={label} onClick={()=>seek(index*duration/4+.025)} aria-pressed={season===index} className={`min-h-11 rounded-lg text-sm ${season===index?'bg-white text-accent':'text-muted'}`}>{label}</button>)}</div>
      <div className="flex items-center gap-3"><button onClick={()=>void toggle()} className="icon-control bg-accent text-white" aria-label={playing?'暂停音乐':'播放音乐'}>{playing?'Ⅱ':'▶'}</button><label className="flex-1 text-xs"><span className="sr-only">播放进度</span><input className="min-h-11 w-full accent-accent" type="range" min={0} max={duration} step={.1} value={time} onChange={event=>seek(Number(event.target.value))}/><span className="flex justify-between"><span>{clock(time)}</span><span>{clock(duration)}</span></span></label></div>
    </dialog>
  </section>;
}
