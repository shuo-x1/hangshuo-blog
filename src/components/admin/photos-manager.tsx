"use client";

import { type FormEvent, type ReactNode } from "react";
import { adminRequest } from "./request";
import { useAdminAction } from "./use-admin-action";
import { EmptyState, Feedback, FormField, deleteClass, inputClass, primaryClass } from "./admin-ui";
import { formatDate, type AdminPhoto } from "./models";

export function PhotosManager({ photos }: { photos: AdminPhoto[] }): ReactNode {
  const action = useAdminAction();
  async function upload(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const success = await action.run(async () => {
      const file = data.get("file");
      if (!(file instanceof File) || !file.size) throw new Error("请先选择一张照片。");
      if (file.size > 5 * 1024 * 1024) throw new Error("照片不能超过 5MB，请压缩后再上传。");
      await adminRequest("/api/admin/uploads", { method: "POST", body: data });
    }, "照片上传成功，已加入照片集。");
    if (success) form.reset();
  }
  async function remove(photo: AdminPhoto): Promise<void> {
    if (!window.confirm("确定删除这张照片吗？照片下的评论也会一并删除。")) return;
    await action.run(() => adminRequest(`/api/admin/photos?id=${encodeURIComponent(photo.id)}`, { method: "DELETE" }), "照片已删除。");
  }
  return <>
    <form onSubmit={upload} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="mb-5 font-serif text-xl text-slate-800">添加照片</h2>
      <fieldset disabled={action.pending} className="space-y-5 disabled:opacity-60">
        <FormField label="选择照片"><input type="file" name="file" required accept="image/jpeg,image/png,image/webp" className={`${inputClass} file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:text-slate-700`} /><span className="mt-2 block text-xs font-normal leading-6 text-slate-500">支持 JPG、PNG、WebP，单张不超过 5MB。</span></FormField>
        <FormField label="照片说明（可选）"><input name="caption" className={inputClass} maxLength={500} placeholder="这个画面背后的故事" /></FormField>
        <button type="submit" className={primaryClass}>{action.pending ? "上传中…" : "上传照片"}</button>
      </fieldset>
    </form>
    <Feedback {...action} />
    <div className="mb-5 mt-8 flex items-center justify-between"><h2 className="font-serif text-xl text-slate-800">已上传的照片</h2><span className="text-sm text-slate-500">{photos.length} 张</span></div>
    {photos.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{photos.map(photo => <article key={photo.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><img src={photo.url} alt={photo.caption || "相册照片"} loading="lazy" className="aspect-[4/3] w-full object-cover" /><div className="p-4"><p className="break-words text-sm leading-7 text-slate-700">{photo.caption || "未填写说明"}</p><p className="my-3 text-xs text-slate-500">{formatDate(photo.createdAt)}</p><button type="button" className={deleteClass} disabled={action.pending} onClick={() => remove(photo)}>删除照片</button></div></article>)}</div> : <EmptyState>相册还是空的，先上传一张照片。</EmptyState>}
  </>;
}
