"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";

const links = [
  ["/", "首页"], ["/blog", "博客"], ["/projects", "项目"],
  ["/photos", "照片集"], ["/guestbook", "留言"], ["/about", "关于"],
] as const;

export function PublicNavigation({ name }: { name: string }): React.JSX.Element {
  const pathname = usePathname();
  const [night, setNight] = useState(false);
  useEffect(() => {
    try {
      const dark = localStorage.getItem("island-theme") === "night";
      document.documentElement.classList.toggle("dark", dark);
      setNight(dark);
    } catch { /* The theme control also works when storage is unavailable. */ }
  }, []);
  function toggleTheme(): void {
    const dark = !night;
    setNight(dark);
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem("island-theme", dark ? "night" : "day"); } catch { /* Keep the current tab's theme. */ }
  }
  return (
    <header className="public-nav glass-panel">
      <Link href="/" className="font-serif text-xl tracking-wide text-ink">{name}<span className="ml-3 hidden font-sans text-[11px] tracking-wider text-muted sm:inline">个人网站</span></Link>
      <nav aria-label="主导航" className="public-nav-links">
        {links.map(([href, title]) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} className="nav-link">{title}</Link>;
        })}
      </nav>
      <button type="button" className="icon-control justify-self-end" onClick={toggleTheme} aria-label={night ? "切换浅色主题" : "切换深色主题"}><Icon name={night ? "sun" : "moon"} /></button>
    </header>
  );
}
