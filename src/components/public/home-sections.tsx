import Link from "next/link";
import type { SiteSetting } from "@prisma/client";
import { Flower } from "@/components/visuals/flower";
import { MusicPlayer } from "@/components/visuals/music-player";
import { ContactLinks } from "@/components/public/contact-links";
import { Icon } from "@/components/icons";

export function HomeHero({ site }: { site: SiteSetting }): React.JSX.Element {
  return <section className="home-hero" aria-labelledby="home-title">
    <div className="hero-introduction">
      <p className="eyebrow flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-sky-400 ring-4 ring-sky-200/40" />欢迎来到我的小岛</p>
      <h1 id="home-title" className="mt-6 font-serif text-[42px] leading-[1.5] tracking-wide text-ink sm:text-[54px] lg:text-[62px]">你好，我是<br /><span className="text-accent">{site.name}。</span></h1>
      <p className="mt-6 font-serif text-base tracking-wide text-copy">博客、项目，还有生活。</p>
      <p className="mt-2 max-w-md text-sm leading-7 text-muted">{site.tagline}</p>
      <div className="hero-actions mb-5 mt-7 flex flex-wrap items-center gap-3"><Link href="/blog" className="button-primary">读我的博客<Icon name="arrowUp" className="h-4 w-4" /></Link><Link href="/projects" className="button-outline">看我的项目<Icon name="arrow" className="h-4 w-4" /></Link></div>
      <div className="hero-contacts"><ContactLinks profile={site} compact /></div>
      <div className="hero-music mt-5 max-w-sm"><MusicPlayer /></div>
    </div>
    <div className="hero-flower"><Flower /><div className="floating-note" aria-hidden="true"><p className="font-serif text-base text-copy">记录想法</p><p className="mt-1 text-xs leading-6 text-muted">也收藏普通的日常。</p></div><p className="absolute bottom-1 right-1 text-xs tracking-wide text-muted">一朵花，慢慢开。</p></div>
  </section>;
}

export function HomeGateways({ projectCount, projectName }: { projectCount: number; projectName?: string }): React.JSX.Element {
  return <section className="home-gateways" aria-label="更多内容">
    <Link href="/projects" className="personality-card pebble-blue"><p className="eyebrow">项目 <span className="ml-1 tabular-nums">/ {projectCount}</span></p><Icon name="code" className="mb-3 mt-6 h-8 w-8 opacity-70" /><h2 className="font-serif text-[28px]">我做的东西</h2><p className="mt-3 max-w-full break-words text-sm leading-7">{projectName || "新的尝试，会慢慢放在这里。"}</p><span className="mt-5 text-xs">查看项目 ↗</span></Link>
    <Link href="/about" className="personality-card pebble-gold"><span aria-hidden="true" className="font-serif text-6xl leading-none opacity-50">“</span><h2 className="mt-1 font-serif text-[28px] leading-relaxed">写点东西，<br />做点喜欢的事。</h2><span className="mt-6 text-xs">认识我 ↗</span></Link>
    <Link href="/guestbook" className="personality-card pebble-sage"><Icon name="chat" className="mb-5 h-7 w-7 opacity-70" /><h2 className="font-serif text-[28px] leading-relaxed">来都来了，<br />留句话吧。</h2><p className="mt-3 text-sm">建议、闲聊都可以。</p><span className="mt-6 text-xs">写留言 ↗</span></Link>
  </section>;
}
