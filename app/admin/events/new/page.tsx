'use client';

import { Suspense } from 'react';
import { EventEditor } from '@/components/admin/EventEditor';

export default function NewEventPage() {
  return <Suspense><EventEditor /></Suspense>;
}
