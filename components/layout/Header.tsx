'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAppStore } from '@/lib/store';
import { signInWithWallet, signOut } from '@/lib/auth';
import { ThemeToggle } from './ThemeToggle';
import { MainNav } from './MainNav';

export function Header() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { session, setSession, clearSession, currentFounder } = useAppStore();

  // Handle wallet connection/disconnection
  useEffect(() => {
    const handleWalletConnection = async () => {
      if (isConnected && address && !session) {
        try {
          const result = await signInWithWallet(address);
          
          if (result.success && result.user && result.session) {
            await setSession(result.session, result.user);
            
            // Redirect based on founder status
            setTimeout(() => {
              const { currentFounder } = useAppStore.getState();
              if (currentFounder) {
                router.push('/game');
              } else {
                router.push('/create-founder');
              }
            }, 200);
          }
        } catch (error) {
          console.error('Failed to authenticate with wallet:', error);
        }
      } else if (!isConnected && session) {
        // Wallet disconnected, clear session
        await signOut();
        clearSession();
        router.push('/');
      }
    };
    
    handleWalletConnection();
  }, [isConnected, address, session, setSession, clearSession, router]);

  const handleDisconnect = async () => {
    // Clear app session first
    await signOut();
    clearSession();
    
    // Disconnect wallet
    disconnect();
    
    // Clear all wallet connection state
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wagmi.store');
      localStorage.removeItem('wagmi.cache');
      localStorage.removeItem('wagmi.wallet');
      localStorage.removeItem('wagmi.connected');
      localStorage.removeItem('rainbowkit.recent');
      localStorage.removeItem('rainbowkit.wallet');
      
      // Clear all localStorage keys that start with 'wagmi' or 'rainbowkit'
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('wagmi') || key.startsWith('rainbowkit')) {
          localStorage.removeItem(key);
        }
      });
    }
    
    // Redirect to home
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-gray-700 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link 
          href="/" 
          className="flex items-center space-x-2"
        >
          <div className="h-8 w-8 rounded-full bg-primary" />
          <span className="font-space-grotesk font-bold text-xl text-gray-900 dark:text-gray-100">
            Polycentric
          </span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <MainNav />
          <div className="flex items-center space-x-2">
            <ConnectButton />
            {session && (
              <button
                onClick={handleDisconnect}
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                Sign Out
              </button>
            )}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
