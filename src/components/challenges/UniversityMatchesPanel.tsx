'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { UniversityMatch } from '@/types/university-match';
import { User } from '@/types/user';

interface UniversityMatchesPanelProps {
  challengeId: string;
}

export function UniversityMatchesPanel({ challengeId }: UniversityMatchesPanelProps) {
  const [matches, setMatches] = useState<UniversityMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetched, setFetched] = useState(false);
  const [triggering, setTriggering] = useState(false);
  
  // Optional map to show university names if we had an API for it, 
  // but we can just display the match data for now.

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/challenges/${challengeId}/matches`);
        const data = await res.json();
        if (res.ok) {
          setMatches(data.matches);
          setFetched(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatches();
  }, [challengeId]);

  const triggerMatch = async () => {
    setTriggering(true);
    setError('');
    try {
      const res = await fetch(`/api/challenges/${challengeId}/match-universities`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setMatches(data.matches);
        setFetched(true);
      } else {
        setError(data.error || 'Failed to match universities');
      }
    } catch (e) {
      setError('An error occurred while matching.');
    } finally {
      setTriggering(false);
    }
  };

  if (loading && !fetched) {
    return <div className="mt-8 text-gray-500">Loading university matches...</div>;
  }

  return (
    <div className="mt-8 border-t pt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">University Matches</h2>
        <Button onClick={triggerMatch} disabled={triggering} className="bg-blue-600 hover:bg-blue-700 text-white">
          {triggering ? 'Matching...' : 'Find Matches'}
        </Button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}

      {fetched && matches.length === 0 ? (
        <div className="p-4 bg-gray-50 rounded border text-gray-600">
          No universities matched yet. Click &quot;Find Matches&quot; to search based on AI analysis.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((match, i) => (
            <div key={i} className="border p-4 rounded bg-white shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-lg text-gray-800">Match #{i + 1}</span>
                <span className="text-sm font-medium bg-green-100 text-green-800 px-2 py-1 rounded">Score: {match.score}</span>
              </div>
              
              <div className="mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">Status</span>
                <p className="text-sm font-medium">{match.status}</p>
              </div>

              <div className="mt-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">Why They Match</span>
                <ul className="list-disc pl-4 text-sm text-gray-600 mt-1">
                  {match.reasons.map((r, idx) => <li key={idx}>{r}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
