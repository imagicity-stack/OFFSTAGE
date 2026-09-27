import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SimpleFooter } from '@/components/SiteFooter';
import { LEGAL_CONTENT } from '@/lib/legal-content';
import { LEGAL_PAGES, SITE, type LegalSlug } from '@/lib/site';

type Props = { params: Promise<{ page: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return LEGAL_PAGES.map(([page]) => ({ page }));
}

const find = (slug: string) => LEGAL_PAGES.find(p => p[0] === slug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = find((await params).page);
  return { title: p ? p[1] : 'Legal' };
}

export default async function LegalPage({ params }: Props) {
  const { page } = await params;
  const current = find(page);
  if (!current) notFound();

  return (
    <div className="page">
      <SiteHeader back />
      <section className="legal-hero">
        <div className="wrap">
          <div className="eyebrow">Legal</div>
          <h1>{current[1]}</h1>
          <p>Last updated 27 September 2026 · {SITE.company}</p>
        </div>
      </section>

      <div className="wrap legal-body">
        <nav className="legal-nav">
          {LEGAL_PAGES.map(([slug, label]) => (
            <Link key={slug} href={`/legal/${slug}`} className={slug === page ? 'active' : undefined}>{label}</Link>
          ))}
        </nav>
        <article className="legal-article">
          {LEGAL_CONTENT[page as LegalSlug]}
          <div className="company-card">
            <div className="name">{SITE.company}</div>
            <div>Operating as Off Stage Productions</div>
            <div>Registered office: {SITE.office}</div>
            <div className="ids"><span>CIN {SITE.cin}</span><span>GSTIN {SITE.gstin}</span></div>
            <div>
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a> · <a href={`tel:${SITE.phone}`}>{SITE.phoneLabel}</a> ·{' '}
              <a href={SITE.instagram} target="_blank" rel="noopener">{SITE.instagramHandle}</a>
            </div>
          </div>
        </article>
      </div>
      <SimpleFooter />
    </div>
  );
}
