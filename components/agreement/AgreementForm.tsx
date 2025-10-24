'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { createAgreement, proposeRevision } from '@/lib/agreements';
import { validateAgreementEquity } from '@/lib/validation';
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
  const { currentFounder, founders, updateAgreement, addAgreement } = useAppStore();
  
  // Get other founders (exclude current founder)
  const otherFounders = founders.filter(f => f.id !== currentFounder?.id);
  
  // Initialize form data
  const [formData, setFormData] = useState({
    founderBId: agreement ? (agreement.founderAId === currentFounder?.id ? agreement.founderBId : agreement.founderAId) : '',
    equityFromA: agreement ? agreement.versions[agreement.currentVersion].equityFromCompanyA : 5,
    equityFromB: agreement ? agreement.versions[agreement.currentVersion].equityFromCompanyB : 5,
    notes: agreement ? agreement.versions[agreement.currentVersion].notes : '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  
  if (!currentFounder) {
    return null;
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    
    try {
      // Validate form
      if (!formData.founderBId) {
        setErrors({ founderBId: 'Please select a founder to create agreement with' });
        return;
      }
      
      // Validate equity amounts
      const validationErrors = validateAgreementEquity(
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
        return;
      }
      
      let result;
      
      if (agreement) {
        // Propose revision
        result = proposeRevision(
          agreement.id,
          formData.equityFromA,
          formData.equityFromB,
          formData.notes,
          currentFounder.id
        );
      } else {
        // Create new agreement
        result = createAgreement(
          currentFounder.id,
          formData.founderBId,
          formData.equityFromA,
          formData.equityFromB,
          formData.notes,
          currentFounder.id
        );
      }
      
      if (result.success && result.agreement) {
        if (agreement) {
          updateAgreement(result.agreement);
        } else {
          addAgreement(result.agreement);
        }
        onSubmit(result.agreement);
      } else {
        setErrors({ general: result.error || 'Failed to save agreement' });
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
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
          <div className="p-3 rounded-md bg-danger/10 border border-danger/20">
            <p className="text-sm text-danger">{errors.general}</p>
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
              placeholder="Choose a founder to create agreement with"
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
                min="0.1"
                max="100"
                step="0.1"
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
                helperText={`Available: ${currentFounder.totalEquityAvailable - currentFounder.equitySwapped}%`}
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
                min="0.1"
                max="100"
                step="0.1"
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
                helperText={selectedFounder ? `Available: ${selectedFounder.totalEquityAvailable - selectedFounder.equitySwapped}%` : ''}
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
            placeholder="Describe the motivation, terms, or any additional details for this equity swap..."
            rows={4}
            helperText="Optional but recommended to explain the strategic rationale"
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
              disabled={submitting || isLoading}
              className="sm:min-w-[140px]"
            >
              {submitting || isLoading
                ? (agreement ? 'Proposing...' : 'Creating...')
                : (agreement ? 'Propose Revision' : 'Create Agreement')
              }
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
