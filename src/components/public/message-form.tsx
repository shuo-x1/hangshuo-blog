"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Icon } from "@/components/icons";

interface MessageFormProps { photoId?: string }
type SubmissionState = { status: "idle" | "sending" | "sent" | "error"; message: string };

export function MessageForm({ photoId }: MessageFormProps): React.JSX.Element {
  const [submission, setSubmission] = useState<SubmissionState>({ status: "idle", message: "" });
  const busy = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    const form = event.currentTarget;
    const fields = new FormData(form);
    setSubmission({ status: "sending", message: "正在寄出…" });
    try {
      const response = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: fields.get("name"), content: fields.get("content"), website: fields.get("website"), ...(photoId ? { photoId } : {}) }) });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(typeof result === "object" && result !== null && "error" in result && typeof result.error === "string" ? result.error : "暂时没有寄出，请稍后重试。");
      form.reset();
      setSubmission({ status: "sent", message: "已经收到。审核通过后，会显示在这里。" });
    } catch (error) {
      setSubmission({ status: "error", message: error instanceof Error ? error.message : "暂时没有寄出，请稍后重试。" });
    } finally { busy.current = false; }
  }
  return <form onSubmit={submit} className="space-y-5">
    <fieldset disabled={submission.status === "sending"} className="space-y-5">
      <label className="form-label">怎么称呼你<input className="form-input" name="name" maxLength={30} autoComplete="nickname" placeholder="你的昵称" required /></label>
      <label className="form-label">{photoId ? "关于这个画面，想说点什么？" : "想说的话"}<textarea className="form-input min-h-32 resize-y" name="content" minLength={2} maxLength={1000} rows={4} placeholder="写下此刻的想法…" required /></label>
      <label className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <button type="submit" className="button-primary w-full sm:w-auto">{submission.status === "sending" ? "正在寄出…" : "留下这句话"}<Icon name="arrowUp" className="h-4 w-4" /></button>
    </fieldset>
    <p className="text-xs leading-6 text-muted">审核通过后公开，最多 1000 字。</p>
    <p className={`min-h-6 text-sm leading-7 ${submission.status === "error" ? "text-red-700 dark:text-red-300" : "text-accent"}`} aria-live="polite" role="status">{submission.message}</p>
  </form>;
}
