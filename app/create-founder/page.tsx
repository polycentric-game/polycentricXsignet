'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { founderStorage, generateId } from '@/lib/storage';
import { setCurrentFounder } from '@/lib/auth';
import { Founder } from '@/lib/types';
import { FounderForm } from '@/components/founder/FounderForm';

export default function CreateFounderPage() {
  const router = useRouter();
  const { session, user, setCurrentFounder: setStoreFounder, addFounder } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!session || !user) {
      router.push('/sign-in');
      return;
    }
    
    // Check if user already has a founder profile
    const existingFounder = founderStorage.findByUserId(user.id);
    if (existingFounder) {
      router.push('/game');
    }
  }, [session, user, router]);
  
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
      
      // Save founder
      addFounder(founder);
      
      // Set as current founder
      setCurrentFounder(founder.id);
      setStoreFounder(founder);
      
      // Redirect to game
      router.push('/game');
    } catch (error) {
      console.error('Failed to create founder:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!session || !user) {
    return null; // Will redirect
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <FounderForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
