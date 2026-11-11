import {NextRequest} from 'next/server';
import {z} from 'zod';
import {createHash} from 'node:crypto';
import {prisma} from '@/lib/db';
import {apiResult, checkOrigin, HttpError, readJson} from '@/lib/http';
import {createSession} from '@/lib/auth';
import {verifyPassword} from '@/lib/password';
import {consumeLimit} from '@/lib/rate-limit';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  return apiResult(async()=>{
    checkOrigin(request);
    const {username,password} = z.object({username:z.string().trim().min(3).max(40),password:z.string().min(1).max(128)}).strict().parse(await readJson(request));
    const key = 'login:' + createHash('sha256').update(username.toLowerCase()).digest('hex');
    await consumeLimit(key,10,15*60*1000);
    const admin = await prisma.admin.findUnique({where:{username}});
    if (!admin || !await verifyPassword(password,admin.passwordHash)) throw new HttpError('账号或密码不正确。',401);
    await prisma.loginAttempt.deleteMany({where:{key}});
    await createSession(admin.id);
    return {ok:true};
  });
}
