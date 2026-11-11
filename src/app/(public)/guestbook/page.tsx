import { prisma } from "@/lib/db";
import { PageHeading } from "@/components/public/page-heading";
import { MessageForm } from "@/components/public/message-form";

export default async function GuestbookPage(): Promise<React.JSX.Element> {
  const messages = await prisma.message.findMany({ where: { approved: true, photoId: null }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 50 });
  return <div className="public-page"><PageHeading eyebrow="小岛上的回声" title="路过，就说声你好。" description="欢迎分享想法、建议，或留下一句简单的问候。" /><div className="grid gap-9 lg:grid-cols-[1fr_1.05fr]"><section className="glass-panel self-start rounded-3xl p-6 sm:p-8"><h2 className="mb-6 font-serif text-2xl text-ink">写一张小纸条</h2><MessageForm /></section><section><h2 className="mb-5 font-serif text-2xl text-ink">收到的问候</h2>{messages.length ? <div className="space-y-4">{messages.map(message => <article key={message.id} className="glass-panel rounded-2xl px-6 py-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="break-all text-sm font-medium text-ink">{message.name}</h3><time className="text-xs text-muted" dateTime={message.createdAt.toISOString()}>{new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeZone: "Asia/Shanghai" }).format(message.createdAt)}</time></div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-8 text-copy">{message.content}</p></article>)}</div> : <p className="border-t border-line py-8 text-sm leading-8 text-muted">还没有公开留言，来留下第一声问候吧。</p>}</section></div></div>;
}
