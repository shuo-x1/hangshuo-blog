import {z} from 'zod';

export const idSchema = z.string().min(1).max(191);
const webUrl = z.string().max(1000).refine(value => !value || /^https?:\/\//i.test(value), '链接必须以 http:// 或 https:// 开头。');
export const postSchema = z.object({
  id: idSchema.optional(), title: z.string().trim().min(1, '请填写标题。').max(191),
  slug: z.string().trim().min(1).max(160).regex(/^[\p{L}\p{N}-]+$/u, '文章标识只能包含文字、数字和连字符。'),
  summary: z.string().max(600).default(''), content: z.string().max(100000),
  category: z.string().trim().min(1).max(80).default('随笔'), published: z.boolean()
}).strict();
export const projectSchema = z.object({
  id: idSchema.optional(), name: z.string().trim().min(1).max(191),
  status: z.string().max(80).default('进行中'), description: z.string().max(10000),
  demoUrl: webUrl.default(''), sourceUrl: webUrl.default(''), downloadUrl: webUrl.default('')
}).strict();
export const messageSchema = z.object({
  name: z.string().trim().min(1).max(30), content: z.string().trim().min(2).max(1000),
  website: z.string().max(0).optional(), photoId: idSchema.optional()
}).strict();
export const settingsSchema = z.object({
  name: z.string().trim().min(1).max(80), tagline: z.string().max(300), about: z.string().max(2000),
  email: z.string().email().max(254), qq: z.string().max(30), github: z.string().max(39).regex(/^[a-zA-Z0-9-]*$/),
  wechat: z.string().max(80), douyin: z.string().max(80),
  galleryStyle: z.enum(['spiral', 'grid', 'orbit', 'wave', 'explode', 'carousel', 'ribbon']).default('carousel')
}).strict();
