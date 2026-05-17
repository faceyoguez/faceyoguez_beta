import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { WebinarManagerClient } from './WebinarManagerClient';
import { getWebinarWhatsAppLink } from '@/lib/actions/webinar';

const STAFF_ROLES = ['admin', 'staff', 'client_management'];

export const metadata = {
  title: 'Webinar Management | Staff',
};

export default async function StaffWebinarPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !STAFF_ROLES.includes(profile.role)) redirect('/auth/login');

  const initialLink = await getWebinarWhatsAppLink();

  return <WebinarManagerClient initialLink={initialLink || ''} />;
}
