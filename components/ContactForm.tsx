'use client';

import { useState, type FormEvent } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { firebaseConfigured } from '@/lib/config';
import { SITE } from '@/lib/site';

const TYPES = ['Festival', 'Corporate', 'Concert', 'Wedding', 'Other'];

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('Festival');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!firebaseConfigured) {
      setError(`We couldn't send this right now. Please email ${SITE.email}.`);
      return;
    }
    setBusy(true);
    try {
      await addDoc(collection(db(), 'enquiries'), {
        name: name.trim().slice(0, 120),
        email: email.trim().slice(0, 200),
        type,
        message: message.trim().slice(0, 5000),
        read: false,
        createdAt: serverTimestamp(),
      });
      setSent(true);
    } catch {
      setError(`We couldn't send this right now. Please email ${SITE.email} or call ${SITE.phoneLabel}.`);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setSent(false);
    setName('');
    setEmail('');
    setMessage('');
    setType('Festival');
  }

  if (sent) {
    return (
      <div className="sent">
        <div className="big">Cue received.</div>
        <div className="small">Thanks, {name} — we&apos;ll be in touch shortly.</div>
        <button type="button" onClick={reset}>Send another</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="brief">
      <label className="field">Name
        <input required maxLength={120} value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
      </label>
      <label className="field">Email
        <input required type="email" maxLength={200} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
      </label>
      <div className="types">
        <div className="field">Type of event</div>
        <div className="pills">
          {TYPES.map(t => (
            <button key={t} type="button" className={`pill${t === type ? ' active' : ''}`} onClick={() => setType(t)}>{t}</button>
          ))}
        </div>
      </div>
      <label className="field">Tell us more
        <textarea rows={3} maxLength={5000} value={message} onChange={e => setMessage(e.target.value)} />
      </label>
      {error && <div className="brief-error">{error}</div>}
      <button type="submit" className="brief-submit" disabled={busy}>{busy ? 'Sending…' : 'Send the brief'}</button>
    </form>
  );
}
