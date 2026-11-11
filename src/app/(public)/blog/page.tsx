import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PageHeading } from "@/components/public/page-heading";
import { ArticleList } from "@/components/public/article-list";
import { Icon } from "@/components/icons";

interface BlogPageProps { searchParams: { q?: string; page?: string } }

export default async function BlogPage({ searchParams }: BlogPageProps): Promise<React.JSX.Element> {
  const q = typeof searchParams.q === "string" ? searchParams.q.trim().slice(0, 100) : "";
  const page = Math.max(1, Math.min(10000, Number.parseInt(searchParams.page || "", 10) || 1));
  const where: Prisma.PostWhereInput = { published: true, ...(q ? { OR: [{ title: { contains: q } }, { summary: { contains: q } }, { content: { contains: q } }, { category: { contains: q } }] } : {}) };
  const [posts, count] = await Promise.all([prisma.post.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 12, take: 12, select: { id: true, slug: true, title: true, summary: true, category: true, createdAt: true } }), prisma.post.count({ where })]);
  const href = (next: number): string => `/blog?${new URLSearchParams({ ...(q ? { q } : {}), page: String(next) })}`;
  return <div className="reading-page-width"><PageHeading eyebrow="写在这里" title="博客" description="技术笔记，也写一点日常。慢慢写，慢慢读。" /><form action="/blog" method="get" className="search-box"><Icon name="search" className="h-5 w-5 shrink-0 text-muted" /><label htmlFor="blog-search" className="sr-only">搜索文章</label><input id="blog-search" name="q" defaultValue={q} maxLength={100} placeholder="搜索标题、分类或正文…" className="min-h-11 w-full min-w-0 bg-transparent text-base text-ink outline-none" /><button className="text-sm text-accent" type="submit">搜索</button></form>{q && <p className="mb-3 text-sm text-muted">“{q}” · {count} 篇文章</p>}<ArticleList posts={posts} /><nav aria-label="文章分页" className="mt-8 flex items-center justify-between gap-4">{page > 1 ? <Link href={href(page - 1)} className="button-outline">← 上一页</Link> : <span />}{page * 12 < count && <Link href={href(page + 1)} className="button-outline">下一页 →</Link>}</nav></div>;
}
