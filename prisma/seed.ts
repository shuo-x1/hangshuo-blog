#!/usr/bin/env -S npx tsx
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";
import { readSeedData, type SeedData } from "./seed-data";

interface AdminSeed {
  username: string;
  passwordHash: string;
}

async function prepareAdmin(): Promise<AdminSeed | null> {
  if (await prisma.admin.count() > 0) return null;
  if (!process.env.ADMIN_USERNAME && !process.env.ADMIN_PASSWORD) return null;
  const credentials = z.object({
    username: z.string().trim().min(3).max(40),
    password: z.string().min(12).max(128),
  }).parse({
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
  });
  return {
    username: credentials.username,
    passwordHash: await hashPassword(credentials.password),
  };
}

async function importContent(data: SeedData): Promise<void> {
  await prisma.$transaction(async transaction => {
    await transaction.siteSetting.upsert({
      where: { id: "site" },
      create: { id: "site", ...data.profile },
      update: {},
    });
    if (data.posts.length) {
      await transaction.post.createMany({ data: data.posts, skipDuplicates: true });
    }
    if (data.projects.length) {
      await transaction.project.createMany({ data: data.projects, skipDuplicates: true });
    }
    if (data.photos.length) {
      await transaction.photo.createMany({ data: data.photos, skipDuplicates: true });
    }
  }, { maxWait: 10_000, timeout: 20_000 });
}

async function createAdminIfEmpty(admin: AdminSeed): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await prisma.$transaction(async transaction => {
        if (await transaction.admin.count() === 0) {
          await transaction.admin.create({ data: admin });
        }
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      return;
    } catch (error) {
      const retryable = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
      if (!retryable || attempt === 2) throw error;
    }
  }
}

async function main(): Promise<void> {
  const data = await readSeedData();
  const admin = await prepareAdmin();
  await importContent(data);
  if (admin) await createAdminIfEmpty(admin);
  console.info("数据库初始化完成。已有账号和内容保留，新记录按需导入。");
}

main().catch((error: unknown) => {
  if (error instanceof z.ZodError) {
    console.error("初始化数据格式不正确，请检查 prisma/data.json 和管理员环境变量。");
  } else {
    console.error("数据库初始化失败，请检查数据库连接和迁移状态。");
  }
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
