// src/app/api/industry/collaborations/[id]/funding/[fundingId]/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import {
  getIndustryCollaborationCollection,
  getFundingCommitmentCollection,
} from '@/lib/industry';
import { z } from 'zod';
import { FundingStatus } from '@/types/industry-collaboration';

const updateSchema = z.object({
  status: z.enum(['PROPOSED', 'COMMITTED', 'RELEASED', 'CANCELLED']),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; fundingId: string } }
) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { id?: string; role?: string };
    if (user.role !== 'INDUSTRY' || !user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // IDOR: verify collaboration belongs to this industry user
    const collabColl = await getIndustryCollaborationCollection();
    const collab = await collabColl.findOne({ collaborationId: params.id, industryId: user.id });
    if (!collab) {
      return NextResponse.json({ success: false, error: 'Collaboration not found or access denied' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation error', details: parsed.error.errors }, { status: 422 });
    }

    const { status: newStatus } = parsed.data;
    const fundingColl = await getFundingCommitmentCollection();

    const funding = await fundingColl.findOne({ fundingId: params.fundingId, collaborationId: params.id });
    if (!funding) {
      return NextResponse.json({ success: false, error: 'Funding record not found' }, { status: 404 });
    }

    const updateSet: { status: FundingStatus; updatedAt: Date; committedAt?: Date } = {
      status: newStatus as FundingStatus,
      updatedAt: new Date(),
    };
    if (newStatus === 'COMMITTED') {
      updateSet.committedAt = new Date();
    }

    await fundingColl.updateOne({ fundingId: params.fundingId }, { $set: updateSet });

    return NextResponse.json({ success: true, message: 'Funding status updated' });
  } catch (error) {
    console.error('PATCH funding error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
