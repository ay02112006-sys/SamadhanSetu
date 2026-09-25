// src/app/dashboard/citizen/page.tsx
import { getServerAuthSession } from "@/lib/auth";
import { getChallengeCollection } from "@/lib/challenge";
import { ChallengeStatus } from "@/types/challenge";

export default async function CitizenDashboard() {
  const session = await getServerAuthSession();
  const name = session?.user?.name ?? "User";
  const userId = session?.user?.id as string;

  // Fetch challenge stats for this citizen
  const coll = await getChallengeCollection();
  const total = await coll.countDocuments({ submittedBy: userId });
  const underReview = await coll.countDocuments({ submittedBy: userId, status: "UNDER_REVIEW" as ChallengeStatus });
  const inProgress = await coll.countDocuments({ submittedBy: userId, status: "IN_PROGRESS" as ChallengeStatus });
  const resolved = await coll.countDocuments({ submittedBy: userId, status: "RESOLVED" as ChallengeStatus });

  return (
    <section className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Welcome, {name}</h1>
      <h2 className="text-xl font-medium mb-2">Citizen Portal</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 border rounded bg-white">
          <p className="font-medium">My Challenges</p>
          <p className="text-2xl">{total}</p>
        </div>
        <div className="p-4 border rounded bg-white">
          <p className="font-medium">Under Review</p>
          <p className="text-2xl">{underReview}</p>
        </div>
        <div className="p-4 border rounded bg-white">
          <p className="font-medium">In Progress</p>
          <p className="text-2xl">{inProgress}</p>
        </div>
        <div className="p-4 border rounded bg-white">
          <p className="font-medium">Resolved</p>
          <p className="text-2xl">{resolved}</p>
        </div>
      </div>
      <div className="flex gap-4">
        <a href="/challenges/my" className="inline-block bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark">
          My Challenges
        </a>
        <a href="/challenges/new" className="inline-block bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark">
          Report a Challenge
        </a>
      </div>
    </section>
  );
}
