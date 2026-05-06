import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import PersonalClassesPageClient from './PersonalClassesPageClient';
import { redirect } from 'next/navigation';

export default async function Page() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let hasCredit = false;
  let hasActiveConsultation = false;

  if (user) {
    const admin = createAdminClient();
    
    // Check for available credit (paid for consultation but not used it yet)
    const { data: credit } = await admin
      .from('consultations')
      .select('id')
      .eq('student_id', user.id)
      .eq('credit_applied', false)
      .not('paid_at', 'is', null)
      .maybeSingle();

    // Check for active/paid consultation (to prevent double booking)
    const { data: active } = await admin
      .from('consultations')
      .select('id')
      .eq('student_id', user.id)
      .in('status', ['paid', 'active'])
      .maybeSingle();

    hasCredit = !!credit;
    hasActiveConsultation = !!active;
  }

  return (
    <PersonalClassesPageClient 
      userId={user?.id} 
      hasCredit={hasCredit} 
      hasActiveConsultation={hasActiveConsultation} 
    />
  );
}
