import Link from "next/link";
import { getSiteSetting } from "@/lib/site-data";
import { PageHeading } from "@/components/public/page-heading";
import { ContactLinks } from "@/components/public/contact-links";

export default async function ContactPage(): Promise<React.JSX.Element> {
  const site = await getSiteSetting();
  return <div className="reading-page-width"><PageHeading eyebrow="保持联系" title="很高兴认识你。" description="想聊聊项目，分享一个故事，或者只是打个招呼，都欢迎。" /><ContactLinks profile={site} /><div className="mt-10 border-t border-line pt-7"><p className="font-serif text-xl leading-9 text-copy">也可以留一张小纸条，<br />让我知道你来过。</p><Link href="/guestbook" className="button-outline mt-5">去留言 ↗</Link></div></div>;
}
