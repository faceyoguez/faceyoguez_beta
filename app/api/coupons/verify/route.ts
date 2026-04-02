import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('active', true)
        .single();

    if (error || !data) {
        return NextResponse.json({ error: 'Invalid or inactive coupon' }, { status: 404 });
    }

    if (data.max_uses && data.times_used >= data.max_uses) {
        return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });
    }

    return NextResponse.json({ data });
}
