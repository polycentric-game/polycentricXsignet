import { NextRequest, NextResponse } from 'next/server';
import { agreementStorage } from '@/lib/storage';
import { founderStorage } from '@/lib/storage';
import { userStorage } from '@/lib/storage';
import { issueEquitySwapVcJwt } from '@/lib/jwt-vc';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agreementId = params.id;
    
    // Get wallet address from header
    const walletAddress = request.headers.get('X-Wallet-Address');
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 401 }
      );
    }
    
    const userAddress = walletAddress.toLowerCase();
    
    // Load agreement
    const agreement = await agreementStorage.findById(agreementId);
    if (!agreement) {
      return NextResponse.json(
        { error: 'Agreement not found' },
        { status: 404 }
      );
    }
    
    // Get founders and their addresses
    const founderA = await founderStorage.findById(agreement.founderAId);
    const founderB = await founderStorage.findById(agreement.founderBId);
    
    if (!founderA || !founderB) {
      return NextResponse.json(
        { error: 'Founders not found' },
        { status: 404 }
      );
    }
    
    const userA = await userStorage.findById(founderA.userId);
    const userB = await userStorage.findById(founderB.userId);
    
    if (!userA?.ethereumAddress || !userB?.ethereumAddress) {
      return NextResponse.json(
        { error: 'Founder addresses not found' },
        { status: 404 }
      );
    }
    
    const partyAAddress = userA.ethereumAddress.toLowerCase();
    const partyBAddress = userB.ethereumAddress.toLowerCase();
    
    // Verify user is a party
    if (userAddress !== partyAAddress && userAddress !== partyBAddress) {
      return NextResponse.json(
        { error: 'You are not authorized to access this credential' },
        { status: 403 }
      );
    }
    
    const agreementWithFields = agreement as any;
    
    // Debug logging
    console.log('Checking signatures for agreement:', agreementId);
    console.log('sigA from DB:', agreementWithFields.sigA ? 'present' : 'missing');
    console.log('sigB from DB:', agreementWithFields.sigB ? 'present' : 'missing');
    console.log('Current version signatures:', agreement.versions[agreement.currentVersion]?.signatures);
    
    // Check if both signatures are present in VC fields
    let sigA = agreementWithFields.sigA;
    let sigB = agreementWithFields.sigB;
    
    // If not in VC fields, check versions array (for backward compatibility)
    // Note: Only use version signatures if they look like EIP-712 signatures (start with 0x and are 132 chars)
    if (!sigA || !sigB) {
      const currentVersion = agreement.versions[agreement.currentVersion];
      if (currentVersion?.signatures) {
        const versionSignatures = currentVersion.signatures;
        // Check if version signatures look like EIP-712 (hex strings starting with 0x)
        const founderASig = versionSignatures[agreement.founderAId];
        const founderBSig = versionSignatures[agreement.founderBId];
        
        if (!sigA && founderASig && founderASig.startsWith('0x') && founderASig.length >= 130) {
          sigA = founderASig;
          console.log('Found sigA in versions array');
        }
        if (!sigB && founderBSig && founderBSig.startsWith('0x') && founderBSig.length >= 130) {
          sigB = founderBSig;
          console.log('Found sigB in versions array');
        }
      }
    }
    
    // Check if both signatures are present
    const bothSigned = sigA && sigB;
    
    if (!bothSigned) {
      // Provide more detailed error message
      const missingSignatures = [];
      if (!sigA) missingSignatures.push('Party A');
      if (!sigB) missingSignatures.push('Party B');
      
      return NextResponse.json(
        { 
          error: `Agreement is not fully signed yet. Missing signatures from: ${missingSignatures.join(', ')}. Both parties must sign before a credential can be issued.` 
        },
        { status: 409 }
      );
    }
    
    // If signatures were found in versions but not in VC fields, migrate them
    if (!agreementWithFields.sigA || !agreementWithFields.sigB) {
      agreementWithFields.sigA = sigA;
      agreementWithFields.sigB = sigB;
      // Save the migrated signatures
      agreementWithFields.updatedAt = new Date().toISOString();
      await agreementStorage.save(agreementWithFields);
      // Reload to get fresh data
      const reloaded = await agreementStorage.findById(agreementId);
      if (reloaded) {
        Object.assign(agreementWithFields, reloaded);
      }
    }
    
    // If not finalized but both signed, finalize it now
    if (!agreementWithFields.finalizedAt) {
      agreementWithFields.finalizedAt = new Date().toISOString();
      agreementWithFields.updatedAt = new Date().toISOString();
      await agreementStorage.save(agreementWithFields);
      // Reload to get fresh data
      const reloaded = await agreementStorage.findById(agreementId);
      if (reloaded) {
        Object.assign(agreementWithFields, reloaded);
      }
    }
    
    // Check if VC JWT exists, if not, issue it
    let vcJwt = agreementWithFields.vcJwt;
    if (!vcJwt) {
      try {
        // Check if issuer key is configured
        if (!process.env.ISSUER_PRIVATE_KEY) {
          return NextResponse.json(
            { 
              error: 'VC issuance is not configured. ISSUER_PRIVATE_KEY environment variable is not set. Please configure the issuer key to issue verifiable credentials.',
              details: 'See VC_SETUP.md for instructions on setting up the issuer key.'
            },
            { status: 500 }
          );
        }
        
        vcJwt = await issueEquitySwapVcJwt(agreementId);
        // Reload to get the updated VC JWT
        const updatedAgreement = await agreementStorage.findById(agreementId);
        if (updatedAgreement) {
          vcJwt = (updatedAgreement as any).vcJwt || vcJwt;
        }
      } catch (vcError: any) {
        console.error('VC issuance error:', vcError);
        console.error('VC issuance error stack:', vcError?.stack);
        return NextResponse.json(
          { 
            error: 'Failed to issue credential: ' + (vcError?.message || 'Unknown error'),
            details: process.env.NODE_ENV === 'development' ? vcError?.stack : undefined
          },
          { status: 500 }
        );
      }
    }
    
    // Decode payload for convenience (just the payload part)
    let decodedPayload = null;
    try {
      const parts = vcJwt.split('.');
      if (parts.length === 3) {
        const payloadBase64 = parts[1];
        const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
        decodedPayload = JSON.parse(payloadJson);
      }
    } catch (e) {
      // Ignore decode errors
    }
    
    return NextResponse.json({
      agreementId,
      vcJwt,
      payload: decodedPayload,
    });
  } catch (error: any) {
    console.error('Get credential error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      cause: error.cause,
    });
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

