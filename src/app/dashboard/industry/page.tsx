// src/app/dashboard/industry/page.tsx
import { getServerAuthSession } from '@/lib/auth';
import { getIndustryProfileCollection, getIndustryMatchCollection, getIndustryInterestCollection, getIndustryCollaborationCollection } from '@/lib/industry';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function IndustryDashboard() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user as { id?: string; role?: string; name?: string };
  const name = user.name ?? 'Industry User';
  const userId = user.id;

  let matchedProjects = 0;
  let pendingInterests = 0;
  let activeCollaborations = 0;
  let completedCollaborations = 0;
  let hasProfile = false;

  if (userId) {
    const profileColl = await getIndustryProfileCollection();
    const profile = await profileColl.findOne({ userId });
    hasProfile = !!profile;

    if (hasProfile) {
      const matchColl = await getIndustryMatchCollection();
      matchedProjects = await matchColl.countDocuments({ industryId: userId, score: { $gt: 0 } });

      const interestColl = await getIndustryInterestCollection();
      pendingInterests = await interestColl.countDocuments({ industryId: userId, status: 'PENDING' });

      const collabColl = await getIndustryCollaborationCollection();
      activeCollaborations = await collabColl.countDocuments({
        industryId: userId,
        status: { $in: ['INITIATED', 'ACTIVE'] },
      });
      completedCollaborations = await collabColl.countDocuments({
        industryId: userId,
        status: 'COMPLETED',
      });
    }
  }

  return (
    <section className="p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Welcome, {name}</h1>
          <h2 className="text-lg font-medium text-gray-600">Industry / Startup / MSME Portal</h2>
        </div>
        <Link
          href="/dashboard/industry/profile"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          {hasProfile ? 'Edit Profile' : 'Complete Profile →'}
        </Link>
      </div>

      {!hasProfile && (
        <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="font-semibold text-amber-900 mb-1">Profile Incomplete</h3>
          <p className="text-amber-800 text-sm">
            Complete your organization profile to discover university projects and express collaboration interest.
          </p>
          <Link href="/dashboard/industry/profile" className="mt-3 inline-block text-sm font-medium text-amber-700 underline">
            Complete Profile →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-2">Matched Projects</p>
          <p className="text-3xl font-bold text-blue-700">{matchedProjects}</p>
        </div>
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-2">Pending Interests</p>
          <p className="text-3xl font-bold text-amber-600">{pendingInterests}</p>
        </div>
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-2">Active Collaborations</p>
          <p className="text-3xl font-bold text-green-700">{activeCollaborations}</p>
        </div>
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-2">Completed</p>
          <p className="text-3xl font-bold text-gray-700">{completedCollaborations}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              href="/dashboard/industry/projects"
              className="flex items-center justify-between w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <span>Discover Relevant Projects</span>
              <span>→</span>
            </Link>
            <Link
              href="/dashboard/industry/collaborations"
              className="flex items-center justify-between w-full px-4 py-3 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
            >
              <span>My Collaborations</span>
              <span>→</span>
            </Link>
            <Link
              href="/dashboard/industry/interests"
              className="flex items-center justify-between w-full px-4 py-3 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
            >
              <span>Interest Submissions</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h3 className="text-lg font-semibold mb-4">How it Works</h3>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</span>
              <span>Complete your organization profile with sector, expertise, and capabilities.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</span>
              <span>Discover matched university projects relevant to your sector and expertise.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</span>
              <span>Express interest in projects and propose your contribution.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold flex-shrink-0">4</span>
              <span>Once accepted, collaborate through mentorship, funding, or prototyping support.</span>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
