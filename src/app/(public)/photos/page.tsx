import { prisma } from "@/lib/db";
import { getSiteSetting } from "@/lib/site-data";
import { PageHeading } from "@/components/public/page-heading";
import { PhotoWall } from "@/components/public/photo-wall";
import { Icon } from "@/components/icons";

export default async function PhotosPage(): Promise<React.JSX.Element> {
  const [photos, site] = await Promise.all([prisma.photo.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, url: true, caption: true } }), getSiteSetting()]);
  const items = photos.map((photo, index) => ({ ...photo, caption: !photo.caption || /^[a-f0-9]{32}$/i.test(photo.caption) ? `照片 ${String(index + 1).padStart(2, "0")}` : photo.caption }));
  return <div className="public-page"><PageHeading eyebrow="留在这里的片刻" title="照片集" description="生活不必赶路，偶尔也翻翻相册。点开一个画面，看看，也说说你的想法。" />{items.length ? <PhotoWall photos={items} initialStyle={site.galleryStyle} /> : <div className="glass-panel rounded-3xl px-6 py-16 text-center"><Icon name="photo" className="mx-auto h-10 w-10 text-muted" /><h2 className="mt-6 font-serif text-2xl text-ink">相册还空着。</h2><p className="mt-3 text-sm leading-8 text-copy">新的画面，会慢慢留在这里。</p></div>}</div>;
}
