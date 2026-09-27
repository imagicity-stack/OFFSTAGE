'use client';

import {
  addDoc, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp,
  setDoc, updateDoc, where, writeBatch, type Timestamp,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, listAll, ref, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from './firebase';
import type { Category, Enquiry, EventDoc, Photo } from './types';

/* ---------- categories ---------- */

export async function listCategories(): Promise<Category[]> {
  const snap = await getDocs(collection(db(), 'categories'));
  return snap.docs
    .map(d => ({ id: d.id, name: String(d.data().name ?? ''), order: Number(d.data().order ?? 0) }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function createCategory(name: string, order: number) {
  await addDoc(collection(db(), 'categories'), { name: name.trim(), order, createdAt: serverTimestamp() });
}

/** Renames a category and updates the name copied onto its events. */
export async function updateCategory(id: string, name: string, order: number) {
  const batch = writeBatch(db());
  batch.update(doc(db(), 'categories', id), { name: name.trim(), order });
  const evs = await getDocs(query(collection(db(), 'events'), where('categoryId', '==', id)));
  evs.forEach(e => batch.update(e.ref, { categoryName: name.trim() }));
  await batch.commit();
}

export async function countEventsInCategory(id: string) {
  const evs = await getDocs(query(collection(db(), 'events'), where('categoryId', '==', id)));
  return evs.size;
}

export async function deleteCategory(id: string) {
  await deleteDoc(doc(db(), 'categories', id));
}

/* ---------- events ---------- */

function toEvent(id: string, d: Record<string, unknown>): EventDoc {
  return {
    id,
    title: String(d.title ?? ''),
    categoryId: String(d.categoryId ?? ''),
    categoryName: String(d.categoryName ?? ''),
    meta: String(d.meta ?? ''),
    description: String(d.description ?? ''),
    date: String(d.date ?? ''),
    location: String(d.location ?? ''),
    cover: (d.cover as Photo) ?? null,
    photos: Array.isArray(d.photos) ? (d.photos as Photo[]) : [],
    published: d.published === true,
    order: typeof d.order === 'number' ? d.order : 0,
  };
}

export async function listEvents(): Promise<EventDoc[]> {
  const snap = await getDocs(collection(db(), 'events'));
  return snap.docs
    .map(d => toEvent(d.id, d.data()))
    .sort((a, b) => a.order - b.order || b.date.localeCompare(a.date));
}

export async function getEventAdmin(id: string): Promise<EventDoc | null> {
  const snap = await getDoc(doc(db(), 'events', id));
  return snap.exists() ? toEvent(snap.id, snap.data()) : null;
}

export type EventInput = Omit<EventDoc, 'id' | 'cover' | 'photos'>;

function slugify(s: string) {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'event';
}

/** Creates an event whose id doubles as its public URL slug (/work/<id>). */
export async function createEvent(input: EventInput): Promise<string> {
  let id = slugify(input.title);
  if ((await getDoc(doc(db(), 'events', id))).exists()) id += '-' + Math.random().toString(36).slice(2, 6);
  await setDoc(doc(db(), 'events', id), {
    ...input, cover: null, photos: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  return id;
}

export async function updateEvent(id: string, patch: Partial<Omit<EventDoc, 'id'>>) {
  await updateDoc(doc(db(), 'events', id), { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteEvent(ev: EventDoc) {
  // Remove every file under the event's folder, including any orphaned uploads.
  try {
    const all = await listAll(ref(storage(), `events/${ev.id}`));
    await Promise.all(all.items.map(i => deleteObject(i).catch(() => {})));
  } catch {
    await Promise.all(ev.photos.map(p => deleteObject(ref(storage(), p.path)).catch(() => {})));
  }
  await deleteDoc(doc(db(), 'events', ev.id));
}

/* ---------- photos ---------- */

const MAX_EDGE = 2400;

/** Downscales large photos in the browser so uploads stay fast and the site stays light. */
async function prepareImage(file: File): Promise<{ blob: Blob; width: number; height: number; ext: string }> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return { blob: file, width: 0, height: 0, ext: file.name.split('.').pop() || 'jpg' };
  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  if (file.type === 'image/gif' || (scale === 1 && file.size < 1.5 * 1024 * 1024)) {
    bitmap.close();
    return { blob: file, width, height, ext: file.name.split('.').pop() || 'jpg' };
  }
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.86));
  return blob ? { blob, width: w, height: h, ext: 'jpg' } : { blob: file, width, height, ext: 'jpg' };
}

export async function uploadPhoto(eventId: string, file: File, onProgress: (pct: number) => void): Promise<Photo> {
  const { blob, width, height, ext } = await prepareImage(file);
  const path = `events/${eventId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext.toLowerCase()}`;
  const task = uploadBytesResumable(ref(storage(), path), blob, {
    contentType: blob.type || file.type || 'image/jpeg',
    cacheControl: 'public, max-age=31536000, immutable',
  });
  await new Promise<void>((resolve, reject) => {
    task.on('state_changed', s => onProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)), reject, () => resolve());
  });
  const url = await getDownloadURL(task.snapshot.ref);
  return { url, path, width, height };
}

/** Appends an uploaded photo atomically, so parallel uploads can't overwrite each other. */
export async function appendPhoto(eventId: string, photo: Photo, makeCover: boolean) {
  await updateDoc(doc(db(), 'events', eventId), {
    photos: arrayUnion(photo),
    ...(makeCover ? { cover: photo } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteStorageFile(path: string) {
  await deleteObject(ref(storage(), path)).catch(() => {});
}

/* ---------- enquiries ---------- */

export async function listEnquiries(): Promise<Enquiry[]> {
  const snap = await getDocs(query(collection(db(), 'enquiries'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => {
    const x = d.data();
    return {
      id: d.id,
      name: String(x.name ?? ''),
      email: String(x.email ?? ''),
      type: String(x.type ?? ''),
      message: String(x.message ?? ''),
      read: x.read === true,
      createdAt: x.createdAt ? (x.createdAt as Timestamp).toDate() : null,
    };
  });
}

export async function setEnquiryRead(id: string, read: boolean) {
  await updateDoc(doc(db(), 'enquiries', id), { read });
}

export async function deleteEnquiry(id: string) {
  await deleteDoc(doc(db(), 'enquiries', id));
}
