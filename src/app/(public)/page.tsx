import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSiteSetting } from "@/lib/site-data";
import { HomeGateways, HomeHero } from "@/components/public/home-sections";
import { ArticleList } from "@/components/public/article-list";
import { ContactLinks } from "@/components/public/contact-links";

export default async function HomePage(): Promise<React.JSX.Element> {
  const [site, posts, postCount, projectCount, latestProject, cover, photoCount] = await Promise.all([
    getSiteSetting(),
    prisma.post.findMany({ where: { published: true }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 2, select: { id: true, slug: true, title: true, summary: true, category: true, createdAt: true } }),
    prisma.post.count({ where: { published: true } }), prisma.project.count(),
    prisma.project.findFirst({ orderBy: { createdAt: "desc" }, select: { name: true } }),
    prisma.photo.findFirst({ orderBy: { createdAt: "desc" }, select: { url: true, caption: true } }),
    prisma.photo.count(),
  ]);
  return <><HomeHero site={site} /><div className="page-width pb-14">
    <div className="home-writing-shelf">
      <section className="glass-panel min-w-0 rounded-[22px_22px_22px_38px] px-6 pb-2 pt-6 sm:px-8 sm:pt-7"><div className="flex items-center justify-between gap-4 border-b border-line pb-5"><h2 className="font-serif text-2xl tracking-wide text-accent">最近写下 <span className="ml-1 align-middle font-sans text-xs text-muted">{postCount}</span></h2><Link href="/blog" className="inline-flex min-h-11 items-center text-xs text-copy">全部文章 ↗</Link></div><ArticleList posts={posts} compact /></section>
      <Link href="/photos" className="album-gateway group">{cover && <img src={cover.url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}<div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/35 to-slate-900/20" /><div className="relative px-5 text-center text-white"><p className="text-xs tracking-[.2em]">照片集 / {photoCount}</p><h2 className="mt-4 font-serif text-3xl leading-relaxed tracking-wide">留下这些画面。</h2><p className="mt-3 text-xs leading-6 text-slate-100">多张照片，换个角度慢慢看。</p></div><span className="absolute bottom-7 text-xs text-white">走进照片集 ↗</span></Link>
    </div>
    <HomeGateways projectCount={projectCount} projectName={latestProject?.name} />
    <section className="glass-panel mt-6 grid items-center gap-7 rounded-3xl p-6 sm:p-8 lg:grid-cols-[.85fr_1.15fr]"><div className="text-center"><p className="eyebrow">联系我</p><h2 className="mt-3 font-serif text-3xl text-ink">很高兴认识你。</h2><p className="mt-3 break-all text-sm text-copy">{site.email}</p></div><ContactLinks profile={site} /></section>
  </div></>;
}
