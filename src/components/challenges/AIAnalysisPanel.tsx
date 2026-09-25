'use client';
// src/components/challenges/AIAnalysisPanel.tsx
// Client component — displays AI analysis for a challenge.
// Handles idle, processing, completed (real + fallback), and failed states.
// Never reads or exposes OPENAI_API_KEY.

import React, { useState, useTransition } from 'react';
import { AIChallengeAnalysis, AIAnalysisStatus } from '@/types/ai-analysis';

interface AIAnalysisPanelProps {
  challengeId: string;
  /** Initial analysis state from the server render (may be null). */
  initialAnalysis: AIChallengeAnalysis | null | undefined;
}

export function AIAnalysisPanel({ challengeId, initialAnalysis }: AIAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<AIChallengeAnalysis | null | undefined>(initialAnalysis);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const triggerAnalysis = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/challenges/${challengeId}/analyze`, {
          method: 'POST',
        });
        const body = await res.json() as { success: boolean; data?: AIChallengeAnalysis; error?: string };
        if (!body.success) {
          setError(body.error ?? 'Analysis failed. Please try again.');
        } else {
          setAnalysis(body.data ?? null);
        }
      } catch {
        setError('Network error. Please try again.');
      }
    });
  };

  const isProcessing =
    isPending ||
    analysis?.status === AIAnalysisStatus.PROCESSING;

  const isFallback = analysis?.status === AIAnalysisStatus.FALLBACK;
  const isCompleted =
    analysis?.status === AIAnalysisStatus.COMPLETED || isFallback;
  const isFailed = analysis?.status === AIAnalysisStatus.FAILED;
  const isNeedsReview = analysis?.status === AIAnalysisStatus.NEEDS_HUMAN_REVIEW;
  const hasAnalysis = isCompleted || isNeedsReview;

  return (
    <section className="mt-8 border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-800">🤖 AI Analysis</span>
          {isFallback && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300">
              Fallback (deterministic)
            </span>
          )}
          {analysis?.status === AIAnalysisStatus.COMPLETED && !isFallback && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-300">
              AI Powered
            </span>
          )}
          {isNeedsReview && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-300">
              Needs Human Review
            </span>
          )}
        </div>

        {/* Action button */}
        {!hasAnalysis && !isProcessing && (
          <button
            id="btn-trigger-analysis"
            onClick={triggerAnalysis}
            disabled={isProcessing}
            className="px-4 py-1.5 rounded-md text-sm font-medium bg-primary text-white hover:bg-primaryLight disabled:opacity-50 transition-colors"
          >
            Analyze
          </button>
        )}
        {(isFailed || isFallback) && (
          <button
            id="btn-retry-analysis"
            onClick={triggerAnalysis}
            disabled={isProcessing}
            className="px-4 py-1.5 rounded-md text-sm font-medium bg-primary text-white hover:bg-primaryLight disabled:opacity-50 transition-colors"
          >
            {isFailed ? 'Retry Analysis' : 'Re-analyze'}
          </button>
        )}
      </div>

      <div className="px-6 py-5">
        {/* ── Idle (no analysis yet) ── */}
        {!analysis && !isProcessing && !error && (
          <p className="text-sm text-gray-500">
            No analysis yet. Click <strong>Analyze</strong> to let the AI engine classify, prioritize, and detect duplicates for this challenge.
          </p>
        )}

        {/* ── Processing ── */}
        {isProcessing && (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Analysis in progress — this may take a few seconds…
          </div>
        )}

        {/* ── Error ── */}
        {error && !isProcessing && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── Failed (persisted) ── */}
        {isFailed && !isProcessing && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            <span>❌</span>
            <span>Previous analysis failed. Click <strong>Retry Analysis</strong> to try again.</span>
          </div>
        )}

        {/* ── Completed / Fallback results ── */}
        {hasAnalysis && analysis && !isProcessing && (
          <div className="space-y-5">
            {isFallback && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                ⚠️ This analysis was generated using deterministic fallback (keyword-based) because the external AI service was unavailable.
              </div>
            )}

            {/* Summary */}
            {analysis.problemSummary && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Summary</h3>
                <p className="text-sm text-gray-700">{analysis.problemSummary}</p>
              </div>
            )}

            {/* Core classification */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <AnalysisCard label="Domain" value={analysis.suggestedDomain} confidence={analysis.domainConfidence} />
              <AnalysisCard label="Priority" value={analysis.suggestedPriority} confidence={analysis.priorityConfidence} />
              <AnalysisCard label="Impact" value={analysis.impactLevel} />
              <AnalysisCard label="Urgency" value={analysis.urgencyLevel} />
            </div>

            {/* Affected population */}
            {(analysis.affectedPopulation || analysis.affectedPopulationEstimate) && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Affected Population</h3>
                <p className="text-sm text-gray-700">
                  {[analysis.affectedPopulation, analysis.affectedPopulationEstimate].filter(Boolean).join(' — ')}
                </p>
              </div>
            )}

            {/* Duplicate detection */}
            {analysis.duplicateCandidates.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Similar Challenges Detected
                </h3>
                <ul className="space-y-1">
                  {analysis.duplicateCandidates.map((d) => (
                    <li key={d.challengeId} className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{d.challengeId}</span>
                      <span className="text-gray-500">{Math.round(d.similarityScore * 100)}% similar</span>
                      <span className="text-gray-400 text-xs">{d.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Routing signals */}
            {analysis.routingSignals.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Routing Signals</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.routingSignals.map((s) => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords / Tags */}
            {(analysis.keywords.length > 0 || analysis.suggestedTags.length > 0) && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Tags &amp; Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {[...analysis.suggestedTags, ...analysis.keywords].map((t) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reasoning */}
            {analysis.reasoning && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">AI Reasoning</h3>
                <p className="text-xs text-gray-500 italic">{analysis.reasoning}</p>
              </div>
            )}

            {/* Provider metadata */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100 text-xs text-gray-400">
              <span>Provider: <strong>{analysis.modelProvider ?? 'unknown'}</strong></span>
              {analysis.modelName && <span>· Model: {analysis.modelName}</span>}
              <span>· {new Date(analysis.analyzedAt).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

interface AnalysisCardProps {
  label: string;
  value: string;
  confidence?: number;
}

function AnalysisCard({ label, value, confidence }: AnalysisCardProps) {
  return (
    <div className="p-3 rounded-lg bg-white border border-gray-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
      {confidence !== undefined && (
        <div className="mt-1.5">
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-1 bg-primary rounded-full"
              style={{ width: `${Math.round(confidence * 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{Math.round(confidence * 100)}% confidence</p>
        </div>
      )}
    </div>
  );
}
