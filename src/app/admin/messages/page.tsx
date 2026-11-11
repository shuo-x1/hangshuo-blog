import type { ReactNode } from "react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { AdminHeading } from "@/components/admin/admin-ui";
import { MessagesManager } from "@/components/admin/messages-manager";

export default async function MessagesPage(): Promise<ReactNode> {
  await requireAdmin();
  const messages = await prisma.message.findMany({ orderBy: { createdAt: "desc" }, include: { photo: { select: { caption: true } } } });
  return <><AdminHeading title="留言与评论" description="新留言和照片评论会先进入待审核列表，审核通过后才会公开展示。" /><MessagesManager messages={messages.map(message => ({ ...message, createdAt: message.createdAt.toISOString() }))} /></>;
}
