"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { MessageForm } from "@/components/public/message-form";

export interface PhotoItem { id: string; url: string; caption: string }
interface PhotoComment { id: string; name: string; content: string; createdAt: string }
type CommentState = { status: "loading" } | { status: "error" } | { status: "ready"; comments: PhotoComment[] };

function isComment(value: unknown): value is PhotoComment {
  return typeof value === "object" && value !== null &&
    "id" in value && typeof value.id === "string" && "name" in value && typeof value.name === "string" &&
    "content" in value && typeof value.content === "string" && "createdAt" in value && typeof value.createdAt === "string";
}

function CommentList({ state }: { state: CommentState }): React.JSX.Element {
  if (state.status === "loading") return <p className="py-4 text-sm text-muted" role="status">正在读取评论…</p>;
  if (state.status === "error") return <p className="py-4 text-sm leading-7 text-muted">评论暂时无法读取。可以关闭照片后重试。</p>;
  if (!state.comments.length) return <p className="py-4 text-sm leading-7 text-muted">还没有公开评论，写下第一句吧。</p>;
  return <div className="max-h-64 divide-y divide-line overflow-y-auto pr-2">{state.comments.map(comment => <article key={comment.id} className="py-4"><div className="flex items-center justify-between gap-3"><h3 className="break-all text-sm font-medium text-ink">{comment.name}</h3><time dateTime={comment.createdAt} className="shrink-0 text-xs text-muted">{new Date(comment.createdAt).toLocaleDateString("zh-CN")}</time></div><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-copy">{comment.content}</p></article>)}</div>;
}

export function PhotoModal({ photo, onDismiss }: { photo: PhotoItem | null; onDismiss: () => void }): React.JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLDivElement>(null);
  const [comments, setComments] = useState<CommentState>({ status: "loading" });
  useEffect(() => {
    if (!photo) { dialog.current?.close(); return; }
    dialog.current?.showModal();
    setComments({ status: "loading" });
    const controller = new AbortController();
    fetch(`/api/messages?photoId=${encodeURIComponent(photo.id)}`, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error("Comments unavailable");
      const value: unknown = await response.json();
      if (typeof value !== "object" || value === null || !("messages" in value) || !Array.isArray(value.messages)) throw new Error("Invalid comments");
      setComments({ status: "ready", comments: value.messages.filter(isComment) });
    }).catch(error => { if (!(error instanceof DOMException && error.name === "AbortError")) setComments({ status: "error" }); });
    return () => controller.abort();
  }, [photo]);
  function focusComment(): void {
    form.current?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    form.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus({ preventScroll: true });
  }
  return <dialog ref={dialog} className="photo-dialog" aria-labelledby="photo-caption" onClose={onDismiss} onClick={event => { if (event.target === event.currentTarget) onDismiss(); }}>
    {photo && <div className="grid lg:grid-cols-[1.5fr_1fr]"><figure className="flex min-w-0 flex-col justify-center bg-[#183044] px-4 py-7 text-white sm:px-7"><img src={photo.url} alt={photo.caption} className="h-[43svh] w-full object-contain lg:h-[62svh]" /><figcaption className="mt-5 flex items-center justify-between gap-4"><span id="photo-caption" className="break-words text-sm leading-7">{photo.caption}</span><button className="shrink-0 rounded-full border border-white/30 px-4 py-3 text-xs text-white" type="button" onClick={focusComment}>写评论 ↗</button></figcaption></figure><aside className="min-w-0 px-6 py-8 sm:px-7"><div className="mb-4 flex items-start justify-between gap-4"><div><p className="eyebrow">这一刻</p><h2 className="mt-2 font-serif text-2xl text-ink">看到了什么？</h2></div><button className="icon-control shrink-0" type="button" onClick={onDismiss} aria-label="关闭照片"><Icon name="close" /></button></div><p className="text-sm leading-7 text-copy">关于这个画面，想说什么都可以。</p><CommentList state={comments} /><div ref={form} className="mt-5 border-t border-line pt-5"><MessageForm key={photo.id} photoId={photo.id} /></div></aside></div>}
  </dialog>;
}
