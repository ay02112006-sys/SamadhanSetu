// src/app/api/government/analytics/universities/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getUsersCollection, getUniversityMatchCollection } from '@/lib/university';
import { getProjectsCollection } from '@/lib/project';

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

    const [usersColl, matchColl, projectsColl] = await Promise.all([
      getUsersCollection(),
      getUniversityMatchCollection(),
      getProjectsCollection(),
    ]);

    const totalUniversities = await usersColl.countDocuments({ role: 'UNIVERSITY' });

    // Universities with matches
    const matchedUniversityIds = await matchColl.distinct('universityId');

    // Universities with accepted matches
    const acceptedMatchAgg = await matchColl.aggregate<{ _id: string; count: number }>([
      { $match: { status: 'ACCEPTED' } },
      { $group: { _id: '$universityId', count: { $sum: 1 } } },
    ]).toArray();

    // Universities with active projects
    const activeProjectAgg = await projectsColl.aggregate<{ _id: string; count: number }>([
      { $match: { status: { $in: ['PLANNING', 'IN_PROGRESS', 'UNDER_REVIEW', 'TESTING'] } } },
      { $group: { _id: '$universityId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray();

    // Universities with completed projects
    const completedProjectAgg = await projectsColl.aggregate<{ _id: string; count: number }>([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: '$universityId', count: { $sum: 1 } } },
    ]).toArray();
    const completedMap = new Map(completedProjectAgg.map((a) => [a._id, a.count]));

    // Fetch names for top active project universities
    const topIds = activeProjectAgg.slice(0, 10).map((a) => a._id);
    const universities = await usersColl
      .find({ role: 'UNIVERSITY' }, {
        projection: { _id: 1, name: 1, 'universityProfile.universityName': 1, 'universityProfile.city': 1, 'universityProfile.state': 1 }
      })
      .toArray();
    const uniMap = new Map(universities.map((u) => [u._id?.toString(), u]));

    const topUniversities = topIds.map((id) => {
      const uni = uniMap.get(id);
      const activeCount = activeProjectAgg.find((a) => a._id === id)?.count ?? 0;
      const completedCount = completedMap.get(id) ?? 0;
      return {
        universityId: id,
        name: uni?.universityProfile?.universityName ?? uni?.name ?? 'Unknown',
        city: uni?.universityProfile?.city ?? '',
        state: uni?.universityProfile?.state ?? '',
        activeProjects: activeCount,
        completedProjects: completedCount,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        totalUniversities,
        universitiesWithMatches: matchedUniversityIds.length,
        universitiesWithAcceptedChallenges: acceptedMatchAgg.length,
        universitiesWithActiveProjects: activeProjectAgg.length,
        universitiesWithCompletedProjects: completedProjectAgg.length,
        topUniversities,
      },
    });
  } catch (error) {
    console.error('GET government university analytics error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
