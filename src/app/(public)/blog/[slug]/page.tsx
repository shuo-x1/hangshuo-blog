import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSiteSetting } from "@/lib/site-data";

const getPost = cache((slug: string) => prisma.post.findFirst({ where: { slug, published: true } }));
interface ArticlePageProps { params: { slug: string } }

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const post = await getPost(params.slug);
  return { title: post ? post.title : "文章未找到", description: post?.summary || undefined };
}

export default async function ArticlePage({ params }: ArticlePageProps): Promise<React.JSX.Element> {
  const [post, site] = await Promise.all([getPost(params.slug), getSiteSetting()]);
  if (!post) notFound();
  const date = new Intl.DateTimeFormat("zh-CN", { dateStyle: "long", timeZone: "Asia/Shanghai" }).format(post.createdAt);
  const minutes = Math.max(1, Math.ceil(post.content.replace(/\s/g, "").length / 400));
  return <div className="article-page"><Link href="/blog" className="mb-9 inline-flex min-h-11 items-center text-sm text-copy">← 回到文章列表</Link><article>
    <header className="article-header"><div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-copy"><span className="text-accent">{post.category || "随笔"}</span><time dateTime={post.createdAt.toISOString()}>{date}</time><span>约 {minutes} 分钟</span></div><h1 className="my-5 break-words font-serif text-4xl leading-relaxed tracking-wide text-ink sm:text-[44px]">{post.title}</h1><p className="text-sm text-copy">{site.name}</p></header>
    <div className="article-body">{post.content.split(/\r?\n\s*\r?\n/).filter(paragraph => paragraph.trim()).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
    <div className="mt-12 border-t border-line py-8 text-center"><span aria-hidden="true" className="tracking-[.7em] text-muted">· · ·</span><p className="mt-5 font-serif text-base text-copy">谢谢你读到这里。</p><Link href="/guestbook" className="mt-3 inline-flex min-h-11 items-center text-sm text-accent">有什么想说的？留句话吧 ↗</Link></div>
  </article></div>;
}
