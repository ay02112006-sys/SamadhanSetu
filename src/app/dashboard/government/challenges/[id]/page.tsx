'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

type ChallengeDetailData = {
  challenge: {
    challengeId: string;
    title: string;
    description: string;
    domain: string;
    priority: string;
    status: string;
    location: { city?: string; state?: string };
    createdAt: string;
    aiAnalysis: {
      status: string;
      confidence: number;
      impactLevel: number;
      urgencyLevel: number;
      problemSummary: string;
      duplicateCandidates: string[];
    } | null;
  };
  universityMatches: Array<{ name: string; city: string; score: number; status: string }>;
  project: {
    projectId: string;
    title: string;
    status: string;
    progress: number;
    targetDate: string;
    mentor: { name: string };
    memberCount: number;
  } | null;
  milestones: Array<{ title: string; status: string; dueDate: string }>;
  industryInterests: number;
  collaborations: Array<{ industryName: string; status: string; supportTypes: string[] }>;
  outcomes: Array<{ outcomeType: string; metricName: string; currentValue?: number; unit: string }>;
};

export default function GovernmentChallengeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<ChallengeDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/government/challenges/${id}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setData(d.data);
        else setError(d.error ?? 'Failed to load');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-gray-500">Loading challenge details...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!data || !data.challenge) return <div className="p-8 text-gray-500">Challenge not found.</div>;

  const { challenge, universityMatches, project, milestones, industryInterests, collaborations, outcomes } = data;

  return (
    <section className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-black mb-2">← Back</button>
          <h1 className="text-2xl font-bold">Challenge Lifecycle View</h1>
          <p className="text-gray-500 text-sm font-mono mt-1">{challenge.challengeId}</p>
        </div>
      </div>

      {/* 1. Challenge Details */}
      <div className="bg-white border shadow-sm rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b px-6 py-4 flex justify-between items-center">
          <h2 className="font-semibold">1. Challenge Information</h2>
          <span className="px-3 py-1 bg-gray-200 text-gray-800 text-xs font-bold rounded">{challenge.status.replace(/_/g, ' ')}</span>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold mb-2">{challenge.title}</h3>
          <p className="text-gray-700 whitespace-pre-wrap mb-4">{challenge.description}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Domain</p>
              <p className="font-medium">{challenge.domain}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Priority</p>
              <p className="font-medium">{challenge.priority}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Location</p>
              <p className="font-medium">{[challenge.location?.city, challenge.location?.state].filter(Boolean).join(', ') || 'Unspecified'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Submitted</p>
              <p className="font-medium">{new Date(challenge.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. AI Analysis */}
      <div className="bg-white border shadow-sm rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b px-6 py-4">
          <h2 className="font-semibold">2. AI Analysis</h2>
        </div>
        <div className="p-6">
          {!challenge.aiAnalysis ? (
            <p className="text-gray-500 italic">No AI analysis available for this challenge.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">AI Problem Summary</p>
                <p className="text-gray-600 bg-gray-50 p-3 rounded border text-sm">{challenge.aiAnalysis.problemSummary}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Status</p>
                  <p className="font-medium text-sm">{challenge.aiAnalysis.status}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Confidence</p>
                  <p className="font-medium text-sm">{challenge.aiAnalysis.confidence ?? 0}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Impact Level</p>
                  <p className="font-medium text-sm">{challenge.aiAnalysis.impactLevel}/10</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Urgency</p>
                  <p className="font-medium text-sm">{challenge.aiAnalysis.urgencyLevel}/10</p>
                </div>
              </div>
              {challenge.aiAnalysis.duplicateCandidates && challenge.aiAnalysis.duplicateCandidates.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border-amber-200 border rounded text-amber-800 text-sm">
                  <strong>⚠ Duplicate Candidates Detected:</strong> {challenge.aiAnalysis.duplicateCandidates.length} potential matches found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. University Matches & Project */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border shadow-sm rounded-lg overflow-hidden flex flex-col">
          <div className="bg-gray-50 border-b px-6 py-4">
            <h2 className="font-semibold">3. University Matching</h2>
          </div>
          <div className="p-6 flex-1">
            {universityMatches.length === 0 ? (
              <p className="text-gray-500 italic">No university matches found.</p>
            ) : (
              <div className="space-y-3">
                {universityMatches.map((m, i) => (
                  <div key={i} className={`flex justify-between items-center p-3 rounded border text-sm ${m.status === 'ACCEPTED' ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                    <div>
                      <p className="font-bold">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-blue-600">{Math.round(m.score * 100)}% Match</p>
                      <p className="text-xs text-gray-500">{m.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border shadow-sm rounded-lg overflow-hidden flex flex-col">
          <div className="bg-gray-50 border-b px-6 py-4">
            <h2 className="font-semibold">4. Project Execution</h2>
          </div>
          <div className="p-6 flex-1">
            {!project ? (
              <p className="text-gray-500 italic">No project initialized yet.</p>
            ) : (
              <div>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-bold">{project.title}</p>
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded font-bold">{project.status}</span>
                  </div>
                  <Link href={`/dashboard/government/projects/${project.projectId}`} className="text-xs text-blue-600 hover:underline">View Project Details →</Link>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                  </div>
                </div>

                <div className="text-sm text-gray-700 space-y-1 mb-4">
                  <p><strong>Mentor:</strong> {project.mentor.name}</p>
                  <p><strong>Team Size:</strong> {project.memberCount} members</p>
                  <p><strong>Target Date:</strong> {new Date(project.targetDate).toLocaleDateString()}</p>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Milestones ({milestones.length})</p>
                  <div className="space-y-1">
                    {milestones.slice(0, 3).map((m, i) => (
                      <div key={i} className="flex items-center text-xs justify-between bg-gray-50 p-1.5 rounded">
                        <span className="truncate max-w-[200px]">{m.title}</span>
                        <span className={m.status === 'COMPLETED' ? 'text-green-600' : 'text-gray-500'}>{m.status}</span>
                      </div>
                    ))}
                    {milestones.length > 3 && <p className="text-xs text-gray-400 text-center mt-1">+{milestones.length - 3} more</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Industry & Outcomes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border shadow-sm rounded-lg overflow-hidden flex flex-col">
          <div className="bg-gray-50 border-b px-6 py-4">
            <h2 className="font-semibold">5. Industry Collaboration</h2>
          </div>
          <div className="p-6 flex-1">
            {!project ? (
              <p className="text-gray-500 italic">Project required for industry collaboration.</p>
            ) : (
              <div>
                <p className="text-sm mb-4">
                  <span className="font-bold">{industryInterests}</span> organizations showed interest.
                </p>
                {collaborations.length === 0 ? (
                  <p className="text-gray-500 italic text-sm">No active collaborations.</p>
                ) : (
                  <div className="space-y-3">
                    {collaborations.map((c, i) => (
                      <div key={i} className="p-3 border rounded bg-gray-50 text-sm">
                        <div className="flex justify-between font-bold mb-1">
                          <span>{c.industryName}</span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{c.status}</span>
                        </div>
                        <p className="text-xs text-gray-600">Support: {c.supportTypes.join(', ')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border shadow-sm rounded-lg overflow-hidden flex flex-col">
          <div className="bg-gray-50 border-b px-6 py-4">
            <h2 className="font-semibold">6. Social Impact Outcomes</h2>
          </div>
          <div className="p-6 flex-1">
            {outcomes.length === 0 ? (
              <p className="text-gray-500 italic">No outcomes reported yet.</p>
            ) : (
              <div className="space-y-3">
                {outcomes.map((o, i) => (
                  <div key={i} className="p-3 border rounded bg-gray-50 text-sm">
                    <p className="font-bold text-gray-800 mb-1">{o.outcomeType.replace(/_/g, ' ')}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{o.metricName}</span>
                      <span className="font-mono font-bold">{o.currentValue ?? 0} {o.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
