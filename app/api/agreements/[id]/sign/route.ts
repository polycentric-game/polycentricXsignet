import { NextRequest, NextResponse } from 'next/server';
import { agreementStorage } from '@/lib/storage';
import { founderStorage } from '@/lib/storage';
import { userStorage } from '@/lib/storage';
import { verifyAgreementSignature, buildEip712Message } from '@/lib/eip712';
import { issueEquitySwapVcJwt } from '@/lib/jwt-vc';
import { buildCanonicalTermsJson, computeTermsHash } from '@/lib/vc';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agreementId = params.id;
    const body = await request.json();
    const { signature } = body;
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Signature is required' },
        { status: 400 }
      );
    }
    
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
        { error: 'You are not authorized to sign this agreement' },
        { status: 403 }
      );
    }
    
    // Ensure canonical terms and hash are set
    let agreementWithFields = agreement as any;
    if (!agreementWithFields.canonicalTermsJson) {
      agreementWithFields.canonicalTermsJson = await buildCanonicalTermsJson(agreement);
      agreementWithFields.termsHash = computeTermsHash(agreementWithFields.canonicalTermsJson);
    }
    if (!agreementWithFields.termsHash) {
      agreementWithFields.termsHash = computeTermsHash(agreementWithFields.canonicalTermsJson);
    }
    
    // Set party addresses if not set
    if (!agreementWithFields.partyAAddress) {
      agreementWithFields.partyAAddress = partyAAddress;
    }
    if (!agreementWithFields.partyBAddress) {
      agreementWithFields.partyBAddress = partyBAddress;
    }
    
    // Get current version
    const currentVersion = agreement.versions[agreement.currentVersion];
    if (!currentVersion) {
      return NextResponse.json(
        { error: 'Invalid agreement version' },
        { status: 400 }
      );
    }
    
    // Set equity amounts from current version
    if (!agreementWithFields.equityAtoB) {
      agreementWithFields.equityAtoB = currentVersion.equityFromCompanyA;
    }
    if (!agreementWithFields.equityBtoA) {
      agreementWithFields.equityBtoA = currentVersion.equityFromCompanyB;
    }
    
    // Verify signature
    const isValid = await verifyAgreementSignature(
      agreementWithFields,
      userAddress,
      signature as `0x${string}`
    );
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }
    
    // Determine which founder is signing
    const signingFounderId = userAddress === partyAAddress 
      ? agreement.founderAId 
      : agreement.founderBId;
    
    // Store signature in VC fields
    if (userAddress === partyAAddress) {
      agreementWithFields.sigA = signature;
    } else {
      agreementWithFields.sigB = signature;
    }
    
    // Update the current version's signatures and approvedBy
    if (currentVersion) {
      const signatures = currentVersion.signatures || {};
      signatures[signingFounderId] = signature;
      
      // Add to approvedBy if not already there
      const updatedApprovedBy = currentVersion.approvedBy.includes(signingFounderId)
        ? currentVersion.approvedBy
        : [...currentVersion.approvedBy, signingFounderId];
      
      const updatedVersion = {
        ...currentVersion,
        approvedBy: updatedApprovedBy,
        signatures,
      };
      
      // Update the versions array
      const updatedVersions = [...agreement.versions];
      updatedVersions[agreement.currentVersion] = updatedVersion;
      agreementWithFields.versions = updatedVersions;
      
      // Check if both founders have approved (and signed)
      const bothApproved = updatedApprovedBy.includes(agreement.founderAId) && 
                          updatedApprovedBy.includes(agreement.founderBId) &&
                          signatures[agreement.founderAId] && 
                          signatures[agreement.founderBId];
      
      // Update status to approved if both have signed
      if (bothApproved && agreementWithFields.status !== 'approved' && agreementWithFields.status !== 'completed') {
        agreementWithFields.status = 'approved';
        
        // Update equity swapped for both founders
        const founderA = await founderStorage.findById(agreement.founderAId);
        const founderB = await founderStorage.findById(agreement.founderBId);
        
        if (founderA && founderB) {
          founderA.equitySwapped += currentVersion.equityFromCompanyA;
          founderB.equitySwapped += currentVersion.equityFromCompanyB;
          founderA.updatedAt = new Date().toISOString();
          founderB.updatedAt = new Date().toISOString();
          
          await founderStorage.save(founderA);
          await founderStorage.save(founderB);
        }
      }
    }
    
    // Check if both signatures are present (for VC issuance)
    const bothSigned = agreementWithFields.sigA && agreementWithFields.sigB;
    
    // If both signed and not finalized, finalize and issue VC
    if (bothSigned && !agreementWithFields.finalizedAt) {
      agreementWithFields.finalizedAt = new Date().toISOString();
      
      // Issue VC
      try {
        await issueEquitySwapVcJwt(agreementId);
      } catch (vcError) {
        console.error('VC issuance error:', vcError);
        // Continue even if VC issuance fails - we can retry later
      }
    }
    
    // Update updatedAt timestamp
    agreementWithFields.updatedAt = new Date().toISOString();
    
    // Save agreement
    await agreementStorage.save(agreementWithFields);
    
    // Reload to get updated state
    const updatedAgreement = await agreementStorage.findById(agreementId);
    
    return NextResponse.json({
      success: true,
      agreement: updatedAgreement,
      isFinalized: !!agreementWithFields.finalizedAt,
    });
  } catch (error: any) {
    console.error('Sign agreement error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

