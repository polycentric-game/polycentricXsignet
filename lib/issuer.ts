import { privateKeyToAccount } from 'viem/accounts';
import { parseEther } from 'viem';

/**
 * Issuer keypair management for VC issuance
 * 
 * The issuer private key should be stored in environment variable:
 * ISSUER_PRIVATE_KEY (without 0x prefix, or with it - we handle both)
 * 
 * NEVER commit this to version control!
 */

function getIssuerPrivateKey(): `0x${string}` {
  const key = process.env.ISSUER_PRIVATE_KEY;
  if (!key) {
    throw new Error('ISSUER_PRIVATE_KEY environment variable is not set');
  }
  
  // Ensure it starts with 0x
  if (key.startsWith('0x')) {
    return key as `0x${string}`;
  }
  return `0x${key}` as `0x${string}`;
}

let issuerAccount: ReturnType<typeof privateKeyToAccount> | null = null;

export function getIssuerAccount() {
  if (!issuerAccount) {
    const privateKey = getIssuerPrivateKey();
    issuerAccount = privateKeyToAccount(privateKey);
  }
  return issuerAccount;
}

export function getIssuerAddress(): `0x${string}` {
  return getIssuerAccount().address;
}

export function getIssuerDid(): string {
  const address = getIssuerAddress();
  return `did:pkh:eip155:1:${address}`;
}

/**
 * Generate a DID for any Ethereum address
 */
export function addressToDid(address: string): string {
  // Normalize address to lowercase
  const normalized = address.toLowerCase();
  return `did:pkh:eip155:1:${normalized}`;
}

