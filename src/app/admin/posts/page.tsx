import type { ReactNode } from "react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { AdminHeading } from "@/components/admin/admin-ui";
import { PostsEditor } from "@/components/admin/posts-editor";

export default async function PostsPage(): Promise<ReactNode> {
  await requireAdmin();
  const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" } });
  return <><AdminHeading title="文章" description="在这里写作、保存草稿和发布文章。编辑已发布的文章后，保存会直接更新公开内容。" /><PostsEditor posts={posts.map(post => ({ ...post, createdAt: post.createdAt.toISOString(), updatedAt: post.updatedAt.toISOString() }))} /></>;
}
