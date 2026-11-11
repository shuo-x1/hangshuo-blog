import type { ReactNode } from "react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { AdminHeading } from "@/components/admin/admin-ui";
import { PhotosManager } from "@/components/admin/photos-manager";

export default async function PhotosPage(): Promise<ReactNode> {
  await requireAdmin();
  const photos = await prisma.photo.findMany({ orderBy: { createdAt: "desc" } });
  return <><AdminHeading title="照片" description="添加生活中的画面，上传后会直接出现在照片集。照片评论和网站留言可在“留言与评论”中审核。" /><PhotosManager photos={photos.map(photo => ({ ...photo, createdAt: photo.createdAt.toISOString() }))} /></>;
}
