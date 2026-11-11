import {createHash, randomBytes} from 'node:crypto';
import {cookies} from 'next/headers';
import {NextRequest} from 'next/server';
import {z} from 'zod';
import {getAdmin} from '@/lib/auth';
import {prisma} from '@/lib/db';
import {apiResult, checkOrigin, readJson} from '@/lib/http';

export function POST(request: NextRequest) {
  return apiResult(async()=>{
    checkOrigin(request);
    if (await getAdmin()) return {ok:true};
    const {path} = z.object({path:z.string().max(191).regex(/^\/(?!api|admin|login)[\p{L}\p{N}/%?=&_.-]*$/u)}).parse(await readJson(request));
    const token = cookies().get('blog_visitor')?.value || randomBytes(24).toString('hex');
    const visitorHash = createHash('sha256').update(token).digest('hex');
    const day = new Date().toISOString().slice(0,10);
    await prisma.visit.upsert({where:{visitorHash_path_day:{visitorHash,path,day}},create:{visitorHash,path,day},update:{}});
    cookies().set('blog_visitor',token,{httpOnly:true,sameSite:'lax',secure:process.env.COOKIE_SECURE==='true',path:'/',maxAge:365*86400});
    return {ok:true};
  });
}
