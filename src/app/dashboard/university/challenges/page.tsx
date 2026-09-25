// src/app/dashboard/university/challenges/page.tsx
import { getServerAuthSession } from "@/lib/auth";
import { getUniversityMatchCollection } from "@/lib/university";
import { getChallengeCollection } from "@/lib/challenge";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Challenge } from "@/types/challenge";

export default async function MatchedChallengesPage() {
  const session = await getServerAuthSession();
  if (!session || !session.user) {
    redirect('/login');
  }

  const userRole = (session.user as { role?: string }).role;
  const userId = (session.user as { id?: string }).id;

  if (userRole !== 'UNIVERSITY' || !userId) {
    notFound();
  }

  const matchColl = await getUniversityMatchCollection();
  const matches = await matchColl.find({ universityId: userId }).sort({ score: -1 }).toArray();

  if (matches.length === 0) {
    return (
      <section className="p-8">
        <h1 className="text-2xl font-semibold mb-6">Matched Challenges</h1>
        <p className="text-gray-500">No challenges have been matched to your university yet.</p>
      </section>
    );
  }

  const challengeIds = matches.map(m => m.challengeId);
  const challengeColl = await getChallengeCollection();
  const challenges = await challengeColl.find({ challengeId: { $in: challengeIds } }).toArray();

  const challengeMap = new Map<string, Challenge>();
  for (const c of challenges) {
    challengeMap.set(c.challengeId, c);
  }

  return (
    <section className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Matched Challenges</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map(match => {
          const challenge = challengeMap.get(match.challengeId);
          if (!challenge) return null;

          return (
            <div key={match._id?.toString()} className="border rounded-lg bg-white shadow-sm p-6 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-blue-600">{match.challengeId}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  match.status === 'SUGGESTED' ? 'bg-gray-100 text-gray-800' :
                  match.status === 'SHORTLISTED' ? 'bg-yellow-100 text-yellow-800' :
                  match.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {match.status}
                </span>
              </div>
              <h3 className="text-lg font-bold mb-2 line-clamp-2">{challenge.title}</h3>
              <p className="text-sm text-gray-500 mb-4 flex-grow">{challenge.domain} • {challenge.location.state}</p>
              
              <div className="mb-4 bg-gray-50 p-3 rounded text-sm">
                <p className="font-medium text-gray-700">Match Score: {match.score}</p>
                <p className="text-gray-600 line-clamp-2 mt-1">{match.reasons[0]}</p>
              </div>

              <Link href={`/dashboard/university/challenges/${match.challengeId}`} className="block text-center w-full bg-black text-white py-2 rounded hover:bg-gray-800">
                View Details
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
