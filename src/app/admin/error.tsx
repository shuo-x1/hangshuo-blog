"use client";

import Link from "next/link";
import { primaryClass, secondaryClass } from "@/components/admin/admin-ui";

export default function AdminError({ reset }: { reset: () => void }): JSX.Element {
  return <div className="py-14 text-center"><h1 className="font-serif text-2xl text-slate-800">管理数据暂时无法读取</h1><p className="my-5 text-sm leading-7 text-slate-600">请稍后重试。如果登录已过期，可以重新登录。</p><div className="flex flex-wrap justify-center gap-3"><button className={primaryClass} type="button" onClick={reset}>重新加载</button><Link href="/login" className={secondaryClass}>重新登录</Link></div></div>;
}
