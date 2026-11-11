"use client";

import { useState, type ReactNode } from "react";
import { adminRequest, saveJson } from "./request";
import { useAdminAction } from "./use-admin-action";
import { EmptyState, Feedback, deleteClass, primaryClass, secondaryClass } from "./admin-ui";
import { formatDate, type AdminMessage } from "./models";

export function MessagesManager({ messages }: { messages: AdminMessage[] }): ReactNode {
  const [filter, setFilter] = useState("pending");
  const action = useAdminAction();
  const visible = messages.filter(message => filter === "all" || message.approved === (filter === "approved"));
  const pendingCount = messages.filter(message => !message.approved).length;
  async function approve(id: string): Promise<void> {
    await action.run(() => saveJson("/api/admin/messages", { id, approved: true }, "PATCH"), "已审核通过，访客可以看到这条内容了。");
  }
  async function remove(id: string): Promise<void> {
    if (!window.confirm("确定删除这条留言或评论吗？")) return;
    await action.run(() => adminRequest(`/api/admin/messages?id=${encodeURIComponent(id)}`, { method: "DELETE" }), "已删除。");
  }
  return <>
    <div role="group" aria-label="留言筛选" className="flex flex-wrap gap-2">{[["pending", `待审核 ${pendingCount}`], ["approved", "已公开"], ["all", "全部"]].map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} className={`${secondaryClass} ${filter === value ? "border-slate-600 bg-slate-100" : ""}`} onClick={() => setFilter(value)}>{label}</button>)}</div>
    <Feedback {...action} />
    <div className="mt-5 space-y-4">{visible.length ? visible.map(message => <article key={message.id} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="break-words text-base font-medium text-slate-800">{message.name}</h2><p className="mt-1 text-xs text-slate-500">{formatDate(message.createdAt)}</p></div><span className={`self-start rounded-full px-3 py-1 text-xs ${message.approved ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{message.approved ? "已公开" : "待审核"}</span></div><p className="mt-4 text-xs font-medium text-slate-500">{message.photo ? `照片评论 · ${message.photo.caption || "未命名照片"}` : "网站留言"}</p><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-8 text-slate-700">{message.content}</p><div className="mt-5 flex flex-wrap gap-3">{!message.approved && <button type="button" className={primaryClass} disabled={action.pending} onClick={() => approve(message.id)}>审核通过</button>}<button type="button" className={deleteClass} disabled={action.pending} onClick={() => remove(message.id)}>删除</button></div></article>) : <EmptyState>{filter === "pending" ? "暂时没有需要审核的留言或评论。" : "这里还没有留言或评论。"}</EmptyState>}</div>
  </>;
}
