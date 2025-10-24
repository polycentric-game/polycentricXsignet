'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { agreementStorage } from '@/lib/storage';
import { Agreement } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface AgreementPageProps {
  params: { id: string };
}

export default function AgreementPage({ params }: AgreementPageProps) {
  const router = useRouter();
  const { session, currentFounder, founders } = useAppStore();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!session) {
      router.push('/sign-in');
      return;
    }
    
    const foundAgreement = agreementStorage.findById(params.id);
    setAgreement(foundAgreement);
    setLoading(false);
  }, [params.id, session, router]);
  
  if (!session || !currentFounder) {
    return null; // Will redirect
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading agreement...</p>
        </div>
      </div>
    );
  }
  
  if (!agreement) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Agreement Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          The agreement you're looking for doesn't exist.
        </p>
        <Button onClick={() => router.push('/agreements')}>
          Back to Agreements
        </Button>
      </div>
    );
  }
  
  const founderA = founders.find(f => f.id === agreement.founderAId);
  const founderB = founders.find(f => f.id === agreement.founderBId);
  const currentVersion = agreement.versions[agreement.currentVersion];
  
  const isInvolved = agreement.founderAId === currentFounder.id || agreement.founderBId === currentFounder.id;
  
  if (!isInvolved) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          You don't have permission to view this agreement.
        </p>
        <Button onClick={() => router.push('/agreements')}>
          Back to Agreements
        </Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-space-grotesk font-bold text-3xl text-gray-900 dark:text-gray-100">
            Agreement {agreement.id}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Version {agreement.currentVersion + 1} of {agreement.versions.length}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={agreement.status === 'approved' ? 'success' : 'secondary'}>
            {agreement.status}
          </Badge>
        </div>
      </div>
      
      {/* Agreement Details */}
      <Card>
        <div className="space-y-6">
          <h2 className="font-semibold text-xl text-gray-900 dark:text-gray-100">
            Current Terms
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Company A */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                {founderA?.companyName}
              </h3>
              <div className="space-y-2">
                <div className="text-sm text-gray-500 dark:text-gray-400">Founder</div>
                <div className="text-gray-900 dark:text-gray-100">{founderA?.founderName}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-500 dark:text-gray-400">Equity Offered</div>
                <div className="text-2xl font-bold text-primary">
                  {currentVersion?.equityFromCompanyA}%
                </div>
              </div>
            </div>
            
            {/* Company B */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                {founderB?.companyName}
              </h3>
              <div className="space-y-2">
                <div className="text-sm text-gray-500 dark:text-gray-400">Founder</div>
                <div className="text-gray-900 dark:text-gray-100">{founderB?.founderName}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-500 dark:text-gray-400">Equity Offered</div>
                <div className="text-2xl font-bold text-primary">
                  {currentVersion?.equityFromCompanyB}%
                </div>
              </div>
            </div>
          </div>
          
          {/* Notes */}
          {currentVersion?.notes && (
            <div className="space-y-2">
              <div className="text-sm text-gray-500 dark:text-gray-400">Notes</div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-900 dark:text-gray-100">{currentVersion.notes}</p>
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {/* Agreement History */}
      <Card>
        <div className="space-y-4">
          <h2 className="font-semibold text-xl text-gray-900 dark:text-gray-100">
            Agreement History
          </h2>
          
          <div className="space-y-4">
            {agreement.versions.map((version, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  index === agreement.currentVersion
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Version {version.versionNumber + 1}
                    {index === agreement.currentVersion && (
                      <Badge variant="default" className="ml-2">Current</Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(version.proposedAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      {founderA?.companyName}: 
                    </span>
                    <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">
                      {version.equityFromCompanyA}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      {founderB?.companyName}: 
                    </span>
                    <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">
                      {version.equityFromCompanyB}%
                    </span>
                  </div>
                </div>
                
                {version.notes && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {version.notes}
                  </div>
                )}
                
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Proposed by: {founders.find(f => f.id === version.proposedBy)?.founderName || 'Unknown'} • 
                  Approved by: {version.approvedBy.length} of 2 founders
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
      
      {/* Actions */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="secondary"
            onClick={() => router.push('/agreements')}
          >
            Back to Agreements
          </Button>
          
          {agreement.status === 'approved' && (
            <Button onClick={() => alert('Export functionality will be implemented in the next phase!')}>
              Export Agreement
            </Button>
          )}
          
          {(agreement.status === 'proposed' || agreement.status === 'revised') && (
            <>
              <Button onClick={() => alert('Approval functionality will be implemented in the next phase!')}>
                Approve Current Version
              </Button>
              <Button 
                variant="secondary"
                onClick={() => alert('Revision functionality will be implemented in the next phase!')}
              >
                Propose Revision
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
