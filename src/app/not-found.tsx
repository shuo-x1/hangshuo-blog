import Link from 'next/link';
export default function NotFound() {
  return <main className="mx-auto max-w-xl px-6 py-24 text-ink">
    <h1 className="font-serif text-3xl">这一页还没找到</h1>
    <p className="my-6">内容可能已移动或尚未公开。</p>
    <Link className="button-primary" href="/">返回首页</Link>
  </main>;
}
