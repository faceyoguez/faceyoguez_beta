export interface Subscription {
    id: string;
    student_id: string;
    plan_type: string;
    status: string;
    is_trial: boolean;
    expires_at: string;
    metadata?: any;
}

export interface BasketItem {
    planId: string;
    tierId: string;
    isTrial: boolean;
}

export interface PlansClientProps {
    user: any;
    activeSubscriptions: Subscription[];
}
