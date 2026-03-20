export type UserRole = 'admin' | 'instructor' | 'staff' | 'client_management' | 'sales_team' | 'marketing_team' | 'student';
export type ConversationType = 'direct' | 'group';
export type MessageContentType = 'text' | 'image' | 'pdf' | 'file' | 'system_alert';
export type BatchStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';
export type EnrollmentStatus = 'active' | 'waiting' | 'completed' | 'extended';
export type QueueStatus = 'waiting' | 'assigned' | 'cancelled';
export type AudienceType = 'one_on_one' | 'group_session' | 'lms' | 'all' | 'trial' | 'unsubscribed';
export type SubscriptionPlanType = 'one_on_one' | 'group_session' | 'lms';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';
export type MeetingType = 'one_on_one' | 'group_session';

// Roles that can access the staff/instructor dashboard
export const STAFF_ROLES: UserRole[] = ['admin', 'instructor', 'staff', 'client_management'];
export const CAN_CREATE_BATCHES: UserRole[] = ['admin', 'client_management']; // + master instructor

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_master_instructor: boolean;
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
  plan_variant: string | null;
  status: SubscriptionStatus;
  duration_months: number;
  start_date: string | null;
  end_date: string | null;
  amount: number | null;
  currency: string;
  payment_id: string | null;
  batches_remaining: number;
  batches_used: number;
  auto_renew: boolean;
  is_trial: boolean;
  assigned_instructor_id: string | null;
  instructor_notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title: string | null;
  batch_id: string | null;
  is_chat_enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_at: string;
  created_by: string | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  content: string | null;
  content_type: MessageContentType;
  file_url: string | null;
  created_at: string;
}

export interface Batch {
  id: string;
  name: string;
  instructor_id: string | null;
  start_date: string;
  end_date: string;
  status: BatchStatus;
  conversation_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface BatchEnrollment {
  id: string;
  batch_id: string;
  student_id: string;
  subscription_id: string;
  status: EnrollmentStatus;
  original_sub_end_date: string | null;
  effective_end_date: string | null;
  is_extended: boolean;
  created_by: string | null;
  updated_by: string | null;
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

export interface Notification {
  id: string;
  user_id: string;
  broadcast_id: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
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

export interface StudentResource {
  id: string;
  student_id: string;
  instructor_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  content_type: string;
  created_at: string;
}

export interface WaitingQueue {
  id: string;
  student_id: string;
  subscription_id: string;
  status: QueueStatus;
  requested_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface BatchResource {
  id: string;
  batch_id: string;
  uploader_id: string;
  student_id: string | null;
  title: string;
  file_url: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
  updated_by: string | null;
  batch_name?: string; // from v_student_resources view
}

export interface Meeting {
  id: string;
  host_id: string;
  student_id: string | null;
  batch_id: string | null;
  zoom_meeting_id: string;
  topic: string;
  start_time: string;
  duration_minutes: number;
  join_url: string;
  start_url: string;
  meeting_type: MeetingType;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface JourneyLog {
  id: string;
  student_id: string;
  day_number: number;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
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

export interface MeetingWithDetails extends Meeting {
  host: Profile;
  student?: Profile | null;
  batch?: Batch | null;
}

// Student info used in instructor dashboards
export interface StudentInfo {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  conversationId: string | null;
  subscription?: Subscription | null;
  daysLeft?: number | null;
  isTrial?: boolean;
}

// Live growth metrics
export interface LiveGrowthMetrics {
  newJoineesThisMonth: number;
  renewalsThisMonth: number;
  totalActiveStudents: number;
  expiringThisWeek: number;
}

// ========================
// LMS TYPES
// ========================

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  level: 'Level 1' | 'Level 2' | 'Level 3' | 'Masterclass';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  video_url: string;
  youtube_id: string | null;
  content: string | null;
  is_free_preview: boolean;
  order_index: number;
  duration_seconds: number;
  created_at: string;
  updated_at: string;
  is_completed?: boolean;
}

export interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed_at: string | null;
  last_watched_at: string;
  progress_percent: number;
}

