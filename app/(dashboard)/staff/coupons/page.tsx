'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
import { 
    Plus, Trash2, Tag, Percent, 
    Calendar, CheckCircle2, XCircle, 
    Loader2, Search, Filter, 
    Copy, ExternalLink, RefreshCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Coupon {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    active: boolean;
    max_uses: number | null;
    times_used: number;
    expires_at: string | null;
    created_at: string;
}

export default function CouponManagement() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discount_type: 'percentage' as const,
        discount_value: 10,
        max_uses: null as number | null,
        expires_at: ''
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    async function fetchCoupons() {
        setLoading(true);
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast.error('Failed to fetch coupons');
        } else {
            setCoupons(data || []);
        }
        setLoading(false);
    }

    async function handleCreateCoupon(e: React.FormEvent) {
        e.preventDefault();
        if (!newCoupon.code) return toast.error('Code is required');

        const { error } = await supabase
            .from('coupons')
            .insert({
                ...newCoupon,
                code: newCoupon.code.toUpperCase(),
                expires_at: newCoupon.expires_at || null
            });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Coupon created successfully');
            setIsCreating(false);
            setNewCoupon({ code: '', discount_type: 'percentage', discount_value: 10, max_uses: null, expires_at: '' });
            fetchCoupons();
        }
    }

    async function toggleCouponStatus(id: string, currentStatus: boolean) {
        const { error } = await supabase
            .from('coupons')
            .update({ active: !currentStatus })
            .eq('id', id);

        if (error) {
            toast.error('Update failed');
        } else {
            fetchCoupons();
        }
    }

    async function deleteCoupon(id: string) {
        if (!confirm('Are you sure you want to delete this coupon?')) return;

        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Delete failed');
        } else {
            toast.success('Coupon deleted');
            fetchCoupons();
        }
    }

    const generateRandomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewCoupon({ ...newCoupon, code });
    };

    const filteredCoupons = coupons.filter(c => 
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#FFFAF7]/40 p-6 lg:p-10 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#1a1a1a]">Coupon Management</h1>
                        <p className="text-sm text-[#6B7280] font-medium mt-1">Generate and manage promotional discounts</p>
                    </div>
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="bg-[#FF8A75] text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#ff705a] transition-all"
                    >
                        <Plus className="w-4 h-4" /> Create New Coupon
                    </button>
                </div>

                {/* Stats / Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[2.5rem] border border-[#FF8A75]/10 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[#FF8A75]/10 rounded-2xl text-[#FF8A75]">
                                <Tag className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Total Coupons</p>
                                <p className="text-2xl font-bold">{coupons.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2.5rem] border border-[#FF8A75]/10 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-500">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Active</p>
                                <p className="text-2xl font-bold">{coupons.filter(c => c.active).length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2.5rem] border border-[#FF8A75]/10 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-2xl text-blue-500">
                                <RefreshCcw className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Redemptions</p>
                                <p className="text-2xl font-bold">{coupons.reduce((acc, current) => acc + current.times_used, 0)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                    <input 
                        type="text" 
                        placeholder="Search coupons..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-[#FF8A75]/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A75]/20"
                    />
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-[2.5rem] border border-[#FF8A75]/10 overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center text-[#6B7280]">
                            <Loader2 className="w-8 h-8 animate-spin mb-4" />
                            <p className="text-sm font-medium">Fetching coupons...</p>
                        </div>
                    ) : coupons.length === 0 ? (
                        <div className="p-20 text-center space-y-4">
                            <Tag className="w-12 h-12 text-[#FF8A75]/20 mx-auto" />
                            <h3 className="text-xl font-bold">No coupons found</h3>
                            <p className="text-sm text-[#6B7280]">Get started by creating your first promotional code.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#FFFAF7] border-b border-[#FF8A75]/10">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Code</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Type</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Discount</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Usage</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#6B7280] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#FF8A75]/5">
                                    {filteredCoupons.map((coupon) => (
                                        <tr key={coupon.id} className="hover:bg-[#FFFAF7]/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-sm bg-[#FF8A75]/5 px-3 py-1 rounded-lg text-[#FF8A75]">
                                                        {coupon.code}
                                                    </span>
                                                    <button 
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(coupon.code);
                                                            toast.success('Code copied!');
                                                        }}
                                                        className="text-[#6B7280] hover:text-[#FF8A75]"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${coupon.discount_type === 'percentage' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                    {coupon.discount_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold">
                                                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-[10px] font-bold text-[#374151]">
                                                        {coupon.times_used} / {coupon.max_uses || '∞'}
                                                    </div>
                                                    {coupon.expires_at && (
                                                        <div className="text-[8px] font-medium text-[#6B7280] flex items-center gap-1">
                                                            <Calendar className="w-2.5 h-2.5" />
                                                            Exp: {format(new Date(coupon.expires_at), 'MMM d, yyyy')}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => toggleCouponStatus(coupon.id, coupon.active)}
                                                    className={`flex items-center gap-2 text-[10px] font-bold px-3 py-1 rounded-full transition-all ${coupon.active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}
                                                >
                                                    {coupon.active ? (
                                                        <><CheckCircle2 className="w-3 h-3" /> Active</>
                                                    ) : (
                                                        <><XCircle className="w-3 h-3" /> Inactive</>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => deleteCoupon(coupon.id)}
                                                    className="p-2 text-[#6B7280] hover:text-rose-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal Overlay */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsCreating(false)} />
                    <div className="relative bg-white w-full max-w-md rounded-[3rem] border border-[#FF8A75]/20 p-8 shadow-xl animate-in scale-in-95 duration-200">
                        <h2 className="text-2xl font-bold mb-2">Create New Coupon</h2>
                        <p className="text-xs text-[#6B7280] mb-6">Set up your promotional offer and restrictions.</p>

                        <form onSubmit={handleCreateCoupon} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Coupon Code</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={newCoupon.code}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g. SUMMER50"
                                        className="flex-1 bg-white border border-[#FF8A75]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A75]/20 font-mono"
                                    />
                                    <button 
                                        type="button"
                                        onClick={generateRandomCode}
                                        className="p-3 bg-[#FF8A75]/5 text-[#FF8A75] rounded-xl hover:bg-[#FF8A75]/10"
                                    >
                                        <RefreshCcw className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Type</label>
                                    <select 
                                        value={newCoupon.discount_type}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value as any })}
                                        className="w-full bg-white border border-[#FF8A75]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A75]/20"
                                    >
                                        <option value="percentage">Percentage</option>
                                        <option value="fixed">Fixed Amount</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Value</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={newCoupon.discount_value}
                                            onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: parseInt(e.target.value) })}
                                            className="w-full bg-white border border-[#FF8A75]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A75]/20"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280]">
                                            {newCoupon.discount_type === 'percentage' ? '%' : '₹'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Max Uses</label>
                                    <input 
                                        type="number" 
                                        placeholder="No limit"
                                        onChange={(e) => setNewCoupon({ ...newCoupon, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                                        className="w-full bg-white border border-[#FF8A75]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A75]/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Expiry Date</label>
                                    <input 
                                        type="date" 
                                        value={newCoupon.expires_at}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, expires_at: e.target.value })}
                                        className="w-full bg-white border border-[#FF8A75]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A75]/20"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 py-4 border border-[#FF8A75]/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-4 bg-[#FF8A75] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#ff705a] transition-all"
                                >
                                    Create Coupon
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
