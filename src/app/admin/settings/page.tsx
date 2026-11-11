import type { ReactNode } from "react";
import { getSiteSetting } from "@/lib/site-data";
import { requireAdmin } from "@/lib/auth";
import { AdminHeading } from "@/components/admin/admin-ui";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function SettingsPage(): Promise<ReactNode> {
  await requireAdmin();
  const { id, ...settings } = await getSiteSetting();
  return <><AdminHeading title="网站资料" description="更新名字、个人介绍、联系方式和照片墙默认样式。" /><SettingsForm initial={settings} /></>;
}
