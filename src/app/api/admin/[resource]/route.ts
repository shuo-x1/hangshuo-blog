import {NextRequest} from 'next/server';
import {adminApi} from '@/lib/http';
import {readAdminResource, saveAdminResource, deleteAdminResource} from '@/lib/admin-data';
import {saveUploadedPhoto} from '@/lib/uploads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = {params:{resource:string}};
export function GET(request: NextRequest,{params}: Context) {
  return adminApi(request,()=>readAdminResource(params.resource));
}
export function POST(request: NextRequest,{params}: Context) {
  return adminApi(request,()=>params.resource==='uploads' ? saveUploadedPhoto(request) : saveAdminResource(request,params.resource));
}
export function PATCH(request: NextRequest,{params}: Context) {
  return adminApi(request,()=>saveAdminResource(request,params.resource));
}
export function DELETE(request: NextRequest,{params}: Context) {
  return adminApi(request,()=>deleteAdminResource(request,params.resource));
}
