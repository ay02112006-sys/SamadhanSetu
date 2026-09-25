// src/app/api/university/collaborations/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getIndustryCollaborationCollection } from '@/lib/industry';

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
    if (user.role !== 'UNIVERSITY' || !user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const collabColl = await getIndustryCollaborationCollection();
    // IDOR: universityId must match authenticated user
    const collab = await collabColl.findOne({ collaborationId: params.id, universityId: user.id });

    if (!collab) {
      return NextResponse.json({ success: false, error: 'Collaboration not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, collaboration: collab });
  } catch (error) {
    console.error('GET /api/university/collaborations/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
