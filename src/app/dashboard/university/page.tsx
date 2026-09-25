// src/app/dashboard/university/page.tsx
import { getServerAuthSession } from "@/lib/auth";
import { getProjectsCollection, getProjectReviewsCollection, getMilestonesCollection } from "@/lib/project";
import { getIndustryInterestCollection, getIndustryCollaborationCollection } from "@/lib/industry";
import Link from 'next/link';

export default async function UniversityDashboard() {
  const session = await getServerAuthSession();
  const name = session?.user?.name ?? "University User";
  const universityId = (session?.user as { id?: string })?.id;

  let activeProjects = 0;
  let pendingReviews = 0;
  let upcomingMilestones = 0;
  let completedProjects = 0;
  let industryInterests = 0;
  let activeCollaborations = 0;

  if (universityId) {
    const projectsColl = await getProjectsCollection();
    activeProjects = await projectsColl.countDocuments({ universityId, status: { $nin: ['COMPLETED', 'CANCELLED'] } });
    completedProjects = await projectsColl.countDocuments({ universityId, status: 'COMPLETED' });

    const userProjects = await projectsColl.find({ universityId }, { projection: { projectId: 1 } }).toArray();
    const projectIds = userProjects.map(p => p.projectId);

    if (projectIds.length > 0) {
      const reviewsColl = await getProjectReviewsCollection();
      pendingReviews = await reviewsColl.countDocuments({ projectId: { $in: projectIds }, status: 'PENDING' });

      const milestonesColl = await getMilestonesCollection();
      upcomingMilestones = await milestonesColl.countDocuments({ projectId: { $in: projectIds }, status: { $in: ['PENDING', 'IN_PROGRESS'] } });
    }

    // Phase 7: Industry metrics
    const interestColl = await getIndustryInterestCollection();
    industryInterests = await interestColl.countDocuments({ universityId, status: 'PENDING' });

    const collabColl = await getIndustryCollaborationCollection();
    activeCollaborations = await collabColl.countDocuments({ universityId, status: { $in: ['INITIATED', 'ACTIVE'] } });
  }

  return (
    <section className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Welcome, {name}</h1>
          <h2 className="text-xl font-medium text-gray-600">University Portal</h2>
        </div>
        <Link href="/dashboard/university/profile" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Edit Profile
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-2">Active Projects</p>
          <p className="text-2xl font-bold">{activeProjects}</p>
        </div>
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-2">Pending Reviews</p>
          <p className="text-2xl font-bold">{pendingReviews}</p>
        </div>
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-2">Milestones</p>
          <p className="text-2xl font-bold">{upcomingMilestones}</p>
        </div>
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-2">Completed</p>
          <p className="text-2xl font-bold">{completedProjects}</p>
        </div>
        <div className="p-4 border rounded-lg bg-white shadow-sm border-amber-200">
          <p className="text-xs font-medium text-amber-600 mb-2">Industry Interests</p>
          <p className="text-2xl font-bold text-amber-700">{industryInterests}</p>
        </div>
        <div className="p-4 border rounded-lg bg-white shadow-sm border-green-200">
          <p className="text-xs font-medium text-green-600 mb-2">Collaborations</p>
          <p className="text-2xl font-bold text-green-700">{activeCollaborations}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link href="/dashboard/university/projects" className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Manage Projects
            </Link>
            <Link href="/dashboard/university/challenges" className="block w-full text-center px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">
              Browse Matched Challenges
            </Link>
            <Link href="/dashboard/university/teams" className="block w-full text-center px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">
              Solution Teams
            </Link>
            <Link href="/dashboard/university/industry" className="block w-full text-center px-4 py-2 bg-amber-100 text-amber-800 rounded hover:bg-amber-200">
              Industry Requests {industryInterests > 0 ? `(${industryInterests} pending)` : ''}
            </Link>
            <Link href="/dashboard/university/collaborations" className="block w-full text-center px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">
              Industry Collaborations
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
