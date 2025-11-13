import { Agreement, AgreementVersion, AgreementStatus, Founder } from './types';
import { agreementStorage, founderStorage, generateAgreementId } from './storage';
import { validateAgreementEquity } from './validation';

// Create new agreement (requires signature)
export async function createAgreement(
  founderAId: string,
  founderBId: string,
  equityFromA: number,
  equityFromB: number,
  notes: string,
  initiatedBy: string,
  signature: string
): Promise<{ success: boolean; agreement?: Agreement; error?: string }> {
  // Validate equity amounts
  const validationErrors = await validateAgreementEquity(founderAId, founderBId, equityFromA, equityFromB);
  if (validationErrors.length > 0) {
    return { success: false, error: validationErrors[0].message };
  }
  
  // Verify signature is provided
  if (!signature) {
    return { success: false, error: 'Signature is required to create agreement' };
  }
  
  // Create initial version with signature
  const signatures: { [founderId: string]: string } = {};
  signatures[initiatedBy] = signature;
  
  const initialVersion: AgreementVersion = {
    versionNumber: 0,
    equityFromCompanyA: equityFromA,
    equityFromCompanyB: equityFromB,
    notes,
    proposedBy: initiatedBy,
    proposedAt: new Date().toISOString(),
    approvedBy: [initiatedBy], // Proposer signs and approves by signing
    signatures, // Store proposer's signature
  };
  
  // Create agreement
  const agreementId = await generateAgreementId();
  const agreement: Agreement = {
    id: agreementId,
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
  
  await agreementStorage.save(agreement);
  return { success: true, agreement };
}

// Propose revision to existing agreement (requires signature)
export async function proposeRevision(
  agreementId: string,
  equityFromA: number,
  equityFromB: number,
  notes: string,
  proposedBy: string,
  signature: string
): Promise<{ success: boolean; agreement?: Agreement; error?: string }> {
  const agreement = await agreementStorage.findById(agreementId);
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
  const validationErrors = await validateAgreementEquity(
    agreement.founderAId, 
    agreement.founderBId, 
    equityFromA, 
    equityFromB,
    agreementId
  );
  if (validationErrors.length > 0) {
    return { success: false, error: validationErrors[0].message };
  }
  
  // Verify signature is provided
  if (!signature) {
    return { success: false, error: 'Signature is required to propose revision' };
  }
  
  // Create new version with signature
  const signatures: { [founderId: string]: string } = {};
  signatures[proposedBy] = signature;
  
  const newVersion: AgreementVersion = {
    versionNumber: agreement.versions.length,
    equityFromCompanyA: equityFromA,
    equityFromCompanyB: equityFromB,
    notes,
    proposedBy,
    proposedAt: new Date().toISOString(),
    approvedBy: [proposedBy], // Proposer signs and approves by signing
    signatures, // Store proposer's signature
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
  
  await agreementStorage.save(updatedAgreement);
  return { success: true, agreement: updatedAgreement };
}

// Generate message to sign for creating a new agreement
export function generateCreateAgreementMessage(
  equityFromA: number,
  equityFromB: number,
  founderName: string,
  otherFounderName: string
): string {
  return `I, ${founderName}, propose a new equity swap agreement:\n\n` +
         `I will exchange ${equityFromA}% of my company's equity for ${equityFromB}% of ${otherFounderName}'s company equity.\n\n` +
         `This signature confirms my proposal of these terms.\n\n` +
         `Timestamp: ${new Date().toISOString()}`;
}

// Generate message to sign for proposing a revision
export function generateRevisionMessage(
  agreementDisplayNumber: number,
  versionNumber: number,
  equityFromA: number,
  equityFromB: number,
  founderName: string
): string {
  return `I, ${founderName}, propose Revision ${versionNumber + 1} to Agreement ${agreementDisplayNumber}:\n\n` +
         `I propose to exchange ${equityFromA}% of my company's equity for ${equityFromB}% of the other company's equity.\n\n` +
         `This signature confirms my proposal of these revised terms.\n\n` +
         `Timestamp: ${new Date().toISOString()}`;
}

// Generate message to sign for agreement approval
export function generateApprovalMessage(
  agreementDisplayNumber: number,
  versionNumber: number,
  equityFromA: number,
  equityFromB: number,
  founderName: string
): string {
  return `I, ${founderName}, approve Agreement ${agreementDisplayNumber}, Version ${versionNumber + 1}:\n\n` +
         `I will exchange ${equityFromA}% of my company's equity for ${equityFromB}% of the other company's equity.\n\n` +
         `This signature confirms my agreement to these terms.\n\n` +
         `Timestamp: ${new Date().toISOString()}`;
}

// Approve current version of agreement (requires signature)
export async function approveAgreement(
  agreementId: string,
  founderId: string,
  signature: string
): Promise<{ success: boolean; agreement?: Agreement; error?: string }> {
  const agreement = await agreementStorage.findById(agreementId);
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
  
  // Verify signature is provided
  if (!signature) {
    return { success: false, error: 'Signature is required to approve agreement' };
  }
  
  // Add approval and signature
  const signatures = currentVersion.signatures || {};
  signatures[founderId] = signature;
  
  // Only add to approvedBy if not already there (shouldn't happen, but safety check)
  const updatedApprovedBy = currentVersion.approvedBy.includes(founderId)
    ? currentVersion.approvedBy
    : [...currentVersion.approvedBy, founderId];
  
  const updatedVersion: AgreementVersion = {
    ...currentVersion,
    approvedBy: updatedApprovedBy,
    signatures,
  };
  
  const updatedVersions = [...agreement.versions];
  updatedVersions[agreement.currentVersion] = updatedVersion;
  
  // Check if both founders have approved (and signed)
  const bothApproved = updatedVersion.approvedBy.includes(agreement.founderAId) && 
                      updatedVersion.approvedBy.includes(agreement.founderBId) &&
                      signatures[agreement.founderAId] && 
                      signatures[agreement.founderBId];
  
  let newStatus: AgreementStatus = agreement.status;
  if (bothApproved) {
    newStatus = 'approved';
    
    // Update equity swapped for both founders
    const founderA = await founderStorage.findById(agreement.founderAId);
    const founderB = await founderStorage.findById(agreement.founderBId);
    
    if (founderA && founderB) {
      founderA.equitySwapped += currentVersion.equityFromCompanyA;
      founderB.equitySwapped += currentVersion.equityFromCompanyB;
      founderA.updatedAt = new Date().toISOString();
      founderB.updatedAt = new Date().toISOString();
      
      await founderStorage.save(founderA);
      await founderStorage.save(founderB);
    }
  }
  
  // Update agreement
  const updatedAgreement: Agreement = {
    ...agreement,
    status: newStatus,
    versions: updatedVersions,
    updatedAt: new Date().toISOString(),
  };
  
  await agreementStorage.save(updatedAgreement);
  return { success: true, agreement: updatedAgreement };
}

// Mark agreement as completed (requires both founders to have signed)
export async function completeAgreement(
  agreementId: string,
  founderId: string
): Promise<{ success: boolean; agreement?: Agreement; error?: string }> {
  const agreement = await agreementStorage.findById(agreementId);
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
  
  // Verify both founders have signed
  const currentVersion = agreement.versions[agreement.currentVersion];
  const signatures = currentVersion?.signatures || {};
  if (!signatures[agreement.founderAId] || !signatures[agreement.founderBId]) {
    return { success: false, error: 'Both founders must sign the agreement before it can be completed' };
  }
  
  // Update agreement
  const updatedAgreement: Agreement = {
    ...agreement,
    status: 'completed',
    updatedAt: new Date().toISOString(),
  };
  
  await agreementStorage.save(updatedAgreement);
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
export async function getOtherFounder(agreement: Agreement, currentFounderId: string): Promise<Founder | null> {
  const otherFounderId = agreement.founderAId === currentFounderId 
    ? agreement.founderBId 
    : agreement.founderAId;
  
  return await founderStorage.findById(otherFounderId);
}
