import Link from "next/link";
import type { ReactNode } from "react";
import { PublicNavigation } from "@/components/public/navigation";
import { getSiteSetting } from "@/lib/site-data";

export default async function PublicLayout({ children }: { children: ReactNode }): Promise<React.JSX.Element> {
  const site = await getSiteSetting();
  return <div className="site-shell">
    <a href="#main-content" className="skip-link">跳到正文</a>
    <PublicNavigation name={site.name} />
    <main id="main-content" tabIndex={-1} className="min-h-[70svh] outline-none">{children}</main>
    <footer className="site-footer">
      <Link href="/" className="font-serif text-lg text-ink">{site.name}<span className="ml-2 font-sans text-xs text-muted">/ 个人网站</span></Link>
      <span className="order-last w-full text-xs sm:order-none sm:w-auto">© {new Date().getFullYear()} · 写点东西，做点喜欢的事。</span>
      <div className="flex items-center gap-4"><Link href="/contact" className="footer-link">联系我</Link><Link href="/login" className="footer-link">返回入口</Link></div>
    </footer>
  </div>;
}
