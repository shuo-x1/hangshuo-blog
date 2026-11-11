import {randomUUID} from 'node:crypto';
import {mkdir, writeFile, unlink} from 'node:fs/promises';
import path from 'node:path';
import {z} from 'zod';
import {prisma} from './db';
import {HttpError, limitedBody} from './http';

export const uploadDirectory = () => path.join(process.cwd(),'public','uploads');
export const safeImageName = /^[a-zA-Z0-9-]{8,100}\.(png|jpg|jpeg|webp)$/;
const maximumFile = 5 * 1024 * 1024;

function imageExtension(bytes: Buffer) {
  if (bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'jpg';
  if (bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP') return 'webp';
  throw new HttpError('仅支持真实的 JPG、PNG、WebP 图片。',400);
}

export async function saveUploadedPhoto(request: Request) {
  const bytes = await limitedBody(request,maximumFile + 64 * 1024);
  const form = await new Request(request.url,{method:'POST',headers:request.headers,body:bytes}).formData();
  const file = form.get('file');
  if (!(file instanceof File) || !file.size || file.size > maximumFile) throw new HttpError('请选择不超过 5MB 的图片。',400);
  const caption = z.string().max(500).parse(form.get('caption') || '');
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = randomUUID() + '.' + imageExtension(buffer);
  const destination = path.join(uploadDirectory(),filename);
  await mkdir(uploadDirectory(),{recursive:true});
  await writeFile(destination,buffer,{flag:'wx',mode:0o640});
  try { return await prisma.photo.create({data:{url:'/uploads/'+filename,caption}}); }
  catch (error) { await unlink(destination).catch(()=>{}); throw error; }
}

export async function deletePhoto(id: string) {
  const photo = await prisma.photo.delete({where:{id}});
  const filename = photo.url.startsWith('/uploads/') ? photo.url.slice('/uploads/'.length) : '';
  if (safeImageName.test(filename)) await unlink(path.join(uploadDirectory(),filename)).catch(()=>{});
  return {ok:true};
}
