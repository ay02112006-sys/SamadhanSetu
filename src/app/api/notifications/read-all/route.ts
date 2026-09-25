// src/app/api/notifications/read-all/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { markAllAsRead } from '@/lib/notifications';

export async function PATCH() {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { id?: string };
    if (!user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const count = await markAllAsRead(user.id);
    return NextResponse.json({ success: true, message: `${count} notifications marked as read` });
  } catch (error) {
    console.error('PATCH notifications read-all error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
