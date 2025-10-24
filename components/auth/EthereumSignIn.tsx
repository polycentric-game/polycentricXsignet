'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEthereum } from '@/lib/auth';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function EthereumSignIn() {
  const router = useRouter();
  const { setSession } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleEthereumSignIn = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await signInWithEthereum();
      
      if (result.success && result.user && result.session) {
        setSession(result.session, result.user);
        router.push('/create-founder');
      } else {
        setError(result.error || 'Ethereum authentication failed');
      }
    } catch (error) {
      setError('Failed to connect to Ethereum wallet');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="font-space-grotesk font-bold text-2xl text-gray-900 dark:text-gray-100">
            Connect Wallet
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Sign in with your Ethereum wallet
          </p>
        </div>
        
        {error && (
          <div className="p-3 rounded-md bg-danger/10 border border-danger/20">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <Button
            onClick={handleEthereumSignIn}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Connecting...' : 'Connect Ethereum Wallet'}
          </Button>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            This is a demo. A mock Ethereum address will be generated for you.
          </p>
        </div>
      </div>
    </Card>
  );
}
