'use client';

import React, { useState } from 'react';
import { Founder } from '@/lib/types';
import { validateFounder } from '@/lib/validation';
import { 
  FOUNDER_TYPES, 
  COMPANY_STAGES, 
  VALUATION_RANGES, 
  REVENUE_STATUSES, 
  BUSINESS_MODELS,
  EXAMPLE_FOUNDERS,
  FOUNDER_VALUES_SUGGESTIONS,
  KEY_ASSETS_SUGGESTIONS,
  GAPS_NEEDS_SUGGESTIONS
} from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';

interface FounderFormProps {
  founder?: Founder;
  onSubmit: (founder: Omit<Founder, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function FounderForm({ founder, onSubmit, onCancel, isLoading = false }: FounderFormProps) {
  const [formData, setFormData] = useState({
    founderName: founder?.founderName || '',
    founderType: founder?.founderType || '',
    founderValues: founder?.founderValues || ['', '', ''] as [string, string, string],
    companyName: founder?.companyName || '',
    companyDescription: founder?.companyDescription || '',
    stage: founder?.stage || '' as any,
    currentValuationRange: founder?.currentValuationRange || '',
    revenueStatus: founder?.revenueStatus || '',
    businessModel: founder?.businessModel || '',
    keyAssets: founder?.keyAssets || ['', '', ''] as [string, string, string],
    swapMotivation: founder?.swapMotivation || '',
    gapsOrNeeds: founder?.gapsOrNeeds || ['', '', ''] as [string, string, string],
    totalEquityAvailable: founder?.totalEquityAvailable || 10,
    equitySwapped: founder?.equitySwapped || 0,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate form
    const validationErrors = validateFounder(formData);
    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      validationErrors.forEach(error => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      return;
    }
    
    onSubmit(formData);
  };
  
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const handleArrayChange = (field: 'founderValues' | 'keyAssets' | 'gapsOrNeeds', index: number, value: string) => {
    const newArray = [...formData[field]] as [string, string, string];
    newArray[index] = value;
    handleInputChange(field, newArray);
  };
  
  const autofillExample = (exampleIndex: number) => {
    const example = EXAMPLE_FOUNDERS[exampleIndex];
    if (example) {
      setFormData(prev => ({ ...prev, ...example }));
      setErrors({});
    }
  };
  
  return (
    <Card className="max-w-4xl mx-auto">
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="font-space-grotesk font-bold text-3xl text-gray-900 dark:text-gray-100">
            {founder ? 'Edit Founder Profile' : 'Create Your Founder Profile'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Tell us about yourself and your company to start building equity relationships
          </p>
        </div>
        
        {/* Quick Fill Examples */}
        {!founder && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
              Quick Start (Optional)
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {EXAMPLE_FOUNDERS.map((example, index) => (
                <Button
                  key={index}
                  variant="secondary"
                  onClick={() => autofillExample(index)}
                  className="text-left p-4 h-auto flex-col items-start"
                >
                  <div className="font-semibold">{example.founderName}</div>
                  <div className="text-sm opacity-75">{example.companyName}</div>
                  <div className="text-xs opacity-60">{example.founderType}</div>
                </Button>
              ))}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="space-y-6">
            <h3 className="font-semibold text-xl text-gray-900 dark:text-gray-100">
              Personal Information
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Founder Name"
                value={formData.founderName}
                onChange={(e) => handleInputChange('founderName', e.target.value)}
                error={errors.founderName}
                placeholder="Your full name"
                required
              />
              <Select
                label="Founder Type"
                value={formData.founderType}
                onChange={(e) => handleInputChange('founderType', e.target.value)}
                error={errors.founderType}
                options={FOUNDER_TYPES}
                placeholder="Select your primary role"
                required
              />
            </div>
            
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Founder Values (3 required)
              </label>
              <div className="grid md:grid-cols-3 gap-4">
                {formData.founderValues.map((value, index) => (
                  <Input
                    key={index}
                    value={value}
                    onChange={(e) => handleArrayChange('founderValues', index, e.target.value)}
                    error={errors[`founderValues.${index}`]}
                    placeholder={`Value ${index + 1}`}
                    required
                  />
                ))}
              </div>
              {errors.founderValues && (
                <p className="text-sm text-danger">{errors.founderValues}</p>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Suggestions: {FOUNDER_VALUES_SUGGESTIONS.slice(0, 10).join(', ')}...
              </div>
            </div>
          </div>
          
          {/* Company Information */}
          <div className="space-y-6">
            <h3 className="font-semibold text-xl text-gray-900 dark:text-gray-100">
              Company Information
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Company Name"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                error={errors.companyName}
                placeholder="Your company name"
                required
              />
              <Select
                label="Company Stage"
                value={formData.stage}
                onChange={(e) => handleInputChange('stage', e.target.value)}
                error={errors.stage}
                options={COMPANY_STAGES}
                placeholder="Select funding stage"
                required
              />
            </div>
            
            <Textarea
              label="Company Description"
              value={formData.companyDescription}
              onChange={(e) => handleInputChange('companyDescription', e.target.value)}
              error={errors.companyDescription}
              placeholder="Describe what your company does..."
              rows={3}
              required
            />
            
            <div className="grid md:grid-cols-3 gap-6">
              <Select
                label="Current Valuation Range"
                value={formData.currentValuationRange}
                onChange={(e) => handleInputChange('currentValuationRange', e.target.value)}
                error={errors.currentValuationRange}
                options={VALUATION_RANGES}
                placeholder="Select range"
                required
              />
              <Select
                label="Revenue Status"
                value={formData.revenueStatus}
                onChange={(e) => handleInputChange('revenueStatus', e.target.value)}
                error={errors.revenueStatus}
                options={REVENUE_STATUSES}
                placeholder="Select status"
                required
              />
              <Select
                label="Business Model"
                value={formData.businessModel}
                onChange={(e) => handleInputChange('businessModel', e.target.value)}
                error={errors.businessModel}
                options={BUSINESS_MODELS}
                placeholder="Select model"
                required
              />
            </div>
          </div>
          
          {/* Assets & Needs */}
          <div className="space-y-6">
            <h3 className="font-semibold text-xl text-gray-900 dark:text-gray-100">
              Assets & Needs
            </h3>
            
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Key Assets (3 required)
              </label>
              <div className="grid md:grid-cols-3 gap-4">
                {formData.keyAssets.map((asset, index) => (
                  <Input
                    key={index}
                    value={asset}
                    onChange={(e) => handleArrayChange('keyAssets', index, e.target.value)}
                    error={errors[`keyAssets.${index}`]}
                    placeholder={`Asset ${index + 1}`}
                    required
                  />
                ))}
              </div>
              {errors.keyAssets && (
                <p className="text-sm text-danger">{errors.keyAssets}</p>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Suggestions: {KEY_ASSETS_SUGGESTIONS.slice(0, 8).join(', ')}...
              </div>
            </div>
            
            <Textarea
              label="Swap Motivation"
              value={formData.swapMotivation}
              onChange={(e) => handleInputChange('swapMotivation', e.target.value)}
              error={errors.swapMotivation}
              placeholder="Why are you interested in equity swaps? What are you hoping to achieve?"
              rows={3}
              required
            />
            
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Gaps or Needs (3 required)
              </label>
              <div className="grid md:grid-cols-3 gap-4">
                {formData.gapsOrNeeds.map((gap, index) => (
                  <Input
                    key={index}
                    value={gap}
                    onChange={(e) => handleArrayChange('gapsOrNeeds', index, e.target.value)}
                    error={errors[`gapsOrNeeds.${index}`]}
                    placeholder={`Need ${index + 1}`}
                    required
                  />
                ))}
              </div>
              {errors.gapsOrNeeds && (
                <p className="text-sm text-danger">{errors.gapsOrNeeds}</p>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Suggestions: {GAPS_NEEDS_SUGGESTIONS.slice(0, 8).join(', ')}...
              </div>
            </div>
          </div>
          
          {/* Equity Information */}
          <div className="space-y-6">
            <h3 className="font-semibold text-xl text-gray-900 dark:text-gray-100">
              Equity Information
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Total Equity Available for Swaps (%)"
                type="number"
                min="1"
                max="100"
                value={formData.totalEquityAvailable}
                onChange={(e) => handleInputChange('totalEquityAvailable', parseInt(e.target.value) || 0)}
                error={errors.totalEquityAvailable}
                helperText="Percentage of your company equity you're willing to swap"
                required
              />
              {founder && (
                <Input
                  label="Equity Already Swapped (%)"
                  type="number"
                  value={formData.equitySwapped}
                  disabled
                  helperText="This is automatically calculated from approved agreements"
                />
              )}
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
            {onCancel && (
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="sm:min-w-[120px]"
            >
              {isLoading 
                ? (founder ? 'Updating...' : 'Creating...') 
                : (founder ? 'Update Profile' : 'Create Profile')
              }
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
