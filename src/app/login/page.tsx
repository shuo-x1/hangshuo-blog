import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "站主登录", robots: { index: false, follow: false } };

export default async function LoginPage(): Promise<ReactNode> {
  if (await getAdmin()) redirect("/admin");
  return <LoginForm />;
}
