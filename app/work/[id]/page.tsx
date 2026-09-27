import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Gallery } from '@/components/Gallery';
import { getEvent } from '@/lib/content';
import { SHOW_SPOTLIGHT } from '@/lib/site';

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

// Render each event on first visit, then cache it (ISR).
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ev = await getEvent((await params).id);
  if (!ev) return { title: 'Event not found' };
  return {
    title: ev.title,
    description: ev.meta || ev.description.slice(0, 160),
    openGraph: ev.cover ? { images: [ev.cover.url] } : undefined,
  };
}

function formatDate(d: string) {
  if (!d) return '';
  const date = new Date(d + 'T00:00:00');
  return isNaN(date.getTime()) ? d : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function EventPage({ params }: Props) {
  const ev = await getEvent((await params).id);
  if (!ev) notFound();
  const photos = ev.photos.length ? ev.photos : ev.cover ? [ev.cover] : [];
  const facts = [ev.categoryName, formatDate(ev.date), ev.location].filter(Boolean);

  return (
    <div className="page">
      <SiteHeader />
      <section className="event-hero">
        {SHOW_SPOTLIGHT && <div className="spotlight" aria-hidden="true" />}
        <div className="wrap">
          <Link href="/#work" className="eyebrow">← Recent nights</Link>
          <h1>{ev.title}</h1>
          {facts.length > 0 && <div className="event-facts">{facts.map(f => <span key={f}>{f}</span>)}</div>}
          {ev.meta && <div className="work-tag">{ev.meta}</div>}
          {ev.description && <p className="event-desc">{ev.description}</p>}
        </div>
      </section>
      <section className="work">
        <div className="wrap section">
          {photos.length ? (
            <Gallery photos={photos} title={ev.title} />
          ) : (
            <div className="work-empty"><strong>Photos coming soon.</strong></div>
          )}
          <div className="btn-row" style={{ marginTop: 48 }}>
            <a href="/#contact" className="btn-gold">Plan your event</a>
            <Link href="/#work" className="btn-ghost">More of our work</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
