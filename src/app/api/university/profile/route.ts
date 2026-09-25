// src/app/api/university/profile/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getUsersCollection } from '@/lib/university';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const profileSchema = z.object({
  universityName: z.string().min(1, 'University name is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  disciplines: z.array(z.string()).min(1, 'At least one discipline is required'),
  researchAreas: z.array(z.string()),
  expertise: z.array(z.string()),
  innovationCenters: z.array(z.string()),
  website: z.string().url().or(z.literal('')),
});

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id?: string; role?: string };
    if (user.role !== 'UNIVERSITY' || !user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = profileSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: 'Validation Error', details: parseResult.error.errors }, { status: 422 });
    }

    const profileData = parseResult.data;
    const usersColl = await getUsersCollection();
    
    // Support string ID or ObjectId
    let queryId;
    try {
      queryId = new ObjectId(user.id);
    } catch {
      queryId = user.id;
    }

    const result = await usersColl.updateOne(
      { _id: queryId as unknown as string },
      { $set: { universityProfile: profileData, updatedAt: new Date() } }
    );
    
    // Also try string if ObjectId failed to match, just in case
    if (result.matchedCount === 0 && queryId instanceof ObjectId) {
      await usersColl.updateOne(
        { _id: user.id as unknown as string },
        { $set: { universityProfile: profileData, updatedAt: new Date() } }
      );
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
