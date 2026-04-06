import { redirect } from 'next/navigation';
import { getServerUser, getServerProfile } from '@/lib/data/auth';

/**
 * Handle root /dashboard redirect based on role.
 * This prevents a 404 if the user visits the route group name.
 */
export default async function DashboardIndex() {
  const user = await getServerUser();
  if (!user) {
    return redirect('/auth/login');
  }

  const profile = await getServerProfile(user.id);
  if (!profile) {
    return redirect('/auth/login');
  }

  // Redirect based on role
  switch (profile.role) {
    case 'student':
      return redirect('/student/dashboard');
    case 'instructor':
    case 'admin':
      return redirect('/instructor/one-on-one');
    case 'staff':
      return redirect('/instructor/one-on-one'); // Change to staff dashboard if separate
    default:
      return redirect('/');
  }
}
