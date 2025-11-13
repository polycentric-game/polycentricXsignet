'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useSignMessage } from 'wagmi';
import { useAppStore } from '@/lib/store';
import { agreementStorage } from '@/lib/storage';
import { approveAgreement, canApproveAgreement, canReviseAgreement, completeAgreement, generateApprovalMessage } from '@/lib/agreements';
import { exportAgreement } from '@/lib/export';
import { toast } from '@/lib/toastStore';
import { Agreement } from '@/lib/types';
import { getAgreementDisplayNumber } from '@/lib/utils';
import { AgreementForm } from '@/components/agreement/AgreementForm';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { LoadingState } from '@/components/ui/LoadingSpinner';

interface AgreementPageProps {
  params: { id: string };
}

export default function AgreementPage({ params }: AgreementPageProps) {
  const router = useRouter();
  const { address } = useAccount();
  const { signMessage, data: signatureData, isPending: isSigning, error: signError } = useSignMessage();
  const { session, currentFounder, founders, agreements, updateAgreement, refreshData } = useAppStore();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pendingApprovalMessage, setPendingApprovalMessage] = useState<string | null>(null);
  
  useEffect(() => {
    if (!session) {
      router.push('/');
      return;
    }
    
    const loadAgreement = async () => {
      const foundAgreement = await agreementStorage.findById(params.id);
      setAgreement(foundAgreement);
      setLoading(false);
    };
    
    loadAgreement();
  }, [params.id, session, router]);
  
  // Refresh agreement data when store updates
  useEffect(() => {
    const loadAgreement = async () => {
      const foundAgreement = await agreementStorage.findById(params.id);
      setAgreement(foundAgreement);
    };
    
    loadAgreement();
  }, [params.id, updateAgreement]);

  // Handle signature completion
  useEffect(() => {
    if (signatureData && pendingApprovalMessage && agreement && currentFounder) {
      const processApproval = async () => {
        try {
          const result = await approveAgreement(agreement.id, currentFounder.id, signatureData);
          if (result.success && result.agreement) {
            updateAgreement(result.agreement);
            refreshData(); // Refresh to update equity counts
            setAgreement(result.agreement);
            
            if (result.agreement.status === 'approved') {
              toast.success('Agreement Approved!', 'Both founders have signed and approved this agreement. It can now be marked as completed.');
            } else {
              toast.success('Approval Recorded', 'Your signature and approval have been recorded. Waiting for the other founder to sign and approve.');
            }
          } else {
            toast.error('Approval Failed', result.error || 'Failed to approve agreement');
          }
        } catch (error: any) {
          console.error('Approval error:', error);
          toast.error('Error', error?.message || 'An unexpected error occurred while approving the agreement');
        } finally {
          setActionLoading(null);
          setPendingApprovalMessage(null);
        }
      };
      
      processApproval();
    }
  }, [signatureData, pendingApprovalMessage, agreement, currentFounder, updateAgreement, refreshData]);

  // Handle signature rejection/error
  useEffect(() => {
    if (signError) {
      const errorMessage = signError.message || '';
      const errorName = signError.name || '';
      if (errorMessage.includes('reject') || errorMessage.includes('denied') || errorMessage.includes('User rejected') || errorName.includes('UserRejected')) {
        toast.error('Signature Rejected', 'You must sign the message to approve the agreement');
      } else {
        toast.error('Signature Failed', errorMessage || 'Failed to sign message');
      }
      setActionLoading(null);
      setPendingApprovalMessage(null);
    }
  }, [signError]);
  
  // Early returns after all hooks
  if (!session || !currentFounder) {
    return null; // Will redirect
  }
  
  if (loading) {
    return <LoadingState message="Loading agreement..." />;
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

  const handleApprove = async () => {
    if (!agreement || !currentFounder || !address) {
      toast.error('Error', 'Missing required information');
      return;
    }

    setActionLoading('approve');
    
    try {
      const currentVersion = agreement.versions[agreement.currentVersion];
      if (!currentVersion) {
        toast.error('Error', 'Invalid agreement version');
        setActionLoading(null);
        return;
      }

      // Determine which equity amount this founder is offering
      const equityFromThisFounder = agreement.founderAId === currentFounder.id 
        ? currentVersion.equityFromCompanyA 
        : currentVersion.equityFromCompanyB;
      const equityFromOther = agreement.founderAId === currentFounder.id 
        ? currentVersion.equityFromCompanyB 
        : currentVersion.equityFromCompanyA;

      // Generate message to sign (use display number for better UX)
      const agreementDisplayNumber = getAgreementDisplayNumber(agreement, agreements);
      const message = generateApprovalMessage(
        agreementDisplayNumber,
        agreement.currentVersion,
        equityFromThisFounder,
        equityFromOther,
        currentFounder.founderName
      );

      // Store message for when signature completes
      setPendingApprovalMessage(message);

      // Prompt user to sign message
      signMessage({ message });
    } catch (error: any) {
      console.error('Approval error:', error);
      toast.error('Error', error?.message || 'An unexpected error occurred while approving the agreement');
      setActionLoading(null);
      setPendingApprovalMessage(null);
    }
  };
  
  const handleComplete = async () => {
    setActionLoading('complete');
    try {
      const result = await completeAgreement(agreement.id, currentFounder.id);
      if (result.success && result.agreement) {
        updateAgreement(result.agreement);
        setAgreement(result.agreement);
        toast.success('Agreement Completed!', 'This agreement has been marked as completed and is ready for implementation.');
      } else {
        toast.error('Completion Failed', result.error || 'Failed to complete agreement');
      }
    } catch (error) {
      toast.error('Error', 'An unexpected error occurred while completing the agreement');
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleExport = async () => {
    setActionLoading('export');
    try {
      const result = await exportAgreement(agreement);
      if (result.success) {
        toast.success('Export Successful!', 'Agreement has been exported as JSON. Check your downloads folder.');
      } else {
        toast.error('Export Failed', result.error || 'Failed to export agreement');
      }
    } catch (error) {
      toast.error('Error', 'An unexpected error occurred while exporting the agreement');
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleRevisionSubmitted = (updatedAgreement: Agreement) => {
    setShowRevisionModal(false);
    updateAgreement(updatedAgreement);
    setAgreement(updatedAgreement);
  };
  
  const canApprove = canApproveAgreement(agreement, currentFounder.id);
  const canRevise = canReviseAgreement(agreement, currentFounder.id);
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-space-grotesk font-bold text-3xl text-gray-900 dark:text-gray-100">
            Agreement {getAgreementDisplayNumber(agreement, agreements)}
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
                  {version.signatures && (
                    <span> • Signed by: {Object.keys(version.signatures).length} of 2 founders</span>
                  )}
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
          
          {agreement.status === 'completed' && isInvolved && (
            <Button 
              onClick={handleExport}
              loading={actionLoading === 'export'}
            >
              Export for signet
            </Button>
          )}
          
          {agreement.status === 'approved' && isInvolved && (
            <Button 
              variant="secondary"
              onClick={handleComplete}
              loading={actionLoading === 'complete'}
            >
              Mark as Completed
            </Button>
          )}
          
          {canApprove && isInvolved && (
            <Button
              onClick={handleApprove}
              loading={actionLoading === 'approve' || isSigning}
              disabled={isSigning}
            >
              {isSigning ? 'Signing Message...' : 'Approve Current Version'}
            </Button>
          )}
          
          {canRevise && isInvolved && (
            <Button 
              variant="secondary"
              onClick={() => setShowRevisionModal(true)}
            >
              Propose Revision
            </Button>
          )}
          
          {!isInvolved && (
            <div className="text-sm text-gray-500 dark:text-gray-400 italic">
              You can view this agreement but cannot take actions as you are not involved in it.
            </div>
          )}
        </div>
      </Card>
      
      {/* Revision Modal */}
      <Modal
        isOpen={showRevisionModal}
        onClose={() => setShowRevisionModal(false)}
        title="Propose Revision"
        size="lg"
      >
        <AgreementForm
          agreement={agreement}
          onSubmit={handleRevisionSubmitted}
          onCancel={() => setShowRevisionModal(false)}
        />
      </Modal>
    </div>
  );
}
