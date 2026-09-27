'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { countEventsInCategory, createCategory, deleteCategory, listCategories, updateCategory } from '@/lib/admin-data';
import type { Category } from '@/lib/types';

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[] | null>(null);
  const [edits, setEdits] = useState<Record<string, { name: string; order: number }>>({});
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const c = await listCategories();
      setCats(c);
      setEdits(Object.fromEntries(c.map(x => [x.id, { name: x.name, order: x.order }])));
    } catch {
      setMsg({ kind: 'err', text: 'Could not load categories.' });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function add(e: FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    if (cats?.some(c => c.name.toLowerCase() === n.toLowerCase())) return setMsg({ kind: 'err', text: `“${n}” already exists.` });
    setBusy(true);
    setMsg(null);
    try {
      await createCategory(n, (cats?.length ?? 0) + 1);
      setName('');
      await load();
      setMsg({ kind: 'ok', text: `Added “${n}”.` });
    } catch {
      setMsg({ kind: 'err', text: 'Could not add the category.' });
    } finally {
      setBusy(false);
    }
  }

  async function save(c: Category) {
    const ed = edits[c.id];
    if (!ed.name.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      await updateCategory(c.id, ed.name, Number(ed.order) || 0);
      await load();
      setMsg({ kind: 'ok', text: 'Category saved. Events in it were updated too.' });
    } catch {
      setMsg({ kind: 'err', text: 'Could not save the category.' });
    } finally {
      setBusy(false);
    }
  }

  async function remove(c: Category) {
    setBusy(true);
    setMsg(null);
    try {
      const n = await countEventsInCategory(c.id);
      if (n > 0) {
        setMsg({ kind: 'err', text: `“${c.name}” still has ${n} event${n === 1 ? '' : 's'}. Move or delete them first.` });
      } else if (confirm(`Delete the category “${c.name}”?`)) {
        await deleteCategory(c.id);
        await load();
      }
    } catch {
      setMsg({ kind: 'err', text: 'Could not delete the category.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Categories</h1>
          <p>These become the filter buttons on the “Recent nights” section.</p>
        </div>
      </div>

      {msg && <div className={`msg ${msg.kind}`}>{msg.text}</div>}

      <form className="card row" onSubmit={add}>
        <label className="in" style={{ flex: '1 1 260px' }}>New category
          <input value={name} maxLength={40} onChange={e => setName(e.target.value)} placeholder="e.g. Weddings" />
        </label>
        <button type="submit" className="btn gold" disabled={busy || !name.trim()} style={{ alignSelf: 'flex-end' }}>+ Add category</button>
      </form>

      <div className="card table-wrap">
        {cats === null ? (
          <div className="muted">Loading…</div>
        ) : cats.length === 0 ? (
          <div className="muted">No categories yet. Try “Events” and “Productions” to match the original design.</div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Name</th><th style={{ width: 110 }}>Order</th><th style={{ width: 200 }} /></tr>
            </thead>
            <tbody>
              {cats.map(c => {
                const ed = edits[c.id] || { name: c.name, order: c.order };
                const dirty = ed.name !== c.name || Number(ed.order) !== c.order;
                return (
                  <tr key={c.id}>
                    <td><input value={ed.name} maxLength={40} onChange={e => setEdits(x => ({ ...x, [c.id]: { ...ed, name: e.target.value } }))} /></td>
                    <td><input type="number" value={ed.order} onChange={e => setEdits(x => ({ ...x, [c.id]: { ...ed, order: Number(e.target.value) } }))} /></td>
                    <td>
                      <div className="row" style={{ justifyContent: 'flex-end' }}>
                        <button type="button" className="btn small" disabled={busy || !dirty} onClick={() => save(c)}>Save</button>
                        <button type="button" className="btn small danger" disabled={busy} onClick={() => remove(c)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
