import { getIssuerDid, addressToDid } from './issuer';
import { agreementStorage } from './storage';
import { verifyAgreementSignature } from './eip712';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { hexToBytes, bytesToHex } from 'viem';

/**
 * Base64 URL decode
 */
function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return atob(str);
}

/**
 * Verify a Verifiable Credential JWT
 */
export async function verifyEquitySwapVcJwt(
  jwt: string
): Promise<{
  isValid: boolean;
  issuerDid?: string;
  payload?: any;
  errors?: string[];
}> {
  const errors: string[] = [];
  
  try {
    // Decode JWT
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      errors.push('Invalid JWT format');
      return { isValid: false, errors };
    }
    
    const [headerBase64, payloadBase64, signatureBase64] = parts;
    
    // Decode header
    let header: any;
    try {
      const headerJson = base64UrlDecode(headerBase64);
      header = JSON.parse(headerJson);
    } catch (e) {
      errors.push('Invalid JWT header');
      return { isValid: false, errors };
    }
    
    // Check algorithm
    if (header.alg !== 'ES256K') {
      errors.push(`Unsupported algorithm: ${header.alg}`);
      return { isValid: false, errors };
    }
    
    // Decode payload
    let payload: any;
    try {
      const payloadJson = base64UrlDecode(payloadBase64);
      payload = JSON.parse(payloadJson);
    } catch (e) {
      errors.push('Invalid JWT payload');
      return { isValid: false, errors };
    }
    
    // Check issuer DID
    const issuerDid = getIssuerDid();
    if (payload.iss !== issuerDid) {
      errors.push(`Invalid issuer: expected ${issuerDid}, got ${payload.iss}`);
    }
    
    // Check VC type
    if (!payload.vc?.type?.includes('EquitySwapAgreementCredential')) {
      errors.push('Missing or invalid VC type');
    }
    
    // Verify JWT signature
    // Reconstruct the message that was signed
    const message = `${headerBase64}.${payloadBase64}`;
    const messageBytes = new TextEncoder().encode(message);
    
    // Decode signature
    const signatureBytes = Uint8Array.from(
      atob(signatureBase64.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );
    
    if (signatureBytes.length !== 64) {
      errors.push('Invalid signature length');
      return { isValid: false, errors };
    }
    
    // Extract r and s (32 bytes each)
    const rBytes = signatureBytes.slice(0, 32);
    const sBytes = signatureBytes.slice(32, 64);
    
    // Convert to BigInt
    let r = BigInt(0);
    let s = BigInt(0);
    for (let i = 0; i < 32; i++) {
      r = (r << BigInt(8)) | BigInt(rBytes[i]);
      s = (s << BigInt(8)) | BigInt(sBytes[i]);
    }
    
    // Get issuer public key
    const { getIssuerAddress } = await import('./issuer');
    const issuerAddress = getIssuerAddress();
    
    // Recover public key from signature (simplified - in production, use proper verification)
    // For now, we'll verify by attempting to recover the address
    // This is a simplified verification - in production, use a proper JWT verification library
    
    // TODO: Implement proper ES256K signature verification
    // For now, we'll do basic checks and mark signature verification as a TODO
    // In production, you should use a library like did-jwt or implement proper secp256k1 verification
    
    // Optional: Verify embedded EIP-712 signatures
    if (payload.vc?.credentialSubject) {
      const agreementId = payload.vc.credentialSubject.agreementId;
      if (agreementId) {
        try {
          const agreement = await agreementStorage.findById(agreementId);
          if (agreement) {
            // Verify party A signature
            const sigA = payload.vc.credentialSubject.partyA?.signature;
            const partyAAddress = payload.vc.credentialSubject.partyA?.ethAddress;
            if (sigA && partyAAddress) {
              const isValidA = await verifyAgreementSignature(
                agreement,
                partyAAddress,
                sigA as `0x${string}`
              );
              if (!isValidA) {
                errors.push('Invalid party A signature in VC');
              }
            }
            
            // Verify party B signature
            const sigB = payload.vc.credentialSubject.partyB?.signature;
            const partyBAddress = payload.vc.credentialSubject.partyB?.ethAddress;
            if (sigB && partyBAddress) {
              const isValidB = await verifyAgreementSignature(
                agreement,
                partyBAddress,
                sigB as `0x${string}`
              );
              if (!isValidB) {
                errors.push('Invalid party B signature in VC');
              }
            }
            
            // Verify terms hash
            const agreementHash = payload.vc.credentialSubject.agreementHash;
            const storedHash = (agreement as any).termsHash;
            if (agreementHash && storedHash && agreementHash.toLowerCase() !== storedHash.toLowerCase()) {
              errors.push('Terms hash mismatch');
            }
          }
        } catch (e) {
          // Ignore agreement lookup errors for now
        }
      }
    }
    
    const isValid = errors.length === 0;
    
    return {
      isValid,
      issuerDid: payload.iss,
      payload,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    errors.push(error.message || 'Verification error');
    return { isValid: false, errors };
  }
}

