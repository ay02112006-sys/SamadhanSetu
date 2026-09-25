// src/app/api/industry/collaborations/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getIndustryCollaborationCollection } from '@/lib/industry';

export async function GET() {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { id?: string; role?: string };
    if (user.role !== 'INDUSTRY' || !user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const collabColl = await getIndustryCollaborationCollection();
    const collaborations = await collabColl
      .find({ industryId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, collaborations });
  } catch (error) {
    console.error('GET /api/industry/collaborations error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
