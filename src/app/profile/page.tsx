import { getServerAuthSession } from '@/lib/auth';

export default async function ProfilePage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return null;
  }
  const user = session.user;

  return (
    <section className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6 text-center">Profile</h2>
        <div className="mb-4">
          <p className="font-medium">Name</p>
          <p>{user.name}</p>
        </div>
        <div className="mb-4">
          <p className="font-medium">Email</p>
          <p>{user.email}</p>
        </div>
        <div className="mb-4">
          <p className="font-medium">Role</p>
          <p>{user.role}</p>
        </div>
        <div className="mb-4">
          <p className="font-medium">Account Created</p>
          <p>N/A (not stored in session)</p>
        </div>
      </div>
    </section>
  );
}
