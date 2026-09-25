'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { MatchStatus } from '@/types/university-match';

export default function MatchActions({ challengeId, universityId, currentStatus }: { challengeId: string, universityId: string, currentStatus: MatchStatus }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async (status: MatchStatus) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/challenges/${challengeId}/matches/${universityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to update status');
      }
    } catch (e) {
      alert('Error updating status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4 mt-6">
      <Button 
        disabled={loading || currentStatus === 'SHORTLISTED' || currentStatus === 'ACCEPTED'} 
        onClick={() => handleUpdate('SHORTLISTED')}
        className="bg-yellow-600 hover:bg-yellow-700 text-white"
      >
        Shortlist
      </Button>
      <Button 
        disabled={loading || currentStatus === 'ACCEPTED'} 
        onClick={() => handleUpdate('ACCEPTED')}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        Accept
      </Button>
      <Button 
        disabled={loading || currentStatus === 'DECLINED' || currentStatus === 'ACCEPTED'} 
        onClick={() => handleUpdate('DECLINED')}
        className="bg-red-600 hover:bg-red-700 text-white"
      >
        Decline
      </Button>

      {currentStatus === 'ACCEPTED' && (
        <Button 
          onClick={() => router.push(`/dashboard/university/teams/new?challengeId=${challengeId}`)}
          className="bg-blue-600 hover:bg-blue-700 text-white ml-auto"
        >
          Form Solution Team
        </Button>
      )}
    </div>
  );
}
