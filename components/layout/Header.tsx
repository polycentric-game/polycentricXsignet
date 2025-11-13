'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppStore } from '@/lib/store';
import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from './ThemeToggle';
import { MainNav } from './MainNav';

export function Header() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { session, clearSession } = useAppStore();

  const handleSignOut = async () => {
    signOut();
    clearSession();
    await disconnect();
    // Clear all RainbowKit and Wagmi persisted connection state
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
    router.push('/sign-in');
  };

  const formatAddress = (addr: string) => {
    return addr.slice(0, 6);
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
          {session && isConnected && address && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-sm"
            >
              Sign Out ({formatAddress(address)})
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
