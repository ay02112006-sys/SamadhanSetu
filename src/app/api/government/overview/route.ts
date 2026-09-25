// src/app/api/government/overview/route.ts
// Consolidated government executive overview using MongoDB aggregations.
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getChallengeCollection } from '@/lib/challenge';
import { getProjectsCollection } from '@/lib/project';
import { getUsersCollection } from '@/lib/university';
import {
  getIndustryProfileCollection,
  getIndustryCollaborationCollection,
} from '@/lib/industry';

async function verifyGovAuth() {
  const session = await getServerAuthSession();
  if (!session?.user) return null;
  const user = session.user as { id?: string; role?: string };
  if (user.role !== 'GOVERNMENT') return null;
  return user;
}

export async function GET() {
  try {
    const user = await verifyGovAuth();
    if (!user) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const [challengeColl, projectsColl, usersColl, industryProfileColl, collabColl] = await Promise.all([
      getChallengeCollection(),
      getProjectsCollection(),
      getUsersCollection(),
      getIndustryProfileCollection(),
      getIndustryCollaborationCollection(),
    ]);

    const [
      totalChallenges,
      validatedChallenges,
      totalProjects,
      activeProjects,
      completedProjects,
      totalUniversities,
      totalIndustry,
      activeCollaborations,
    ] = await Promise.all([
      challengeColl.countDocuments({}),
      challengeColl.countDocuments({ status: 'VALIDATED' }),
      projectsColl.countDocuments({}),
      projectsColl.countDocuments({ status: { $in: ['PLANNING', 'IN_PROGRESS', 'UNDER_REVIEW', 'TESTING'] } }),
      projectsColl.countDocuments({ status: 'COMPLETED' }),
      usersColl.countDocuments({ role: 'UNIVERSITY' }),
      industryProfileColl.countDocuments({}),
      collabColl.countDocuments({ status: { $in: ['INITIATED', 'ACTIVE'] } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalChallenges,
        validatedChallenges,
        totalProjects,
        activeProjects,
        completedProjects,
        totalUniversities,
        totalIndustry,
        activeCollaborations,
      },
    });
  } catch (error) {
    console.error('GET /api/government/overview error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
