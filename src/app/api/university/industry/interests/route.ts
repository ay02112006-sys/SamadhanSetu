// src/app/api/university/industry/interests/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import {
  getIndustryInterestCollection,
  getIndustryProfileCollection,
} from '@/lib/industry';
import { getProjectsCollection } from '@/lib/project';

export async function GET() {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { id?: string; role?: string };
    if (user.role !== 'UNIVERSITY' || !user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Only show interests for projects this university owns
    const projectsColl = await getProjectsCollection();
    const ownedProjects = await projectsColl
      .find({ universityId: user.id }, { projection: { projectId: 1 } })
      .toArray();
    const ownedProjectIds = ownedProjects.map((p) => p.projectId);

    if (ownedProjectIds.length === 0) {
      return NextResponse.json({ success: true, interests: [] });
    }

    const interestColl = await getIndustryInterestCollection();
    const interests = await interestColl
      .find({ universityId: user.id, projectId: { $in: ownedProjectIds } })
      .sort({ createdAt: -1 })
      .toArray();

    // Enrich with safe industry profile info
    const industryIds = [...new Set(interests.map((i) => i.industryId))];
    const profileColl = await getIndustryProfileCollection();
    const profiles = await profileColl.find({ userId: { $in: industryIds } }).toArray();
    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    const enriched = interests.map((interest) => {
      const profile = profileMap.get(interest.industryId);
      return {
        ...interest,
        industryOrganizationName: profile?.organizationName ?? 'Unknown Organization',
        industryOrganizationType: profile?.organizationType ?? 'OTHER',
        industryIndustrySector: profile?.industrySector ?? 'OTHER',
        industryCity: profile?.city ?? '',
        industryState: profile?.state ?? '',
      };
    });

    return NextResponse.json({ success: true, interests: enriched });
  } catch (error) {
    console.error('GET /api/university/industry/interests error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
