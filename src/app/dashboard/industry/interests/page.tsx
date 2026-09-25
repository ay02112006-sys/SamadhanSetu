'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Interest = {
  interestId: string;
  projectId: string;
  supportTypes: string[];
  proposedContribution: string;
  status: string;
  createdAt: string;
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  DECLINED: 'bg-red-100 text-red-700',
  WITHDRAWN: 'bg-gray-100 text-gray-600',
};

export default function IndustryInterestsPage() {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/industry/interests')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setInterests(d.interests ?? []);
        else setError(d.error ?? 'Failed to load');
        setLoading(false);
      })
      .catch(() => { setError('Network error'); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Loading interests...</div>;

  return (
    <section className="p-8">
      <h1 className="text-2xl font-bold mb-6">My Interest Submissions</h1>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}

      {interests.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <p className="text-gray-500">No interests submitted yet.</p>
          <Link href="/dashboard/industry/projects" className="mt-3 inline-block text-blue-600 underline text-sm">Browse Projects</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {interests.map((interest) => (
            <div key={interest.interestId} className="bg-white border rounded-lg p-5 flex justify-between items-start">
              <div>
                <p className="font-mono text-xs text-gray-400 mb-1">{interest.interestId}</p>
                <p className="font-medium">Project: {interest.projectId}</p>
                <p className="text-sm text-gray-600 mt-1">Support: {interest.supportTypes.join(', ')}</p>
                <p className="text-sm text-gray-500 mt-1">Submitted: {new Date(interest.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded font-medium ${STATUS_STYLES[interest.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {interest.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
