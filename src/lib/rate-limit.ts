import {prisma} from './db';
import {HttpError} from './http';

export async function consumeLimit(key: string, maximum: number, windowMs: number) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);
  await prisma.$executeRawUnsafe(
    'INSERT INTO LoginAttempt (`key`, attempts, expiresAt) VALUES (?, 1, ?) ' +
    'ON DUPLICATE KEY UPDATE attempts = IF(expiresAt <= ?, 1, attempts + 1), ' +
    'expiresAt = IF(expiresAt <= ?, ?, expiresAt)',
    key, expiresAt, now, now, expiresAt
  );
  const record = await prisma.loginAttempt.findUnique({where: {key}});
  if (record && record.attempts > maximum) throw new HttpError('操作过于频繁，请稍后再试。', 429);
}
