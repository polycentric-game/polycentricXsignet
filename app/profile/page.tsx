'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';

export default function ProfilePage() {
  const router = useRouter();
  const { session, currentFounder } = useAppStore();
  
  useEffect(() => {
    if (!session) {
      router.push('/sign-in');
      return;
    }
    
    if (!currentFounder) {
      router.push('/create-founder');
      return;
    }
    
    // Redirect to founder profile page
    router.push(`/founder/${currentFounder.id}`);
  }, [session, currentFounder, router]);
  
  return null; // Will redirect
}
