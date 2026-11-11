import Link from "next/link";
import { getSiteSetting } from "@/lib/site-data";
import { PageHeading } from "@/components/public/page-heading";
import { ContactLinks } from "@/components/public/contact-links";

export default async function AboutPage(): Promise<React.JSX.Element> {
  const site = await getSiteSetting();
  return <div className="public-page"><PageHeading eyebrow="认识一下" title="关于我" /><div className="grid items-start gap-8 lg:grid-cols-[1.1fr_1fr]"><article className="glass-panel rounded-[28px_48px_28px_28px] p-7 sm:p-10"><div className="grid h-20 w-20 place-items-center rounded-[24px_32px_24px_32px] bg-sky-200/50 font-serif text-4xl text-accent" aria-hidden="true">{site.name.slice(-1)}</div><h2 className="mt-7 font-serif text-3xl leading-relaxed text-ink">我是{site.name}。</h2><p className="mt-4 whitespace-pre-wrap break-words font-serif text-lg leading-[2.1] text-copy">{site.about}</p><p className="mt-6 text-sm leading-8 text-muted">{site.tagline}</p><Link href="/blog" className="button-outline mt-6">从文章里了解我 ↗</Link></article><section className="pt-2"><p className="eyebrow">保持联系</p><h2 className="mb-6 mt-3 font-serif text-2xl text-ink">在这里找到我。</h2><ContactLinks profile={site} /></section></div></div>;
}
