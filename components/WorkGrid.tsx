'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Category, EventDoc } from '@/lib/types';

export function WorkGrid({ categories, events }: { categories: Category[]; events: EventDoc[] }) {
  const [filter, setFilter] = useState('all');
  // Only offer filters for categories that actually have published events.
  const used = categories.filter(c => events.some(e => e.categoryId === c.id));
  const shown = events.filter(e => filter === 'all' || e.categoryId === filter);

  return (
    <>
      <div className="section-head work-head">
        <h2 className="h2">Recent nights.</h2>
        {used.length > 0 && (
          <div className="pills">
            {[{ id: 'all', name: 'All' }, ...used].map(c => (
              <button key={c.id} type="button" className={`pill${filter === c.id ? ' active' : ''}`} onClick={() => setFilter(c.id)}>
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>
      {events.length === 0 ? (
        <div className="work-empty">
          <strong>The house lights are coming up.</strong>
          <span>Our latest events will be here soon. Until then, catch us on Instagram.</span>
        </div>
      ) : (
        <div className="work-grid">
          {shown.map(w => {
            const count = w.photos.length;
            return (
              <Link key={w.id} href={`/work/${w.id}`} className="work-card">
                <div className="work-thumb">
                  {w.cover ? (
                    <img src={w.cover.url} alt={w.title} loading="lazy" />
                  ) : (
                    <span className="ph">event photo — {w.title}</span>
                  )}
                  {count > 1 && <span className="count">{count} photos</span>}
                </div>
                <div className="work-title-row">
                  <div className="work-title">{w.title}</div>
                  <div className="work-tag">{w.categoryName}</div>
                </div>
                {w.meta && <div className="work-meta">{w.meta}</div>}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
