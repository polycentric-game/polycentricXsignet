'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { EmailPasswordForm } from '@/components/auth/EmailPasswordForm';
import { EthereumSignIn } from '@/components/auth/EthereumSignIn';
import { Button } from '@/components/ui/Button';

export default function SignInPage() {
  const router = useRouter();
  const { session } = useAppStore();
  const [authMethod, setAuthMethod] = useState<'email' | 'ethereum'>('email');
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  
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
          Choose your preferred sign-in method
        </p>
      </div>
      
      {/* Auth Method Toggle */}
      <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-1">
        <Button
          variant={authMethod === 'email' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setAuthMethod('email')}
          className="flex-1"
        >
          Email
        </Button>
        <Button
          variant={authMethod === 'ethereum' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setAuthMethod('ethereum')}
          className="flex-1"
        >
          Ethereum
        </Button>
      </div>
      
      {/* Auth Forms */}
      {authMethod === 'email' ? (
        <EmailPasswordForm
          mode={emailMode}
          onToggleMode={() => setEmailMode(emailMode === 'signin' ? 'signup' : 'signin')}
        />
      ) : (
        <EthereumSignIn />
      )}
    </div>
  );
}
