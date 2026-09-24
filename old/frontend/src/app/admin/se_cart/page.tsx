"use client";
import { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import SeCartContent from './SeCartContent';


export default function SeCartPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SeCartContent />
    </Suspense>
  );
}