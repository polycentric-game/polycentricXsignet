'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { founderStorage } from '@/lib/storage';
import { Founder } from '@/lib/types';
import { FounderForm } from '@/components/founder/FounderForm';
import { LoadingState } from '@/components/ui/LoadingSpinner';

interface EditFounderPageProps {
  params: { id: string };
}

export default function EditFounderPage({ params }: EditFounderPageProps) {
  const router = useRouter();
  const { session, user, currentFounder, updateFounder, setCurrentFounder, refreshData } = useAppStore();
  const [founder, setFounder] = useState<Founder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (!session) {
      router.push('/');
      return;
    }
    
    const loadFounder = async () => {
      try {
        const foundFounder = await founderStorage.findById(params.id);
        if (!foundFounder) {
          router.push('/game');
          return;
        }
        
        // Verify this is the current user's founder by checking userId
        // Also check currentFounder as an additional safeguard
        if (!user || (foundFounder.userId !== user.id) || (currentFounder?.id !== foundFounder.id)) {
          router.push(`/founder/${params.id}`);
          return;
        }
        
        setFounder(foundFounder);
      } catch (error) {
        console.error('Failed to load founder:', error);
        router.push(`/founder/${params.id}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadFounder();
  }, [params.id, session, user, router, currentFounder]);
  
  const handleSubmit = async (founderData: Omit<Founder, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!founder) return;
    
    setIsSaving(true);
    
    try {
      const updatedFounder: Founder = {
        ...founderData,
        id: founder.id,
        userId: founder.userId,
        createdAt: founder.createdAt,
        updatedAt: new Date().toISOString(),
        // Preserve equitySwapped from the original founder (it's calculated from agreements, not user input)
        // The form field is disabled, so founderData.equitySwapped should match, but we use the DB value as source of truth
        equitySwapped: founder.equitySwapped,
      };
      
      // Update founder in database
      await updateFounder(updatedFounder);
      
      // Update store with current founder (this also updates the session)
      await setCurrentFounder(updatedFounder);
      
      // Refresh data to ensure everything is in sync
      await refreshData();
      
      // Redirect back to founder profile
      router.push(`/founder/${founder.id}`);
    } catch (error) {
      console.error('Failed to update founder:', error);
      alert('Failed to update founder profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    router.push(`/founder/${params.id}`);
  };
  
  if (!session) {
    return null; // Will redirect
  }
  
  if (loading) {
    return <LoadingState message="Loading founder profile..." />;
  }
  
  if (!founder) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Founder Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          The founder profile you're looking for doesn't exist.
        </p>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <FounderForm
        founder={founder}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isSaving}
      />
    </div>
  );
}

