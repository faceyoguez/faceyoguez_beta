import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const planType = searchParams.get('planType');

    if (!code) {
        return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // Fetch WITHOUT is_active filter so we can give specific error messages
    const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

    if (error || !data) {
        return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 });
    }

    // Check if coupon is deactivated by staff
    if (!data.is_active) {
        return NextResponse.json({ error: 'This coupon is no longer active' }, { status: 400 });
    }

    // Check expiry
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
    }

    // Check usage limit
    if (data.max_uses && data.used_count >= data.max_uses) {
        return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 });
    }

    // Check plan type compatibility
    if (planType && data.course_type !== 'all' && data.course_type !== planType) {
        return NextResponse.json({ error: `This coupon is only valid for ${data.course_type.replace(/_/g, ' ')} plans` }, { status: 400 });
    }

    return NextResponse.json({ data });
}
