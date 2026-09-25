'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SUPPORT_TYPES = [
  'MENTORSHIP', 'FUNDING', 'PROTOTYPING', 'TESTING', 'TECHNOLOGY',
  'PILOT_DEPLOYMENT', 'IMPLEMENTATION', 'MARKET_ACCESS', 'DOMAIN_EXPERTISE',
];

type ExistingInterest = {
  status: string;
  supportTypes: string[];
  proposedContribution: string;
  message?: string;
  createdAt: string;
};

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const projectId = params.id;

  const [project, setProject] = useState<Record<string, unknown> | null>(null);
  const [match, setMatch] = useState<Record<string, unknown> | null>(null);
  const [existingInterest, setExistingInterest] = useState<ExistingInterest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [supportTypes, setSupportTypes] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [proposedContribution, setProposedContribution] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const load = async () => {
      const [projRes, interestRes] = await Promise.all([
        fetch(`/api/industry/projects`),
        fetch(`/api/industry/projects/${projectId}/interest`),
      ]);
      const projData = await projRes.json();
      const interestData = await interestRes.json();

      if (projData.projects) {
        const found = (projData.projects as Array<Record<string, unknown>>).find(
          (p) => p.projectId === projectId
        );
        setProject(found ?? null);
        setMatch(found ?? null);
      }

      if (interestData.interest) {
        setExistingInterest(interestData.interest as ExistingInterest);
      }
      setLoading(false);
    };
    load();
  }, [projectId]);

  const toggleType = (t: string) => {
    setSupportTypes((prev) =>
      prev.includes(t) ? prev.filter((s) => s !== t) : [...prev, t]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch(`/api/industry/projects/${projectId}/interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supportTypes, message, proposedContribution }),
      });
      const data = await res.json();
      if (res.ok) {
        setExistingInterest(data.interest as ExistingInterest);
        setShowForm(false);
        router.refresh();
      } else {
        setSubmitError(data.error ?? 'Failed to submit interest');
      }
    } catch {
      setSubmitError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-400">Loading project details...</div>;
  if (!project) return <div className="p-8 text-red-500">Project not found or not matched to your organization. <a href="/dashboard/industry/projects" className="underline">Go back</a></div>;

  const p = project;

  return (
    <section className="p-8 max-w-4xl mx-auto">
      <a href="/dashboard/industry/projects" className="text-sm text-blue-600 hover:underline mb-6 block">← Back to Projects</a>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-mono text-gray-400 mb-1 block">{String(p.projectId)}</span>
              <h1 className="text-2xl font-bold">{String(p.title)}</h1>
              <p className="text-sm text-blue-600 mt-1">Challenge: {String(p.challengeTitle)} · {String(p.challengeDomain)}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-blue-700">{String(p.matchScore)}%</span>
              <p className="text-xs text-gray-500">match score</p>
            </div>
          </div>
        </div>

        <div className="p-6 grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Project</h3>
              <p className="text-gray-800">{String(p.description)}</p>
              <div className="mt-3 flex gap-4 text-sm text-gray-600">
                <span>Status: <strong>{String(p.status)}</strong></span>
                <span>Progress: <strong>{String(p.progress)}%</strong></span>
                <span>Target: <strong>{new Date(String(p.targetDate)).toLocaleDateString()}</strong></span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Challenge</h3>
              <div className="bg-gray-50 p-4 rounded border text-sm">
                <p><strong>Domain:</strong> {String(p.challengeDomain)}</p>
                <p className="mt-1"><strong>Location:</strong> {String((p.challengeLocation as Record<string, string>).city ?? '')} {String((p.challengeLocation as Record<string, string>).state ?? '')}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">University</h3>
              <div className="bg-gray-50 p-4 rounded border text-sm">
                <p className="font-medium">{String(p.universityName)}</p>
                <p className="text-gray-600">{String(p.universityCity)}, {String(p.universityState)}</p>
              </div>
            </div>
          </div>

          <div className="border-l pl-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Why This Matches</h3>
            <div className="space-y-3 text-sm">
              {(p.matchReasons as string[]).map((reason: string, i: number) => (
                <div key={i} className="flex gap-2">
                  <span className="text-green-500 flex-shrink-0">✓</span>
                  <span className="text-gray-700">{reason}</span>
                </div>
              ))}
              {(p.matchedCapabilities as string[]).length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium text-gray-500 mb-1">Matching Capabilities:</p>
                  <div className="flex flex-wrap gap-1">
                    {(p.matchedCapabilities as string[]).map((c: string) => (
                      <span key={c} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">{c.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interest Section */}
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">Industry Collaboration</h2>

        {existingInterest ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-green-800">Interest Submitted</h3>
              <span className={`text-xs px-2 py-1 rounded font-medium ${
                existingInterest.status === 'ACCEPTED' ? 'bg-green-200 text-green-800' :
                existingInterest.status === 'DECLINED' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {existingInterest.status}
              </span>
            </div>
            <p className="text-sm text-green-700 mt-2">Submitted on {new Date(existingInterest.createdAt).toLocaleDateString()}</p>
            <p className="text-sm text-gray-700 mt-1">Support offered: {existingInterest.supportTypes.join(', ')}</p>
          </div>
        ) : showForm ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{submitError}</div>}

            <div>
              <label className="block text-sm font-medium mb-2">Support Types *</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {SUPPORT_TYPES.map((t) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={supportTypes.includes(t)}
                      onChange={() => toggleType(t)}
                      className="rounded"
                    />
                    {t.replace(/_/g, ' ')}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Proposed Contribution *</label>
              <textarea
                required
                value={proposedContribution}
                onChange={(e) => setProposedContribution(e.target.value)}
                className="w-full border rounded p-2 text-sm"
                rows={3}
                placeholder="Describe specifically what you will contribute to this project..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Message to University <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full border rounded p-2 text-sm"
                rows={2}
                placeholder="Any additional message for the university team..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || supportTypes.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 px-6 rounded font-medium text-sm"
              >
                {submitting ? 'Submitting...' : 'Submit Interest'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-600 py-2 px-4 border rounded text-sm hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p className="text-gray-600 text-sm mb-4">Express interest in collaborating on this project. The university team will review your request.</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded font-medium"
            >
              Express Interest
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
