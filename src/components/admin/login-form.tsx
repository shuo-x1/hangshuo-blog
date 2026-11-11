"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveJson } from "./request";
import { Feedback, FormField, inputClass, primaryClass } from "./admin-ui";

export function LoginForm(): ReactNode {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function login(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      await saveJson("/api/auth/login", { username: fields.get("username"), password: fields.get("password") });
      router.replace("/admin");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "暂时无法登录，请稍后重试。");
      setPending(false);
    }
  }
  return <div className="mx-auto grid min-h-[70vh] max-w-5xl items-center gap-12 rounded-3xl bg-[#edf3f7] px-5 py-14 [color-scheme:light] sm:px-8 lg:grid-cols-2">
    <div><p className="text-xs tracking-[.2em] text-slate-500">张航硕的个人网站</p><h1 className="mt-6 font-serif text-4xl leading-relaxed text-slate-800">欢迎回来。<br />接着写点东西吧。</h1><p className="mt-5 text-sm leading-8 text-slate-600">文章、项目、照片和大家的留言，都在这里。</p><Link href="/" className="mt-7 inline-flex min-h-11 items-center text-sm text-sky-800 underline decoration-sky-300 underline-offset-8">游客浏览，直接进入网站 →</Link></div>
    <form onSubmit={login} className="rounded-3xl border border-white bg-white/80 p-7 shadow-sm sm:p-9">
      <h2 className="font-serif text-2xl text-slate-800">站主登录</h2><p className="mb-7 mt-3 text-sm leading-7 text-slate-600">输入你的账号和密码，管理网站内容。</p>
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-60"><FormField label="账号"><input className={inputClass} name="username" autoComplete="username" required maxLength={80} autoCapitalize="none" spellCheck={false} /></FormField><FormField label="密码"><input type="password" className={inputClass} name="password" autoComplete="current-password" required maxLength={128} /></FormField><button className={`${primaryClass} w-full`} type="submit">{pending ? "正在登录…" : "登录管理空间"}</button></fieldset>
      <Feedback pending={pending} error={error} success="" />
    </form>
  </div>;
}
