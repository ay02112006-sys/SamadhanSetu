'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

type ProjectDetailData = {
  project: {
    projectId: string;
    title: string;
    description: string;
    status: string;
    progress: number;
    startDate: string;
    targetDate: string;
    mentor: { name: string };
    memberCount: number;
  };
  challenge: {
    challengeId: string;
    title: string;
    domain: string;
    priority: string;
    location: { city?: string; state?: string };
    aiAnalysis: { status: string } | null;
  } | null;
  university: { name: string } | null;
  milestones: Array<{ title: string; status: string; dueDate: string }>;
  deliverables: Array<{ title: string; status: string }>;
  reviews: Array<{ status: string }>;
  collaborations: Array<{ industryName: string; status: string; supportTypes: string[] }>;
  fundingCommitments: Array<{ amount: number; status: string }>;
  outcomes: Array<{ outcomeType: string; metricName: string; baselineValue?: number; currentValue?: number; targetValue?: number; unit: string; verified: boolean }>;
};

export default function GovernmentProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<ProjectDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/government/projects/${id}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setData(d.data);
        else setError(d.error ?? 'Failed to load');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-gray-500">Loading project details...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!data || !data.project) return <div className="p-8 text-gray-500">Project not found.</div>;

  const { project, challenge, university, milestones, deliverables, reviews, collaborations, fundingCommitments, outcomes } = data;

  const totalFunding = fundingCommitments.filter((f) => f.status !== 'CANCELLED').reduce((s, f) => s + f.amount, 0);

  return (
    <section className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-black mb-2">← Back</button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded">{project.status.replace(/_/g, ' ')}</span>
          </div>
          <p className="text-gray-500 text-sm font-mono mt-1">{project.projectId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white border shadow-sm rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Project Overview</h2>
            <p className="text-gray-700 whitespace-pre-wrap mb-6">{project.description}</p>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded border">
                <p className="text-xs text-gray-500 uppercase mb-1">Execution Details</p>
                <div className="space-y-2 mt-2 text-sm">
                  <p><strong>University:</strong> {university?.name ?? 'Unknown'}</p>
                  <p><strong>Mentor:</strong> {project.mentor.name}</p>
                  <p><strong>Team Size:</strong> {project.memberCount}</p>
                  <p><strong>Started:</strong> {new Date(project.startDate).toLocaleDateString()}</p>
                  <p><strong>Target:</strong> {new Date(project.targetDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded border">
                <p className="text-xs text-gray-500 uppercase mb-1">Progress Tracker</p>
                <div className="text-3xl font-bold text-green-600 mb-2">{project.progress}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{milestones.filter((m) => m.status === 'COMPLETED').length} / {milestones.length} Milestones</span>
                  <span>{deliverables.filter((d) => d.status === 'APPROVED').length} / {deliverables.length} Deliverables</span>
                </div>
              </div>
            </div>
          </div>

          {challenge && (
            <div className="bg-white border shadow-sm rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase">Original Challenge</h2>
                <Link href={`/dashboard/government/challenges/${challenge.challengeId}`} className="text-xs text-blue-600 hover:underline">View Challenge →</Link>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{challenge.title}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3 border-t pt-3">
                <div><span className="text-gray-500 block text-xs">Domain</span>{challenge.domain}</div>
                <div><span className="text-gray-500 block text-xs">Priority</span>{challenge.priority}</div>
                <div><span className="text-gray-500 block text-xs">Location</span>{[challenge.location?.city, challenge.location?.state].filter(Boolean).join(', ') || 'Unspec.'}</div>
                <div>
                  <span className="text-gray-500 block text-xs">AI Status</span>
                  {challenge.aiAnalysis?.status ?? 'None'}
                </div>
              </div>
            </div>
          )}

          {/* Social Impact Outcomes */}
          <div className="bg-white border shadow-sm rounded-lg overflow-hidden">
            <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4">
              <h2 className="font-semibold text-emerald-800">Social Impact Outcomes</h2>
            </div>
            <div className="p-6">
              {outcomes.length === 0 ? (
                <p className="text-gray-500 italic text-sm">No outcomes reported yet.</p>
              ) : (
                <div className="space-y-4">
                  {outcomes.map((o, i) => (
                    <div key={i} className="border rounded p-4 relative overflow-hidden">
                      {o.verified && <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl">VERIFIED</div>}
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{o.outcomeType.replace(/_/g, ' ')}</p>
                      <p className="text-sm font-semibold text-gray-800 mb-3">{o.metricName}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex-1 bg-gray-50 p-2 rounded border text-center">
                          <p className="text-xs text-gray-500">Baseline</p>
                          <p className="font-mono font-bold text-gray-700">{o.baselineValue ?? '-'}</p>
                        </div>
                        <span className="text-gray-300">→</span>
                        <div className="flex-1 bg-blue-50 p-2 rounded border border-blue-100 text-center">
                          <p className="text-xs text-blue-600">Current</p>
                          <p className="font-mono font-bold text-blue-800">{o.currentValue ?? '-'}</p>
                        </div>
                        <span className="text-gray-300">/</span>
                        <div className="flex-1 bg-gray-50 p-2 rounded border text-center">
                          <p className="text-xs text-gray-500">Target</p>
                          <p className="font-mono font-bold text-gray-700">{o.targetValue ?? '-'}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 text-right mt-2">{o.unit}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Secondary Details */}
        <div className="space-y-6">
          {/* Industry Collaboration */}
          <div className="bg-white border shadow-sm rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Industry Partners</h2>
            {collaborations.length === 0 ? (
              <p className="text-gray-500 italic text-sm">No active collaborations.</p>
            ) : (
              <div className="space-y-4">
                {totalFunding > 0 && (
                  <div className="bg-blue-50 text-blue-800 p-3 rounded border border-blue-200 text-center mb-4">
                    <p className="text-xs uppercase font-semibold">Total Funding</p>
                    <p className="text-xl font-bold">₹{totalFunding.toLocaleString()}</p>
                  </div>
                )}
                {collaborations.map((c, i) => (
                  <div key={i} className="border rounded p-3 text-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold">{c.industryName}</span>
                      <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold uppercase">{c.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.supportTypes.map((type: string) => (
                        <span key={type} className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded">{type.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Milestones & Deliverables Summary */}
          <div className="bg-white border shadow-sm rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Timeline & Outputs</h2>
            
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-700 mb-2">Next Milestones</h3>
              {milestones.filter((m) => m.status !== 'COMPLETED').slice(0, 3).length === 0 ? (
                <p className="text-gray-500 text-xs italic">No pending milestones.</p>
              ) : (
                <div className="space-y-2">
                  {milestones.filter((m) => m.status !== 'COMPLETED').slice(0, 3).map((m, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded text-xs border">
                      <span className="truncate pr-2 font-medium">{m.title}</span>
                      <span className="whitespace-nowrap text-gray-500">{new Date(m.dueDate).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-700 mb-2">Recent Deliverables</h3>
              {deliverables.length === 0 ? (
                <p className="text-gray-500 text-xs italic">No deliverables submitted.</p>
              ) : (
                <div className="space-y-2">
                  {deliverables.slice(0, 3).map((d, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded text-xs border">
                      <span className="truncate pr-2 font-medium">{d.title}</span>
                      <span className="px-1.5 py-0.5 bg-gray-200 rounded">{d.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Reviews */}
          <div className="bg-white border shadow-sm rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Reviews</h2>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-50 p-3 rounded border text-center">
                <span className="block text-xl font-bold text-gray-700">{reviews.length}</span>
                <span className="text-[10px] text-gray-500 uppercase">Total</span>
              </div>
              <div className="flex-1 bg-green-50 p-3 rounded border border-green-100 text-center">
                <span className="block text-xl font-bold text-green-700">{reviews.filter((r) => r.status === 'APPROVED').length}</span>
                <span className="text-[10px] text-gray-500 uppercase">Approved</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
