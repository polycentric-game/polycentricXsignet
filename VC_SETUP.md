# Verifiable Credentials Setup Guide

This guide explains how to set up and use Verifiable Credentials (VCs) for equity swap agreements.

## Prerequisites

1. **Issuer Private Key**: You need to generate an Ethereum keypair for the issuer (the backend that signs VCs).

## Setup Steps

### 1. Generate Issuer Keypair

Generate a new Ethereum private key for the issuer. **DO NOT use a user wallet or any key with funds.**

You can generate a key using:
- `cast wallet new` (Foundry)
- `ethers.Wallet.createRandom()` (ethers.js)
- Any Ethereum key generator

**Example:**
```bash
# Using Foundry
cast wallet new

# Or using Node.js
node -e "const { ethers } = require('ethers'); console.log(ethers.Wallet.createRandom().privateKey);"
```

### 2. Set Environment Variable

Add the issuer private key to your environment variables:

```bash
# .env.local (for local development)
ISSUER_PRIVATE_KEY=0x...your_private_key_here

# Or in your production environment
export ISSUER_PRIVATE_KEY=0x...your_private_key_here
```

**⚠️ SECURITY WARNING:**
- Never commit the private key to version control
- Store it securely in your production environment
- Use environment variable management tools (e.g., Vercel, AWS Secrets Manager)
- Consider key rotation strategies for production

### 3. Run Database Migration

Apply the database migration to add VC-related fields:

```bash
# If using Supabase CLI
supabase migration up

# Or manually run the SQL in supabase/migrations/002_add_vc_fields.sql
```

### 4. Verify Setup

The issuer DID will be automatically computed as:
```
did:pkh:eip155:1:<ISSUER_ADDRESS>
```

You can verify the issuer address is correct by checking the logs when the app starts, or by calling the issuer utilities.

## How It Works

### 1. Agreement Signing Flow

1. Founder A opens an agreement page
2. Frontend fetches EIP-712 domain, types, and message from `/api/agreements/:id/eip712`
3. User signs the typed data using their wallet
4. Signature is sent to `/api/agreements/:id/sign`
5. Backend verifies the signature
6. When both parties have signed, the agreement is finalized and a VC is issued

### 2. VC Issuance

When an agreement is finalized (both parties have signed):
- A canonical terms JSON is generated
- Terms hash is computed (keccak256)
- VC payload is built with:
  - Issuer DID
  - Both parties' DIDs and signatures
  - Equity swap details
  - Agreement hash
- VC is signed as a JWT using the issuer's Ethereum key (ES256K)
- JWT is stored in the database

### 3. Retrieving VCs

Parties can retrieve their VC by calling:
```
GET /api/agreements/:id/credential
```

This returns:
- `vcJwt`: The signed JWT string
- `payload`: Decoded payload for convenience

### 4. VC Verification

VCs can be verified using the `verifyEquitySwapVcJwt` function:
- Checks JWT structure
- Verifies issuer DID
- Validates VC type
- Verifies JWT signature (ES256K)
- Optionally verifies embedded EIP-712 signatures
- Validates terms hash

## API Endpoints

### POST `/api/agreements/:id/sign`
Submit an EIP-712 signature for an agreement.

**Request:**
```json
{
  "signature": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "agreement": {...},
  "isFinalized": true
}
```

### GET `/api/agreements/:id/eip712`
Get EIP-712 domain, types, and message for signing.

**Response:**
```json
{
  "domain": {...},
  "types": {...},
  "primaryType": "EquitySwapAgreement",
  "message": {...}
}
```

### GET `/api/agreements/:id/credential`
Get the Verifiable Credential JWT for a finalized agreement.

**Response:**
```json
{
  "agreementId": "...",
  "vcJwt": "eyJ...",
  "payload": {...}
}
```

## VC Structure

The VC follows the W3C Verifiable Credentials v2 specification:

```json
{
  "iss": "did:pkh:eip155:1:0x...",
  "sub": "did:pkh:eip155:1:0x...",
  "nbf": 1234567890,
  "vc": {
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    "type": ["VerifiableCredential", "EquitySwapAgreementCredential"],
    "credentialSubject": {
      "agreementId": "...",
      "partyA": {
        "id": "did:pkh:eip155:1:0x...",
        "ethAddress": "0x...",
        "signature": "0x..."
      },
      "partyB": {
        "id": "did:pkh:eip155:1:0x...",
        "ethAddress": "0x...",
        "signature": "0x..."
      },
      "equitySwap": [...],
      "agreementHash": "0x...",
      "signedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

## Troubleshooting

### "ISSUER_PRIVATE_KEY environment variable is not set"
- Make sure you've set the `ISSUER_PRIVATE_KEY` environment variable
- Restart your development server after setting it

### "Invalid signature" errors
- Ensure the EIP-712 message matches exactly between frontend and backend
- Check that the chain ID matches (currently set to 1 for mainnet)
- Verify the user's wallet address matches the agreement party

### VC not issued after both signatures
- Check server logs for VC issuance errors
- Verify the issuer private key is valid
- Ensure the database migration has been applied

## Security Considerations

1. **Private Key Security**: The issuer private key must be kept secret
2. **Key Rotation**: Plan for key rotation in production (v2 feature)
3. **Signature Verification**: Always verify signatures server-side
4. **Terms Hash**: The terms hash ensures agreement integrity
5. **DID Format**: Uses `did:pkh:eip155:1:` format for Ethereum addresses

## Future Enhancements

- Key rotation support
- VC revocation
- VC expiration
- Multiple chain support
- Enhanced verification UI
- QR code generation for VCs

