'use server';

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createCouponAction(formData: {
  code: string;
  discount_percentage: number;
  course_type: string;
  max_uses: number | null;
  expires_at: string | null;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const admin = createAdminClient();
    
    // Check if user is authorized
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return { success: false, error: 'User profile not found.' };
    }

    const permittedRoles = ['admin', 'staff', 'instructor', 'client_management'];
    if (!permittedRoles.includes(profile.role)) {
      return { success: false, error: 'Unauthorized.' };
    }

    const { data: coupon, error } = await admin
      .from('coupons')
      .insert({
        code: formData.code.toUpperCase(),
        discount_percentage: formData.discount_percentage,
        course_type: formData.course_type,
        max_uses: formData.max_uses || null,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        created_by: user.id,
        is_active: true,
        used_count: 0,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Insert error:', error);
      if (error.code === '23505') {
        return { success: false, error: 'A coupon with this code already exists.' };
      }
      return { success: false, error: error.message };
    }

    revalidatePath('/staff/coupons');
    return { success: true, coupon };

  } catch (err: any) {
    console.error('Create Coupon Error:', err);
    return { success: false, error: 'Internal failure: ' + (err.message || 'Unknown error') };
  }
}

export async function getStaffCoupons() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getStaffCoupons error:', error);
      throw error;
    }
    return data || [];
  } catch (err) {
    console.error('Fetch error:', err);
    return [];
  }
}

export async function toggleCouponStatusAction(id: string, isActive: boolean) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('coupons')
    .update({ is_active: isActive })
    .eq('id', id);
    
  if (error) return { success: false, error: error.message };
  revalidatePath('/staff/coupons');
  return { success: true };
}

export async function deleteCouponAction(id: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('coupons')
    .delete()
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/staff/coupons');
  return { success: true };
}

export async function consumeCouponAction(code: string, planType: string) {
  const admin = createAdminClient();

  // Fetch WITHOUT is_active filter to get specific error messages
  const { data: coupon, error: fetchError } = await admin
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (fetchError || !coupon) return { success: false, error: 'Invalid coupon code' };

  if (!coupon.is_active) return { success: false, error: 'This coupon is no longer active' };

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { success: false, error: 'This coupon has expired' };
  }

  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    return { success: false, error: 'This coupon has reached its usage limit' };
  }

  if (planType && coupon.course_type !== 'all' && coupon.course_type !== planType) {
    return { success: false, error: `This coupon is only valid for ${coupon.course_type.replace(/_/g, ' ')} plans` };
  }

  const { error: updateError } = await admin
    .from('coupons')
    .update({ used_count: coupon.used_count + 1 })
    .eq('id', coupon.id);
    
  if (updateError) return { success: false, error: 'Failed to apply coupon. Please try again.' };
  return { success: true, discountPercentage: coupon.discount_percentage };
}
