// src/app/challenges/[id]/page.tsx
import { notFound } from 'next/navigation';
import { getChallengeById } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { getServerAuthSession } from '@/lib/auth';
import { AIAnalysisPanel } from '@/components/challenges/AIAnalysisPanel';
import { UniversityMatchesPanel } from '@/components/challenges/UniversityMatchesPanel';

interface Props {
  params: { id: string };
}

export default async function ChallengeDetail({ params }: Props) {
  const challenge = await getChallengeById(params.id);
  if (!challenge) {
    notFound();
    return null;
  }

  const session = await getServerAuthSession();
  const isCitizenOwner =
    session?.user?.role === 'CITIZEN' &&
    session.user.id === challenge.submittedBy;

  const {
    challengeId,
    title,
    description,
    domain,
    location,
    status,
    priority,
    submittedByName,
    createdAt,
    updatedAt,
    attachments,
    aiAnalysis,
  } = challenge;

  return (
    <section className="container mx-auto py-8">
      <Card className="p-6">
        <h1 className="text-3xl font-bold mb-4 text-primary">{title}</h1>
        <p className="mb-4 text-gray-700 whitespace-pre-line">{description}</p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <li><strong>Domain:</strong> {domain}</li>
          <li><strong>Status:</strong> {status}</li>
          <li><strong>Priority:</strong> {priority}</li>
          <li><strong>Submitted By:</strong> {submittedByName}</li>
          <li><strong>Submitted Date:</strong> {new Date(createdAt).toLocaleDateString()}</li>
          <li><strong>Last Updated:</strong> {new Date(updatedAt).toLocaleDateString()}</li>
          <li>
            <strong>Location:</strong>{' '}
            {[location.city, location.district, location.state].filter(Boolean).join(', ') || 'Not specified'}
          </li>
          {attachments && attachments.length > 0 && (
            <li>
              <strong>Attachments:</strong>
              <ul className="list-disc list-inside mt-1">
                {attachments.map((a, i) => (
                  <li key={i}>{a.filename} ({a.contentType})</li>
                ))}
              </ul>
            </li>
          )}
        </ul>

        <div className="flex space-x-4">
          <Link href="/challenges">
            <Button variant="outline">Back to Challenges</Button>
          </Link>
          {/* Future actions placeholder */}
          <Button variant="primary" disabled>Propose Solution (Phase 2)</Button>
        </div>

        {/* AI Analysis Panel — visible only to the citizen who submitted this challenge */}
        {isCitizenOwner && (
          <>
            <AIAnalysisPanel
              challengeId={challengeId}
              initialAnalysis={aiAnalysis ?? null}
            />
            
            {aiAnalysis?.status === 'COMPLETED' || aiAnalysis?.status === 'FALLBACK' ? (
              <UniversityMatchesPanel challengeId={challengeId} />
            ) : null}
          </>
        )}
      </Card>
      
      {/* Project Progress for Citizen Owner */}
      {isCitizenOwner && await renderProjectProgress(challengeId)}
    </section>
  );
}

// Extract fetching and rendering to a separate async function to keep it clean
async function renderProjectProgress(challengeId: string) {
  const { getProjectsCollection, getMilestonesCollection } = await import('@/lib/project');
  const { getUsersCollection } = await import('@/lib/university');
  
  const projectsColl = await getProjectsCollection();
  const project = await projectsColl.findOne({ challengeId, status: { $ne: 'CANCELLED' } });
  
  if (!project) return null;

  const usersColl = await getUsersCollection();
  // Safe cast since ObjectId might be string or object depending on db type
  const university = await usersColl.findOne({ _id: project.universityId as unknown as string }) || 
                     await usersColl.findOne({ _id: new (require('mongodb').ObjectId)(project.universityId) });
                     
  const universityName = university?.universityProfile?.universityName || 'Unknown University';

  const milestonesColl = await getMilestonesCollection();
  const milestones = await milestonesColl.find({ projectId: project.projectId }).toArray();
  const completedMilestones = milestones.filter(m => m.status === 'COMPLETED').length;

  return (
    <Card className="p-6 mt-8 border-blue-200 shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-blue-900">Solution Project Progress</h2>
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-1">{project.title}</h3>
        <p className="text-sm text-blue-600 mb-4">Being developed by: <strong>{universityName}</strong></p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Status</p>
            <p className="font-medium">{project.status.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Target Date</p>
            <p className="font-medium">{new Date(project.targetDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Milestones</p>
            <p className="font-medium">{completedMilestones} / {milestones.length} Completed</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Overall Progress</p>
            <p className="font-bold text-blue-700">{project.progress}%</p>
          </div>
        </div>

        <div className="w-full bg-blue-200 rounded-full h-3 mt-2">
          <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${project.progress}%` }}></div>
        </div>
      </div>
    </Card>
  );
}
