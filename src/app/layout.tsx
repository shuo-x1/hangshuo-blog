import type {Metadata} from 'next';
import {VisitTracker} from '@/components/visit-tracker';
import './globals.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title:{default:'张航硕 · 个人博客',template:'%s · 张航硕'},
  description:'记录想法，创造一些有用的东西。博客、项目和生活。'
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="zh-CN"><body>{children}<VisitTracker/></body></html>;
}
