import type { SiteSetting } from "@prisma/client";
import { prisma } from "./db";

export const defaultSiteSetting = {
  id: "site",
  name: "张航硕",
  tagline: "记录想法，创造一些有用的东西。",
  about: "这是我的个人空间，用来记录想法、分享作品，也认识同样热爱创造的朋友。",
  email: "3217710568@qq.com",
  qq: "3217710568",
  github: "shuo-x1",
  wechat: "",
  douyin: "z1117321771",
  galleryStyle: "carousel",
} satisfies SiteSetting;

export async function getSiteSetting(): Promise<SiteSetting> {
  return await prisma.siteSetting.findUnique({ where: { id: "site" } }) ?? defaultSiteSetting;
}
