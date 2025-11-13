'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { founderStorage } from '@/lib/storage';
import { Founder } from '@/lib/types';
import { getAgreementDisplayNumber } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { FounderGraph } from '@/components/graph/FounderGraph';

interface FounderPageProps {
  params: { id: string };
}

export default function FounderPage({ params }: FounderPageProps) {
  const router = useRouter();
  const { session, currentFounder, agreements, founders } = useAppStore();
  const [founder, setFounder] = useState<Founder | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!session) {
      router.push('/');
      return;
    }
    
    const loadFounder = async () => {
      const foundFounder = await founderStorage.findById(params.id);
      setFounder(foundFounder);
      setLoading(false);
    };
    
    loadFounder();
  }, [params.id, session, router]);
  
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
        <Button onClick={() => router.push('/game')}>
          Back to Network
        </Button>
      </div>
    );
  }
  
  const isOwnProfile = currentFounder?.id === founder.id;
  const equityRemaining = founder.totalEquityAvailable - founder.equitySwapped;
  const founderAgreements = agreements.filter(
    a => a.founderAId === founder.id || a.founderBId === founder.id
  );
  
  const handleCreateAgreement = () => {
    router.push(`/game?createWith=${founder.id}`);
  };
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-space-grotesk font-bold text-3xl text-gray-900 dark:text-gray-100">
            {founder.founderName}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {founder.founderType} at {founder.companyName}
          </p>
        </div>
        <div className="flex gap-2">
          {!isOwnProfile && (
            <Button onClick={handleCreateAgreement}>
              Propose Equity Swap
            </Button>
          )}
          {isOwnProfile && (
            <Button 
              variant="secondary" 
              onClick={() => router.push('/profile')}
            >
              Edit Profile
            </Button>
          )}
        </div>
      </div>
      
      {/* Company Overview */}
      <Card>
        <div className="space-y-6">
          <div>
            <h2 className="font-semibold text-xl text-gray-900 dark:text-gray-100 mb-4">
              Company Overview
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Company
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">{founder.companyName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Stage
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">{founder.stage}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Business Model
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">{founder.businessModel}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Valuation Range
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">{founder.currentValuationRange}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Revenue Status
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">{founder.revenueStatus}</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Description
              </label>
              <p className="text-gray-900 dark:text-gray-100 mt-1">{founder.companyDescription}</p>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Values & Assets */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-4">
            Founder Values
          </h3>
          <div className="flex flex-wrap gap-2">
            {founder.founderValues.map((value, index) => (
              <Badge key={index} variant="secondary">
                {value}
              </Badge>
            ))}
          </div>
        </Card>
        
        <Card>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-4">
            Key Assets
          </h3>
          <div className="space-y-2">
            {founder.keyAssets.map((asset, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-gray-900 dark:text-gray-100">{asset}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      
      {/* Motivation & Needs */}
      <Card>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
              Swap Motivation
            </h3>
            <p className="text-gray-900 dark:text-gray-100">{founder.swapMotivation}</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-4">
              Gaps & Needs
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {founder.gapsOrNeeds.map((need, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-900 dark:text-gray-100">{need}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Equity Information */}
      <Card>
        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-4">
          Equity Information
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {founder.totalEquityAvailable}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Total Available</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-danger">
              {founder.equitySwapped}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Already Swapped</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {equityRemaining}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Remaining</div>
          </div>
        </div>
      </Card>
      
      {/* Network Graph */}
      <Card>
        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-4">
          Network Connections
        </h3>
        <div className="h-80">
          <FounderGraph
            founder={founder}
            founders={founders}
            agreements={agreements}
          />
        </div>
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Click on connected founders to view their profiles, or click on edges to view agreements.
        </div>
      </Card>

      {/* Agreements */}
      {founderAgreements.length > 0 && (
        <Card>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-4">
            Agreements ({founderAgreements.length})
          </h3>
          <div className="space-y-3">
            {founderAgreements.map((agreement) => (
              <div
                key={agreement.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => router.push(`/agreement/${agreement.id}`)}
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Agreement {getAgreementDisplayNumber(agreement, agreements)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Status: {agreement.status}
                  </div>
                </div>
                <Badge variant={agreement.status === 'approved' ? 'default' : 'secondary'}>
                  {agreement.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
