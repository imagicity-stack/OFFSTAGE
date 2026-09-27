import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SimpleFooter } from '@/components/SiteFooter';

export default function NotFound() {
  return (
    <div className="page">
      <SiteHeader back />
      <section className="legal-hero" style={{ minHeight: '60vh' }}>
        <div className="wrap">
          <div className="eyebrow">404</div>
          <h1>Wrong stage door.</h1>
          <p>This page isn&apos;t part of the show.</p>
          <div className="btn-row"><Link href="/" className="btn-gold">Back to the site</Link></div>
        </div>
      </section>
      <SimpleFooter />
    </div>
  );
}
