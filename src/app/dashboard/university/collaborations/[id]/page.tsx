// src/app/dashboard/university/collaborations/[id]/page.tsx
import { getServerAuthSession } from '@/lib/auth';
import {
  getIndustryCollaborationCollection,
  getIndustryProfileCollection,
  getCollaborationActivityCollection,
  getFundingCommitmentCollection,
} from '@/lib/industry';
import { getProjectsCollection } from '@/lib/project';
import { notFound, redirect } from 'next/navigation';

export default async function UniversityCollaborationDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect('/login');

  const user = session.user as { id?: string; role?: string };
  if (user.role !== 'UNIVERSITY' || !user.id) notFound();

  const collabColl = await getIndustryCollaborationCollection();
  // IDOR check: universityId must match
  const collab = await collabColl.findOne({ collaborationId: params.id, universityId: user.id });

  if (!collab) {
    return (
      <section className="p-8">
        <h1 className="text-xl font-bold mb-4">Collaboration</h1>
        <p className="text-red-500">Collaboration not found or access denied.</p>
      </section>
    );
  }

  const [profileColl, projectsColl, actColl, fundColl] = await Promise.all([
    getIndustryProfileCollection(),
    getProjectsCollection(),
    getCollaborationActivityCollection(),
    getFundingCommitmentCollection(),
  ]);

  const [profile, project, activities, funding] = await Promise.all([
    profileColl.findOne({ userId: collab.industryId }),
    projectsColl.findOne({ projectId: collab.projectId }),
    actColl.find({ collaborationId: params.id }).sort({ createdAt: -1 }).toArray(),
    fundColl.find({ collaborationId: params.id }).sort({ createdAt: -1 }).toArray(),
  ]);

  return (
    <section className="p-8 max-w-4xl mx-auto">
      <a href="/dashboard/university/collaborations" className="text-sm text-blue-600 hover:underline mb-6 block">← Back to Collaborations</a>

      <div className="bg-white border rounded-lg shadow-sm mb-6">
        <div className="p-6 border-b bg-gray-50">
          <span className="text-xs font-mono text-gray-400 block mb-1">{collab.collaborationId}</span>
          <h1 className="text-2xl font-bold">Collaboration Details</h1>
          <p className="text-sm text-gray-600 mt-1">
            With: <strong>{profile?.organizationName ?? 'Industry Partner'}</strong> · Project: <strong>{project?.title ?? collab.projectId}</strong>
          </p>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Industry Partner</h3>
            <p className="font-medium">{profile?.organizationName}</p>
            <p className="text-sm text-gray-600">{profile?.organizationType?.replace(/_/g, ' ')} · {profile?.industrySector?.replace(/_/g, ' ')}</p>
            <p className="text-sm text-gray-500">{profile?.city}, {profile?.state}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Support Types</h3>
            <div className="flex flex-wrap gap-1">
              {collab.supportTypes.map((t) => (
                <span key={t} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{t.replace(/_/g, ' ')}</span>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-3">Status: <strong>{collab.status}</strong></p>
            <p className="text-sm text-gray-500">Started: {new Date(collab.startDate).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="p-6 border-t">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Scope & Objectives</h3>
          <p className="text-gray-700 text-sm">{collab.scope}</p>
        </div>
      </div>

      {/* Activities */}
      <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Support Activities</h2>
        {activities.length === 0 ? (
          <p className="text-gray-400 text-sm">No activities recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {activities.map((act) => (
              <div key={act.activityId} className="border rounded p-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{act.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{act.type.replace(/_/g, ' ')} · {act.actorName}</p>
                  </div>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">{act.status}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{act.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Funding */}
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4">Funding Commitments</h2>
        {funding.length === 0 ? (
          <p className="text-gray-400 text-sm">No funding commitments recorded.</p>
        ) : (
          <div className="space-y-3">
            {funding.map((f) => (
              <div key={f.fundingId} className="border rounded p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{f.currency} {f.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">{f.purpose}</p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{f.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
