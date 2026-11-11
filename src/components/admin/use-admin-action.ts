"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function useAdminAction() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function run(action: () => Promise<void>, message: string): Promise<boolean> {
    setPending(true);
    setError("");
    setSuccess("");
    try {
      await action();
      setSuccess(message);
      router.refresh();
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "操作没有完成，请稍后重试。");
      return false;
    } finally {
      setPending(false);
    }
  }
  return { pending, error, success, run };
}
