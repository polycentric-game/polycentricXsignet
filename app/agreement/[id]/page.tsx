'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useSignTypedData } from 'wagmi';
import { useAppStore } from '@/lib/store';
import { agreementStorage } from '@/lib/storage';
import { canApproveAgreement, canReviseAgreement, completeAgreement } from '@/lib/agreements';
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
  const { signTypedData, data: signatureData, isPending: isSigning, error: signError } = useSignTypedData();
  const { session, currentFounder, founders, agreements, updateAgreement, refreshData } = useAppStore();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pendingApprovalMessage, setPendingApprovalMessage] = useState<string | null>(null);
  const [vcJwt, setVcJwt] = useState<string | null>(null);
  const [vcPayload, setVcPayload] = useState<any | null>(null);
  const [loadingVc, setLoadingVc] = useState(false);
  
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
    if (signatureData && pendingApprovalMessage && agreement && currentFounder && address) {
      const processApproval = async () => {
        try {
          // Send signature to backend
          const response = await fetch(`/api/agreements/${agreement.id}/sign`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Wallet-Address': address.toLowerCase(),
            },
            body: JSON.stringify({
              signature: signatureData,
            }),
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to sign agreement');
          }
          
          // Reload agreement to get updated state
          const updatedAgreement = await agreementStorage.findById(agreement.id);
          if (updatedAgreement) {
            updateAgreement(updatedAgreement);
            refreshData(); // Refresh to update equity counts
            setAgreement(updatedAgreement);
            
            if (data.isFinalized) {
              toast.success('Agreement Finalized!', 'Both founders have signed. A Verifiable Credential has been issued.');
            } else {
              toast.success('Signature Recorded', 'Your signature has been recorded. Waiting for the other founder to sign.');
            }
          }
        } catch (error: any) {
          console.error('Approval error:', error);
          toast.error('Error', error?.message || 'An unexpected error occurred while signing the agreement');
        } finally {
          setActionLoading(null);
          setPendingApprovalMessage(null);
        }
      };
      
      processApproval();
    }
  }, [signatureData, pendingApprovalMessage, agreement, currentFounder, address, updateAgreement, refreshData]);

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
      // Fetch EIP-712 data from backend
      // Pass wallet address in header for authentication
      const response = await fetch(`/api/agreements/${agreement.id}/eip712`, {
        headers: {
          'X-Wallet-Address': address.toLowerCase(),
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to fetch signing data (${response.status})`);
      }
      
      const eip712Data = await response.json();
      
      // Store agreement ID for when signature completes
      setPendingApprovalMessage(agreement.id);

      // Convert string values back to BigInt for signing
      const message = {
        ...eip712Data.message,
        equityAtoB: BigInt(eip712Data.message.equityAtoB),
        equityBtoA: BigInt(eip712Data.message.equityBtoA),
      };

      // Prompt user to sign typed data
      signTypedData({
        domain: eip712Data.domain,
        types: eip712Data.types,
        primaryType: eip712Data.primaryType,
        message,
      });
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
  
  const handleFetchCredential = async () => {
    if (!agreement || !address) return;
    
    setLoadingVc(true);
    try {
      const response = await fetch(`/api/agreements/${agreement.id}/credential`, {
        headers: {
          'X-Wallet-Address': address.toLowerCase(),
        },
      });
      if (!response.ok) {
        const data = await response.json();
        const errorMsg = data.error || 'Failed to fetch credential';
        const details = data.details ? `\n\nDetails: ${data.details}` : '';
        throw new Error(errorMsg + details);
      }
      
      const data = await response.json();
      setVcJwt(data.vcJwt);
      setVcPayload(data.payload);
      
      // Automatically copy JWT to clipboard
      if (data.vcJwt) {
        try {
          await navigator.clipboard.writeText(data.vcJwt);
          toast.success('Credential Copied!', 'Verifiable Credential has been copied to your clipboard.');
        } catch (clipboardError) {
          // If clipboard copy fails, still show success but mention manual copy
          toast.success('Credential Retrieved', 'Verifiable Credential has been loaded. Click "Copy" to copy it to clipboard.');
        }
      }
    } catch (error: any) {
      toast.error('Error', error?.message || 'Failed to fetch credential');
    } finally {
      setLoadingVc(false);
    }
  };
  
  const handleCopyJwt = () => {
    if (vcJwt) {
      navigator.clipboard.writeText(vcJwt);
      toast.success('Copied!', 'JWT has been copied to clipboard');
    }
  };
  
  const handleDownloadCredential = () => {
    if (!vcJwt || !vcPayload) return;
    
    const credentialData = {
      jwt: vcJwt,
      payload: vcPayload,
      agreementId: agreement.id,
      downloadedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(credentialData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verifiable-credential-${agreement.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Downloaded!', 'Verifiable Credential has been saved to your downloads folder.');
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
                  {typeof currentVersion?.equityFromCompanyA === 'number' ? currentVersion.equityFromCompanyA.toFixed(3) : currentVersion?.equityFromCompanyA}%
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
                  {typeof currentVersion?.equityFromCompanyB === 'number' ? currentVersion.equityFromCompanyB.toFixed(3) : currentVersion?.equityFromCompanyB}%
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
                      {typeof version.equityFromCompanyA === 'number' ? version.equityFromCompanyA.toFixed(3) : version.equityFromCompanyA}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      {founderB?.companyName}: 
                    </span>
                    <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">
                      {typeof version.equityFromCompanyB === 'number' ? version.equityFromCompanyB.toFixed(3) : version.equityFromCompanyB}%
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
          
          {(agreement.finalizedAt || agreement.status === 'completed') && isInvolved && (
            <>
              <Button 
                onClick={handleFetchCredential}
                loading={loadingVc}
                variant="secondary"
              >
                {vcJwt ? 'Refresh Credential' : 'Get Verifiable Credential'}
              </Button>
              {agreement.status === 'completed' && (
                <Button 
                  onClick={handleExport}
                  loading={actionLoading === 'export'}
                >
                  Export for signet
                </Button>
              )}
            </>
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
      
      {/* Verifiable Credential Display */}
      {vcJwt && (
        <Card>
          <div className="space-y-4">
            <h2 className="font-semibold text-xl text-gray-900 dark:text-gray-100">
              Verifiable Credential
            </h2>
            
            {vcPayload && (
              <div className="space-y-2">
                <div className="text-sm text-gray-500 dark:text-gray-400">Issuer</div>
                <div className="text-gray-900 dark:text-gray-100 font-mono text-xs break-all">
                  {vcPayload.iss}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">JWT</div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyJwt}
                  >
                    Copy
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDownloadCredential}
                  >
                    Download
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-900 dark:text-gray-100 font-mono text-xs break-all">
                  {vcJwt}
                </p>
              </div>
            </div>
            
            {vcPayload?.vc?.credentialSubject && (
              <div className="space-y-2">
                <div className="text-sm text-gray-500 dark:text-gray-400">Credential Subject</div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <pre className="text-xs text-gray-900 dark:text-gray-100 overflow-auto">
                    {JSON.stringify(vcPayload.vc.credentialSubject, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
      
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
