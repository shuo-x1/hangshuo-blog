"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { adminRequest } from "./request";

const links = [["/admin", "概览"], ["/admin/posts", "文章"], ["/admin/projects", "项目"], ["/admin/photos", "照片"], ["/admin/messages", "留言与评论"], ["/admin/settings", "网站资料"]] as const;

export function AdminShell({ children }: { children: ReactNode }): ReactNode {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function logout(): Promise<void> {
    setPending(true);
    try { await adminRequest("/api/auth/logout", { method: "POST" }); router.replace("/login"); router.refresh(); }
    catch { setError("退出失败，请重试。"); setPending(false); }
  }
  return <div className="mx-auto max-w-7xl rounded-3xl bg-[#edf3f7] px-4 py-10 [color-scheme:light] sm:px-8">
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
      <Link href="/admin" className="font-serif text-xl text-slate-800">张航硕 / 管理空间</Link>
      <div className="flex items-center gap-4 text-sm"><Link href="/" className="py-3 text-slate-600 hover:text-slate-900">查看网站 ↗</Link><button type="button" onClick={logout} disabled={pending} className="min-h-11 rounded-lg px-3 text-slate-600 hover:bg-white disabled:opacity-50">{pending ? "退出中…" : "退出登录"}</button></div>
    </div>
    {error && <p role="alert" className="mb-5 text-sm text-rose-700">{error}</p>}
    <div className="grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)]">
      <nav aria-label="管理导航" className="flex flex-wrap content-start gap-2 lg:flex-col">
        {links.map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={`min-h-11 rounded-xl px-4 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 ${pathname === href ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-white"}`}>{label}</Link>)}
      </nav>
      <div className="min-w-0 rounded-3xl border border-white bg-white/65 p-5 shadow-sm sm:p-8">{children}</div>
    </div>
  </div>;
}
