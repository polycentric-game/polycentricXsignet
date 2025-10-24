import { Founder, Agreement } from './types';
import { founderStorage, agreementStorage, generateId, generateAgreementId } from './storage';
import { EXAMPLE_FOUNDERS } from './constants';

// Initialize sample data if none exists
export function initializeSampleData(): void {
  const existingFounders = founderStorage.getAll();
  const existingAgreements = agreementStorage.getAll();
  
  // Only initialize if no data exists
  if (existingFounders.length === 0 && existingAgreements.length === 0) {
    // Create sample founders
    const sampleFounders: Founder[] = EXAMPLE_FOUNDERS.map((example, index) => ({
      ...example,
      id: generateId('founder_'),
      userId: generateId('user_'), // Mock user IDs
      createdAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString(), // Stagger creation dates
      updatedAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString(),
    }));
    
    // Save sample founders
    sampleFounders.forEach(founder => {
      founderStorage.save(founder);
    });
    
    // Create a sample agreement between Alex and Maya
    if (sampleFounders.length >= 2) {
      const agreement: Agreement = {
        id: generateAgreementId(),
        founderAId: sampleFounders[0].id, // Alex
        founderBId: sampleFounders[1].id, // Maya
        status: 'proposed',
        initiatedBy: sampleFounders[0].id,
        lastRevisedBy: sampleFounders[0].id,
        currentVersion: 0,
        versions: [{
          versionNumber: 0,
          equityFromCompanyA: 5, // Alex offers 5%
          equityFromCompanyB: 7, // Maya offers 7%
          notes: 'Looking to combine AI analytics with DeFi insights for better risk assessment and market expansion.',
          proposedBy: sampleFounders[0].id,
          proposedAt: new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)).toISOString(),
          approvedBy: [sampleFounders[0].id], // Alex auto-approved
        }],
        createdAt: new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)).toISOString(),
        updatedAt: new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)).toISOString(),
      };
      
      agreementStorage.save(agreement);
    }
    
    console.log('Sample data initialized with', sampleFounders.length, 'founders and 1 agreement');
  }
}
