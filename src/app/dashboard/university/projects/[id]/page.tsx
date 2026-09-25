// src/app/dashboard/university/projects/[id]/page.tsx
import { getServerAuthSession } from "@/lib/auth";
import { getProjectsCollection } from "@/lib/project";
import { getChallengeCollection } from "@/lib/challenge";
import { notFound, redirect } from "next/navigation";
import ProjectStatusManager from "./ProjectStatusManager";
import ProjectTabs from "./ProjectTabs";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session || !session.user) {
    redirect('/login');
  }

  const userRole = (session.user as { role?: string }).role;
  const userId = (session.user as { id?: string }).id;

  if (userRole !== 'UNIVERSITY' || !userId) {
    notFound();
  }

  const projectId = params.id;
  const projectsColl = await getProjectsCollection();
  const project = await projectsColl.findOne({ projectId, universityId: userId });

  if (!project) {
    return (
      <section className="p-8">
        <h1 className="text-2xl font-semibold mb-6">Project Detail</h1>
        <p className="text-red-500">Project not found or access denied.</p>
      </section>
    );
  }

  const challengeColl = await getChallengeCollection();
  const challenge = await challengeColl.findOne({ challengeId: project.challengeId });

  return (
    <section className="p-8 max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
        {/* Header */}
        <div className="p-6 border-b bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-sm text-gray-500 font-mono mb-1 block">{project.projectId}</span>
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <p className="text-sm text-gray-600 mt-1">Challenge: {project.challengeId}</p>
          </div>
          <ProjectStatusManager projectId={projectId} currentStatus={project.status} />
        </div>

        {/* Project Info */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</h3>
              <p className="text-gray-800">{project.description}</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider mb-2">Progress</h3>
              <div className="flex justify-between text-sm mb-1 text-blue-800">
                <span>{project.progress}% Completed</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${project.progress}%` }}></div>
              </div>
            </div>

            {challenge && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Original Challenge Context</h3>
                <div className="border p-4 rounded bg-gray-50 text-sm">
                  <h4 className="font-bold mb-1">{challenge.title}</h4>
                  <p className="text-gray-700 mb-2 line-clamp-3">{challenge.description}</p>
                  <div className="flex gap-4 text-gray-500">
                    <span>Domain: {challenge.domain}</span>
                    <span>Priority: {challenge.priority}</span>
                  </div>
                  {challenge.aiAnalysis && (
                    <div className="mt-2 pt-2 border-t text-gray-600">
                      <strong>AI Summary:</strong> {challenge.aiAnalysis.problemSummary}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6 border-l pl-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Key Dates</h3>
              <p className="text-sm"><span className="text-gray-600">Started:</span> {new Date(project.startDate || project.createdAt).toLocaleDateString()}</p>
              <p className="text-sm"><span className="text-gray-600">Target:</span> {new Date(project.targetDate).toLocaleDateString()}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Solution Team</h3>
              <p className="text-sm font-medium mb-1">Mentor: {project.mentor.name}</p>
              <ul className="text-sm space-y-1">
                {project.members.map((m, i) => (
                  <li key={i} className="text-gray-700">• {m.name} <span className="text-gray-400">({m.role})</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <ProjectTabs projectId={projectId} />
      </div>
    </section>
  );
}
