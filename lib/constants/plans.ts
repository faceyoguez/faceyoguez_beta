import { User, Users, BookOpen } from 'lucide-react';

export const PLANS_DATA = [
    {
        id: 'one_on_one',
        title: 'Personal 1-on-1 Classes',
        subtitle: 'Get a customised face yoga routine made just for you',
        icon: User,
        color: 'rose',
        note: 'Best for personalised results',
        hasTrial: true,
        trialDays: 1,
        tiers: [
            { id: '1_month', label: '1 Month', originalPrice: 8000, discountedPrice: 5499, note: 'PLAN 1' },
            { id: '3_months', label: '3 Months', originalPrice: 24000, discountedPrice: 11000, badge: 'MOST POPULAR', note: 'PLAN 2' },
            { id: '6_months', label: '6 Months', originalPrice: 48000, discountedPrice: 18000, badge: 'BEST VALUE', note: '60% OFF' },
            { id: '12_months', label: '12 Months', originalPrice: 96000, discountedPrice: 30000, note: '70% OFF' }
        ],
        features: [
            'Initial 1-on-1 Consultation',
            '30-Day Custom Routine',
            '30 Daily Instruction Videos',
            '2 Dedicated Q&A Support Sessions',
            'Exclusive Skin Assessment'
        ]
    },
    {
        id: 'group_session',
        title: 'Face Yoga 21-Day Transformation',
        subtitle: 'The Glow-Up Your Skin Has Been Waiting For',
        icon: Users,
        color: 'teal',
        note: 'Best for accountability & community',
        hasTrial: false,
        tiers: [
            { id: '1_month', label: '1 Month Plan', originalPrice: 4400, discountedPrice: 1499, note: 'EARLY BIRD' },
            { id: '3_months', label: '3 Months Plan', originalPrice: 12999, discountedPrice: 3499, badge: 'MOST POPULAR', note: 'BEST VALUE' }
        ],
        features: [
            '21 Days Live Group Classes',
            'Every day at 7:30 PM',
            'Community Accountability',
            'Session Recordings Access',
            'Group Support & Motivation'
        ]
    },
    {
        id: 'lms',
        title: 'Self-Paced Video Courses',
        subtitle: 'Learn face yoga at your own pace — lifetime access',
        icon: BookOpen,
        color: 'indigo',
        note: 'Best for self-learners',
        hasTrial: false,
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
    }
];
