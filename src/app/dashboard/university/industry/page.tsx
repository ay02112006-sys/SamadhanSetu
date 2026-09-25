// src/app/dashboard/university/industry/page.tsx
import { getServerAuthSession } from '@/lib/auth';
import { getIndustryInterestCollection, getIndustryProfileCollection } from '@/lib/industry';
import { getProjectsCollection } from '@/lib/project';
import { notFound, redirect } from 'next/navigation';
import UniversityInterestActions from './UniversityInterestActions';

export default async function UniversityIndustryPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect('/login');

  const user = session.user as { id?: string; role?: string };
  if (user.role !== 'UNIVERSITY' || !user.id) notFound();

  const projectsColl = await getProjectsCollection();
  const ownedProjects = await projectsColl
    .find({ universityId: user.id }, { projection: { projectId: 1, title: 1 } })
    .toArray();
  const ownedProjectIds = ownedProjects.map((p) => p.projectId);
  const projectTitleMap = new Map(ownedProjects.map((p) => [p.projectId, p.title]));

  const interestColl = await getIndustryInterestCollection();
  const interests = await interestColl
    .find({ universityId: user.id, projectId: { $in: ownedProjectIds } })
    .sort({ createdAt: -1 })
    .toArray();

  const industryIds = [...new Set(interests.map((i) => i.industryId))];
  const profileColl = await getIndustryProfileCollection();
  const profiles = await profileColl.find({ userId: { $in: industryIds } }).toArray();
  const profileMap = new Map(profiles.map((p) => [p.userId, p]));

  const pendingCount = interests.filter((i) => i.status === 'PENDING').length;

  return (
    <section className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Industry Collaboration Requests</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-amber-600 mt-1 font-medium">{pendingCount} pending review{pendingCount > 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      {interests.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <p className="text-gray-500">No industry collaboration requests received yet.</p>
          <p className="text-sm text-gray-400 mt-2">Once industry organizations express interest in your projects, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {interests.map((interest) => {
            const profile = profileMap.get(interest.industryId);
            const projectTitle = projectTitleMap.get(interest.projectId) ?? interest.projectId;
            return (
              <div key={interest.interestId} className="bg-white border rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs font-mono text-gray-400 mb-1">{interest.interestId}</p>
                    <h3 className="font-bold text-lg">{profile?.organizationName ?? 'Unknown Organization'}</h3>
                    <div className="flex gap-3 text-sm text-gray-500 mt-1">
                      <span>{profile?.organizationType?.replace(/_/g, ' ')}</span>
                      <span>·</span>
                      <span>{profile?.industrySector?.replace(/_/g, ' ')}</span>
                      <span>·</span>
                      <span>{profile?.city}, {profile?.state}</span>
                    </div>
                  </div>
                  <span className={`text-sm px-3 py-1 rounded font-medium ${
                    interest.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    interest.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                    interest.status === 'DECLINED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {interest.status}
                  </span>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">For Project</p>
                    <p className="font-medium">{projectTitle}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Support Offered</p>
                    <div className="flex flex-wrap gap-1">
                      {interest.supportTypes.map((t) => (
                        <span key={t} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{t.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Submitted</p>
                    <p>{new Date(interest.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Proposed Contribution</p>
                  <p className="text-sm text-gray-700">{interest.proposedContribution}</p>
                </div>

                {interest.message && (
                  <div className="mb-4 p-3 bg-gray-50 rounded text-sm text-gray-700 border-l-2 border-gray-300">
                    <strong>Message:</strong> {interest.message}
                  </div>
                )}

                {interest.status === 'PENDING' && (
                  <UniversityInterestActions interestId={interest.interestId} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
