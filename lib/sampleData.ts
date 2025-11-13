import { Founder, Agreement, User } from './types';
import { founderStorage, agreementStorage, userStorage, generateId, generateAgreementId } from './storage';
import { EXAMPLE_FOUNDERS } from './constants';

// Initialize sample data if none exists
export async function initializeSampleData(): Promise<void> {
  const existingFounders = await founderStorage.getAll();
  const existingAgreements = await agreementStorage.getAll();
  
  // Only initialize if no data exists
  if (existingFounders.length === 0 && existingAgreements.length === 0) {
    // Create sample users first (required for foreign key constraint)
    const sampleUsers: User[] = [];
    for (let i = 0; i < EXAMPLE_FOUNDERS.length; i++) {
      // Generate a valid Ethereum address (42 characters: 0x + 40 hex chars)
      const addressBytes = Array.from({ length: 20 }, () => Math.floor(Math.random() * 256));
      const ethereumAddress = '0x' + addressBytes.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const user: User = {
        id: generateId(),
        ethereumAddress,
        createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
      };
      const savedUser = await userStorage.save(user);
      sampleUsers.push(savedUser);
    }
    
    // Create sample founders with valid user IDs
    const sampleFounders: Founder[] = [];
    for (let index = 0; index < EXAMPLE_FOUNDERS.length; index++) {
      const example = EXAMPLE_FOUNDERS[index];
      const founder: Founder = {
        ...example,
        id: generateId(),
        userId: sampleUsers[index].id, // Use the actual user ID from created user
        createdAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString(), // Stagger creation dates
        updatedAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString(),
      };
      const savedFounder = await founderStorage.save(founder);
      sampleFounders.push(savedFounder);
    }
    
    // Create a sample agreement between Alex and Maya
    if (sampleFounders.length >= 2) {
      const agreementId = await generateAgreementId();
      const agreement: Agreement = {
        id: agreementId,
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
      
      await agreementStorage.save(agreement);
    }
    
    console.log('Sample data initialized with', sampleFounders.length, 'founders and 1 agreement');
  }
}
