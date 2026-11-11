export async function adminRequest(path: string, init: RequestInit): Promise<void> {
  const response = await fetch(path, { ...init, credentials: "same-origin" });
  if (response.ok) return;
  const data: unknown = await response.json().catch(() => null);
  if (typeof data === "object" && data !== null && "error" in data && typeof data.error === "string") {
    throw new Error(data.error);
  }
  throw new Error(response.status === 401 ? "登录已失效，请重新登录。" : "操作没有完成，请稍后重试。");
}

export function saveJson(path: string, body: object, method = "POST"): Promise<void> {
  return adminRequest(path, {
    method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}
