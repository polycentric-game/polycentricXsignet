'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useAppStore } from '@/lib/store';
import { createAgreement, proposeRevision, generateCreateAgreementMessage, generateRevisionMessage } from '@/lib/agreements';
import { validateAgreementEquity } from '@/lib/validation';
import { getAgreementDisplayNumber } from '@/lib/utils';
import { toast } from '@/lib/toastStore';
import { Agreement, Founder } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';

interface AgreementFormProps {
  agreement?: Agreement;
  onSubmit: (agreement: Agreement) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AgreementForm({ agreement, onSubmit, onCancel, isLoading = false }: AgreementFormProps) {
  const { address } = useAccount();
  const { signMessage, data: signatureData, isPending: isSigning, error: signError } = useSignMessage();
  const { currentFounder, founders, agreements, updateAgreement, addAgreement } = useAppStore();
  
  // Get other founders (exclude current founder)
  const otherFounders = founders.filter(f => f.id !== currentFounder?.id);
  
  // Initialize form data
  const [formData, setFormData] = useState({
    founderBId: agreement ? (agreement.founderAId === currentFounder?.id ? agreement.founderBId : agreement.founderAId) : '',
    equityFromA: agreement ? agreement.versions[agreement.currentVersion].equityFromCompanyA : 0.1,
    equityFromB: agreement ? agreement.versions[agreement.currentVersion].equityFromCompanyB : 0.1,
    notes: agreement ? agreement.versions[agreement.currentVersion].notes : '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<{
    type: 'create' | 'revision';
    data: any;
  } | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  
  // Handle signature completion
  useEffect(() => {
    if (signatureData && pendingSubmission && pendingMessage && currentFounder) {
      const processSubmission = async () => {
        try {
          let result;
          
          if (pendingSubmission.type === 'create') {
            result = await createAgreement(
              pendingSubmission.data.founderAId,
              pendingSubmission.data.founderBId,
              pendingSubmission.data.equityFromA,
              pendingSubmission.data.equityFromB,
              pendingSubmission.data.notes,
              pendingSubmission.data.initiatedBy,
              signatureData
            );
          } else {
            result = await proposeRevision(
              pendingSubmission.data.agreementId,
              pendingSubmission.data.equityFromA,
              pendingSubmission.data.equityFromB,
              pendingSubmission.data.notes,
              pendingSubmission.data.proposedBy,
              signatureData
            );
          }
          
          if (result.success && result.agreement) {
            if (pendingSubmission.type === 'revision') {
              updateAgreement(result.agreement);
              toast.success('Revision Proposed!', 'Your revision has been proposed. The other founder can now review and approve it.');
            } else {
              addAgreement(result.agreement);
              toast.success('Agreement Created!', 'Your equity swap proposal has been sent to the other founder.');
            }
            onSubmit(result.agreement);
          } else {
            setErrors({ general: result.error || 'Failed to save agreement' });
          }
        } catch (error: any) {
          console.error('Submission error:', error);
          setErrors({ general: error?.message || 'An unexpected error occurred' });
        } finally {
          setSubmitting(false);
          setPendingSubmission(null);
          setPendingMessage(null);
        }
      };
      
      processSubmission();
    }
  }, [signatureData, pendingSubmission, pendingMessage, currentFounder, updateAgreement, addAgreement, onSubmit]);

  // Handle signature rejection/error
  useEffect(() => {
    if (signError) {
      const errorMessage = signError.message || '';
      const errorName = signError.name || '';
      if (errorMessage.includes('reject') || errorMessage.includes('denied') || errorMessage.includes('User rejected') || errorName.includes('UserRejected')) {
        toast.error('Signature Rejected', 'You must sign the message to ' + (agreement ? 'propose this revision' : 'create this agreement'));
      } else {
        toast.error('Signature Failed', errorMessage || 'Failed to sign message');
      }
      setSubmitting(false);
      setPendingSubmission(null);
      setPendingMessage(null);
    }
  }, [signError, agreement]);

  if (!currentFounder) {
    return null;
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      toast.error('Error', 'Wallet address not found');
      return;
    }
    
    setSubmitting(true);
    setErrors({});
    
    try {
      // Validate form
      if (!formData.founderBId) {
        setErrors({ founderBId: 'Please select a founder to propose agreement with' });
        setSubmitting(false);
        return;
      }
      
      // Validate notes are provided
      if (!formData.notes || !formData.notes.trim()) {
        setErrors({ notes: 'Agreement notes are required. Please explain the strategic rationale, key terms, risks, and benefits.' });
        setSubmitting(false);
        return;
      }
      
      // Validate equity amounts
      const validationErrors = await validateAgreementEquity(
        currentFounder.id,
        formData.founderBId,
        formData.equityFromA,
        formData.equityFromB,
        agreement?.id
      );
      
      if (validationErrors.length > 0) {
        const errorMap: Record<string, string> = {};
        validationErrors.forEach(error => {
          errorMap[error.field] = error.message;
        });
        setErrors(errorMap);
        setSubmitting(false);
        return;
      }
      
      // Determine equity amounts for signature message
      const equityFromThisFounder = agreement?.founderAId === currentFounder.id 
        ? formData.equityFromA 
        : formData.equityFromB;
      const equityFromOther = agreement?.founderAId === currentFounder.id 
        ? formData.equityFromB 
        : formData.equityFromA;
      
      let message: string;
      
      if (agreement) {
        // Generate revision message
        const agreementDisplayNumber = getAgreementDisplayNumber(agreement, agreements);
        const versionNumber = agreement.versions.length;
        message = generateRevisionMessage(
          agreementDisplayNumber,
          versionNumber,
          equityFromThisFounder,
          equityFromOther,
          currentFounder.founderName
        );
        
        // Store pending submission
        setPendingSubmission({
          type: 'revision',
          data: {
            agreementId: agreement.id,
            equityFromA: formData.equityFromA,
            equityFromB: formData.equityFromB,
            notes: formData.notes,
            proposedBy: currentFounder.id,
          }
        });
      } else {
        // Generate propose agreement message
        const otherFounder = founders.find(f => f.id === formData.founderBId);
        message = generateCreateAgreementMessage(
          equityFromThisFounder,
          equityFromOther,
          currentFounder.founderName,
          otherFounder?.founderName || 'the other founder'
        );
        
        // Store pending submission
        setPendingSubmission({
          type: 'create',
          data: {
            founderAId: currentFounder.id,
            founderBId: formData.founderBId,
            equityFromA: formData.equityFromA,
            equityFromB: formData.equityFromB,
            notes: formData.notes,
            initiatedBy: currentFounder.id,
          }
        });
      }
      
      // Store message and prompt for signature
      setPendingMessage(message);
      signMessage({ message });
    } catch (error: any) {
      console.error('Submit error:', error);
      setErrors({ general: error?.message || 'An unexpected error occurred' });
      setSubmitting(false);
    }
  };
  
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const selectedFounder = founders.find(f => f.id === formData.founderBId);
  const currentFounderEquity = agreement?.founderAId === currentFounder.id ? formData.equityFromA : formData.equityFromB;
  const otherFounderEquity = agreement?.founderAId === currentFounder.id ? formData.equityFromB : formData.equityFromA;
  
  return (
    <Card className="max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="font-space-grotesk font-bold text-2xl text-gray-900 dark:text-gray-100">
            {agreement ? 'Propose Revision' : 'Create Equity Swap Agreement'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {agreement 
              ? 'Propose new terms for this agreement'
              : 'Propose an equity swap with another founder'
            }
          </p>
        </div>
        
        {errors.general && (
          <div className="p-4 rounded-md bg-danger/10 border border-danger/20">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-danger" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-danger font-medium">{errors.general}</p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Founder Selection (only for new agreements) */}
          {!agreement && (
            <Select
              label="Select Founder"
              value={formData.founderBId}
              onChange={(e) => handleInputChange('founderBId', e.target.value)}
              error={errors.founderBId}
              options={otherFounders.map(founder => ({
                value: founder.id,
                label: `${founder.founderName} (${founder.companyName})`
              }))}
              placeholder="Choose a founder to propose agreement with"
              required
            />
          )}
          
          {/* Agreement Terms */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                Your Company ({currentFounder.companyName})
              </h3>
              <Input
                label="Equity You Offer (%)"
                type="number"
                min="0.001"
                max="100"
                step="0.001"
                value={currentFounderEquity}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  if (agreement?.founderAId === currentFounder.id) {
                    handleInputChange('equityFromA', value);
                  } else {
                    handleInputChange('equityFromB', value);
                  }
                }}
                error={errors.equityFromCompanyA || errors.equityFromCompanyB}
                helperText={`Available: ${(currentFounder.totalEquityAvailable - currentFounder.equitySwapped).toFixed(3)}%`}
                required
              />
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                {selectedFounder ? `${selectedFounder.companyName}` : 'Other Company'}
              </h3>
              <Input
                label="Equity You Request (%)"
                type="number"
                min="0.001"
                max="100"
                step="0.001"
                value={otherFounderEquity}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  if (agreement?.founderAId === currentFounder.id) {
                    handleInputChange('equityFromB', value);
                  } else {
                    handleInputChange('equityFromA', value);
                  }
                }}
                error={errors.equityFromCompanyB || errors.equityFromCompanyA}
                helperText={selectedFounder ? `Available: ${(selectedFounder.totalEquityAvailable - selectedFounder.equitySwapped).toFixed(3)}%` : ''}
                required
              />
            </div>
          </div>
          
          {/* Notes */}
          <Textarea
            label="Agreement Notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            error={errors.notes}
            placeholder="What considerations led to the proposed ratio for this agreement?"
            rows={4}
            helperText="Required. Explain the rationale, key terms, risks, and benefits for this equity swap."
            required
          />
          
          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={submitting || isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting || isLoading || isSigning}
              disabled={isSigning}
              className="sm:min-w-[140px]"
            >
              {isSigning ? 'Signing Message...' : (agreement ? 'Propose Revision' : 'Propose Agreement')}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
