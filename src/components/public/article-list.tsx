import Link from "next/link";
import { Icon } from "@/components/icons";

interface ArticlePreview {
  id: string; slug: string; title: string; summary: string | null;
  category: string | null; createdAt: Date;
}

export function ArticleList({ posts, compact = false }: { posts: ArticlePreview[]; compact?: boolean }): React.JSX.Element {
  if (!posts.length) return <p className="py-10 text-sm leading-8 text-muted">这里还没有文章。新的想法，会慢慢写下来。</p>;
  return (
    <div className="divide-y divide-line">
      {posts.map(post => <Link href={`/blog/${encodeURIComponent(post.slug)}`} key={post.id} className="article-link group">
        {!compact && <time dateTime={post.createdAt.toISOString()} className="w-full shrink-0 text-xs tabular-nums text-muted sm:w-24">{new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", dateStyle: "medium" }).format(post.createdAt)}</time>}
        <div className="min-w-0 flex-1"><span className="text-xs tracking-wide text-muted">{post.category || "随笔"}</span><h2 className="mt-2 font-serif text-2xl leading-relaxed text-ink">{post.title}</h2>{post.summary && <p className="mt-2 line-clamp-2 text-sm leading-7 text-copy">{post.summary}</p>}</div>
        <Icon name="arrowUp" className="mt-4 h-4 w-4 shrink-0 text-accent transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </Link>)}
    </div>
  );
}
