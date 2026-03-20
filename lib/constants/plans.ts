import { User, Users, BookOpen } from 'lucide-react';

export const PLANS_DATA = [
    {
        id: 'one_on_one',
        title: 'Bespoke 1-1 Consultation',
        subtitle: 'Because Your Face Deserves a Plan Made Only for You',
        icon: User,
        color: 'rose',
        note: 'The Ultimate Personalised Experience',
        hasTrial: true,
        tiers: [
            { id: '1_month', label: '1 Month', originalPrice: 8000, discountedPrice: 5499, note: 'PLAN 1' },
            { id: '3_months', label: '3 Months', originalPrice: 24000, discountedPrice: 11000, badge: 'MOST POPULAR', note: 'PLAN 2' },
            { id: '6_months', label: '6 Months', originalPrice: 48000, discountedPrice: 18000, badge: 'BEST VALUE', note: '60% OFF' },
            { id: '12_months', label: '12 Months', originalPrice: 96000, discountedPrice: 30000, note: '70% OFF' }
        ],
        features: [
            'Initial 1:1 Consultation',
            'Full 30-Day Bespoke Routine',
            '30 Daily Instruction Videos',
            '2 Dedicated Q&A Support Sessions',
            'Exclusive Skin Assessment'
        ]
    },
    {
        id: 'lms',
        title: 'Masterclass Hub',
        subtitle: 'Elevate Your Self-Care with Lifetime Knowledge',
        icon: BookOpen,
        color: 'indigo',
        note: 'Learn Once, Glow Forever',
        hasTrial: true,
        tiers: [
            { id: 'level_1', label: 'Level 1', originalPrice: 1999, discountedPrice: 999, note: '50% OFF' },
            { id: 'level_1_2', label: 'Level 1 + 2', originalPrice: 3999, discountedPrice: 1499, badge: 'MASTER PACK', note: '62.5% OFF' }
        ],
        features: [
            'Lifetime Content Access',
            'Step-by-Step Video Modules',
            'Downloadable Face Maps',
            'Bonus: Lymphatic Drainage Guide',
            'Community Forum Access'
        ]
    },
    {
        id: 'group_session',
        title: 'Group Transformation',
        subtitle: '21 Days to a Radiant New You with the Tribe',
        icon: Users,
        color: 'teal',
        note: 'Collective Glow, Singular Focus',
        hasTrial: true,
        tiers: [
            { id: '1_month_12d', label: '1M (12d Rec)', originalPrice: 4400, discountedPrice: 1499, note: 'EARLY BIRD' },
            { id: '1_month_lifetime', label: '1M (Lifetime)', originalPrice: 4400, discountedPrice: 1998, badge: 'LIFETIME ACCESS', note: 'KEEP FOREVER' },
            { id: '3_months_12d', label: '3M (12d Rec)', originalPrice: 12999, discountedPrice: 3499, note: 'EXTENDED JOURNEY' },
            { id: '3_months_lifetime', label: '3M (Lifetime)', originalPrice: 12999, discountedPrice: 4348, badge: 'TOTAL VALUE', note: 'BEST FOR RESULTS' }
        ],
        features: [
            '21 Days Live Group Classes',
            'Every day at 7:30 PM',
            'Community Accountability',
            'Session Recordings Access',
            'Collective Energy'
        ]
    }
];
