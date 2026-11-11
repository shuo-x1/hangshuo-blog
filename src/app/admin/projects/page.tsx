import type { ReactNode } from "react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { AdminHeading } from "@/components/admin/admin-ui";
import { ProjectsEditor } from "@/components/admin/projects-editor";

export default async function ProjectsPage(): Promise<ReactNode> {
  await requireAdmin();
  const projects = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  return <><AdminHeading title="项目" description="把做过的软件和小工具放在一起。在线体验、源码和下载入口可以分别填写。" /><ProjectsEditor projects={projects.map(project => ({ ...project, createdAt: project.createdAt.toISOString() }))} /></>;
}
