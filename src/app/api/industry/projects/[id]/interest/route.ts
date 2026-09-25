// src/app/api/industry/projects/[id]/interest/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import {
  getIndustryProfileCollection,
  getIndustryInterestCollection,
  getIndustryMatchCollection,
} from '@/lib/industry';
import { getProjectsCollection } from '@/lib/project';
import { notifyIndustryInterestReceived } from '@/lib/notifications';
import { z } from 'zod';
import { IndustryInterest, InterestStatus } from '@/types/industry-interest';
import { SupportCapability } from '@/types/industry';
import { ObjectId } from 'mongodb';

const interestSchema = z.object({
  supportTypes: z
    .array(
      z.enum([
        'MENTORSHIP', 'FUNDING', 'PROTOTYPING', 'TESTING', 'TECHNOLOGY',
        'PILOT_DEPLOYMENT', 'IMPLEMENTATION', 'MARKET_ACCESS', 'DOMAIN_EXPERTISE', 'OTHER',
      ])
    )
    .min(1, 'At least one support type required'),
  message: z.string().max(500).optional(),
  proposedContribution: z.string().min(10, 'Please describe your proposed contribution'),
});

const ELIGIBLE_FOR_INTEREST = ['PLANNING', 'IN_PROGRESS', 'UNDER_REVIEW', 'TESTING', 'COMPLETED'];

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
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const projectId = params.id;

    // Verify profile exists
    const profileColl = await getIndustryProfileCollection();
    const profile = await profileColl.findOne({ userId: user.id });
    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Please complete your industry profile before expressing interest' },
        { status: 400 }
      );
    }

    // Verify project exists and is eligible
    const projectsColl = await getProjectsCollection();
    const project = await projectsColl.findOne({ projectId });
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }
    if (!ELIGIBLE_FOR_INTEREST.includes(project.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot express interest in a project with status: ${project.status}` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = interestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: parsed.error.errors },
        { status: 422 }
      );
    }

    const data = parsed.data;

    // Prevent duplicate active interests
    const interestColl = await getIndustryInterestCollection();
    const existing = await interestColl.findOne({
      projectId,
      industryId: user.id,
      status: { $in: ['PENDING', 'ACCEPTED'] },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'You already have an active interest in this project' },
        { status: 409 }
      );
    }

    const interestId = `INT-${new ObjectId().toHexString().substring(0, 10).toUpperCase()}`;
    const now = new Date();

    const interest: IndustryInterest = {
      interestId,
      projectId,
      industryId: user.id,
      universityId: project.universityId,
      supportTypes: data.supportTypes as SupportCapability[],
      message: data.message,
      proposedContribution: data.proposedContribution,
      status: 'PENDING' as InterestStatus,
      createdAt: now,
      updatedAt: now,
    };

    const result = await interestColl.insertOne(interest);
    if (!result.acknowledged) {
      return NextResponse.json({ success: false, error: 'Failed to submit interest' }, { status: 500 });
    }

    // Update match status to INTERESTED
    const matchColl = await getIndustryMatchCollection();
    await matchColl.updateOne(
      { projectId, industryId: user.id },
      { $set: { status: 'INTERESTED', updatedAt: now } }
    );

    // Phase 9: Notification
    const orgName = profile.organizationName || (session.user as { name?: string }).name || 'An industry partner';
    await notifyIndustryInterestReceived(project.universityId, projectId, interestId, orgName);

    return NextResponse.json({ success: true, interest }, { status: 201 });
  } catch (error) {
    console.error('POST /api/industry/projects/[id]/interest error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
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
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const interestColl = await getIndustryInterestCollection();
    const interest = await interestColl.findOne({ projectId: params.id, industryId: user.id });

    return NextResponse.json({ success: true, interest: interest ?? null });
  } catch (error) {
    console.error('GET /api/industry/projects/[id]/interest error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
