import Link from 'next/link';
import { LEGAL_PAGES, SITE } from '@/lib/site';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-top">
        <img src="/assets/logo.png" alt="Off Stage Productions" />
        <div className="footer-links">
          <a href={SITE.instagram} target="_blank" rel="noopener">Instagram</a>
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          <a href={`tel:${SITE.phone}`}>{SITE.phoneLabel}</a>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <div className="footer-legal">
          {LEGAL_PAGES.map(([slug, label]) => (
            <Link key={slug} href={`/legal/${slug}`}>{label}</Link>
          ))}
        </div>
        <div className="footer-company">
          <span>© {new Date().getFullYear()} Off Stage Productions, a brand of {SITE.company}</span>
          <span>Hazaribagh, Jharkhand · CIN {SITE.cin} · GSTIN {SITE.gstin}</span>
        </div>
      </div>
    </footer>
  );
}

export function SimpleFooter() {
  return (
    <footer className="footer-simple-wrap">
      <div className="wrap footer-simple">
        <img src="/assets/logo.png" alt="Off Stage Productions" />
        <div>© {new Date().getFullYear()} Off Stage Productions, a brand of {SITE.company}</div>
      </div>
    </footer>
  );
}
