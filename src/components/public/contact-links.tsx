"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/icons";

interface ContactProfile { name: string; email: string; qq: string; github: string; wechat: string; douyin: string }
const platforms = {
  wechat: { title: "加个微信，慢慢聊", image: "/wechat-qr.jpg", label: "微信" },
  qq: { title: "加个 QQ，聊一聊", image: "/qq-qr.jpg", label: "QQ" },
  douyin: { title: "在抖音，遇见更多日常", image: "/douyin-qr.jpg", label: "抖音" },
} as const;
type Platform = keyof typeof platforms;

export function ContactLinks({ profile, compact = false }: { profile: ContactProfile; compact?: boolean }): React.JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  const [platform, setPlatform] = useState<Platform>("wechat");
  const github = profile.github.replace(/^https:\/\/github\.com\//i, "").replace(/\/$/, "");
  function open(next: Platform): void { setPlatform(next); dialog.current?.showModal(); }
  const data = platforms[platform];
  const account = profile[platform];
  return <>
    <div className={compact ? "flex flex-wrap items-center gap-2.5" : "grid gap-3 sm:grid-cols-2"}>
      <a href={`mailto:${profile.email}`} className={compact ? "social-icon bg-amber-50 text-amber-800" : "contact-card bg-amber-50/70 text-amber-900"} aria-label={compact ? "发邮件" : undefined}><Icon name="mail" />{!compact && <span>发邮件<small>{profile.email}</small></span>}</a>
      {(["wechat", "qq", "douyin"] as const).map(key => <button key={key} type="button" onClick={() => open(key)} className={`${compact ? "social-icon" : "contact-card"} ${key === "wechat" ? "bg-emerald-50/80 text-emerald-800" : key === "qq" ? "bg-sky-50 text-sky-800" : "bg-violet-50 text-violet-800"}`} aria-label={compact ? `查看${platforms[key].label}二维码` : undefined}><Icon name={key === "douyin" ? "music" : "chat"} />{!compact && <span>{platforms[key].label}<small>{profile[key] || "查看二维码"}</small></span>}</button>)}
      {/^[a-zA-Z0-9-]{1,39}$/.test(github) && <a href={`https://github.com/${github}`} target="_blank" rel="noopener noreferrer" className={compact ? "social-icon bg-stone-100 text-stone-700" : "contact-card bg-stone-100/80 text-stone-700"} aria-label={compact ? "访问 GitHub" : undefined}><Icon name="github" />{!compact && <span>GitHub<small>@{github}</small></span>}</a>}
    </div>
    <dialog ref={dialog} className="contact-dialog" aria-labelledby={`contact-title-${compact ? "mini" : "full"}`} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="p-5 sm:p-7"><div className="mb-5 flex items-start justify-between gap-5"><div><p className="eyebrow">{profile.name} · {data.label}</p><h2 id={`contact-title-${compact ? "mini" : "full"}`} className="mt-2 font-serif text-2xl leading-relaxed">{data.title}</h2>{account && <p className="mt-2 break-all text-sm leading-7 text-copy">{account}</p>}</div><button type="button" className="icon-control shrink-0" onClick={() => dialog.current?.close()} aria-label="关闭二维码"><Icon name="close" /></button></div><img className="mx-auto max-h-[55svh] w-auto max-w-full rounded-xl object-contain" src={data.image} alt={`${profile.name}的${data.label}二维码`} /><p className="mt-4 text-center text-xs leading-6 text-muted">用另一台设备扫码，或保存图片后识别。</p><a href={data.image} download className="button-outline mt-4 w-full">保存二维码图片</a></div>
    </dialog>
  </>;
}
