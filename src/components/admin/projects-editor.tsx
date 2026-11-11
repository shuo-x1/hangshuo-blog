"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { adminRequest, saveJson } from "./request";
import { useAdminAction } from "./use-admin-action";
import { EmptyState, Feedback, FormField, deleteClass, inputClass, primaryClass, secondaryClass } from "./admin-ui";
import type { AdminProject } from "./models";

interface ProjectDraft { id?: string; name: string; status: string; description: string; demoUrl: string; sourceUrl: string; downloadUrl: string }
const blank: ProjectDraft = { name: "", status: "进行中", description: "", demoUrl: "", sourceUrl: "", downloadUrl: "" };
const urlFields = [["demoUrl", "在线体验"], ["sourceUrl", "源码地址"], ["downloadUrl", "下载地址"]] as const;

export function ProjectsEditor({ projects }: { projects: AdminProject[] }): ReactNode {
  const [draft, setDraft] = useState<ProjectDraft>(blank);
  const action = useAdminAction();
  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (await action.run(() => saveJson("/api/admin/projects", draft), "项目已保存，公开展示已更新。")) setDraft(blank);
  }
  async function remove(project: AdminProject): Promise<void> {
    if (!window.confirm(`确定删除项目“${project.name}”吗？`)) return;
    const success = await action.run(() => adminRequest(`/api/admin/projects?id=${encodeURIComponent(project.id)}`, { method: "DELETE" }), "项目已删除。");
    if (success && draft.id === project.id) setDraft(blank);
  }
  return <>
    <div className="mb-5 flex justify-end"><button type="button" className={secondaryClass} disabled={action.pending} onClick={() => setDraft(blank)}>＋ 新建项目</button></div>
    <div className="mb-8 space-y-3">{projects.length ? projects.map(project => <article key={project.id} className="flex flex-wrap items-start justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5"><div className="min-w-0 flex-1"><p className="text-xs text-slate-500">{project.status}</p><h2 className="mt-2 break-words font-serif text-xl text-slate-800">{project.name}</h2><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">{project.description}</p></div><div className="flex gap-2"><button type="button" className={secondaryClass} disabled={action.pending} onClick={() => setDraft({ id: project.id, name: project.name, status: project.status, description: project.description, demoUrl: project.demoUrl, sourceUrl: project.sourceUrl, downloadUrl: project.downloadUrl })}>编辑</button><button type="button" className={deleteClass} disabled={action.pending} onClick={() => remove(project)}>删除</button></div></article>) : <EmptyState>还没有项目。可以先保存名称和介绍，再添加链接。</EmptyState>}</div>
    <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="mb-5 font-serif text-xl text-slate-800">{draft.id ? "编辑项目" : "添加项目"}</h2><fieldset disabled={action.pending} className="space-y-5 disabled:opacity-60">
      <div className="grid gap-5 sm:grid-cols-2"><FormField label="项目名称"><input className={inputClass} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} required maxLength={191} /></FormField><FormField label="项目状态"><input className={inputClass} value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value })} required maxLength={80} placeholder="进行中 / 已上线" /></FormField></div>
      <FormField label="项目介绍"><textarea className={inputClass} value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} required maxLength={10000} rows={4} /></FormField>
      {urlFields.map(([key, label]) => <FormField key={key} label={`${label}（可选）`}><input type="url" className={inputClass} value={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} maxLength={1000} placeholder="https://" /></FormField>)}
      <div className="flex flex-wrap gap-3"><button type="submit" className={primaryClass}>{action.pending ? "保存中…" : "保存项目"}</button>{draft.id && <button type="button" className={secondaryClass} onClick={() => setDraft(blank)}>取消编辑</button>}</div>
    </fieldset></form><Feedback {...action} />
  </>;
}
