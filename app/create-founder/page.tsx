'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useAppStore } from '@/lib/store';
import { founderStorage, generateId } from '@/lib/storage';
import { Founder } from '@/lib/types';
import { FounderForm } from '@/components/founder/FounderForm';

export default function CreateFounderPage() {
  const router = useRouter();
  const { isConnected, address, isConnecting } = useAccount();
  const { session, user, currentFounder, setCurrentFounder: setStoreFounder, addFounder, isLoading: appIsLoading, refreshData } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [hasWaitedForSession, setHasWaitedForSession] = useState(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clear any pending redirects
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }

    // Wait for app to finish initializing
    if (appIsLoading) {
      return;
    }

    // If user already has a founder, redirect to their profile
    if (currentFounder) {
      router.push(`/founder/${currentFounder.id}`);
      return;
    }

    // If wallet is connected, we should have a session - wait a bit if needed
    if (isConnected && address) {
      if (!session || !user) {
        // Wait for Header to create session - but don't redirect if we're still waiting
        if (!hasWaitedForSession) {
          setHasWaitedForSession(true);
          redirectTimeoutRef.current = setTimeout(() => {
            const { session: currentSession, user: currentUser } = useAppStore.getState();
            if (!currentSession || !currentUser) {
              // Still no session after waiting, something went wrong - redirect to home
              router.push('/');
            }
          }, 2000); // Give Header more time to create session
        }
        return;
      }
      // All good - session and user exist, but no founder (which is why we're here)
      return;
    }

    // If wallet is connecting, wait - don't redirect yet
    if (isConnecting) {
      return;
    }

    // If we have a session, we're good (even if wallet isn't connected yet)
    if (session && user) {
      // All good - session and user exist, but no founder (which is why we're here)
      return;
    }

    // Only redirect if wallet is NOT connected, NOT connecting, and we have NO session
    // This means the user truly isn't authenticated
    if (!isConnected && !isConnecting && !session) {
      // Wait a bit to make sure wagmi has fully initialized
      redirectTimeoutRef.current = setTimeout(() => {
        const { session: finalSession } = useAppStore.getState();
        
        // Only redirect if we're absolutely sure there's no session
        if (!finalSession && !isConnected && !isConnecting) {
          router.push('/');
        }
      }, 1000);
      return;
    }

    // If we have session but no user, something went wrong - redirect to home
    if (session && !user) {
      router.push('/');
      return;
    }

    // Cleanup function
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, [session, user, currentFounder, router, isConnected, isConnecting, address, appIsLoading, hasWaitedForSession]);
  
  const handleSubmit = async (founderData: Omit<Founder, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const founder: Founder = {
        ...founderData,
        id: generateId('founder_'),
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Save founder to database
      await addFounder(founder);
      
      // Update store with current founder (this also updates the session)
      await setStoreFounder(founder);
      
      // Refresh data to ensure everything is in sync
      await refreshData();
      
      // Redirect to game
      router.push('/game');
    } catch (error) {
      console.error('Failed to create founder:', error);
      alert('Failed to create founder profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Show loading state while waiting for app initialization or if wallet is connecting
  if (appIsLoading || isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  // If wallet is connected but no session yet, show loading (Header is creating session)
  if (isConnected && address && (!session || !user)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-300">Setting up your session...</div>
      </div>
    );
  }

  // If we have a session and user, show the form (even if wallet connection state is unclear)
  if (session && user) {
    return (
      <div className="max-w-6xl mx-auto">
        <FounderForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    );
  }

  // If wallet is not connected and no session, show a message to connect wallet
  if (!isConnected && !session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="text-gray-600 dark:text-gray-300">
            Please connect your wallet to create a founder profile.
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Use the Connect Wallet button in the header.
          </div>
        </div>
      </div>
    );
  }

  // Fallback loading state
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-gray-600 dark:text-gray-300">Loading...</div>
    </div>
  );
}
