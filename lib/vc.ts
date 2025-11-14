import { Agreement } from './types';
import { getIssuerDid, addressToDid } from './issuer';
import { founderStorage } from './storage';
import { userStorage } from './storage';
import { encodePercent } from './eip712';
import { keccak256, toHex, stringToHex } from 'viem';

/**
 * Build VC payload for an equity swap agreement
 */
export async function buildEquitySwapVcPayload(agreement: Agreement): Promise<any> {
  const currentVersion = agreement.versions[agreement.currentVersion];
  if (!currentVersion) {
    throw new Error('Invalid agreement version');
  }
  
  // Get founders and their addresses
  const founderA = await founderStorage.findById(agreement.founderAId);
  const founderB = await founderStorage.findById(agreement.founderBId);
  
  if (!founderA || !founderB) {
    throw new Error('Founders not found for agreement');
  }
  
  const userA = await userStorage.findById(founderA.userId);
  const userB = await userStorage.findById(founderB.userId);
  
  if (!userA?.ethereumAddress || !userB?.ethereumAddress) {
    throw new Error('Founder Ethereum addresses not found');
  }
  
  const partyAAddress = userA.ethereumAddress.toLowerCase();
  const partyBAddress = userB.ethereumAddress.toLowerCase();
  
  // Get signatures and finalized timestamp
  const sigA = (agreement as any).sigA || null;
  const sigB = (agreement as any).sigB || null;
  const finalizedAt = (agreement as any).finalizedAt || new Date().toISOString();
  
  // Get terms hash
  const termsHash = (agreement as any).termsHash || '0x0000000000000000000000000000000000000000000000000000000000000000';
  
  const payload = {
    iss: getIssuerDid(),
    sub: addressToDid(partyAAddress), // Primary subject
    nbf: Math.floor(new Date(finalizedAt).getTime() / 1000),
    vc: {
      '@context': ['https://www.w3.org/ns/credentials/v2'],
      type: ['VerifiableCredential', 'EquitySwapAgreementCredential'],
      credentialSubject: {
        agreementId: agreement.id,
        partyA: {
          id: addressToDid(partyAAddress),
          ethAddress: partyAAddress,
          signature: sigA,
        },
        partyB: {
          id: addressToDid(partyBAddress),
          ethAddress: partyBAddress,
          signature: sigB,
        },
        equitySwap: [
          {
            from: addressToDid(partyAAddress),
            to: addressToDid(partyBAddress),
            percentage: currentVersion.equityFromCompanyA,
          },
          {
            from: addressToDid(partyBAddress),
            to: addressToDid(partyAAddress),
            percentage: currentVersion.equityFromCompanyB,
          },
        ],
        agreementHash: termsHash,
        signedAt: finalizedAt,
      },
    },
  };
  
  return payload;
}

/**
 * Compute terms hash from canonical JSON
 */
export function computeTermsHash(canonicalTermsJson: string): `0x${string}` {
  // Convert string to bytes and hash with keccak256
  const hex = stringToHex(canonicalTermsJson);
  return keccak256(hex);
}

/**
 * Build canonical terms JSON from agreement
 */
export async function buildCanonicalTermsJson(agreement: Agreement): Promise<string> {
  const currentVersion = agreement.versions[agreement.currentVersion];
  if (!currentVersion) {
    throw new Error('Invalid agreement version');
  }
  
  const founderA = await founderStorage.findById(agreement.founderAId);
  const founderB = await founderStorage.findById(agreement.founderBId);
  
  if (!founderA || !founderB) {
    throw new Error('Founders not found for agreement');
  }
  
  const userA = await userStorage.findById(founderA.userId);
  const userB = await userStorage.findById(founderB.userId);
  
  if (!userA?.ethereumAddress || !userB?.ethereumAddress) {
    throw new Error('Founder Ethereum addresses not found');
  }
  
  // Create canonical JSON object (sorted keys for determinism)
  const canonicalTerms = {
    agreementId: agreement.id,
    partyA: userA.ethereumAddress.toLowerCase(),
    partyB: userB.ethereumAddress.toLowerCase(),
    equityAtoB: currentVersion.equityFromCompanyA,
    equityBtoA: currentVersion.equityFromCompanyB,
    notes: currentVersion.notes || '',
    version: currentVersion.versionNumber,
    createdAt: agreement.createdAt,
  };
  
  // Return sorted JSON string (manually sort keys)
  const sortedKeys = Object.keys(canonicalTerms).sort();
  const sortedTerms: any = {};
  for (const key of sortedKeys) {
    sortedTerms[key] = (canonicalTerms as any)[key];
  }
  return JSON.stringify(sortedTerms);
}

