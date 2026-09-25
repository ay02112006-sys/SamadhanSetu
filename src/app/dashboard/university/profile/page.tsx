// src/app/dashboard/university/profile/page.tsx
import { getServerAuthSession } from "@/lib/auth";
import { getUsersCollection } from "@/lib/university";
import ProfileForm from "./ProfileForm";
import { notFound, redirect } from "next/navigation";
import { ObjectId } from "mongodb";

export default async function UniversityProfilePage() {
  const session = await getServerAuthSession();
  if (!session || !session.user) {
    redirect('/login');
  }

  const userRole = (session.user as { role?: string }).role;
  const userId = (session.user as { id?: string }).id;

  if (userRole !== 'UNIVERSITY' || !userId) {
    notFound();
  }

  const usersColl = await getUsersCollection();
  
  let queryId;
  try {
    queryId = new ObjectId(userId);
  } catch {
    queryId = userId;
  }

  const user = await usersColl.findOne({ _id: queryId as unknown as string });

  return (
    <section className="p-8">
      <h1 className="text-2xl font-semibold mb-6">University Profile</h1>
      <ProfileForm initialProfile={user?.universityProfile} />
    </section>
  );
}
