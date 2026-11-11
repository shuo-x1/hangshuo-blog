import {NextRequest} from 'next/server';
import {z} from 'zod';
import {prisma} from './db';
import {getSiteSetting} from './site-data';
import {HttpError, readJson} from './http';
import {idSchema, postSchema, projectSchema, settingsSchema} from './validation';
import {deletePhoto} from './uploads';

async function summary() {
  const [posts, photos, messages, visits, unique] = await Promise.all([
    prisma.post.count(), prisma.photo.count(), prisma.message.count({where:{approved:false}}),
    prisma.visit.count(), prisma.$queryRaw<Array<{visitors:bigint}>>`SELECT COUNT(DISTINCT visitorHash) AS visitors FROM Visit`
  ]);
  return {posts, photos, messages, visits, visitors:Number(unique[0]?.visitors || 0)};
}

export async function readAdminResource(resource: string) {
  const readers: Record<string, () => Promise<unknown>> = {
    posts: () => prisma.post.findMany({orderBy:{createdAt:'desc'}}),
    projects: () => prisma.project.findMany({orderBy:{createdAt:'desc'}}),
    photos: () => prisma.photo.findMany({orderBy:{createdAt:'desc'}}),
    messages: () => prisma.message.findMany({include:{photo:true}, orderBy:{createdAt:'desc'},take:200}),
    visits: () => prisma.visit.findMany({orderBy:{createdAt:'desc'},take:100,select:{id:true,path:true,day:true,createdAt:true}}),
    settings: getSiteSetting, summary
  };
  const read = readers[resource];
  if (!read) throw new HttpError('接口不存在。',404);
  return read();
}

export async function saveAdminResource(request: NextRequest, resource: string) {
  const body = await readJson(request);
  if (resource === 'posts') {
    const {id,...data} = postSchema.parse(body);
    return id ? prisma.post.update({where:{id},data}) : prisma.post.create({data});
  }
  if (resource === 'projects') {
    const {id,...data} = projectSchema.parse(body);
    return id ? prisma.project.update({where:{id},data}) : prisma.project.create({data});
  }
  if (resource === 'settings') {
    const data = settingsSchema.parse(body);
    return prisma.siteSetting.upsert({where:{id:'site'},create:{id:'site',...data},update:data});
  }
  if (resource === 'messages') {
    const {id,approved} = z.object({id:idSchema,approved:z.boolean()}).strict().parse(body);
    return prisma.message.update({where:{id},data:{approved}});
  }
  throw new HttpError('不支持的操作。',405);
}

export async function deleteAdminResource(request: NextRequest, resource: string) {
  const id = idSchema.parse(request.nextUrl.searchParams.get('id'));
  const removers: Record<string, () => Promise<unknown>> = {
    posts: () => prisma.post.delete({where:{id}}),
    projects: () => prisma.project.delete({where:{id}}),
    messages: () => prisma.message.delete({where:{id}}),
    photos: () => deletePhoto(id)
  };
  const remove = removers[resource];
  if (!remove) throw new HttpError('不支持的操作。',405);
  await remove();
  return {ok:true};
}
