"use client";

import { useEffect, useRef, useState } from "react";
import { PhotoModal, type PhotoItem } from "@/components/public/photo-modal";
import { getPhotoPose, isPhotoLayout, photoLayouts, poseTransform, type PhotoLayout } from "@/components/public/photo-layouts";

interface PhotoWallProps { photos: PhotoItem[]; initialStyle: string }

function usePhotoMotion({ world, stage, layout, count, photoKey, running }: {
  world: React.RefObject<HTMLDivElement>; stage: React.RefObject<HTMLDivElement>; layout: PhotoLayout; count: number; photoKey: string; running: boolean;
}): void {
  useEffect(() => {
    const container = stage.current;
    const scene = world.current;
    if (!container || !scene) return;
    let frame = 0;
    let visible = false;
    let last = 0;
    let time = 0;
    const cards = scene.querySelectorAll<HTMLButtonElement>(".photo-wall-card");
    const wake = (): void => { if (visible && !document.hidden && !frame) frame = requestAnimationFrame(paint); };
    function paint(now: number): void {
      frame = 0;
      if (!visible || document.hidden) return;
      if (running && last) time += Math.min((now - last) / 1000, .06);
      last = now;
      cards.forEach((card, index) => { const pose = getPhotoPose({ layout, index, count, time }); card.style.transform = poseTransform(pose); card.style.zIndex = String(Math.round(pose.z + 500)); });
      if (running) wake();
    }
    const resize = new ResizeObserver(() => { scene.style.transform = `translate(-50%,-50%) scale(${Math.min(container.clientWidth / (count <= 3 ? 650 : 900), container.clientHeight / 620)})`; wake(); });
    const observer = new IntersectionObserver(([entry]) => { visible = !!entry?.isIntersecting; wake(); });
    resize.observe(container); observer.observe(container); document.addEventListener("visibilitychange", wake);
    return () => { cancelAnimationFrame(frame); resize.disconnect(); observer.disconnect(); document.removeEventListener("visibilitychange", wake); };
  }, [world, stage, layout, count, photoKey, running]);
}

export function PhotoWall({ photos, initialStyle }: PhotoWallProps): React.JSX.Element {
  const [layout, setLayout] = useState<PhotoLayout>(isPhotoLayout(initialStyle) ? initialStyle : "carousel");
  const [running, setRunning] = useState(true);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<PhotoItem | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const pages = Math.ceil(photos.length / 12);
  const visiblePhotos = photos.slice(page * 12, page * 12 + 12);
  usePhotoMotion({ world, stage, layout, count: visiblePhotos.length, photoKey: visiblePhotos.map(photo => photo.id).join(","), running: running && !selected });
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const update = (): void => setRunning(!reduced.matches);
    update(); reduced.addEventListener("change", update);
    return () => reduced.removeEventListener("change", update);
  }, []);
  return <><div className="mb-5 flex items-center justify-between gap-5"><h2 className="font-serif text-2xl leading-relaxed text-ink">换个角度，慢慢看。</h2><span className="hidden text-xs text-muted sm:inline">七种排列 · 多张同时展示</span></div><div className="mb-4 grid grid-cols-4 gap-2 sm:grid-cols-7" role="group" aria-label="照片墙样式">{photoLayouts.map(([key, label], index) => <button key={key} type="button" aria-pressed={layout === key} className="wall-style" onClick={() => setLayout(key)}><span className="text-[10px] tabular-nums opacity-75">0{index + 1}</span><span className="font-serif text-sm">{label}</span></button>)}</div>
    <div ref={stage} className="photo-wall"><p className="absolute left-5 top-5 z-[1001] text-xs text-copy">{photos.length} 张照片 · 多图同屏</p><div ref={world} className="photo-wall-world">{visiblePhotos.map((photo, index) => <button type="button" key={photo.id} className="photo-wall-card" style={{ transform: poseTransform(getPhotoPose({ layout, index, count: visiblePhotos.length, time: 0 })) }} onClick={() => setSelected(photo)} aria-label={`放大照片并写评论：${photo.caption}`}><img src={photo.url} alt={photo.caption} loading="lazy" draggable={false} /><span>{photo.caption}</span></button>)}</div><p className="absolute bottom-5 left-5 right-5 z-[1001] text-xs leading-6 text-copy">点击照片放大，也可以写一条评论。</p></div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-4"><button className="button-outline" type="button" onClick={() => setRunning(value => !value)}>{running ? "暂停动画 Ⅱ" : "播放动画 ▷"}</button>{pages > 1 && <div className="flex items-center gap-3"><button type="button" className="icon-control" aria-label="上一组照片" onClick={() => setPage(value => (value - 1 + pages) % pages)}>←</button><span className="text-xs tabular-nums text-copy">{page + 1} / {pages}</span><button type="button" className="icon-control" aria-label="下一组照片" onClick={() => setPage(value => (value + 1) % pages)}>→</button></div>}</div>
    <PhotoModal photo={selected} onDismiss={() => setSelected(null)} />
  </>;
}
