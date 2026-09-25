// src/app/dashboard/university/teams/new/page.tsx
import { getServerAuthSession } from "@/lib/auth";
import { getUniversityMatchCollection } from "@/lib/university";
import { notFound, redirect } from "next/navigation";
import NewTeamForm from "./NewTeamForm";

export default async function NewTeamPage({ searchParams }: { searchParams: { challengeId?: string } }) {
  const session = await getServerAuthSession();
  if (!session || !session.user) {
    redirect('/login');
  }

  const userRole = (session.user as { role?: string }).role;
  const userId = (session.user as { id?: string }).id;

  if (userRole !== 'UNIVERSITY' || !userId) {
    notFound();
  }

  const challengeId = searchParams.challengeId;
  if (!challengeId) {
    return (
      <section className="p-8">
        <h1 className="text-2xl font-semibold mb-6">Form Solution Team</h1>
        <p className="text-red-500">No challenge ID provided.</p>
      </section>
    );
  }

  const matchColl = await getUniversityMatchCollection();
  const match = await matchColl.findOne({ challengeId, universityId: userId });

  if (!match || match.status !== 'ACCEPTED') {
    return (
      <section className="p-8">
        <h1 className="text-2xl font-semibold mb-6">Form Solution Team</h1>
        <p className="text-red-500">You must accept the match for this challenge before forming a team.</p>
      </section>
    );
  }

  return (
    <section className="p-8">
      <h1 className="text-2xl font-semibold mb-2">Form Solution Team</h1>
      <p className="text-gray-600 mb-6">Create a team for challenge: <span className="font-mono font-medium">{challengeId}</span></p>
      <NewTeamForm challengeId={challengeId} />
    </section>
  );
}
