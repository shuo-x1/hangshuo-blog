import type { ReactNode } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { AdminHeading, EmptyState, secondaryClass } from "@/components/admin/admin-ui";
import { formatDate } from "@/components/admin/models";

export default async function DashboardPage(): Promise<ReactNode> {
  await requireAdmin();
  const [posts, photos, messages, visits, visitors, recentVisits] = await Promise.all([
    prisma.post.count(), prisma.photo.count(), prisma.message.count({ where: { approved: false } }),
    prisma.visit.count(), prisma.visit.groupBy({ by: ["visitorHash"] }),
    prisma.visit.findMany({ take: 100, orderBy: { createdAt: "desc" }, select: { id: true, path: true, day: true, createdAt: true } }),
  ]);
  const metrics = [["文章", posts], ["照片", photos], ["待审核", messages], ["页面访问", visits], ["累计访客", visitors.length]] as const;
  return <>
    <AdminHeading title="概览" description="看看最近的访问，再处理留言或写一篇新文章。" />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{metrics.map(([label, value]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">{label}</p><p className="mt-3 text-3xl tabular-nums text-slate-800">{value}</p></article>)}</div>
    <p className="mt-4 text-xs leading-6 text-slate-500">页面访问按访客、路径和日期去重统计，站主登录后的访问不计入。</p>
    <div className="my-8 flex flex-wrap gap-3"><Link href="/admin/posts" className={secondaryClass}>写文章 →</Link><Link href="/admin/photos" className={secondaryClass}>添加照片 →</Link><Link href="/admin/messages" className={secondaryClass}>审核留言 →</Link></div>
    <section><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="font-serif text-2xl text-slate-800">最近访问</h2><p className="text-xs text-slate-500">最多显示最近 100 条</p></div>
      {recentVisits.length ? <div className="max-h-[540px] overflow-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full min-w-[480px] text-left text-sm"><thead className="sticky top-0 bg-slate-50 text-slate-600"><tr><th scope="col" className="px-5 py-4 font-medium">访问路径</th><th scope="col" className="px-5 py-4 font-medium">日期</th><th scope="col" className="px-5 py-4 font-medium">记录时间</th></tr></thead><tbody>{recentVisits.map(visit => <tr key={visit.id} className="border-t border-slate-100"><td className="max-w-[260px] break-words px-5 py-4 font-mono text-xs text-slate-700">{visit.path}</td><td className="whitespace-nowrap px-5 py-4 text-slate-500">{visit.day}</td><td className="whitespace-nowrap px-5 py-4 text-slate-500"><time dateTime={visit.createdAt.toISOString()}>{formatDate(visit.createdAt.toISOString())}</time></td></tr>)}</tbody></table></div> : <EmptyState>还没有访问记录。访客浏览网站后，数据会显示在这里。</EmptyState>}
    </section>
  </>;
}
