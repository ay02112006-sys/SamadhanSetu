// src/app/dashboard/university/collaborations/page.tsx
import { getServerAuthSession } from '@/lib/auth';
import { getIndustryCollaborationCollection, getIndustryProfileCollection } from '@/lib/industry';
import { getProjectsCollection } from '@/lib/project';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  INITIATED: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700',
  ON_HOLD: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default async function UniversityCollaborationsPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect('/login');

  const user = session.user as { id?: string; role?: string };
  if (user.role !== 'UNIVERSITY' || !user.id) notFound();

  const collabColl = await getIndustryCollaborationCollection();
  const collaborations = await collabColl
    .find({ universityId: user.id })
    .sort({ createdAt: -1 })
    .toArray();

  const industryIds = [...new Set(collaborations.map((c) => c.industryId))];
  const profileColl = await getIndustryProfileCollection();
  const profiles = await profileColl.find({ userId: { $in: industryIds } }).toArray();
  const profileMap = new Map(profiles.map((p) => [p.userId, p]));

  const projectsColl = await getProjectsCollection();
  const projectIds = [...new Set(collaborations.map((c) => c.projectId))];
  const projects = await projectsColl.find({ projectId: { $in: projectIds } }).toArray();
  const projectMap = new Map(projects.map((p) => [p.projectId, p]));

  return (
    <section className="p-8">
      <h1 className="text-2xl font-bold mb-6">Industry Collaborations</h1>

      {collaborations.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <p className="text-gray-500">No active collaborations yet.</p>
          <p className="text-sm text-gray-400 mt-2">Accept industry interest requests to start collaborations.</p>
          <Link href="/dashboard/university/industry" className="mt-3 inline-block text-blue-600 underline text-sm">Review Requests</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {collaborations.map((collab) => {
            const profile = profileMap.get(collab.industryId);
            const project = projectMap.get(collab.projectId);
            return (
              <div key={collab.collaborationId} className="bg-white border rounded-lg p-5 flex flex-col shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs font-mono text-gray-400">{collab.collaborationId}</p>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${STATUS_COLORS[collab.status] ?? 'bg-gray-100'}`}>
                    {collab.status}
                  </span>
                </div>

                <h3 className="font-bold mb-1">{profile?.organizationName ?? 'Industry Partner'}</h3>
                <p className="text-xs text-gray-500 mb-2">{profile?.organizationType?.replace(/_/g, ' ')} · {profile?.industrySector?.replace(/_/g, ' ')}</p>

                <p className="text-sm text-gray-600 mb-2">Project: <strong>{project?.title ?? collab.projectId}</strong></p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {collab.supportTypes.map((t) => (
                    <span key={t} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{t.replace(/_/g, ' ')}</span>
                  ))}
                </div>

                <div className="mt-auto pt-3 border-t">
                  <Link
                    href={`/dashboard/university/collaborations/${collab.collaborationId}`}
                    className="block text-center w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-700 text-sm"
                  >
                    View Collaboration
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
