// src/components/ChallengeAnalyze.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function ChallengeAnalyze({ challengeId }: { challengeId: string }) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/challenges/${challengeId}/analyze`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze');
      setAnalysis(data.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <Button onClick={runAnalysis} disabled={loading}>
        {loading ? 'Analyzing...' : 'Run AI Analysis'}
      </Button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {analysis && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">AI Analysis</h3>
          <pre className="whitespace-pre-wrap">{JSON.stringify(analysis, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
