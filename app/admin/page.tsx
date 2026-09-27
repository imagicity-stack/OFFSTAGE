'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listCategories, listEvents } from '@/lib/admin-data';
import type { Category, EventDoc } from '@/lib/types';

export default function EventsDashboard() {
  const [events, setEvents] = useState<EventDoc[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([listEvents(), listCategories()])
      .then(([e, c]) => { setEvents(e); setCategories(c); })
      .catch(() => setError('Could not load events. Check your Firestore rules and connection.'));
  }, []);

  const shown = (events || []).filter(e => filter === 'all' || e.categoryId === filter);

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Events</h1>
          <p>{events ? `${events.length} total · ${events.filter(e => e.published).length} live on the site` : 'Loading…'}</p>
        </div>
        <Link href="/admin/events/new" className="btn gold">+ Add event</Link>
      </div>

      {error && <div className="msg err">{error}</div>}

      {categories.length === 0 && events && (
        <div className="msg ok">
          Start by <Link href="/admin/categories"><u>creating a category</u></Link> (for example “Events” or “Productions”). Every event belongs to one.
        </div>
      )}

      {categories.length > 0 && (
        <div className="row">
          {[{ id: 'all', name: 'All' }, ...categories].map(c => {
            const n = c.id === 'all' ? events?.length ?? 0 : (events || []).filter(e => e.categoryId === c.id).length;
            return (
              <button key={c.id} type="button" className={`btn small ${filter === c.id ? '' : 'line'}`} onClick={() => setFilter(c.id)}>
                {c.name} <span className="muted">{n}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="ev-list">
        {shown.map(ev => (
          <Link key={ev.id} href={`/admin/events/${ev.id}`} className="ev-row">
            <div className="ev-thumb">{ev.cover && <img src={ev.cover.url} alt="" />}</div>
            <div>
              <div className="ev-title">{ev.title}</div>
              <div className="ev-sub">
                <span>{ev.categoryName || 'No category'}</span>
                {ev.date && <span>{ev.date}</span>}
                <span>{ev.photos.length} photo{ev.photos.length === 1 ? '' : 's'}</span>
              </div>
            </div>
            <span className={`status ${ev.published ? 'live' : 'draft'}`}>{ev.published ? 'Live' : 'Draft'}</span>
          </Link>
        ))}
        {events && shown.length === 0 && <div className="card muted">No events here yet.</div>}
      </div>
    </>
  );
}
