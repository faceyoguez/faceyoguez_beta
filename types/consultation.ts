/**
 * ════════════════════════════════════════
 *  CONSULTATION TYPES
 * ════════════════════════════════════════
 */

export type ConsultationStatus = 'paid' | 'active' | 'completed' | 'cancelled';
export type ConsultationMessageType = 'text' | 'pdf' | 'image' | 'file' | 'system';

export interface Consultation {
  id: string;
  student_id: string;
  staff_id: string | null;
  payment_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  status: ConsultationStatus;
  credit_applied: boolean;
  credit_applied_at: string | null;
  credit_subscription_id: string | null;
  paid_at: string;
  activated_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsultationMessage {
  id: string;
  consultation_id: string;
  sender_id: string;
  content: string | null;
  content_type: ConsultationMessageType;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  is_read: boolean;
  created_at: string;
}

export interface ConsultationZoomCall {
  id: string;
  consultation_id: string;
  zoom_meeting_id: string;
  topic: string;
  join_url: string;
  start_url: string;
  password: string | null;
  start_time: string;
  duration_minutes: number;
  created_by: string | null;
  created_at: string;
}

// Enriched types (with joins)
export interface ConsultationWithDetails extends Consultation {
  student?: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
  staff?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  latest_message?: ConsultationMessage | null;
  unread_count?: number;
  zoom_call?: ConsultationZoomCall | null;
}

export interface ConsultationMessageWithSender extends ConsultationMessage {
  sender: {
    id: string;
    full_name: string;
    role: string;
    avatar_url: string | null;
  };
}

export const CONSULTATION_PRICE = 999;
export const CONSULTATION_CREDIT = 999;
