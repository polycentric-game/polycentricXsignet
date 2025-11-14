import { NextRequest, NextResponse } from 'next/server';
import { agreementStorage, founderStorage, userStorage } from '@/lib/storage';
import { buildEip712Message } from '@/lib/eip712';
import { EIP712_DOMAIN, EIP712_TYPES } from '@/lib/eip712';

/**
 * GET /api/agreements/[id]/eip712
 * Returns the EIP-712 domain, types, and message for signing
 */
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
    
    // Verify user is a party to the agreement
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
    
    // Build EIP-712 message
    let message;
    try {
      message = await buildEip712Message(agreement);
    } catch (buildError: any) {
      console.error('Error building EIP-712 message:', buildError);
      console.error('Agreement data:', JSON.stringify(agreement, null, 2));
      throw new Error(`Failed to build EIP-712 message: ${buildError.message}`);
    }
    
    // Convert BigInt values to strings for JSON serialization
    const serializableMessage = {
      ...message,
      equityAtoB: message.equityAtoB.toString(),
      equityBtoA: message.equityBtoA.toString(),
    };
    
    return NextResponse.json({
      domain: EIP712_DOMAIN,
      types: EIP712_TYPES,
      primaryType: 'EquitySwapAgreement',
      message: serializableMessage,
    });
  } catch (error: any) {
    console.error('Get EIP-712 data error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

