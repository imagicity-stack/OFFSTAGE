'use client';

import { useEffect, useState } from 'react';
import { deleteEnquiry, listEnquiries, setEnquiryRead } from '@/lib/admin-data';
import type { Enquiry } from '@/lib/types';

export default function EnquiriesPage() {
  const [items, setItems] = useState<Enquiry[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listEnquiries().then(setItems).catch(() => setError('Could not load enquiries.'));
  }, []);

  async function toggle(q: Enquiry) {
    await setEnquiryRead(q.id, !q.read);
    setItems(xs => xs && xs.map(x => (x.id === q.id ? { ...x, read: !q.read } : x)));
  }

  async function remove(q: Enquiry) {
    if (!confirm(`Delete the enquiry from ${q.name}?`)) return;
    await deleteEnquiry(q.id);
    setItems(xs => xs && xs.filter(x => x.id !== q.id));
  }

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Enquiries</h1>
          <p>Briefs sent from the “Got a date?” form on the website.</p>
        </div>
      </div>
      {error && <div className="msg err">{error}</div>}
      <div className="enq">
        {items === null && !error && <div className="muted">Loading…</div>}
        {items?.length === 0 && <div className="card muted">No enquiries yet.</div>}
        {items?.map(q => (
          <div key={q.id} className={`enq-item${q.read ? '' : ' unread'}`}>
            <div className="enq-top">
              <div className="enq-name">{q.name}</div>
              <span className="muted" style={{ fontSize: 14 }}>
                {q.createdAt ? q.createdAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
              </span>
            </div>
            <div className="row" style={{ fontSize: 15 }}>
              <a href={`mailto:${q.email}?subject=${encodeURIComponent('Your enquiry — Off Stage Productions')}`}><u>{q.email}</u></a>
              <span className="status draft">{q.type}</span>
            </div>
            {q.message && <div className="enq-msg">{q.message}</div>}
            <div className="row">
              <button type="button" className="btn small line" onClick={() => toggle(q)}>{q.read ? 'Mark unread' : 'Mark read'}</button>
              <button type="button" className="btn small danger" onClick={() => remove(q)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
