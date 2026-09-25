// src/app/dashboard/university/projects/page.tsx
import { getServerAuthSession } from "@/lib/auth";
import { getProjectsCollection } from "@/lib/project";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ProjectStatus } from "@/types/project";

const getStatusColor = (status: ProjectStatus) => {
  switch (status) {
    case 'PLANNING': return 'bg-gray-100 text-gray-800';
    case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
    case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800';
    case 'UNDER_REVIEW': return 'bg-purple-100 text-purple-800';
    case 'TESTING': return 'bg-indigo-100 text-indigo-800';
    case 'COMPLETED': return 'bg-green-100 text-green-800';
    case 'CANCELLED': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default async function UniversityProjectsPage() {
  const session = await getServerAuthSession();
  if (!session || !session.user) {
    redirect('/login');
  }

  const userRole = (session.user as { role?: string }).role;
  const userId = (session.user as { id?: string }).id;

  if (userRole !== 'UNIVERSITY' || !userId) {
    notFound();
  }

  const projectsColl = await getProjectsCollection();
  
  // Sort active first (COMPLETED and CANCELLED last)
  const allProjects = await projectsColl.find({ universityId: userId }).sort({ createdAt: -1 }).toArray();

  const activeProjects = allProjects.filter(p => p.status !== 'COMPLETED' && p.status !== 'CANCELLED');
  const pastProjects = allProjects.filter(p => p.status === 'COMPLETED' || p.status === 'CANCELLED');
  const sortedProjects = [...activeProjects, ...pastProjects];

  return (
    <section className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Solution Projects</h1>
      </div>

      {sortedProjects.length === 0 ? (
        <div className="bg-white p-8 text-center rounded border shadow-sm">
          <p className="text-gray-500">You haven&apos;t created any projects yet.</p>
          <p className="text-sm text-gray-400 mt-2">To start a project, go to Solution Teams and click &quot;Create Project&quot; (or via matched challenges).</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedProjects.map(project => (
            <div key={project._id?.toString()} className="border rounded-lg bg-white shadow-sm p-6 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-500">{project.projectId}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              
              <h3 className="text-xl font-bold mb-1">{project.title}</h3>
              <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block mb-4 self-start">
                Challenge: {project.challengeId}
              </p>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-medium text-gray-700">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-6 space-y-1">
                <p><span className="font-medium">Target Date:</span> {new Date(project.targetDate).toLocaleDateString()}</p>
                <p><span className="font-medium">Team:</span> {project.members.length} members (Mentor: {project.mentor.name})</p>
                <p><span className="font-medium">Last Updated:</span> {new Date(project.updatedAt).toLocaleDateString()}</p>
              </div>

              <div className="mt-auto pt-4 border-t">
                <Link href={`/dashboard/university/projects/${project.projectId}`} className="block text-center w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-800">
                  Manage Project
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
