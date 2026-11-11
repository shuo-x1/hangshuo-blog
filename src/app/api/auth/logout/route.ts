import {NextRequest} from 'next/server';
import {apiResult, checkOrigin} from '@/lib/http';
import {deleteSession} from '@/lib/auth';

export async function POST(request: NextRequest) {
  return apiResult(async()=>{checkOrigin(request);await deleteSession();return {ok:true};});
}
