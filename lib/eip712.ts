import { recoverTypedDataAddress } from 'viem';
import { Agreement } from './types';
import { founderStorage } from './storage';
import { userStorage } from './storage';

/**
 * EIP-712 Domain and Types for Equity Swap Agreements
 */
export const EIP712_DOMAIN = {
  name: 'EquitySwapApp',
  version: '1',
  chainId: 1, // Mainnet - can be made configurable
  verifyingContract: '0x0000000000000000000000000000000000000000' as `0x${string}`,
} as const;

export const EIP712_TYPES = {
  EquitySwapAgreement: [
    { name: 'agreementId', type: 'string' },
    { name: 'partyA', type: 'address' },
    { name: 'partyB', type: 'address' },
    { name: 'equityAtoB', type: 'uint256' },
    { name: 'equityBtoA', type: 'uint256' },
    { name: 'termsHash', type: 'bytes32' },
  ],
} as const;

/**
 * Encode percentage to basis points (multiply by 10000)
 * e.g., 2.5% -> 25000
 */
export function encodePercent(percentage: number): bigint {
  // Convert percentage to basis points (multiply by 10000)
  return BigInt(Math.round(percentage * 10000));
}

/**
 * Decode basis points to percentage
 */
export function decodePercent(basisPoints: bigint): number {
  return Number(basisPoints) / 10000;
}

/**
 * Build EIP-712 message for an agreement
 */
export async function buildEip712Message(agreement: Agreement): Promise<{
  agreementId: string;
  partyA: `0x${string}`;
  partyB: `0x${string}`;
  equityAtoB: bigint;
  equityBtoA: bigint;
  termsHash: `0x${string}`;
}> {
  // Get founder addresses
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
  
  const currentVersion = agreement.versions[agreement.currentVersion];
  if (!currentVersion) {
    throw new Error('Invalid agreement version');
  }
  
  // Get terms hash - if not set, compute it from canonical terms
  let termsHash = (agreement as any).termsHash;
  if (!termsHash) {
    try {
      const { buildCanonicalTermsJson, computeTermsHash } = await import('./vc');
      const canonicalTerms = await buildCanonicalTermsJson(agreement);
      termsHash = computeTermsHash(canonicalTerms);
    } catch (error) {
      console.error('Error computing terms hash:', error);
      // Use a default hash if computation fails
      termsHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
    }
  }
  
  return {
    agreementId: agreement.id,
    partyA: userA.ethereumAddress.toLowerCase() as `0x${string}`,
    partyB: userB.ethereumAddress.toLowerCase() as `0x${string}`,
    equityAtoB: encodePercent(currentVersion.equityFromCompanyA),
    equityBtoA: encodePercent(currentVersion.equityFromCompanyB),
    termsHash: termsHash as `0x${string}`,
  };
}

/**
 * Verify an EIP-712 signature for an agreement
 */
export async function verifyAgreementSignature(
  agreement: Agreement,
  signerAddress: string,
  signature: `0x${string}`
): Promise<boolean> {
  try {
    const message = await buildEip712Message(agreement);
    
    // Normalize addresses for comparison
    const normalizedSigner = signerAddress.toLowerCase();
    const normalizedPartyA = message.partyA.toLowerCase();
    const normalizedPartyB = message.partyB.toLowerCase();
    
    // Check if signer is one of the parties
    if (normalizedSigner !== normalizedPartyA && normalizedSigner !== normalizedPartyB) {
      return false;
    }
    
    // Recover the address from the signature
    const recoveredAddress = await recoverTypedDataAddress({
      domain: EIP712_DOMAIN,
      types: EIP712_TYPES,
      primaryType: 'EquitySwapAgreement',
      message,
      signature,
    });
    
    // Compare recovered address with signer address
    return recoveredAddress.toLowerCase() === normalizedSigner;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

