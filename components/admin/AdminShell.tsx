'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { firebaseConfigured, isAdminEmail } from '@/lib/config';

const UserCtx = createContext<User | null>(null);
export const useAdminUser = () => useContext(UserCtx);

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/admin/login';
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!firebaseConfigured) return setUser(null);
    return onAuthStateChanged(auth(), u => {
      if (u && !isAdminEmail(u.email)) {
        signOut(auth());
        setUser(null);
      } else setUser(u);
    });
  }, []);

  useEffect(() => {
    if (user === null && !isLogin) router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [user, isLogin, pathname, router]);

  useEffect(() => {
    if (!user) return;
    getCountFromServer(query(collection(db(), 'enquiries'), where('read', '==', false)))
      .then(s => setUnread(s.data().count))
      .catch(() => {});
  }, [user, pathname]);

  if (isLogin) return <>{children}</>;
  if (!user) return <div className="adm"><div className="center-screen">Checking your pass…</div></div>;

  const nav = [
    ['/admin', 'Events'],
    ['/admin/categories', 'Categories'],
    ['/admin/enquiries', 'Enquiries'],
  ] as const;
  const active = (href: string) => (href === '/admin' ? pathname === '/admin' || pathname.startsWith('/admin/events') : pathname.startsWith(href));

  return (
    <UserCtx.Provider value={user}>
      <div className="adm">
        <header className="adm-bar">
          <div className="wrap">
            <Link href="/admin" className="adm-brand">
              <img src="/assets/logo.png" alt="Off Stage Productions" />
              <span>Backstage</span>
            </Link>
            <nav className="adm-nav">
              {nav.map(([href, label]) => (
                <Link key={href} href={href} className={active(href) ? 'active' : undefined}>
                  {label}
                  {href === '/admin/enquiries' && unread > 0 && <span className="adm-badge">{unread}</span>}
                </Link>
              ))}
              <a href="/" target="_blank" rel="noopener">View site ↗</a>
              <span className="who">{user.email}</span>
              <button type="button" onClick={() => signOut(auth()).then(() => router.replace('/admin/login'))}>Sign out</button>
            </nav>
          </div>
        </header>
        <main className="wrap adm-main">{children}</main>
      </div>
    </UserCtx.Provider>
  );
}
