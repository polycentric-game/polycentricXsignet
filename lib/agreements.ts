import { Agreement, AgreementVersion, AgreementStatus, Founder } from './types';
import { agreementStorage, founderStorage, generateAgreementId } from './storage';
import { validateAgreementEquity } from './validation';

// Create new agreement
export function createAgreement(
  founderAId: string,
  founderBId: string,
  equityFromA: number,
  equityFromB: number,
  notes: string,
  initiatedBy: string
): { success: boolean; agreement?: Agreement; error?: string } {
  // Validate equity amounts
  const validationErrors = validateAgreementEquity(founderAId, founderBId, equityFromA, equityFromB);
  if (validationErrors.length > 0) {
    return { success: false, error: validationErrors[0].message };
  }
  
  // Create initial version
  const initialVersion: AgreementVersion = {
    versionNumber: 0,
    equityFromCompanyA: equityFromA,
    equityFromCompanyB: equityFromB,
    notes,
    proposedBy: initiatedBy,
    proposedAt: new Date().toISOString(),
    approvedBy: [initiatedBy], // Initiator auto-approves
  };
  
  // Create agreement
  const agreement: Agreement = {
    id: generateAgreementId(),
    founderAId,
    founderBId,
    status: 'proposed',
    initiatedBy,
    lastRevisedBy: initiatedBy,
    currentVersion: 0,
    versions: [initialVersion],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  agreementStorage.save(agreement);
  return { success: true, agreement };
}

// Propose revision to existing agreement
export function proposeRevision(
  agreementId: string,
  equityFromA: number,
  equityFromB: number,
  notes: string,
  proposedBy: string
): { success: boolean; agreement?: Agreement; error?: string } {
  const agreement = agreementStorage.findById(agreementId);
  if (!agreement) {
    return { success: false, error: 'Agreement not found' };
  }
  
  // Check if user is involved in agreement
  if (agreement.founderAId !== proposedBy && agreement.founderBId !== proposedBy) {
    return { success: false, error: 'You are not authorized to revise this agreement' };
  }
  
  // Cannot revise completed agreements
  if (agreement.status === 'completed') {
    return { success: false, error: 'Cannot revise completed agreements' };
  }
  
  // Validate equity amounts
  const validationErrors = validateAgreementEquity(
    agreement.founderAId, 
    agreement.founderBId, 
    equityFromA, 
    equityFromB,
    agreementId
  );
  if (validationErrors.length > 0) {
    return { success: false, error: validationErrors[0].message };
  }
  
  // Create new version
  const newVersion: AgreementVersion = {
    versionNumber: agreement.versions.length,
    equityFromCompanyA: equityFromA,
    equityFromCompanyB: equityFromB,
    notes,
    proposedBy,
    proposedAt: new Date().toISOString(),
    approvedBy: [proposedBy], // Proposer auto-approves
  };
  
  // Update agreement
  const updatedAgreement: Agreement = {
    ...agreement,
    status: 'revised',
    lastRevisedBy: proposedBy,
    currentVersion: agreement.versions.length,
    versions: [...agreement.versions, newVersion],
    updatedAt: new Date().toISOString(),
  };
  
  agreementStorage.save(updatedAgreement);
  return { success: true, agreement: updatedAgreement };
}

// Approve current version of agreement
export function approveAgreement(
  agreementId: string,
  founderId: string
): { success: boolean; agreement?: Agreement; error?: string } {
  const agreement = agreementStorage.findById(agreementId);
  if (!agreement) {
    return { success: false, error: 'Agreement not found' };
  }
  
  // Check if user is involved in agreement
  if (agreement.founderAId !== founderId && agreement.founderBId !== founderId) {
    return { success: false, error: 'You are not authorized to approve this agreement' };
  }
  
  // Cannot approve completed agreements
  if (agreement.status === 'completed') {
    return { success: false, error: 'Agreement is already completed' };
  }
  
  const currentVersion = agreement.versions[agreement.currentVersion];
  if (!currentVersion) {
    return { success: false, error: 'Invalid agreement version' };
  }
  
  // Check if already approved by this founder
  if (currentVersion.approvedBy.includes(founderId)) {
    return { success: false, error: 'You have already approved this version' };
  }
  
  // Add approval
  const updatedVersion: AgreementVersion = {
    ...currentVersion,
    approvedBy: [...currentVersion.approvedBy, founderId],
  };
  
  const updatedVersions = [...agreement.versions];
  updatedVersions[agreement.currentVersion] = updatedVersion;
  
  // Check if both founders have approved
  const bothApproved = updatedVersion.approvedBy.includes(agreement.founderAId) && 
                      updatedVersion.approvedBy.includes(agreement.founderBId);
  
  let newStatus: AgreementStatus = agreement.status;
  if (bothApproved) {
    newStatus = 'approved';
    
    // Update equity swapped for both founders
    const founderA = founderStorage.findById(agreement.founderAId);
    const founderB = founderStorage.findById(agreement.founderBId);
    
    if (founderA && founderB) {
      founderA.equitySwapped += currentVersion.equityFromCompanyA;
      founderB.equitySwapped += currentVersion.equityFromCompanyB;
      founderA.updatedAt = new Date().toISOString();
      founderB.updatedAt = new Date().toISOString();
      
      founderStorage.save(founderA);
      founderStorage.save(founderB);
    }
  }
  
  // Update agreement
  const updatedAgreement: Agreement = {
    ...agreement,
    status: newStatus,
    versions: updatedVersions,
    updatedAt: new Date().toISOString(),
  };
  
  agreementStorage.save(updatedAgreement);
  return { success: true, agreement: updatedAgreement };
}

// Mark agreement as completed
export function completeAgreement(
  agreementId: string,
  founderId: string
): { success: boolean; agreement?: Agreement; error?: string } {
  const agreement = agreementStorage.findById(agreementId);
  if (!agreement) {
    return { success: false, error: 'Agreement not found' };
  }
  
  // Check if user is involved in agreement
  if (agreement.founderAId !== founderId && agreement.founderBId !== founderId) {
    return { success: false, error: 'You are not authorized to complete this agreement' };
  }
  
  // Can only complete approved agreements
  if (agreement.status !== 'approved') {
    return { success: false, error: 'Agreement must be approved before completion' };
  }
  
  // Update agreement
  const updatedAgreement: Agreement = {
    ...agreement,
    status: 'completed',
    updatedAt: new Date().toISOString(),
  };
  
  agreementStorage.save(updatedAgreement);
  return { success: true, agreement: updatedAgreement };
}

// Get agreement status color
export function getStatusColor(status: AgreementStatus): string {
  switch (status) {
    case 'proposed':
      return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
    case 'revised':
      return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
    case 'approved':
      return 'text-primary bg-primary/10';
    case 'completed':
      return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
    default:
      return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
  }
}

// Get agreement label with version
export function getAgreementLabel(agreement: Agreement): string {
  return `${agreement.id}-${agreement.currentVersion}`;
}

// Check if founder can approve agreement
export function canApproveAgreement(agreement: Agreement, founderId: string): boolean {
  if (agreement.status === 'completed') return false;
  if (agreement.founderAId !== founderId && agreement.founderBId !== founderId) return false;
  
  const currentVersion = agreement.versions[agreement.currentVersion];
  if (!currentVersion) return false;
  
  return !currentVersion.approvedBy.includes(founderId);
}

// Check if founder can revise agreement
export function canReviseAgreement(agreement: Agreement, founderId: string): boolean {
  if (agreement.status === 'completed') return false;
  return agreement.founderAId === founderId || agreement.founderBId === founderId;
}

// Get other founder in agreement
export function getOtherFounder(agreement: Agreement, currentFounderId: string): Founder | null {
  const otherFounderId = agreement.founderAId === currentFounderId 
    ? agreement.founderBId 
    : agreement.founderAId;
  
  return founderStorage.findById(otherFounderId);
}
