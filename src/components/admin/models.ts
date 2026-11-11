import type { Message, Photo, Post, Project, SiteSetting } from "@prisma/client";

export type AdminPost = Omit<Post, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};
export type AdminProject = Omit<Project, "createdAt"> & { createdAt: string };
export type AdminPhoto = Omit<Photo, "createdAt"> & { createdAt: string };
export type AdminMessage = Omit<Message, "createdAt"> & {
  createdAt: string;
  photo: { caption: string } | null;
};
export type EditableSettings = Omit<SiteSetting, "id">;

export function formatDate(value: string): string {
  return new Date(value).toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}
