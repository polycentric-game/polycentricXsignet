import { Founder, Agreement, ValidationError } from './types';
import { founderStorage } from './storage';

// Validate founder form
export function validateFounder(founder: Partial<Founder>): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!founder.founderName?.trim()) {
    errors.push({ field: 'founderName', message: 'Founder name is required' });
  }
  
  if (!founder.founderType?.trim()) {
    errors.push({ field: 'founderType', message: 'Founder type is required' });
  }
  
  if (!founder.founderValues || founder.founderValues.length !== 3) {
    errors.push({ field: 'founderValues', message: 'Exactly 3 founder values are required' });
  } else {
    founder.founderValues.forEach((value, index) => {
      if (!value?.trim()) {
        errors.push({ field: `founderValues.${index}`, message: `Founder value ${index + 1} is required` });
      }
    });
  }
  
  if (!founder.companyName?.trim()) {
    errors.push({ field: 'companyName', message: 'Company name is required' });
  }
  
  if (!founder.companyDescription?.trim()) {
    errors.push({ field: 'companyDescription', message: 'Company description is required' });
  }
  
  if (!founder.stage) {
    errors.push({ field: 'stage', message: 'Company stage is required' });
  }
  
  if (!founder.currentValuationRange?.trim()) {
    errors.push({ field: 'currentValuationRange', message: 'Valuation range is required' });
  }
  
  if (!founder.revenueStatus?.trim()) {
    errors.push({ field: 'revenueStatus', message: 'Revenue status is required' });
  }
  
  if (!founder.businessModel?.trim()) {
    errors.push({ field: 'businessModel', message: 'Business model is required' });
  }
  
  if (!founder.keyAssets || founder.keyAssets.length !== 3) {
    errors.push({ field: 'keyAssets', message: 'Exactly 3 key assets are required' });
  } else {
    founder.keyAssets.forEach((asset, index) => {
      if (!asset?.trim()) {
        errors.push({ field: `keyAssets.${index}`, message: `Key asset ${index + 1} is required` });
      }
    });
  }
  
  if (!founder.swapMotivation?.trim()) {
    errors.push({ field: 'swapMotivation', message: 'Swap motivation is required' });
  }
  
  if (!founder.gapsOrNeeds || founder.gapsOrNeeds.length !== 3) {
    errors.push({ field: 'gapsOrNeeds', message: 'Exactly 3 gaps or needs are required' });
  } else {
    founder.gapsOrNeeds.forEach((gap, index) => {
      if (!gap?.trim()) {
        errors.push({ field: `gapsOrNeeds.${index}`, message: `Gap or need ${index + 1} is required` });
      }
    });
  }
  
  if (typeof founder.totalEquityAvailable !== 'number' || founder.totalEquityAvailable <= 0 || founder.totalEquityAvailable > 100) {
    errors.push({ field: 'totalEquityAvailable', message: 'Total equity available must be between 1 and 100' });
  }
  
  return errors;
}

// Check if founder has enough equity remaining
export function getEquityRemaining(founderId: string): number {
  const founder = founderStorage.findById(founderId);
  if (!founder) return 0;
  
  return founder.totalEquityAvailable - founder.equitySwapped;
}

// Validate agreement equity amounts
export function validateAgreementEquity(
  founderAId: string,
  founderBId: string,
  equityFromA: number,
  equityFromB: number,
  excludeAgreementId?: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (equityFromA <= 0) {
    errors.push({ field: 'equityFromCompanyA', message: 'Equity from Company A must be greater than 0' });
  }
  
  if (equityFromB <= 0) {
    errors.push({ field: 'equityFromCompanyB', message: 'Equity from Company B must be greater than 0' });
  }
  
  // Check if founders have enough equity remaining
  const founderA = founderStorage.findById(founderAId);
  const founderB = founderStorage.findById(founderBId);
  
  if (!founderA) {
    errors.push({ field: 'founderAId', message: 'Founder A not found' });
    return errors;
  }
  
  if (!founderB) {
    errors.push({ field: 'founderBId', message: 'Founder B not found' });
    return errors;
  }
  
  const remainingA = getEquityRemaining(founderAId);
  const remainingB = getEquityRemaining(founderBId);
  
  if (equityFromA > remainingA) {
    errors.push({ 
      field: 'equityFromCompanyA', 
      message: `${founderA.companyName} only has ${remainingA}% equity remaining` 
    });
  }
  
  if (equityFromB > remainingB) {
    errors.push({ 
      field: 'equityFromCompanyB', 
      message: `${founderB.companyName} only has ${remainingB}% equity remaining` 
    });
  }
  
  return errors;
}

// Validate agreement form
export function validateAgreement(agreement: Partial<Agreement>): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!agreement.founderAId) {
    errors.push({ field: 'founderAId', message: 'Company A is required' });
  }
  
  if (!agreement.founderBId) {
    errors.push({ field: 'founderBId', message: 'Company B is required' });
  }
  
  if (agreement.founderAId === agreement.founderBId) {
    errors.push({ field: 'founderBId', message: 'Cannot create agreement with yourself' });
  }
  
  if (!agreement.versions || agreement.versions.length === 0) {
    errors.push({ field: 'versions', message: 'Agreement must have at least one version' });
    return errors;
  }
  
  const currentVersion = agreement.versions[agreement.currentVersion || 0];
  if (!currentVersion) {
    errors.push({ field: 'currentVersion', message: 'Invalid current version' });
    return errors;
  }
  
  // Validate equity amounts
  if (agreement.founderAId && agreement.founderBId) {
    const equityErrors = validateAgreementEquity(
      agreement.founderAId,
      agreement.founderBId,
      currentVersion.equityFromCompanyA,
      currentVersion.equityFromCompanyB,
      agreement.id
    );
    errors.push(...equityErrors);
  }
  
  return errors;
}

// Check if email is valid
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate sign-in form
export function validateSignIn(email: string, password: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!email.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }
  
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }
  
  return errors;
}

// Validate sign-up form
export function validateSignUp(email: string, password: string, confirmPassword: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!email.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }
  
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
  }
  
  if (!confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Please confirm your password' });
  } else if (password !== confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
  }
  
  return errors;
}
