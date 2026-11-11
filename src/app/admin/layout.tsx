import type { ReactNode } from "react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = { title: "管理空间", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: ReactNode }): Promise<ReactNode> {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
