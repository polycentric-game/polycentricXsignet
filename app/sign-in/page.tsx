'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { WalletSignIn } from '@/components/auth/EthereumSignIn';

export default function SignInPage() {
  const router = useRouter();
  const { session } = useAppStore();
  
  useEffect(() => {
    if (session) {
      router.push('/game');
    }
  }, [session, router]);
  
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
