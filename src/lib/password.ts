import {randomBytes, scrypt, timingSafeEqual} from 'node:crypto';

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, {N: 16384, r: 8, p: 1}, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${(await derive(password, salt)).toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const match = /^scrypt\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(stored);
  if (!match) return false;
  const actual = await derive(password, match[1]);
  return timingSafeEqual(actual, Buffer.from(match[2], 'hex'));
}
