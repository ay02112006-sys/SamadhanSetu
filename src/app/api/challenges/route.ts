// src/app/api/challenges/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getChallengeCollection } from '@/lib/challenge';
import { notifyChallengeSubmitted } from '@/lib/notifications';
import { Challenge, ChallengeStatus, ChallengePriority } from '@/types/challenge';
import { z } from 'zod';

const challengeSchema = z.object({
  title: z.string().min(5).max(150),
  description: z.string().min(20).max(5000),
  domain: z.enum([
    'EDUCATION',
    'HEALTHCARE',
    'AGRICULTURE',
    'WATER',
    'SANITATION',
    'ENVIRONMENT',
    'RURAL_LIVELIHOODS',
    'ACCESSIBILITY',
    'URBAN_INFRASTRUCTURE',
    'PUBLIC_SERVICES',
    'OTHER',
  ]),
  location: z.object({
    state: z.string().optional(),
    district: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  // attachments are received as metadata only for now
  attachments: z.array(
    z.object({ filename: z.string(), contentType: z.string() })
  ).optional(),
});

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session || session.user.role !== 'CITIZEN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  }

  const body = await req.json();
  const parseResult = challengeSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ success: false, error: 'Invalid request data' }, { status: 400 });
  }
  const data = parseResult.data;

  const challenges = await getChallengeCollection();

  // Generate a human‑friendly challengeId (e.g., SAM-00001)
  const count = await challenges.countDocuments();
  const newIdNumber = count + 1;
  const challengeId = `SAM-${String(newIdNumber).padStart(5, '0')}`;

  const now = new Date();
  const newChallenge: Challenge = {
    challengeId,
    title: data.title,
    description: data.description,
    domain: data.domain,
    location: data.location,
    attachments: data.attachments,
    status: 'SUBMITTED' as ChallengeStatus,
    priority: 'MEDIUM' as ChallengePriority,
    submittedBy: session.user.id as string,
    submittedByName: session.user.name ?? '',
    createdAt: now,
    updatedAt: now,
    // future optional fields left undefined
  };

  await challenges.insertOne(newChallenge);

  // Phase 9: Send notification
  await notifyChallengeSubmitted(session.user.id as string, challengeId, data.title);

  return NextResponse.json({ success: true, data: newChallenge }, { status: 201 });
}
