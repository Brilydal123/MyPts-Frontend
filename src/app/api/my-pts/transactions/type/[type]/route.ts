import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

import { TransactionType } from '@/types/mypts';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the transaction type from the URL
    const { type } = await params;
    const transactionType = type as TransactionType;

    // Validate transaction type
    const validTypes = Object.values(TransactionType);
    if (!validTypes.includes(transactionType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid transaction type' },
        { status: 400 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Mock transactions data for the specific type
    const mockTransactions = Array.from({ length: 5 }, (_, i) => ({
      _id: `tx_${transactionType}_${i + offset + 1}`,
      profileId: session.user.id,
      type: transactionType,
      amount: transactionType.includes('SENT') || transactionType === 'PURCHASE_PRODUCT'
        ? -Math.floor(Math.random() * 50) - 5
        : Math.floor(Math.random() * 100) + 10,
      balance: 1000 - (i * 10),
      description: `Mock ${transactionType} transaction #${i + offset + 1}`,
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - (i * 86400000)).toISOString(),
      updatedAt: new Date(Date.now() - (i * 86400000)).toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: {
        transactions: mockTransactions,
        pagination: {
          total: 25,
          limit,
          offset,
          hasMore: offset + limit < 25
        }
      }
    });
  } catch (error) {
    console.error(`Error in transactions by type API route:`, error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
