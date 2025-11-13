'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { getStatusColor } from '@/lib/agreements';
import { getAgreementDisplayNumber } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus } from 'lucide-react';

export default function AgreementsPage() {
  const router = useRouter();
  const { session, currentFounder, agreements, founders } = useAppStore();
  
  useEffect(() => {
    if (!session) {
      router.push('/');
      return;
    }
    
    if (!currentFounder) {
      router.push('/create-founder');
      return;
    }
  }, [session, currentFounder, router]);
  
  if (!session || !currentFounder) {
    return null; // Will redirect
  }
  
  // Filter agreements involving current founder
  const myAgreements = agreements.filter(
    agreement => agreement.founderAId === currentFounder.id || agreement.founderBId === currentFounder.id
  );
  
  const getOtherFounder = (agreement: any) => {
    const otherFounderId = agreement.founderAId === currentFounder.id 
      ? agreement.founderBId 
      : agreement.founderAId;
    return founders.find(f => f.id === otherFounderId);
  };
  
  const handleCreateAgreement = () => {
    router.push('/game'); // Redirect to game page where they can create agreements
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-space-grotesk font-bold text-3xl text-gray-900 dark:text-gray-100">
            My Agreements
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your equity swap agreements
          </p>
        </div>
        <Button onClick={handleCreateAgreement} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Create Agreement</span>
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {myAgreements.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Total Agreements</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {myAgreements.filter(a => a.status === 'proposed' || a.status === 'revised').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Pending</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-primary">
            {myAgreements.filter(a => a.status === 'approved').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Approved</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {myAgreements.filter(a => a.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Completed</div>
        </Card>
      </div>
      
      {/* Agreements List */}
      {myAgreements.length === 0 ? (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No agreements yet
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Start by creating your first equity swap agreement
          </p>
          <Button onClick={handleCreateAgreement}>
            Create Your First Agreement
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {myAgreements.map((agreement) => {
            const otherFounder = getOtherFounder(agreement);
            const currentVersion = agreement.versions[agreement.currentVersion];
            
            return (
              <Card
                key={agreement.id}
                clickable
                onClick={() => router.push(`/agreement/${agreement.id}`)}
                className="p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                        Agreement {getAgreementDisplayNumber(agreement, agreements)}
                      </h3>
                      <Badge variant={agreement.status === 'approved' ? 'success' : 'secondary'}>
                        {agreement.status}
                      </Badge>
                    </div>
                    <div className="text-gray-600 dark:text-gray-300">
                      With {otherFounder?.companyName || 'Unknown Company'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      You offer: {agreement.founderAId === currentFounder.id ? currentVersion?.equityFromCompanyA : currentVersion?.equityFromCompanyB}% • 
                      You receive: {agreement.founderAId === currentFounder.id ? currentVersion?.equityFromCompanyB : currentVersion?.equityFromCompanyA}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Last updated
                    </div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(agreement.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
