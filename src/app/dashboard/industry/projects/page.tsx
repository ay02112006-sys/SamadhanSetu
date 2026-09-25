'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type MatchedProject = {
  projectId: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  targetDate: string;
  challengeTitle: string;
  challengeDomain: string;
  challengeLocation: { state?: string; city?: string };
  universityName: string;
  universityCity: string;
  universityState: string;
  matchScore: number;
  matchConfidence: number;
  matchReasons: string[];
  matchedAreas: string[];
  matchedExpertise: string[];
  matchedTechnologies: string[];
  matchedCapabilities: string[];
  matchStatus: string;
};

const STATUS_COLORS: Record<string, string> = {
  PLANNING: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-purple-100 text-purple-700',
  TESTING: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-green-100 text-green-700',
  ON_HOLD: 'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const SCORE_COLOR = (score: number) => {
  if (score >= 75) return 'text-green-700 bg-green-50 border-green-200';
  if (score >= 50) return 'text-blue-700 bg-blue-50 border-blue-200';
  if (score >= 25) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-gray-600 bg-gray-50 border-gray-200';
};

export default function IndustryProjectsPage() {
  const [projects, setProjects] = useState<MatchedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (domainFilter) params.set('domain', domainFilter);
    try {
      const res = await fetch(`/api/industry/projects?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setProjects(data.projects ?? []);
      } else {
        setError(data.error ?? 'Failed to load projects');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, domainFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const runMatching = async () => {
    setMatching(true);
    setError('');
    try {
      const res = await fetch('/api/industry/match-projects', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        await fetchProjects();
      } else {
        setError(data.error ?? 'Matching failed');
      }
    } catch {
      setError('Network error during matching');
    } finally {
      setMatching(false);
    }
  };

  return (
    <section className="p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Discover Projects</h1>
          <p className="text-gray-500 text-sm mt-1">University projects matched to your organization&apos;s profile</p>
        </div>
        <button
          onClick={runMatching}
          disabled={matching}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 px-5 rounded font-medium text-sm"
        >
          {matching ? 'Finding Matches...' : '🔍 Refresh Matches'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded p-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="PLANNING">Planning</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="TESTING">Testing</option>
        </select>
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          className="border rounded p-2 text-sm"
        >
          <option value="">All Domains</option>
          <option value="AGRICULTURE">Agriculture</option>
          <option value="HEALTHCARE">Healthcare</option>
          <option value="WATER">Water</option>
          <option value="EDUCATION">Education</option>
          <option value="ENVIRONMENT">Environment</option>
          <option value="RURAL_LIVELIHOODS">Rural Livelihoods</option>
          <option value="URBAN_INFRASTRUCTURE">Urban Infrastructure</option>
        </select>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}

      {loading ? (
        <div className="text-gray-400 py-12 text-center">Loading matched projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 bg-white border rounded-lg">
          <p className="text-gray-500 text-lg mb-2">No matched projects found</p>
          <p className="text-gray-400 text-sm mb-6">Click &quot;Refresh Matches&quot; to run the matching engine, or complete your profile with more details.</p>
          <Link href="/dashboard/industry/profile" className="text-blue-600 underline">Update Profile</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((project) => (
            <div key={project.projectId} className="bg-white border rounded-lg shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-mono text-gray-400">{project.projectId}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[project.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {project.status.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${SCORE_COLOR(project.matchScore)}`}>
                      {project.matchScore}% match
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-1 leading-tight">{project.title}</h3>
                <p className="text-xs text-blue-600 mb-3">
                  Challenge: {project.challengeTitle} · {project.challengeDomain.replace(/_/g, ' ')}
                </p>

                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{project.description}</p>

                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1 text-gray-500">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>

                <div className="text-xs text-gray-500 space-y-1 mb-4">
                  <p>🏛 {project.universityName} — {project.universityCity}, {project.universityState}</p>
                  <p>📅 Target: {new Date(project.targetDate).toLocaleDateString()}</p>
                </div>

                {/* Match reasons */}
                {project.matchReasons.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded text-xs text-blue-800">
                    <p className="font-semibold mb-1">Why this matches:</p>
                    <ul className="space-y-0.5 list-disc list-inside">
                      {project.matchReasons.slice(0, 3).map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              <div className="p-4 border-t bg-gray-50">
                <Link
                  href={`/dashboard/industry/projects/${project.projectId}`}
                  className="block w-full text-center bg-gray-900 text-white py-2 rounded hover:bg-gray-700 text-sm font-medium"
                >
                  View Details & Express Interest
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
