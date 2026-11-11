'use client';

export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}) {
  return <main className="mx-auto max-w-xl px-6 py-24 text-ink">
    <h1 className="font-serif text-3xl">暂时无法加载</h1>
    <p className="my-6 leading-8">请检查数据库连接后重试，已保存的内容仍保留在数据库中。</p>
    <button onClick={reset} className="button-primary">重新加载</button>
  </main>;
}
