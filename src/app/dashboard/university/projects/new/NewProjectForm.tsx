'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function NewProjectForm({ challengeId, teamId }: { challengeId: string, teamId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/university/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          teamId,
          title,
          description,
          targetDate
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        router.push(`/dashboard/university/projects/${data.project.projectId}`);
      } else {
        setError(data.error || 'Failed to create project');
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl bg-white p-6 rounded shadow-sm">
      {error && <div className="p-3 bg-red-50 text-red-700 rounded">{error}</div>}

      <div>
        <label className="block text-sm font-medium mb-1">Project Title</label>
        <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded p-2" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description / Objectives</label>
        <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded p-2" rows={4}></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Target Completion Date</label>
        <input required type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full border rounded p-2" />
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
          {loading ? 'Creating Project...' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}
