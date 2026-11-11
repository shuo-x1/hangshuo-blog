interface PageHeadingProps { eyebrow: string; title: string; description?: string }

export function PageHeading({ eyebrow, title, description }: PageHeadingProps): React.JSX.Element {
  return <div className="mb-9 border-b border-line pb-7 sm:mb-11"><p className="eyebrow">{eyebrow}</p><h1 className="mt-3 font-serif text-4xl leading-relaxed tracking-wide text-ink sm:text-[42px]">{title}</h1>{description && <p className="mt-3 max-w-xl text-sm leading-8 text-copy">{description}</p>}</div>;
}
