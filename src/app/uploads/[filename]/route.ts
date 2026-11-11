import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {NextRequest} from 'next/server';
import {safeImageName, uploadDirectory} from '@/lib/uploads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(_request: NextRequest,{params}:{params:{filename:string}}) {
  if (!safeImageName.test(params.filename)) return new Response('Not found',{status:404});
  try {
    const bytes = await readFile(path.join(uploadDirectory(),params.filename));
    const extension = params.filename.split('.').pop();
    return new Response(bytes,{headers:{
      'Content-Type':extension==='png'?'image/png':extension==='webp'?'image/webp':'image/jpeg',
      'X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=86400'
    }});
  } catch { return new Response('Not found',{status:404}); }
}
