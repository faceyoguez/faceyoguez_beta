'use server';

import { createAdminClient } from '@/lib/supabase/server';

const SETTING_KEY = 'webinar_whatsapp_link';

export async function getWebinarWhatsAppLink(): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('app_settings')
      .select('value')
      .eq('key', SETTING_KEY)
      .single();

    if (error || !data) return null;
    return data.value as string;
  } catch {
    return null;
  }
}

export async function setWebinarWhatsAppLink(link: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient();

    // Upsert: insert if not exists, update if exists
    const { error } = await admin
      .from('app_settings')
      .upsert(
        { key: SETTING_KEY, value: link },
        { onConflict: 'key' }
      );

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Unknown error' };
  }
}
