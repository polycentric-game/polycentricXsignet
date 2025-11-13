'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useAppStore } from '@/lib/store';

export default function ProfilePage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const { session, user, currentFounder, isLoading } = useAppStore();
  
  useEffect(() => {
    // Wait for app to finish initializing
    if (isLoading) {
      return;
    }
    
    // If wallet is connected, we should have a session - wait a bit if needed
    if (isConnected && address) {
      if (!session || !user) {
        // Wait for Header to create session
        const timer = setTimeout(() => {
          const { session: currentSession, user: currentUser, currentFounder: currentFounderState } = useAppStore.getState();
          if (!currentSession || !currentUser) {
            // Still no session after waiting, something went wrong - redirect to home
            router.push('/');
          } else if (!currentFounderState) {
            // Session and user exist but no founder, redirect to create founder
            router.push('/create-founder');
          } else {
            // Session, user, and founder exist - redirect to founder profile
            router.push(`/founder/${currentFounderState.id}`);
          }
        }, 1500); // Give Header time to create session
        return () => clearTimeout(timer);
      } else if (!currentFounder) {
        // Have session and user but no founder - redirect to create founder
        router.push('/create-founder');
        return;
      } else {
        // Have session, user, and founder - redirect to founder profile
        router.push(`/founder/${currentFounder.id}`);
        return;
      }
    }
    
    // If no wallet connected and no session, redirect to home
    if (!isConnected && !session) {
      router.push('/');
      return;
    }
    
    // If we have session but no user, something went wrong - redirect to home
    if (session && !user) {
      router.push('/');
      return;
    }
    
    // If we have session and user but no founder, redirect to create founder
    if (session && user && !currentFounder) {
      router.push('/create-founder');
      return;
    }
    
    // If we have everything, redirect to founder profile
    if (session && user && currentFounder) {
      router.push(`/founder/${currentFounder.id}`);
      return;
    }
  }, [session, user, currentFounder, router, isConnected, address, isLoading]);
  
  // Show loading state while waiting for session or redirecting
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-gray-600 dark:text-gray-300">Loading...</div>
    </div>
  );
}
