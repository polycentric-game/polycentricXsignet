import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Agreement } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the display number for an agreement based on creation order
 * Agreements are numbered 1, 2, 3, etc. based on when they were created
 */
export function getAgreementDisplayNumber(agreement: Agreement, allAgreements: Agreement[]): number {
  // Sort all agreements by creation date
  const sortedAgreements = [...allAgreements].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
  
  // Find the index of this agreement (0-based) and add 1 for display
  const index = sortedAgreements.findIndex(a => a.id === agreement.id);
  return index >= 0 ? index + 1 : 0;
}
