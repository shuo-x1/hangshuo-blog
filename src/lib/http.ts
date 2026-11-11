import {NextRequest, NextResponse} from 'next/server';
import {Prisma} from '@prisma/client';
import {z} from 'zod';
import {getAdmin} from './auth';

export class HttpError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export function checkOrigin(request: NextRequest) {
  const expected = new URL(process.env.APP_URL || request.url).origin;
  if (request.headers.get('origin') !== expected) throw new HttpError('请求来源无效，请从本站重新提交。', 403);
}

export async function limitedBody(request: Request, limit: number) {
  if (Number(request.headers.get('content-length')) > limit) throw new HttpError('提交内容过大。', 413);
  const chunks: Uint8Array[] = [];
  const reader = request.body?.getReader();
  let length = 0;
  if (!reader) throw new HttpError('请填写内容。', 400);
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) { await reader.cancel(); throw new HttpError('提交内容过大。', 413); }
    chunks.push(value);
  }
  return Buffer.concat(chunks, length);
}

export async function readJson(request: Request) {
  try { return JSON.parse((await limitedBody(request, 512 * 1024)).toString('utf8')) as unknown; }
  catch (error) { if (error instanceof HttpError) throw error; throw new HttpError('提交格式无效。', 400); }
}

export async function apiResult(action: () => Promise<unknown>) {
  try { return NextResponse.json(await action()); }
  catch (error) {
    if (error instanceof HttpError) return NextResponse.json({error: error.message}, {status: error.status});
    if (error instanceof z.ZodError) return NextResponse.json({error: error.issues[0]?.message || '请检查填写内容。'}, {status: 400});
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return NextResponse.json({error: '该标识已存在，请修改后重试。'}, {status: 409});
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return NextResponse.json({error: '内容已不存在，请刷新页面。'}, {status: 404});
    console.error('Request failed:', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({error: '服务暂时不可用，请稍后重试。'}, {status: 500});
  }
}

export async function adminApi(request: NextRequest, action: () => Promise<unknown>) {
  return apiResult(async () => {
    if (!['GET', 'HEAD'].includes(request.method)) checkOrigin(request);
    if (!await getAdmin()) throw new HttpError('请先登录管理员账号。', 401);
    return action();
  });
}
