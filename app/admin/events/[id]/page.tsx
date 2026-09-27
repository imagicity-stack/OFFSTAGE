'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { EventEditor } from '@/components/admin/EventEditor';

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  return <Suspense><EventEditor id={id} /></Suspense>;
}
