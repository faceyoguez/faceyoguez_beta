/**
 * Mapping of user roles to their respective dashboard paths.
 */
export const ROLE_DASHBOARDS: Record<string, string> = {
  student: '/student/dashboard',
  instructor: '/instructor/dashboard',
  staff: '/staff/dashboard',
  admin: '/staff/dashboard', // Admins currently use the staff dashboard
};

/**
 * Returns the appropriate redirect path for a given user role.
 * Defaults to '/student/dashboard' if the role is unrecognized.
 */
export function getRoleRedirectPath(role?: string | null): string {
  if (!role) return ROLE_DASHBOARDS.student;
  
  const normalizedRole = role.toLowerCase();
  return ROLE_DASHBOARDS[normalizedRole] || ROLE_DASHBOARDS.student;
}

/**
 * Fetches the user role from the profiles table.
 * Used for both client-side and server-side role retrieval.
 */
export async function fetchUserRole(supabase: any, userId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.warn(`Could not fetch role for user ${userId}:`, error?.message || 'No data');
      return 'student'; // Default fallback
    }

    return data.role || 'student';
  } catch (err) {
    console.error(`Error in fetchUserRole:`, err);
    return 'student';
  }
}
