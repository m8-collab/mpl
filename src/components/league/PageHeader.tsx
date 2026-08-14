export function PageHeader({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: string }) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="eyebrow text-accent">{eyebrow}</p>}
      <h1 className="mt-2 font-display text-3xl font-black lg:text-5xl">{title}</h1>
      {lead && <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{lead}</p>}
    </div>
  );
}