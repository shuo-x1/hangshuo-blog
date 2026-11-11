"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { saveJson } from "./request";
import { useAdminAction } from "./use-admin-action";
import { Feedback, FormField, inputClass, primaryClass } from "./admin-ui";
import type { EditableSettings } from "./models";

const contactFields = [["qq", "QQ", 30], ["github", "GitHub 用户名", 39], ["wechat", "微信号", 80], ["douyin", "抖音号", 80]] as const;
const styles = [["carousel", "旋转木马"], ["spiral", "螺旋柱墙"], ["grid", "视差网格"], ["orbit", "扇形轨道"], ["wave", "波浪帘"], ["explode", "聚合照片墙"], ["ribbon", "丝带飘带"]] as const;

export function SettingsForm({ initial }: { initial: EditableSettings }): ReactNode {
  const [settings, setSettings] = useState(initial);
  const action = useAdminAction();
  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await action.run(() => saveJson("/api/admin/settings", settings, "PATCH"), "网站资料已更新。");
  }
  return <form onSubmit={save}>
    <fieldset disabled={action.pending} className="space-y-7 disabled:opacity-60">
      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="font-serif text-xl text-slate-800">个人介绍</h2>
        <FormField label="名字"><input className={inputClass} value={settings.name} onChange={event => setSettings({ ...settings, name: event.target.value })} required maxLength={80} /></FormField>
        <FormField label="首页介绍"><input className={inputClass} value={settings.tagline} onChange={event => setSettings({ ...settings, tagline: event.target.value })} required maxLength={300} /></FormField>
        <FormField label="关于我"><textarea className={inputClass} value={settings.about} onChange={event => setSettings({ ...settings, about: event.target.value })} rows={5} maxLength={2000} /></FormField>
      </section>
      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="font-serif text-xl text-slate-800">公开联系方式</h2><p className="text-sm leading-7 text-slate-600">填写后会显示在网站上。微信、QQ 和抖音可以按账号搜索添加。</p>
        <FormField label="联系邮箱"><input type="email" className={inputClass} value={settings.email} onChange={event => setSettings({ ...settings, email: event.target.value })} required maxLength={254} /></FormField>
        <div className="grid gap-5 sm:grid-cols-2">{contactFields.map(([key, label, limit]) => <FormField key={key} label={label}><input className={inputClass} value={settings[key]} onChange={event => setSettings({ ...settings, [key]: event.target.value })} maxLength={limit} /></FormField>)}</div>
      </section>
      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="font-serif text-xl text-slate-800">照片墙</h2><FormField label="默认展示样式"><select className={inputClass} value={settings.galleryStyle} onChange={event => setSettings({ ...settings, galleryStyle: event.target.value })}>{styles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></FormField></section>
      <button className={primaryClass} type="submit">{action.pending ? "保存中…" : "保存网站资料"}</button>
    </fieldset><Feedback {...action} />
  </form>;
}
