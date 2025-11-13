'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { signInWithWallet } from '@/lib/auth';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';

export function WalletSignIn() {
  const router = useRouter();
  const { setSession, session } = useAppStore();
  const { address, isConnected } = useAccount();
  
  useEffect(() => {
    const handleWalletConnection = async () => {
      // Only authenticate when wallet is connected and we don't have a session
      if (isConnected && address && !session) {
        try {
          const result = await signInWithWallet(address);
          
          if (result.success && result.user && result.session) {
            await setSession(result.session, result.user);
            
            // Small delay to ensure state is updated
            setTimeout(() => {
              const { currentFounder } = useAppStore.getState();
              if (currentFounder) {
                router.push('/game');
              } else {
                router.push('/create-founder');
              }
            }, 100);
          }
        } catch (error) {
          console.error('Failed to authenticate with wallet:', error);
        }
      }
    };
    
    handleWalletConnection();
  }, [isConnected, address, setSession, router, session]);
  
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
        
        <div className="flex justify-center">
          <ConnectButton />
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Connect your wallet to join the equity swap network
        </p>
      </div>
    </Card>
  );
}
