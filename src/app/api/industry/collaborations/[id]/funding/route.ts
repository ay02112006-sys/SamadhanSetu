// src/app/api/industry/collaborations/[id]/funding/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import {
  getIndustryCollaborationCollection,
  getFundingCommitmentCollection,
} from '@/lib/industry';
import { notifyFundingCommitmentCreated } from '@/lib/notifications';
import { z } from 'zod';
import { FundingCommitment, FundingStatus } from '@/types/industry-collaboration';
import { ObjectId } from 'mongodb';

const VALID_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

const fundingSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().refine((c) => VALID_CURRENCIES.includes(c.toUpperCase()), {
    message: `Currency must be one of: ${VALID_CURRENCIES.join(', ')}`,
  }),
  purpose: z.string().min(5, 'Purpose required'),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { id?: string; role?: string };
    if (user.role !== 'INDUSTRY' || !user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden — only industry users can commit funding' }, { status: 403 });
    }

    // IDOR: verify industry owns this collaboration
    const collabColl = await getIndustryCollaborationCollection();
    const collab = await collabColl.findOne({ collaborationId: params.id, industryId: user.id });
    if (!collab) {
      return NextResponse.json({ success: false, error: 'Collaboration not found or access denied' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = fundingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation error', details: parsed.error.errors }, { status: 422 });
    }

    const data = parsed.data;
    const fundingId = `FND-${new ObjectId().toHexString().substring(0, 10).toUpperCase()}`;
    const now = new Date();

    const funding: FundingCommitment = {
      fundingId,
      collaborationId: params.id,
      amount: data.amount,
      currency: data.currency.toUpperCase(),
      purpose: data.purpose,
      status: 'PROPOSED' as FundingStatus,
      createdAt: now,
      updatedAt: now,
    };

    const fundingColl = await getFundingCommitmentCollection();
    const result = await fundingColl.insertOne(funding);
    if (!result.acknowledged) {
      return NextResponse.json({ success: false, error: 'Failed to create funding record' }, { status: 500 });
    }

    // Phase 9: Notification
    await notifyFundingCommitmentCreated(collab.universityId, 'UNIVERSITY', fundingId, params.id, data.amount, data.currency);

    return NextResponse.json({ success: true, funding }, { status: 201 });
  } catch (error) {
    console.error('POST /api/industry/collaborations/[id]/funding error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { id?: string; role?: string };
    if (!user.id || !['INDUSTRY', 'UNIVERSITY'].includes(user.role ?? '')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const collabColl = await getIndustryCollaborationCollection();
    let collab = null;
    if (user.role === 'INDUSTRY') {
      collab = await collabColl.findOne({ collaborationId: params.id, industryId: user.id });
    } else {
      collab = await collabColl.findOne({ collaborationId: params.id, universityId: user.id });
    }

    if (!collab) {
      return NextResponse.json({ success: false, error: 'Collaboration not found or access denied' }, { status: 404 });
    }

    const fundingColl = await getFundingCommitmentCollection();
    const funding = await fundingColl
      .find({ collaborationId: params.id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, funding });
  } catch (error) {
    console.error('GET /api/industry/collaborations/[id]/funding error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
