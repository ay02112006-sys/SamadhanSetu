'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Collaboration = {
  collaborationId: string;
  projectId: string;
  status: string;
  supportTypes: string[];
  scope: string;
  startDate: string;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  INITIATED: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700',
  ON_HOLD: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function IndustryCollaborationsPage() {
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/industry/collaborations')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCollaborations(d.collaborations ?? []);
        else setError(d.error ?? 'Failed to load');
        setLoading(false);
      })
      .catch(() => { setError('Network error'); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Loading collaborations...</div>;

  return (
    <section className="p-8">
      <h1 className="text-2xl font-bold mb-6">My Collaborations</h1>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}

      {collaborations.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <p className="text-gray-500">No active collaborations yet.</p>
          <p className="text-sm text-gray-400 mt-2">Express interest in a project and wait for university approval.</p>
          <Link href="/dashboard/industry/projects" className="mt-3 inline-block text-blue-600 underline text-sm">Browse Projects</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {collaborations.map((collab) => (
            <div key={collab.collaborationId} className="bg-white border rounded-lg p-5 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <p className="font-mono text-xs text-gray-400">{collab.collaborationId}</p>
                <span className={`text-xs px-2 py-1 rounded font-medium ${STATUS_COLORS[collab.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {collab.status}
                </span>
              </div>
              <h3 className="font-semibold mb-1">Project: {collab.projectId}</h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{collab.scope}</p>
              <p className="text-xs text-gray-500 mb-4">Support: {collab.supportTypes.join(', ')}</p>
              <div className="mt-auto pt-3 border-t">
                <Link
                  href={`/dashboard/industry/collaborations/${collab.collaborationId}`}
                  className="block text-center w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-700 text-sm"
                >
                  Manage Collaboration
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
