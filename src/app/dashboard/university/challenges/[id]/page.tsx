// src/app/dashboard/university/challenges/[id]/page.tsx
import { getServerAuthSession } from "@/lib/auth";
import { getUniversityMatchCollection } from "@/lib/university";
import { getChallengeCollection } from "@/lib/challenge";
import { notFound, redirect } from "next/navigation";
import MatchActions from "./MatchActions";

export default async function UniversityChallengeDetail({ params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session || !session.user) {
    redirect('/login');
  }

  const userRole = (session.user as { role?: string }).role;
  const userId = (session.user as { id?: string }).id;

  if (userRole !== 'UNIVERSITY' || !userId) {
    notFound();
  }

  const challengeId = params.id;

  const matchColl = await getUniversityMatchCollection();
  const match = await matchColl.findOne({ challengeId, universityId: userId });

  if (!match) {
    return (
      <section className="p-8">
        <h1 className="text-2xl font-semibold mb-6">Challenge Detail</h1>
        <p className="text-red-500">This challenge has not been matched to your university.</p>
      </section>
    );
  }

  const challengeColl = await getChallengeCollection();
  const challenge = await challengeColl.findOne({ challengeId });

  if (!challenge) {
    notFound();
  }

  const ai = challenge.aiAnalysis;

  return (
    <section className="p-8 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded shadow-sm mb-6 border">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-sm text-gray-500">{challenge.challengeId}</span>
            <h1 className="text-2xl font-bold mt-1">{challenge.title}</h1>
          </div>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {match.status}
          </span>
        </div>
        <p className="text-gray-700 mb-6">{challenge.description}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
          <div>
            <p className="text-gray-500 font-medium">Domain</p>
            <p>{challenge.domain}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium">Priority</p>
            <p>{challenge.priority}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium">Location</p>
            <p>{challenge.location.state || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium">Submitted</p>
            <p>{new Date(challenge.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {ai && (
          <div className="bg-blue-50 p-4 rounded mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">AI Analysis</h3>
            <p className="text-sm text-blue-800 mb-3">{ai.problemSummary}</p>
            <div className="flex gap-2 flex-wrap text-xs">
              <span className="bg-white px-2 py-1 rounded border text-gray-600">Impact: {ai.impactLevel}</span>
              <span className="bg-white px-2 py-1 rounded border text-gray-600">Urgency: {ai.urgencyLevel}</span>
            </div>
          </div>
        )}

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Match Details</h2>
          <div className="bg-gray-50 p-4 rounded mb-4">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium">Match Score</span>
              <span className="text-xl font-bold text-green-600">{match.score}/100</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Why this match was made:</p>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                {match.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </div>
        </div>

        <MatchActions challengeId={challengeId} universityId={userId} currentStatus={match.status} />
      </div>
    </section>
  );
}
