"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { adminRequest, saveJson } from "./request";
import { useAdminAction } from "./use-admin-action";
import { EmptyState, Feedback, FormField, deleteClass, inputClass, primaryClass, secondaryClass } from "./admin-ui";
import { formatDate, type AdminPost } from "./models";

interface PostDraft { id?: string; title: string; slug: string; summary: string; content: string; category: string; published: boolean }
const blank: PostDraft = { title: "", slug: "", summary: "", content: "", category: "随笔", published: false };

export function PostsEditor({ posts }: { posts: AdminPost[] }): ReactNode {
  const [draft, setDraft] = useState<PostDraft>(blank);
  const [filter, setFilter] = useState("all");
  const action = useAdminAction();
  const visible = posts.filter(post => filter === "all" || post.published === (filter === "published"));
  function select(post: AdminPost): void {
    setDraft({ id: post.id, title: post.title, slug: post.slug, summary: post.summary, content: post.content, category: post.category, published: post.published });
  }
  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const payload = { ...draft, slug: draft.slug.trim() || `post-${Date.now().toString(36)}` };
    const success = await action.run(() => saveJson("/api/admin/posts", payload), draft.published ? "文章已保存并公开。" : "草稿已保存，游客暂时看不到。" );
    if (success) setDraft(blank);
  }
  async function remove(post: AdminPost): Promise<void> {
    if (!window.confirm(`确定删除《${post.title}》吗？此操作无法撤销。`)) return;
    const success = await action.run(() => adminRequest(`/api/admin/posts?id=${encodeURIComponent(post.id)}`, { method: "DELETE" }), "文章已删除。");
    if (success && draft.id === post.id) setDraft(blank);
  }
  return <>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2" role="group" aria-label="文章状态筛选">{[["all", "全部"], ["published", "已发布"], ["draft", "草稿"]].map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`${secondaryClass} ${filter === value ? "border-slate-600 bg-slate-100" : ""}`}>{label}</button>)}</div><button type="button" onClick={() => setDraft(blank)} disabled={action.pending} className={secondaryClass}>＋ 新建文章</button></div>
    <Feedback {...action} />
    <div className="mt-5 grid items-start gap-7 xl:grid-cols-[220px_minmax(0,1fr)]">
      <div className="space-y-3">{visible.length ? visible.map(post => <article key={post.id} className={`rounded-2xl border p-4 ${draft.id === post.id ? "border-sky-600 bg-sky-50" : "border-slate-200 bg-white"}`}><p className="mb-2 text-xs text-slate-500">{post.published ? "已发布" : "草稿"} · {post.category}</p><h2 className="break-words font-serif text-lg leading-7 text-slate-800">{post.title}</h2><p className="mt-2 text-xs leading-6 text-slate-500">{formatDate(post.updatedAt)}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" className={secondaryClass} disabled={action.pending} onClick={() => select(post)}>编辑</button><button type="button" className={deleteClass} disabled={action.pending} onClick={() => remove(post)}>删除</button>{post.published && <Link className="inline-flex min-h-11 items-center px-2 text-sm text-sky-800" href={`/blog/${encodeURIComponent(post.slug)}`} target="_blank" rel="noopener noreferrer">查看 ↗</Link>}</div></article>) : <EmptyState>这里还没有{filter === "draft" ? "草稿" : "文章"}。</EmptyState>}</div>
      <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="mb-5 font-serif text-xl text-slate-800">{draft.id ? "编辑文章" : "写一篇新文章"}</h2>
        <fieldset disabled={action.pending} className="space-y-5 disabled:opacity-60">
          <FormField label="文章标题"><input className={inputClass} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} required maxLength={191} /></FormField>
          <div className="grid gap-5 sm:grid-cols-2"><FormField label="文章分类"><input className={inputClass} value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })} required maxLength={80} /></FormField><FormField label="网址名"><input className={inputClass} value={draft.slug} onChange={event => setDraft({ ...draft, slug: event.target.value })} maxLength={160} pattern="[\p{L}\p{N}-]+" placeholder="留空自动生成" /><span className="mt-1 block text-xs font-normal leading-6 text-slate-500">可用文字、数字和短横线。</span></FormField></div>
          <FormField label="文章摘要"><textarea className={inputClass} value={draft.summary} onChange={event => setDraft({ ...draft, summary: event.target.value })} maxLength={600} rows={3} placeholder="用一两句话介绍这篇文章" /></FormField>
          <FormField label="正文"><textarea className={`${inputClass} min-h-[360px] resize-y leading-8`} value={draft.content} onChange={event => setDraft({ ...draft, content: event.target.value })} required maxLength={100000} rows={15} placeholder="从这里开始写…" /></FormField>
          <label className="flex min-h-11 items-center gap-3 text-sm text-slate-700"><input type="checkbox" checked={draft.published} onChange={event => setDraft({ ...draft, published: event.target.checked })} className="h-5 w-5 accent-slate-800" />公开发布这篇文章</label>
          <div className="flex flex-wrap gap-3"><button className={primaryClass} type="submit">{action.pending ? "保存中…" : draft.published ? "保存并发布" : "保存草稿"}</button>{draft.id && <button className={secondaryClass} type="button" onClick={() => setDraft(blank)}>取消编辑</button>}</div>
        </fieldset>
      </form>
    </div>
  </>;
}
