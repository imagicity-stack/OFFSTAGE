'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Photo } from '@/lib/types';

export function Gallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const n = photos.length;
  const step = useCallback((d: number) => setOpen(i => (i === null ? i : (i + d + n) % n)), [n]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, step]);

  return (
    <>
      <div className="gallery">
        {photos.map((p, i) => (
          <button key={p.path || p.url} type="button" onClick={() => setOpen(i)} aria-label={`Open photo ${i + 1}`}>
            <img src={p.url} alt={`${title} — photo ${i + 1}`} loading="lazy" width={p.width} height={p.height} />
          </button>
        ))}
      </div>
      {open !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
          <span className="lb-count">{open + 1} / {n}</span>
          <img src={photos[open].url} alt={`${title} — photo ${open + 1}`} onClick={e => e.stopPropagation()} />
          <button type="button" className="lb-btn lb-close" aria-label="Close" onClick={() => setOpen(null)}>✕</button>
          {n > 1 && (
            <>
              <button type="button" className="lb-btn lb-prev" aria-label="Previous" onClick={e => { e.stopPropagation(); step(-1); }}>←</button>
              <button type="button" className="lb-btn lb-next" aria-label="Next" onClick={e => { e.stopPropagation(); step(1); }}>→</button>
            </>
          )}
        </div>
      )}
    </>
  );
}
