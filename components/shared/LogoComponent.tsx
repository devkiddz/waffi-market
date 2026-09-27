import Link from 'next/link';

export default function LogoComponent({ brandName = 'Waffi', brandSlug = '' }: {
  brandName?: string;
  brandSlug?: string;
}) {
  const label = `${brandName} ${brandSlug}`.trim();

  return (
    <Link href="/" aria-label={`${label} home`}
      className="inline-flex shrink-0 items-baseline rounded-md font-heading text-2xl font-black tracking-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-3xl">
      {brandName}<span className="text-accent">.</span>
      {brandSlug ? <span className="ml-1 text-sm font-medium">{brandSlug}</span> : null}
    </Link>
  );
}
