'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { ProjectStatus } from '@/types/project';

const STATUSES: ProjectStatus[] = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'UNDER_REVIEW', 'TESTING', 'COMPLETED', 'CANCELLED'];

export default function ProjectStatusManager({ projectId, currentStatus }: { projectId: string, currentStatus: ProjectStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ProjectStatus>(currentStatus);
  const [error, setError] = useState('');

  const handleUpdate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/university/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        router.refresh();
      } else {
        setError(data.error || 'Failed to update status');
      }
    } catch (e) {
      setError('Error updating status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="flex gap-2 items-center">
        <select 
          value={status} 
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          className="border rounded p-1.5 text-sm"
        >
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <Button 
          disabled={loading || status === currentStatus} 
          onClick={handleUpdate}
          className="bg-black hover:bg-gray-800 text-white py-1.5 px-3 text-sm"
        >
          Update Status
        </Button>
      </div>
    </div>
  );
}
