'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UniversityInterestActions({ interestId }: { interestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<'ACCEPTED' | 'DECLINED' | null>(null);
  const [error, setError] = useState('');

  const handleReview = async (status: 'ACCEPTED' | 'DECLINED') => {
    setLoading(status);
    setError('');
    try {
      const res = await fetch(`/api/university/industry/interests/${interestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        router.refresh();
      } else {
        setError(data.error ?? 'Failed to update');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="pt-4 border-t flex items-center gap-3">
      {error && <span className="text-red-600 text-sm flex-1">{error}</span>}
      <button
        onClick={() => handleReview('ACCEPTED')}
        disabled={loading !== null}
        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 px-5 rounded text-sm font-medium"
      >
        {loading === 'ACCEPTED' ? 'Accepting...' : 'Accept'}
      </button>
      <button
        onClick={() => handleReview('DECLINED')}
        disabled={loading !== null}
        className="bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 py-2 px-5 rounded text-sm font-medium"
      >
        {loading === 'DECLINED' ? 'Declining...' : 'Decline'}
      </button>
    </div>
  );
}
