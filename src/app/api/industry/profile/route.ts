// src/app/api/industry/profile/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getIndustryProfileCollection } from '@/lib/industry';
import { z } from 'zod';
import { IndustryProfile, OrganizationType, IndustrySector, SupportCapability } from '@/types/industry';

const profileSchema = z.object({
  organizationName: z.string().min(1, 'Organization name required'),
  organizationType: z.enum([
    'STARTUP', 'MSME', 'CORPORATE', 'INDUSTRY_PARTNER',
    'CSR_ORGANIZATION', 'RESEARCH_ORGANIZATION', 'OTHER',
  ]),
  industrySector: z.enum([
    'AGRICULTURE', 'HEALTHCARE', 'EDTECH', 'FINTECH', 'CLIMATE',
    'WATER', 'ENERGY', 'MANUFACTURING', 'AI_ML', 'SOFTWARE',
    'INFRASTRUCTURE', 'MOBILITY', 'SOCIAL_IMPACT', 'RURAL_DEVELOPMENT', 'OTHER',
  ]),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  city: z.string().min(1),
  state: z.string().min(1),
  website: z.string().url().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  expertise: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  areasOfInterest: z.array(z.string()).default([]),
  supportCapabilities: z.array(z.enum([
    'MENTORSHIP', 'FUNDING', 'PROTOTYPING', 'TESTING', 'TECHNOLOGY',
    'PILOT_DEPLOYMENT', 'IMPLEMENTATION', 'MARKET_ACCESS', 'DOMAIN_EXPERTISE', 'OTHER',
  ])).default([]),
  companySize: z.string().optional(),
});

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

    const coll = await getIndustryProfileCollection();
    const profile = await coll.findOne({ userId: user.id });
    return NextResponse.json({ success: true, profile: profile ?? null });
  } catch (error) {
    console.error('GET /api/industry/profile error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { id?: string; role?: string };
    if (user.role !== 'INDUSTRY' || !user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation error', details: parsed.error.errors }, { status: 422 });
    }

    const data = parsed.data;
    const now = new Date();
    const coll = await getIndustryProfileCollection();

    const existing = await coll.findOne({ userId: user.id });

    const profileData: IndustryProfile = {
      userId: user.id,
      organizationName: data.organizationName,
      organizationType: data.organizationType as OrganizationType,
      industrySector: data.industrySector as IndustrySector,
      description: data.description,
      city: data.city,
      state: data.state,
      website: data.website || undefined,
      email: data.email || undefined,
      expertise: data.expertise,
      technologies: data.technologies,
      areasOfInterest: data.areasOfInterest,
      supportCapabilities: data.supportCapabilities as SupportCapability[],
      companySize: data.companySize || undefined,
      isVerified: existing?.isVerified ?? false,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await coll.updateOne(
      { userId: user.id },
      { $set: profileData },
      { upsert: true }
    );

    return NextResponse.json({ success: true, profile: profileData });
  } catch (error) {
    console.error('PUT /api/industry/profile error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
