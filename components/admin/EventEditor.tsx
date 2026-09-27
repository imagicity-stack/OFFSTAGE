'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  appendPhoto, createEvent, deleteEvent, deleteStorageFile, getEventAdmin, listCategories,
  updateEvent, uploadPhoto, type EventInput,
} from '@/lib/admin-data';
import type { Category, EventDoc, Photo } from '@/lib/types';

const EMPTY: EventInput = {
  title: '', categoryId: '', categoryName: '', meta: '', description: '', date: '', location: '', published: false, order: 0,
};

type Upload = { key: string; name: string; pct: number; error?: string };

const UPLOAD_CONCURRENCY = 3;
const MAX_FILE_MB = 25;

export function EventEditor({ id }: { id?: string }) {
  const router = useRouter();
  const justCreated = useSearchParams().get('created') === '1';
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<EventInput>(EMPTY);
  const [event, setEvent] = useState<EventDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(
    justCreated ? { kind: 'ok', text: 'Event created. Now add photos below, then publish it.' } : null,
  );
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [over, setOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const hasCover = useRef(false);

  useEffect(() => {
    if (justCreated) window.history.replaceState(null, '', window.location.pathname);
  }, [justCreated]);

  useEffect(() => {
    (async () => {
      try {
        const cats = await listCategories();
        setCategories(cats);
        if (id) {
          const ev = await getEventAdmin(id);
          if (!ev) {
            setMsg({ kind: 'err', text: 'This event no longer exists.' });
          } else {
            setEvent(ev);
            hasCover.current = !!ev.cover;
            const { id: _id, cover: _c, photos: _p, ...rest } = ev;
            setForm(rest);
          }
        } else if (cats[0]) {
          setForm(f => ({ ...f, categoryId: cats[0].id, categoryName: cats[0].name }));
        }
      } catch {
        setMsg({ kind: 'err', text: 'Could not load data. Check your connection.' });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const set = <K extends keyof EventInput>(k: K, v: EventInput[K]) => setForm(f => ({ ...f, [k]: v }));

  async function save(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    const cat = categories.find(c => c.id === form.categoryId);
    if (!form.title.trim()) return setMsg({ kind: 'err', text: 'Give the event a title.' });
    if (!cat) return setMsg({ kind: 'err', text: 'Pick a category.' });
    const data: EventInput = {
      ...form,
      title: form.title.trim(),
      meta: form.meta.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
      categoryName: cat.name,
      order: Number(form.order) || 0,
    };
    setSaving(true);
    try {
      if (id) {
        await updateEvent(id, data);
        setEvent(ev => (ev ? { ...ev, ...data } : ev));
        setMsg({ kind: 'ok', text: data.published ? 'Saved. Live on the site within a minute.' : 'Saved as draft.' });
      } else {
        const newId = await createEvent(data);
        router.replace(`/admin/events/${newId}?created=1`);
      }
    } catch {
      setMsg({ kind: 'err', text: 'Could not save. Are you still signed in?' });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!event || !confirm(`Delete “${event.title}” and all ${event.photos.length} photos? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await deleteEvent(event);
      router.replace('/admin');
    } catch {
      setSaving(false);
      setMsg({ kind: 'err', text: 'Could not delete the event.' });
    }
  }

  /* ----- photos ----- */

  async function addFiles(list: FileList | File[]) {
    if (!event) return;
    const files = Array.from(list).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    const jobs = files.map(f => ({ file: f, key: `${f.name}-${f.size}-${Math.random()}` }));
    setUploads(u => [...u, ...jobs.map(j => ({ key: j.key, name: j.file.name, pct: 0 }))]);
    const patch = (key: string, p: Partial<Upload>) => setUploads(u => u.map(x => (x.key === key ? { ...x, ...p } : x)));

    const queue = [...jobs];
    const worker = async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        if (job.file.size > MAX_FILE_MB * 1024 * 1024) {
          patch(job.key, { error: `Over ${MAX_FILE_MB} MB` });
          continue;
        }
        try {
          const photo = await uploadPhoto(event.id, job.file, pct => patch(job.key, { pct }));
          const makeCover = !hasCover.current;
          hasCover.current = true;
          await appendPhoto(event.id, photo, makeCover);
          setEvent(ev => (ev ? { ...ev, photos: [...ev.photos, photo], cover: makeCover ? photo : ev.cover } : ev));
          setUploads(u => u.filter(x => x.key !== job.key));
        } catch {
          patch(job.key, { error: 'Failed' });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, jobs.length) }, worker));
  }

  async function persistPhotos(photos: Photo[], cover: Photo | null) {
    if (!event) return;
    const prev = event;
    setEvent({ ...event, photos, cover });
    hasCover.current = !!cover;
    try {
      await updateEvent(event.id, { photos, cover });
    } catch {
      setEvent(prev);
      hasCover.current = !!prev.cover;
      setMsg({ kind: 'err', text: 'Could not update photos.' });
    }
  }

  function move(i: number, d: number) {
    if (!event) return;
    const photos = [...event.photos];
    [photos[i], photos[i + d]] = [photos[i + d], photos[i]];
    persistPhotos(photos, event.cover);
  }

  async function removePhoto(p: Photo) {
    if (!event || !confirm('Delete this photo?')) return;
    const photos = event.photos.filter(x => x.path !== p.path);
    const cover = event.cover?.path === p.path ? photos[0] ?? null : event.cover;
    await persistPhotos(photos, cover);
    await deleteStorageFile(p.path);
  }

  if (loading) return <div className="center-screen">Loading…</div>;

  return (
    <>
      <div className="adm-head">
        <div>
          <Link href="/admin" className="muted">← All events</Link>
          <h1 style={{ marginTop: 10 }}>{id ? form.title || 'Untitled event' : 'New event'}</h1>
          {event && (
            <p>
              <span className={`status ${event.published ? 'live' : 'draft'}`}>{event.published ? 'Live' : 'Draft'}</span>{' '}
              {event.published && <a href={`/work/${event.id}`} target="_blank" rel="noopener"><u>/work/{event.id}</u> ↗</a>}
            </p>
          )}
        </div>
      </div>

      {msg && <div className={`msg ${msg.kind}`}>{msg.text}</div>}

      {categories.length === 0 ? (
        <div className="card">
          <h2>Create a category first</h2>
          <p className="muted">Every event belongs to a category such as “Events” or “Productions”.</p>
          <Link href="/admin/categories" className="btn gold">Go to categories</Link>
        </div>
      ) : (
        <form className="card form" onSubmit={save}>
          <h2>Details</h2>
          <div className="form-grid">
            <label className="in">Title *
              <input required maxLength={120} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Summer Lights Festival" />
            </label>
            <label className="in">Category *
              <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)} required>
                <option value="" disabled>Choose…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          </div>
          <label className="in">Short line
            <input maxLength={120} value={form.meta} onChange={e => set('meta', e.target.value)} placeholder="Open-air · 3 stages · 12,000 guests" />
            <small>Shown under the title on the “Recent nights” grid.</small>
          </label>
          <div className="form-grid">
            <label className="in">Event date
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </label>
            <label className="in">Location
              <input maxLength={120} value={form.location} onChange={e => set('location', e.target.value)} placeholder="Ranchi, Jharkhand" />
            </label>
            <label className="in">Display order
              <input type="number" value={form.order} onChange={e => set('order', Number(e.target.value))} />
              <small>Lower numbers show first. Ties are sorted newest first.</small>
            </label>
          </div>
          <label className="in">Story
            <textarea maxLength={4000} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What made the night — brief, scale, highlights." />
          </label>
          <label className="check">
            <input type="checkbox" checked={form.published} onChange={e => set('published', e.target.checked)} />
            Published — show this event on the website
          </label>
          <div className="row spread">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving…' : id ? 'Save changes' : 'Create event & add photos'}
            </button>
            {event && <button type="button" className="btn danger" onClick={remove} disabled={saving}>Delete event</button>}
          </div>
        </form>
      )}

      {event && (
        <section className="card form" id="photos">
          <div className="row spread">
            <h2 style={{ margin: 0 }}>Photos <span className="muted">({event.photos.length})</span></h2>
            <span className="muted" style={{ fontSize: 14 }}>The highlighted photo is the cover on the site.</span>
          </div>
          <div
            className={`drop${over ? ' over' : ''}`}
            onClick={() => fileInput.current?.click()}
            onDragOver={e => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={e => { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files); }}
          >
            <strong>Drop photos here or click to choose</strong>
            <span className="muted">JPG, PNG, WebP · up to {MAX_FILE_MB} MB each · large photos are resized to 2400px</span>
            <input
              ref={fileInput} type="file" accept="image/*" multiple hidden
              onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
            />
          </div>
          {uploads.length > 0 && (
            <div className="uploads">
              {uploads.map(u => (
                <div key={u.key} className="upl">
                  <span className="name">{u.name}</span>
                  <span className="bar"><i style={{ width: `${u.pct}%` }} /></span>
                  {u.error ? (
                    <button type="button" className="btn small danger" title={u.error} onClick={() => setUploads(x => x.filter(y => y.key !== u.key))}>✕</button>
                  ) : (
                    <span className="muted">{u.pct}%</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {event.photos.length > 0 && (
            <div className="photos">
              {event.photos.map((p, i) => {
                const isCover = event.cover?.path === p.path;
                return (
                  <div key={p.path} className={`ph-card${isCover ? ' cover' : ''}`}>
                    <div className="ph-img">
                      <img src={p.url} alt="" loading="lazy" />
                      {isCover && <span className="tag">Cover</span>}
                    </div>
                    <div className="ph-tools">
                      <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move left">←</button>
                      <button type="button" disabled={isCover} onClick={() => persistPhotos(event.photos, p)}>Cover</button>
                      <button type="button" disabled={i === event.photos.length - 1} onClick={() => move(i, 1)} aria-label="Move right">→</button>
                      <button type="button" className="del" onClick={() => removePhoto(p)}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </>
  );
}
