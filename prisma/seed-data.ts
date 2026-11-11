import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";

const id = z.string().min(1).max(191);
const createdAt = z.coerce.date().optional();
const externalUrl = z.union([
  z.literal(""),
  z.string().url().max(1000).refine(value => /^https?:\/\//i.test(value)),
]).default("");

const profile = z.object({
  name: z.string().min(1).max(80).optional(),
  tagline: z.string().max(300).optional(),
  about: z.string().max(2000).optional(),
  email: z.string().email().max(254).optional(),
  qq: z.string().max(30).optional(),
  github: z.string().max(80).optional(),
  wechat: z.string().max(80).optional(),
  douyin: z.string().max(80).optional(),
  galleryStyle: z.string().max(30).optional(),
});

const seedData = z.object({
  profile: profile.default({}),
  posts: z.array(z.object({
    id,
    title: z.string().min(1).max(191),
    slug: z.string().min(1).max(191).regex(/^[^\s/?#]+$/),
    summary: z.string().max(600).default(""),
    content: z.string().max(2_000_000),
    category: z.string().max(80).default("随笔"),
    published: z.boolean().default(true),
    createdAt,
  })).default([]),
  projects: z.array(z.object({
    id,
    name: z.string().min(1).max(191),
    status: z.string().max(80).default("进行中"),
    description: z.string().max(16_000),
    demoUrl: externalUrl,
    sourceUrl: externalUrl,
    downloadUrl: externalUrl,
    createdAt,
  })).default([]),
  photos: z.array(z.object({
    id,
    url: z.string().max(500).regex(/^\/uploads\/[A-Za-z0-9][A-Za-z0-9._-]*$/),
    caption: z.string().max(500).default(""),
    createdAt,
  })).default([]),
});

export type SeedData = z.infer<typeof seedData>;

export async function readSeedData(): Promise<SeedData> {
  try {
    const source = await readFile(resolve(process.cwd(), "prisma/data.json"), "utf8");
    const data: unknown = JSON.parse(source.replace(/^\uFEFF/, ""));
    return seedData.parse(data);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return seedData.parse({});
    }
    throw error;
  }
}
