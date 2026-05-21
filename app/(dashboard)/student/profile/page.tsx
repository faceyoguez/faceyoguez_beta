import { redirect } from 'next/navigation';
import { getServerUser, getServerProfile } from '@/lib/data/auth';
import StudentProfileClient from './StudentProfileClient';

export default async function StudentProfilePage() {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  const profile = await getServerProfile(user.id);
  if (!profile) redirect('/auth/login');

  return (
    <StudentProfileClient user={user} profile={profile} />
  );
}
