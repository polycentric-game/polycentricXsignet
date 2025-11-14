import { Agreement } from './types';
import { buildEquitySwapVcPayload } from './vc';
import { agreementStorage } from './storage';
import { hexToBytes } from 'viem';
import { secp256k1 } from '@noble/curves/secp256k1.js';

/**
 * Base64 URL encode (JWT format)
 * Works in both Node.js and browser environments
 */
function base64UrlEncode(data: string | Uint8Array): string {
  let base64: string;
  
  // Use Buffer in Node.js, btoa in browser
  if (typeof Buffer !== 'undefined') {
    // Node.js environment
    if (typeof data === 'string') {
      base64 = Buffer.from(data, 'utf8').toString('base64');
    } else {
      base64 = Buffer.from(data).toString('base64');
    }
  } else {
    // Browser environment
    if (typeof data === 'string') {
      base64 = btoa(unescape(encodeURIComponent(data)));
    } else {
      // For Uint8Array, convert to base64 more efficiently
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        const chunkArray = Array.from(chunk);
        binary += String.fromCharCode.apply(null, chunkArray as any);
      }
      base64 = btoa(binary);
    }
  }
  
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Sign JWT payload with issuer's Ethereum key (ES256K)
 * 
 * JWT structure: header.payload.signature
 * We use ES256K (secp256k1) which is compatible with Ethereum keys
 * 
 * Note: jose library doesn't support ES256K directly, so we implement it manually
 */
export async function signJwt(payload: any): Promise<string> {
  try {
    const header = {
      alg: 'ES256K',
      typ: 'JWT',
    };
    
    // Encode header and payload
    // Use a replacer function to handle any potential BigInt values
    const jsonStringify = (obj: any): string => {
      try {
        return JSON.stringify(obj, (key, value) => {
          if (typeof value === 'bigint') {
            return value.toString();
          }
          return value;
        });
      } catch (error: any) {
        console.error('JSON stringify error:', error);
        console.error('Object that failed to stringify:', obj);
        throw new Error(`Failed to stringify JWT data: ${error.message}`);
      }
    };
    
    let encodedHeader: string;
    let encodedPayload: string;
    
    try {
      encodedHeader = base64UrlEncode(jsonStringify(header));
      encodedPayload = base64UrlEncode(jsonStringify(payload));
    } catch (error: any) {
      console.error('Base64 encoding error:', error);
      throw new Error(`Failed to encode JWT: ${error.message}`);
    }
    
    // Create the message to sign: header.payload
    const message = `${encodedHeader}.${encodedPayload}`;
    
    // Get private key
    const privateKey = process.env.ISSUER_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('ISSUER_PRIVATE_KEY environment variable is not set');
    }
    
    const privateKeyHex = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    let privateKeyBytes: Uint8Array;
    
    try {
      privateKeyBytes = hexToBytes(privateKeyHex as `0x${string}`);
    } catch (error: any) {
      console.error('Private key conversion error:', error);
      throw new Error(`Invalid private key format: ${error.message}`);
    }
    
    // Ensure we have exactly 32 bytes for the private key
    const privateKey32 = privateKeyBytes.slice(0, 32);
    if (privateKey32.length !== 32) {
      throw new Error(`Invalid private key length: expected 32 bytes, got ${privateKey32.length}`);
    }
    
    // For ES256K in JWT, we sign the raw message bytes (not keccak256 hash)
    const messageBytes = new TextEncoder().encode(message);
    
    // Sign with secp256k1
    // secp256k1.sign expects: (msgHash: Uint8Array, privateKey: PrivKey, opts?: SignOpts)
    // For ES256K in JWT, we need to hash the message with SHA-256 first
    let signature: any;
    try {
      // Import crypto for SHA-256 hashing
      const crypto = await import('crypto');
      
      // Hash the message with SHA-256 (ES256K in JWT context uses SHA-256)
      const messageHash = new Uint8Array(
        crypto.createHash('sha256').update(messageBytes).digest()
      );
      
      // Sign the hashed message using Uint8Array private key
      // secp256k1.sign expects privateKey as Uint8Array (or other compatible types)
      signature = secp256k1.sign(messageHash, privateKey32, { lowS: true });
    } catch (error: any) {
      console.error('secp256k1 signing error:', error);
      console.error('Error type:', typeof error);
      console.error('Message bytes length:', messageBytes.length);
      console.error('Private key length:', privateKey32.length);
      throw new Error(`Failed to sign JWT: ${error.message}`);
    }
    
    // ES256K signature format for JWT: r and s as 32-byte big-endian integers
    // secp256k1.sign already returns a 64-byte Uint8Array: [r (32 bytes), s (32 bytes)]
    // No conversion needed - use the signature directly
    if (signature.length !== 64) {
      throw new Error(`Invalid signature length: expected 64 bytes, got ${signature.length}`);
    }
    
    // Encode signature
    const encodedSignature = base64UrlEncode(signature);
    
    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  } catch (error: any) {
    console.error('signJwt error:', error);
    throw error;
  }
}

/**
 * Issue a Verifiable Credential JWT for an agreement
 */
export async function issueEquitySwapVcJwt(agreementId: string): Promise<string> {
  // Load agreement
  const agreement = await agreementStorage.findById(agreementId);
  if (!agreement) {
    throw new Error('Agreement not found');
  }
  
  // Verify agreement is finalized
  const sigA = (agreement as any).sigA;
  const sigB = (agreement as any).sigB;
  const finalizedAt = (agreement as any).finalizedAt;
  
  if (!sigA || !sigB) {
    throw new Error('Agreement is not fully signed');
  }
  
  if (!finalizedAt) {
    throw new Error('Agreement is not finalized');
  }
  
  // Build VC payload
  const payload = await buildEquitySwapVcPayload(agreement);
  
  // Sign JWT
  const jwt = await signJwt(payload);
  
  // Persist JWT
  const updatedAgreement = {
    ...agreement,
    vcJwt: jwt,
  } as any;
  
  await agreementStorage.save(updatedAgreement);
  
  return jwt;
}

