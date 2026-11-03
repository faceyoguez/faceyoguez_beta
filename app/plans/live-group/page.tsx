import { redirect } from 'next/navigation';
import { SHOW_GROUP_PLAN } from '@/lib/constants/plans';
import LiveGroupPageClient from './LiveGroupPageClient';

// The Live Group plan is currently hidden (SHOW_GROUP_PLAN in
// lib/constants/plans.ts). Old shared links to this page land on the home
// page's plans section instead of a page selling something that's off sale.
export default function LiveGroupPage() {
  if (!SHOW_GROUP_PLAN) redirect('/#plans-overview');
  return <LiveGroupPageClient />;
}
