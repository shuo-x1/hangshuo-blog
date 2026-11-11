import {createHash, randomBytes} from 'node:crypto';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {prisma} from './db';

export const SESSION_COOKIE = 'blog_session';
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

export async function getAdmin() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await prisma.session.findUnique({where: {tokenHash: tokenHash(token)}, include: {admin: true}});
  if (!session || session.expiresAt <= new Date()) return null;
  return session.admin;
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  return admin;
}

export async function createSession(adminId: number) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
  await prisma.session.deleteMany({where: {expiresAt: {lt: new Date()}}});
  await prisma.session.create({data: {adminId, tokenHash: tokenHash(token), expiresAt}});
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.COOKIE_SECURE === 'true',
    path: '/', expires: expiresAt
  });
}

export async function deleteSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({where: {tokenHash: tokenHash(token)}});
  cookies().delete(SESSION_COOKIE);
}
