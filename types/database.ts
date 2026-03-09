export type UserRole = 'admin' | 'instructor' | 'staff' | 'student';
export type ConversationType = 'direct' | 'group';
export type MessageContentType = 'text' | 'image' | 'pdf' | 'file';
export type BatchStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';
export type EnrollmentStatus = 'active' | 'waiting' | 'completed' | 'extended';
export type QueueStatus = 'waiting' | 'assigned' | 'cancelled';
export type AudienceType = 'one_on_one' | 'group_session' | 'lms' | 'all';
export type SubscriptionPlanType = 'one_on_one' | 'group_session' | 'lms';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  date_of_birth: string | null;
  gender: string | null;
  emergency_contact: string | null;
  health_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  student_id: string;
  plan_type: SubscriptionPlanType;
  status: SubscriptionStatus;
  duration_months: number;
  start_date: string;
  end_date: string;
  amount: number | null;
  currency: string;
  payment_id: string | null;
  payment_method: string | null;
  batches_remaining: number;
  batches_used: number;
  auto_renew: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title: string | null;
  batch_id: string | null;
  is_chat_enabled: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
  last_read_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  content_type: MessageContentType;
  file_url: string | null;
  file_name: string | null;
  reply_to: string | null;
  is_deleted: boolean;
  created_at: string;
}

export interface Batch {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  max_students: number;
  current_students: number;
  status: BatchStatus;
  plan_type: SubscriptionPlanType;
  conversation_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BatchEnrollment {
  id: string;
  batch_id: string;
  student_id: string;
  subscription_id: string;
  status: EnrollmentStatus;
  batch_number: number;
  total_batches: number;
  original_sub_end_date: string | null;
  effective_end_date: string | null;
  is_extended: boolean;
  extension_note: string | null;
  enrolled_at: string;
  completed_at: string | null;
}

export interface Broadcast {
  id: string;
  sender_id: string;
  title: string;
  content: string | null;
  content_type: MessageContentType;
  file_url: string | null;
  file_name: string | null;
  target_audience: AudienceType;
  target_batch_id: string | null;
  is_pinned: boolean;
  created_at: string;
}

export interface BroadcastRead {
  id: string;
  broadcast_id: string;
  user_id: string;
  read_at: string;
}

export interface ProgressLog {
  id: string;
  student_id: string;
  log_type: string;
  title: string | null;
  content: string | null;
  photo_url: string | null;
  metadata: Record<string, unknown>;
  instructor_comment: string | null;
  commented_by: string | null;
  created_at: string;
}

// ========================
// JOINED / ENRICHED TYPES
// ========================

export interface ConversationWithDetails extends Conversation {
  participants: (ConversationParticipant & { profile: Profile })[];
  last_message: ChatMessage | null;
  unread_count: number;
  batch?: Batch | null;
}

export interface ChatMessageWithSender extends ChatMessage {
  sender: Profile;
  reply_message?: ChatMessage | null;
}

export interface BatchWithEnrollments extends Batch {
  enrollments: (BatchEnrollment & {
    student: Profile;
    subscription: Subscription;
  })[];
}

export interface BroadcastWithSender extends Broadcast {
  sender: Profile;
  is_read: boolean;
  read_count: number;
  total_recipients: number;
}
