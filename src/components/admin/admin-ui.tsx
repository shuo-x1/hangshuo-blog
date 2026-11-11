import type { ReactNode } from "react";

export const inputClass = "mt-2 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-500 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20 disabled:bg-slate-100";
export const primaryClass = "inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-700 disabled:cursor-wait disabled:opacity-50";
export const secondaryClass = "inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-700 disabled:cursor-wait disabled:opacity-50";
export const deleteClass = "inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm text-rose-700 hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-700 disabled:cursor-wait disabled:opacity-50";

export function AdminHeading({ title, description }: { title: string; description: string }): ReactNode {
  return <div className="mb-8"><p className="text-xs font-medium tracking-[0.2em] text-slate-500">站主管理</p><h1 className="mt-3 font-serif text-3xl text-slate-800">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{description}</p></div>;
}

export function Feedback({ pending, error, success }: { pending: boolean; error: string; success: string }): ReactNode {
  if (error) return <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800">{error}</p>;
  return <p role="status" aria-live="polite" className="mt-4 min-h-6 text-sm leading-6 text-slate-600">{pending ? "正在处理，请稍候…" : success}</p>;
}

export function EmptyState({ children }: { children: ReactNode }): ReactNode {
  return <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm leading-7 text-slate-600">{children}</p>;
}

export function FormField({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return <label className="block text-sm font-medium text-slate-700">{label}{children}</label>;
}
