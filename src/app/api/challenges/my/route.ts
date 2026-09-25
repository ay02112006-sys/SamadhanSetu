// src/app/api/challenges/my/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getChallengeCollection } from '@/lib/challenge';
import { Challenge } from '@/types/challenge';

export async function GET() {
  const session = await getServerAuthSession();
  if (!session || session.user.role !== 'CITIZEN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  }

  const challengesColl = await getChallengeCollection();
  const userId = session.user.id as string;
  const challenges: Challenge[] = await challengesColl
    .find({ submittedBy: userId })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({ success: true, data: challenges }, { status: 200 });
}
