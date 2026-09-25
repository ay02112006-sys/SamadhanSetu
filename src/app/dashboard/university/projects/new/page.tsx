// src/app/dashboard/university/projects/new/page.tsx
import { getServerAuthSession } from "@/lib/auth";
import { getUniversityMatchCollection, getUniversityTeamCollection } from "@/lib/university";
import { notFound, redirect } from "next/navigation";
import NewProjectForm from "./NewProjectForm";

export default async function NewProjectPage({ searchParams }: { searchParams: { challengeId?: string, teamId?: string } }) {
  const session = await getServerAuthSession();
  if (!session || !session.user) {
    redirect('/login');
  }

  const userRole = (session.user as { role?: string }).role;
  const userId = (session.user as { id?: string }).id;

  if (userRole !== 'UNIVERSITY' || !userId) {
    notFound();
  }

  const { challengeId, teamId } = searchParams;

  if (!challengeId || !teamId) {
    return (
      <section className="p-8">
        <h1 className="text-2xl font-semibold mb-6">Create Solution Project</h1>
        <p className="text-red-500">Challenge ID and Team ID are required.</p>
      </section>
    );
  }

  const matchColl = await getUniversityMatchCollection();
  const match = await matchColl.findOne({ challengeId, universityId: userId });

  if (!match || match.status !== 'ACCEPTED') {
    return (
      <section className="p-8">
        <h1 className="text-2xl font-semibold mb-6">Create Solution Project</h1>
        <p className="text-red-500">You must have an accepted match for this challenge.</p>
      </section>
    );
  }

  const teamColl = await getUniversityTeamCollection();
  const team = await teamColl.findOne({ teamId, universityId: userId, challengeId });

  if (!team) {
    return (
      <section className="p-8">
        <h1 className="text-2xl font-semibold mb-6">Create Solution Project</h1>
        <p className="text-red-500">Invalid team specified or team does not belong to this challenge.</p>
      </section>
    );
  }

  return (
    <section className="p-8">
      <h1 className="text-2xl font-semibold mb-2">Create Solution Project</h1>
      <p className="text-gray-600 mb-6">Create a project for challenge: <span className="font-mono font-medium">{challengeId}</span></p>
      <NewProjectForm challengeId={challengeId} teamId={teamId} />
    </section>
  );
}
