// Server-side reads of public content through the Firestore REST API.
// Runs unauthenticated, so the security rules in firestore.rules decide what is visible
// (published events and all categories).
import 'server-only';
import { firebaseConfig, useEmulators } from './config';
import type { Category, EventDoc, Photo } from './types';

export const REVALIDATE_SECONDS = 60;

type FsValue = Record<string, unknown>;

function decode(v: FsValue | undefined): unknown {
  if (!v) return undefined;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (((v.arrayValue as { values?: FsValue[] }).values) || []).map(decode);
  if ('mapValue' in v) return decodeFields((v.mapValue as { fields?: Record<string, FsValue> }).fields);
  return undefined;
}

function decodeFields(fields: Record<string, FsValue> = {}) {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(fields)) out[k] = decode(fields[k]);
  return out;
}

const base = () =>
  `${useEmulators ? 'http://127.0.0.1:8080' : 'https://firestore.googleapis.com'}/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

const idOf = (name: string) => name.split('/').pop() as string;

function toPhoto(p: unknown): Photo | null {
  const o = p as Photo | null;
  return o && typeof o.url === 'string' ? o : null;
}

export function toEvent(id: string, d: Record<string, unknown>): EventDoc {
  return {
    id,
    title: String(d.title ?? ''),
    categoryId: String(d.categoryId ?? ''),
    categoryName: String(d.categoryName ?? ''),
    meta: String(d.meta ?? ''),
    description: String(d.description ?? ''),
    date: String(d.date ?? ''),
    location: String(d.location ?? ''),
    cover: toPhoto(d.cover),
    photos: Array.isArray(d.photos) ? (d.photos.map(toPhoto).filter(Boolean) as Photo[]) : [],
    published: d.published === true,
    order: typeof d.order === 'number' ? d.order : 0,
  };
}

async function fsFetch(path: string, init?: RequestInit) {
  if (!firebaseConfig.projectId || !firebaseConfig.apiKey) return null;
  const sep = path.includes('?') ? '&' : '?';
  try {
    const res = await fetch(`${base()}${path}${sep}key=${firebaseConfig.apiKey}`, {
      ...init,
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getCategories(): Promise<Category[]> {
  const json = await fsFetch('/categories?pageSize=300');
  const docs: { name: string; fields: Record<string, FsValue> }[] = json?.documents || [];
  return docs
    .map(d => {
      const f = decodeFields(d.fields);
      return { id: idOf(d.name), name: String(f.name ?? ''), order: Number(f.order ?? 0) };
    })
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function getPublishedEvents(): Promise<EventDoc[]> {
  const json = await fsFetch(':runQuery', {
    method: 'POST',
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'events' }],
        where: { fieldFilter: { field: { fieldPath: 'published' }, op: 'EQUAL', value: { booleanValue: true } } },
      },
    }),
  });
  const rows: { document?: { name: string; fields: Record<string, FsValue> } }[] = Array.isArray(json) ? json : [];
  return rows
    .filter(r => r.document)
    .map(r => toEvent(idOf(r.document!.name), decodeFields(r.document!.fields)))
    .sort((a, b) => a.order - b.order || b.date.localeCompare(a.date));
}

export async function getEvent(id: string): Promise<EventDoc | null> {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) return null;
  const json = await fsFetch(`/events/${id}`);
  if (!json?.fields) return null;
  const ev = toEvent(id, decodeFields(json.fields));
  return ev.published ? ev : null;
}
