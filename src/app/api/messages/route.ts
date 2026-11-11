import {createHash, randomBytes} from 'node:crypto';
import {cookies} from 'next/headers';
import {NextRequest} from 'next/server';
import {prisma} from '@/lib/db';
import {apiResult, checkOrigin, HttpError, readJson} from '@/lib/http';
import {messageSchema} from '@/lib/validation';
import {consumeLimit} from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export function GET(request: NextRequest) {
  return apiResult(async()=>{
    const photoId = request.nextUrl.searchParams.get('photoId') || null;
    const messages = await prisma.message.findMany({
      where:{approved:true,photoId},orderBy:{createdAt:'desc'},take:100,
      select:{id:true,name:true,content:true,createdAt:true}
    });
    return {messages};
  });
}

export function POST(request: NextRequest) {
  return apiResult(async()=>{
    checkOrigin(request);
    const {website: _trap,...data} = messageSchema.parse(await readJson(request));
    const token = cookies().get('blog_visitor')?.value || randomBytes(24).toString('hex');
    await consumeLimit('message:'+createHash('sha256').update(token).digest('hex'),3,60000);
    if (data.photoId && !await prisma.photo.findUnique({where:{id:data.photoId}})) throw new HttpError('这张照片已不存在。',404);
    await prisma.message.create({data});
    cookies().set('blog_visitor',token,{httpOnly:true,sameSite:'lax',secure:process.env.COOKIE_SECURE==='true',path:'/',maxAge:365*86400});
    return {ok:true,message:'留言已收到，审核通过后显示。'};
  });
}
