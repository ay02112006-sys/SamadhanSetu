'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Challenge = {
  challengeId: string;
  title: string;
  domain: string;
  priority: string;
  status: string;
  location: { state?: string; city?: string };
  createdAt: string;
  aiStatus: string | null;
  hasDuplicateCandidates: boolean;
  hasUniversityMatch: boolean;
  projectStatus: string | null;
};

export default function GovernmentChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [domainFilter, setDomainFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [aiFilter, setAiFilter] = useState('');

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '20');
    if (domainFilter) params.set('domain', domainFilter);
    if (priorityFilter) params.set('priority', priorityFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (aiFilter) params.set('aiAnalyzed', aiFilter);

    try {
      const res = await fetch(`/api/government/challenges?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setChallenges(data.data.challenges);
        setTotal(data.data.total);
        setPages(data.data.pages);
      } else {
        setError(data.error ?? 'Failed to load challenges');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [page, domainFilter, priorityFilter, statusFilter, aiFilter]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const STATUS_COLORS: Record<string, string> = {
    SUBMITTED: 'bg-gray-100 text-gray-700',
    UNDER_REVIEW: 'bg-blue-100 text-blue-700',
    VALIDATED: 'bg-green-100 text-green-700',
    IN_PROGRESS: 'bg-purple-100 text-purple-700',
    RESOLVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
  };

  const PRIORITY_COLORS: Record<string, string> = {
    CRITICAL: 'bg-red-500 text-white',
    HIGH: 'bg-orange-500 text-white',
    MEDIUM: 'bg-yellow-500 text-white',
    LOW: 'bg-green-500 text-white',
  };

  return (
    <section className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Challenge Monitoring</h1>
          <p className="text-gray-500 text-sm mt-1">Ecosystem-wide view of all submitted challenges</p>
        </div>
      </div>

      <div className="bg-white border rounded-lg shadow-sm p-4 mb-6 flex flex-wrap gap-3">
        <select value={domainFilter} onChange={(e) => { setDomainFilter(e.target.value); setPage(1); }} className="border rounded p-2 text-sm flex-1 min-w-[150px]">
          <option value="">All Domains</option>
          <option value="EDUCATION">Education</option>
          <option value="HEALTHCARE">Healthcare</option>
          <option value="AGRICULTURE">Agriculture</option>
          <option value="WATER">Water</option>
          <option value="ENVIRONMENT">Environment</option>
          <option value="RURAL_LIVELIHOODS">Rural Livelihoods</option>
          <option value="URBAN_INFRASTRUCTURE">Urban Infrastructure</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="border rounded p-2 text-sm flex-1 min-w-[150px]">
          <option value="">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="VALIDATED">Validated</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }} className="border rounded p-2 text-sm flex-1 min-w-[150px]">
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select value={aiFilter} onChange={(e) => { setAiFilter(e.target.value); setPage(1); }} className="border rounded p-2 text-sm flex-1 min-w-[150px]">
          <option value="">AI Status: All</option>
          <option value="yes">AI Analyzed</option>
          <option value="no">Not Analyzed</option>
        </select>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border text-red-700 rounded">{error}</div>}

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-gray-600">ID / Title</th>
                <th className="p-4 font-semibold text-gray-600">Domain & Location</th>
                <th className="p-4 font-semibold text-gray-600">Priority & Status</th>
                <th className="p-4 font-semibold text-gray-600">Lifecycle</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && challenges.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading challenges...</td></tr>
              ) : challenges.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No challenges found matching criteria.</td></tr>
              ) : (
                challenges.map((c) => (
                  <tr key={c.challengeId} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-mono text-xs text-gray-400 mb-1">{c.challengeId}</p>
                      <p className="font-medium max-w-xs truncate" title={c.title}>{c.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-gray-800">{c.domain.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500 mt-1">{[c.location?.city, c.location?.state].filter(Boolean).join(', ') || 'Unspecified'}</p>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded font-bold mr-2 ${PRIORITY_COLORS[c.priority] ?? 'bg-gray-500 text-white'}`}>{c.priority}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium mt-1 inline-block ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-600'}`}>{c.status.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${c.aiStatus ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-xs text-gray-600">AI Analyzed</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${c.hasUniversityMatch ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-xs text-gray-600">Uni Matches</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${c.projectStatus ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-xs text-gray-600">Project: {c.projectStatus ?? 'None'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/dashboard/government/challenges/${c.challengeId}`} className="text-blue-600 hover:underline text-sm font-medium">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t flex justify-between items-center bg-gray-50">
          <span className="text-sm text-gray-500">Total: {total}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 border rounded bg-white disabled:opacity-50 text-sm"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm">Page {page} of {pages || 1}</span>
            <button
              disabled={page >= pages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 border rounded bg-white disabled:opacity-50 text-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
