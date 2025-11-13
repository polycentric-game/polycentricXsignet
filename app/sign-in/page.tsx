'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { WalletSignIn } from '@/components/auth/EthereumSignIn';

export default function SignInPage() {
  const router = useRouter();
  const { session, currentFounder, isLoading } = useAppStore();
  
  useEffect(() => {
    // Only redirect if we have a session and we're not loading
    if (session && !isLoading) {
      if (currentFounder) {
        router.push('/game');
      } else {
        router.push('/create-founder');
      }
    }
  }, [session, currentFounder, isLoading, router]);
  
  // Show loading state while initializing
  if (isLoading) {
    return (
      <div className="max-w-md mx-auto space-y-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Don't show sign-in form if already authenticated
  if (session) {
    return null; // Will redirect
  }
  
  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="text-center">
        <h1 className="font-space-grotesk font-bold text-3xl text-gray-900 dark:text-gray-100">
          Join Polycentric
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Connect your wallet to get started
        </p>
      </div>
      
      <WalletSignIn />
    </div>
  );
}
