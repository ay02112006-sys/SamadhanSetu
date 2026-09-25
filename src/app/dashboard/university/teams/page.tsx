// src/app/dashboard/university/teams/page.tsx
import { getServerAuthSession } from "@/lib/auth";
import { getUniversityTeamCollection } from "@/lib/university";
import { getProjectsCollection } from "@/lib/project";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function UniversityTeamsPage() {
  const session = await getServerAuthSession();
  if (!session || !session.user) {
    redirect('/login');
  }

  const userRole = (session.user as { role?: string }).role;
  const userId = (session.user as { id?: string }).id;

  if (userRole !== 'UNIVERSITY' || !userId) {
    notFound();
  }

  const teamColl = await getUniversityTeamCollection();
  const teams = await teamColl.find({ universityId: userId }).sort({ createdAt: -1 }).toArray();

  const projectsColl = await getProjectsCollection();
  const projects = await projectsColl.find({ universityId: userId }).toArray();
  const projectMap = new Map(projects.map(p => [p.teamId, p.projectId]));

  return (
    <section className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Solution Teams</h1>
      </div>

      {teams.length === 0 ? (
        <div className="bg-white p-8 text-center rounded border shadow-sm">
          <p className="text-gray-500">You haven&apos;t formed any solution teams yet.</p>
          <p className="text-sm text-gray-400 mt-2">To form a team, browse matched challenges, accept one, and click &quot;Form Solution Team&quot;.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map(team => {
            const existingProjectId = projectMap.get(team.teamId);

            return (
              <div key={team._id?.toString()} className="border rounded-lg bg-white shadow-sm p-6 flex flex-col">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-mono text-gray-500">{team.teamId}</span>
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Challenge: {team.challengeId}</span>
                </div>
                <h3 className="text-xl font-bold mb-2">{team.name}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{team.description}</p>
                
                <div className="text-sm mb-6">
                  <p><span className="font-medium">Mentor:</span> {team.mentor}</p>
                  <p><span className="font-medium">Members:</span> {team.members.length}</p>
                </div>

                <div className="mt-auto pt-4 border-t">
                  {existingProjectId ? (
                    <Link href={`/dashboard/university/projects/${existingProjectId}`} className="block text-center w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                      View Project
                    </Link>
                  ) : (
                    <Link href={`/dashboard/university/projects/new?challengeId=${team.challengeId}&teamId=${team.teamId}`} className="block text-center w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                      Create Project
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
