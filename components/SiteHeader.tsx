import Link from 'next/link';

export function SiteHeader({ back = false }: { back?: boolean }) {
  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" className="logo">
          <img src="/assets/logo.png" alt="Off Stage Productions" width={136} height={44} />
        </Link>
        {back ? (
          <Link href="/" className="back-link">← Back to site</Link>
        ) : (
          <nav className="site-nav">
            <a href="/#services">Services</a>
            <a href="/#work">Work</a>
            <a href="/#process">Process</a>
            <a href="/#contact" className="nav-cta">Start a project</a>
          </nav>
        )}
      </div>
    </header>
  );
}
