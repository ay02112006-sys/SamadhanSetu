'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Project = {
  projectId: string;
  title: string;
  status: string;
  progress: number;
  targetDate: string;
  updatedAt: string;
  challengeId: string;
  challengeTitle: string;
  challengeDomain: string;
  challengeLocation: { state?: string; city?: string };
  universityName: string;
  industryCollaborations: number;
};

export default function GovernmentProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '20');
    if (statusFilter) params.set('status', statusFilter);
    if (domainFilter) params.set('domain', domainFilter);

    try {
      const res = await fetch(`/api/government/projects?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setProjects(data.data.projects);
        setTotal(data.data.total);
        setPages(data.data.pages);
      } else {
        setError(data.error ?? 'Failed to load projects');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, domainFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const STATUS_COLORS: Record<string, string> = {
    PLANNING: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
    TESTING: 'bg-purple-100 text-purple-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  return (
    <section className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Project Monitoring</h1>
          <p className="text-gray-500 text-sm mt-1">Ecosystem-wide view of all university projects</p>
        </div>
      </div>

      <div className="bg-white border rounded-lg shadow-sm p-4 mb-6 flex flex-wrap gap-3">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="border rounded p-2 text-sm flex-1 min-w-[200px]">
          <option value="">All Project Statuses</option>
          <option value="PLANNING">Planning</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="TESTING">Testing / Pilot</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select value={domainFilter} onChange={(e) => { setDomainFilter(e.target.value); setPage(1); }} className="border rounded p-2 text-sm flex-1 min-w-[200px]">
          <option value="">All Challenge Domains</option>
          <option value="EDUCATION">Education</option>
          <option value="HEALTHCARE">Healthcare</option>
          <option value="AGRICULTURE">Agriculture</option>
          <option value="WATER">Water</option>
          <option value="ENVIRONMENT">Environment</option>
          <option value="RURAL_LIVELIHOODS">Rural Livelihoods</option>
          <option value="URBAN_INFRASTRUCTURE">Urban Infrastructure</option>
        </select>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border text-red-700 rounded">{error}</div>}

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Project / Challenge</th>
                <th className="p-4 font-semibold text-gray-600">University / Location</th>
                <th className="p-4 font-semibold text-gray-600">Status & Progress</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && projects.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading projects...</td></tr>
              ) : projects.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No projects found matching criteria.</td></tr>
              ) : (
                projects.map((p) => (
                  <tr key={p.projectId} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-bold max-w-sm truncate" title={p.title}>{p.title}</p>
                      <p className="text-xs text-gray-500 mt-1 max-w-sm truncate" title={p.challengeTitle}>Challenge: {p.challengeTitle}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{p.projectId}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-gray-800">{p.universityName}</p>
                      <p className="text-xs text-gray-500 mt-1">{p.challengeDomain.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{[p.challengeLocation?.city, p.challengeLocation?.state].filter(Boolean).join(', ') || 'Location unspec.'}</p>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>{p.status.replace(/_/g, ' ')}</span>
                      <div className="mt-2 w-32 bg-gray-200 rounded-full h-1.5 mb-1">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${p.progress}%` }}></div>
                      </div>
                      <p className="text-xs text-gray-500 flex justify-between w-32">
                        <span>{p.progress}%</span>
                        {p.industryCollaborations > 0 && <span className="text-blue-600 font-medium">{p.industryCollaborations} Collab</span>}
                      </p>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/dashboard/government/projects/${p.projectId}`} className="text-blue-600 hover:underline text-sm font-medium">
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
