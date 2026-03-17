# Faceyoguez - Platform Documentation

## 1. Project Overview

**Faceyoguez** is a Face Yoga & Wellness platform that connects instructors with students for personalized and group-based face yoga sessions. The platform supports live video sessions via Zoom, real-time chat, progress tracking with photo comparisons, and a broadcast system for announcements.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4, Material UI 7, Radix UI |
| Backend/DB | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Video Calls | Zoom API (Server-to-Server OAuth) |
| Real-Time | Supabase Realtime (WebSocket) + Server-Sent Events (SSE) |
| Icons | Lucide React, MUI Icons |
| Dates | date-fns |
| Notifications | Sonner (toast) |

---

## 3. User Roles

| Role | Description |
|------|------------|
| **Admin** | Full platform access. Can do everything an instructor can + admin privileges |
| **Instructor** | Creates/manages batches, sends broadcasts, schedules Zoom meetings, chats with students, uploads resources |
| **Staff** | Limited instructor capabilities |
| **Student** | Subscribes to plans, attends sessions, chats with instructors, tracks progress |

---

## 4. Subscription Plans

| Plan | Price | Features |
|------|-------|---------|
| **One-on-One** | Rs.4,999/month | Dedicated instructor, personalized plan, direct chat, weekly video sessions, progress tracking |
| **Group Session** | Rs.1,999/month | Live group sessions, batch-based learning, group chat, guided routines |
| **LMS** | Rs.999/month | Full video library, self-paced learning, module tracking, downloadable resources |

All subscriptions are **1-month duration** with pricing in **INR**.

---

## 5. Authentication Flow

```
User visits site (/)
        |
   Authenticated?
   /           \
  No           Yes
  |             |
  v             v
/auth/login   Check role
              /        \
        Student     Instructor/Admin/Staff
            |              |
            v              v
  /student/dashboard   /instructor/dashboard
```

- **Sign Up**: Collects name, email, password, phone. Creates a `student` profile automatically.
- **Login**: Email + password via Supabase Auth.
- **Session Management**: Handled via cookies using `@supabase/ssr`.

---

## 6. Feature Breakdown

### 6.1 Instructor Features

#### Broadcast System (`/instructor/broadcast`)
- Send announcements to targeted groups: all students, 1-on-1 subscribers, group session subscribers, or a specific batch
- Attach files (images, PDFs, documents) up to 50MB
- View broadcast history

#### One-on-One Management (`/instructor/one-on-one`)
- View list of active 1-on-1 students
- Real-time direct chat with each student
- Upload resources/files to individual students
- View student journey progress (milestone days: 1, 7, 14, 21, 30) with before/after photo comparison
- Schedule Zoom meetings (set topic, date, time, duration)

#### Batch/Group Management (`/instructor/groups`)
- Create new batches (name, start/end dates, max capacity)
- Each batch auto-creates a linked group conversation for chat
- Activate batches (pulls students from waiting queue automatically)
- Upload shared resources to batches
- Enable/disable group chat per batch

#### Group Session (`/instructor/group-session`)
- Real-time group chat with all batch students
- Toggle chat on/off
- Send messages visible to entire batch

#### Meeting Scheduling
- Create Zoom meetings for 1-on-1 or group sessions
- Meetings stored in database with join URL (students) and start URL (host)
- Waiting room enabled, mute on entry

---

### 6.2 Student Features

#### Plan Selection (`/student/plans`)
- Browse 3 available subscription plans with pricing
- Subscribe to a plan (creates subscription record + auto-joins waiting queue for group sessions)

#### Broadcasts (`/student/broadcasts`)
- View all announcements from instructors
- Download file attachments
- Broadcasts auto-marked as read

#### One-on-One Sessions (`/student/one-on-one`)
- Real-time chat with assigned instructor
- View/download resources shared by instructor
- Journey tracking:
  - Log daily check-ins with notes and photos
  - Milestone markers at days 1, 7, 14, 21, 30
  - Before/after image comparison slider
- View upcoming Zoom meetings with join links

#### Group Sessions (`/student/group-session`)
- View active batch info
- Participate in group chat (if enabled)
- Access batch resources
- Track progress with daily check-ins
- View upcoming group Zoom sessions

#### Chat (`/student/chat`)
- Routes to appropriate chat based on subscription type:
  - 1-on-1 plan -> Direct chat with instructor
  - Group plan -> Group chat with batch
  - LMS plan -> "Chat Not Available"

---

## 7. Database Schema

### 7.1 All Tables

#### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, linked to auth.users |
| full_name | text | |
| email | text | |
| phone | text | nullable |
| avatar_url | text | nullable |
| role | enum | 'admin', 'instructor', 'staff', 'student' |
| date_of_birth | text | nullable |
| gender | text | nullable |
| emergency_contact | text | nullable |
| health_notes | text | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

#### `subscriptions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| student_id | uuid | FK -> profiles |
| plan_type | enum | 'one_on_one', 'group_session', 'lms' |
| status | enum | 'active', 'expired', 'cancelled', 'pending' |
| duration_months | integer | |
| start_date | date | nullable |
| end_date | date | nullable |
| amount | numeric | nullable |
| currency | text | default 'INR' |
| payment_id | text | nullable |
| batches_remaining | integer | |
| batches_used | integer | |
| auto_renew | boolean | |
| created_at / updated_at | timestamp | |

#### `batches`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | |
| instructor_id | uuid | FK -> profiles, nullable |
| start_date | date | |
| end_date | date | |
| status | enum | 'upcoming', 'active', 'completed', 'cancelled' |
| conversation_id | uuid | FK -> conversations, nullable |
| max_students | integer | optional |
| is_chat_enabled | boolean | optional |
| created_at / updated_at | timestamp | |

#### `batch_enrollments`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| batch_id | uuid | FK -> batches |
| student_id | uuid | FK -> profiles |
| subscription_id | uuid | FK -> subscriptions |
| status | enum | 'active', 'waiting', 'completed', 'extended' |
| original_sub_end_date | date | nullable |
| effective_end_date | date | nullable |
| is_extended | boolean | |

#### `waiting_queue`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| student_id | uuid | FK -> profiles |
| subscription_id | uuid | FK -> subscriptions |
| status | enum | 'waiting', 'assigned', 'cancelled' |
| requested_at | timestamp | |

#### `conversations`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| type | enum | 'direct', 'group' |
| title | text | nullable |
| batch_id | uuid | FK -> batches, nullable |
| is_chat_enabled | boolean | |
| created_at / updated_at | timestamp | |

#### `conversation_participants`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| conversation_id | uuid | FK -> conversations |
| user_id | uuid | FK -> profiles |
| last_read_at | timestamp | for unread tracking |

#### `chat_messages`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| conversation_id | uuid | FK -> conversations |
| sender_id | uuid | FK -> profiles, nullable |
| content | text | nullable |
| content_type | enum | 'text', 'image', 'pdf', 'file', 'system_alert' |
| file_url | text | nullable |
| created_at | timestamp | |

#### `broadcasts`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| sender_id | uuid | FK -> profiles |
| title | text | |
| content | text | nullable |
| content_type | enum | 'text', 'image', 'pdf', 'file', 'system_alert' |
| file_url | text | nullable |
| file_name | text | nullable |
| target_audience | enum | 'one_on_one', 'group_session', 'lms', 'all' |
| target_batch_id | uuid | FK -> batches, nullable |
| is_pinned | boolean | |
| created_at | timestamp | |

#### `broadcast_read`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| broadcast_id | uuid | FK -> broadcasts |
| user_id | uuid | FK -> profiles |
| read_at | timestamp | |

#### `notifications`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK -> profiles |
| broadcast_id | uuid | FK -> broadcasts, nullable |
| title | text | |
| message | text | |
| type | text | |
| is_read | boolean | |
| created_at | timestamp | |

#### `meetings`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| host_id | uuid | FK -> profiles |
| student_id | uuid | FK -> profiles, nullable (for 1-on-1) |
| batch_id | uuid | FK -> batches, nullable (for group) |
| zoom_meeting_id | text | |
| topic | text | |
| start_time | timestamptz | |
| duration_minutes | integer | |
| join_url | text | for participants |
| start_url | text | for host |
| meeting_type | enum | 'one_on_one', 'group_session' |
| created_at / updated_at | timestamp | |

#### `student_resources`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| student_id | uuid | FK -> profiles |
| instructor_id | uuid | FK -> profiles |
| file_name | text | |
| file_url | text | |
| file_size | number | |
| content_type | text | |
| created_at | timestamp | |

#### `batch_resources`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| batch_id | uuid | FK -> batches |
| uploader_id | uuid | FK -> profiles |
| student_id | uuid | FK -> profiles, nullable |
| title | text | |
| file_url | text | |
| description | text | nullable |
| created_at | timestamp | |

#### `journey_logs`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| student_id | uuid | FK -> profiles |
| day_number | integer | |
| notes | text | nullable |
| photo_url | text | nullable |
| created_at / updated_at | timestamp | |

### 7.2 Entity Relationship Diagram

```
                        ┌──────────────┐
                        │  auth.users  │
                        └──────┬───────┘
                               │ 1:1
                        ┌──────▼───────┐
               ┌────────┤   profiles   ├────────┐
               │        └──┬───┬───┬───┘        │
               │           │   │   │             │
        ┌──────▼──────┐    │   │   │    ┌────────▼────────┐
        │subscriptions│    │   │   │    │   broadcasts    │
        └──┬──────┬───┘    │   │   │    └────┬───────┬────┘
           │      │        │   │   │         │       │
    ┌──────▼──┐   │        │   │   │  ┌──────▼───┐ ┌─▼──────────┐
    │waiting  │   │        │   │   │  │broadcast │ │notifications│
    │_queue   │   │        │   │   │  │_read     │ └─────────────┘
    └─────────┘   │        │   │   │  └──────────┘
                  │        │   │   │
           ┌──────▼────┐   │   │   │
           │  batch_   │   │   │   │
           │enrollments├───┘   │   │
           └──────┬────┘       │   │
                  │            │   │
           ┌──────▼───┐        │   │
           │ batches  ├────────┘   │
           └──┬───┬───┘            │
              │   │                │
   ┌──────────▼┐ ┌▼────────────┐   │
   │  batch_   │ │conversations│   │
   │ resources │ └──┬──────┬───┘   │
   └───────────┘    │      │       │
              ┌─────▼────┐ │       │
              │  chat_   │ │       │
              │ messages │ │       │
              └──────────┘ │       │
                     ┌─────▼──────────────┐
                     │conversation_       │
                     │participants        │
                     └────────────────────┘

        ┌──────────────┐    ┌──────────────┐
        │   meetings   │    │student_      │
        │(Zoom links)  │    │resources     │
        └──────────────┘    └──────────────┘

        ┌──────────────┐
        │ journey_logs │
        │(daily logs)  │
        └──────────────┘
```

### 7.3 Supabase Storage Buckets

| Bucket | Purpose |
|--------|---------|
| `resources` | Student and batch resource files |
| `journey-photos` | Journey log daily photos |

### 7.4 Row Level Security (RLS)

RLS is enabled on tables like `meetings`:
- Instructors/Admins can view and manage all meetings
- Students can only view their own 1-on-1 meetings
- Students can view group meetings for batches they're enrolled in

### 7.5 Database Triggers

- **Auto-profile creation**: When a user signs up via Supabase Auth, a profile row is created automatically
- **Waiting queue enrollment**: New `group_session` subscriptions auto-enter the waiting queue
- **Batch activation**: Activating a batch pulls students from the waiting queue into enrollments
- **updated_at timestamps**: Auto-updated on row changes

---

## 8. Real-Time Architecture

The platform uses a **multi-layer** real-time system for instant messaging:

```
1. User sends message
        │
        ▼
2. Server Action inserts into DB
        │
        ├──▶ 3a. Chat Hub (in-memory) notifies SSE clients
        │         │
        │         ▼
        │    Connected browsers get instant update via SSE stream
        │    (endpoint: /api/chat/stream/[conversationId])
        │    (heartbeat every 15 seconds)
        │
        └──▶ 3b. Supabase Realtime broadcasts via WebSocket
                  │
                  ▼
             Clients subscribed to postgres_changes get update
```

**Why multiple layers?** Redundancy ensures messages arrive even if one path has latency. Optimistic updates show the message immediately in the sender's UI before server confirmation.

---

## 9. Zoom Integration

### How It Works
1. Uses **Server-to-Server OAuth** (no user login popup needed)
2. Requires environment variables: `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_HOST_EMAIL`
3. OAuth tokens are cached and refreshed 5 minutes before expiry

### Meeting Flow
```
Instructor clicks "Schedule Meeting"
        │
        ▼
POST /api/meetings
        │
        ▼
Server gets Zoom OAuth token (cached)
        │
        ▼
Zoom API creates scheduled meeting
        │
        ▼
Meeting record saved to DB with:
  - join_url (shared with student)
  - start_url (used by host/instructor)
        │
        ▼
Student sees meeting in their dashboard with "Join" button
```

### Meeting Settings
- Host & participant video: ON
- Waiting room: ENABLED
- Mute on entry: YES
- Join before host: DISABLED

---

## 10. API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/chat/send` | Send a chat message |
| GET | `/api/chat/messages/[conversationId]` | Fetch paginated messages (default 50/page) |
| GET | `/api/chat/stream/[conversationId]` | SSE endpoint for real-time chat updates |
| POST | `/api/chat/notify` | Notify Chat Hub of new messages |
| POST | `/api/chat/debug` | Debug chat issues (dev only) |
| POST | `/api/chat/fix-duplicates` | Fix duplicate messages (dev only) |
| POST | `/api/meetings` | Create a Zoom meeting |
| POST | `/api/signup-subscription` | Create subscription for a student |

---

## 11. Complete Route Map

### Public Routes
| Route | Page |
|-------|------|
| `/` | Root redirect (role-based) |
| `/auth/login` | Login page |
| `/auth/signup` | Sign-up page |

### Student Routes (Protected)
| Route | Page | Status |
|-------|------|--------|
| `/student` | Student entry (redirects) | Active |
| `/student/dashboard` | Main dashboard | Coming Soon |
| `/student/plans` | Browse & subscribe to plans | Active |
| `/student/one-on-one` | 1-on-1 session hub (chat, resources, journey, meetings) | Active |
| `/student/group-session` | Active batch hub (chat, resources, meetings) | Active |
| `/student/group` | Group overview | Coming Soon |
| `/student/broadcasts` | View announcements | Active |
| `/student/chat` | Chat routing by subscription type | Active |
| `/student/lms` | Learning management system | Coming Soon |

### Instructor Routes (Protected)
| Route | Page | Status |
|-------|------|--------|
| `/instructor` | Instructor entry (redirects) | Active |
| `/instructor/dashboard` | Main dashboard | Coming Soon |
| `/instructor/one-on-one` | Manage 1-on-1 students (chat, resources, journey, meetings) | Active |
| `/instructor/groups` | Create & manage batches | Active |
| `/instructor/group-session` | Active batch chat & management | Active |
| `/instructor/broadcast` | Send announcements | Active |
| `/instructor/chat` | Redirects to one-on-one | Active |
| `/instructor/lms` | LMS management | Coming Soon |

### Debug Route
| Route | Page |
|-------|------|
| `/debug` | Database state viewer (dev only) |

---

## 12. Key Business Logic Flows

### Student Subscribes to Group Session
```
Student selects "Group Session" plan
        │
        ▼
Subscription created (status: active)
        │
        ▼
Student auto-added to waiting_queue (status: waiting)
        │
        ▼
Instructor creates & activates a batch
        │
        ▼
System pulls students from waiting_queue
        │
        ▼
batch_enrollment created (status: active)
waiting_queue updated (status: assigned)
subscription gets start_date & end_date
        │
        ▼
Student added to batch conversation as participant
        │
        ▼
Student can now access group chat, resources, and meetings
```

### Student Subscribes to One-on-One
```
Student selects "One-on-One" plan
        │
        ▼
Subscription created (status: active)
        │
        ▼
Direct conversation created between student & instructor
        │
        ▼
Student appears in instructor's 1-on-1 student list
        │
        ▼
Both can chat, instructor can schedule meetings & upload resources
Student can log daily journey entries with photos
```

---

## 13. Project File Structure

```
faceyoguez_beta/
├── app/
│   ├── page.tsx                          # Root redirect
│   ├── layout.tsx                        # Root layout
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx, SignUpForm.tsx
│   ├── api/
│   │   ├── chat/send, messages, stream, notify, debug, fix-duplicates
│   │   ├── meetings/route.ts
│   │   └── signup-subscription/route.ts
│   └── (dashboard)/
│       ├── layout.tsx                    # Dashboard layout with sidebar
│       ├── debug/page.tsx
│       ├── instructor/
│       │   ├── dashboard, one-on-one, groups, group-session
│       │   ├── broadcast, chat, lms
│       │   └── [Client components for each]
│       └── student/
│           ├── dashboard, one-on-one, group-session, group
│           ├── plans, broadcasts, chat, lms
│           └── [Client components for each]
├── components/
│   ├── chat/       # ChatWindow, ChatSidebar, OneOnOneChat, MessageBubble, MessageInput
│   ├── layout/     # AppSidebar, PageHeader
│   └── ui/         # button, stepper, image-comparison-slider
├── hooks/
│   ├── useConversations.ts      # Real-time conversation list
│   └── useRealtimeMessages.ts   # Real-time chat messages with SSE + WebSocket
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser Supabase client
│   │   └── server.ts            # Server + Admin Supabase clients
│   ├── actions/
│   │   ├── batch.ts, batches.ts # Batch CRUD & activation
│   │   ├── broadcast.ts         # Send broadcasts & notifications
│   │   ├── chat.ts              # Chat actions (send, fetch, toggle)
│   │   ├── journey.ts           # Journey log CRUD
│   │   ├── meetings.ts          # Meeting queries
│   │   ├── resources.ts         # File upload & fetch
│   │   └── subscription.ts      # Subscription creation
│   ├── zoom.ts                  # Zoom OAuth + meeting CRUD
│   ├── chat-hub.ts              # In-memory event emitter for SSE
│   └── utils.ts                 # Utility helpers (cn for classnames)
├── types/
│   └── database.ts              # Full TypeScript types for all DB tables
├── scripts/
│   └── create_meetings.sql      # SQL for meetings table + RLS policies
├── next.config.ts
├── tsconfig.json
├── package.json
└── .env.local                   # Supabase + Zoom credentials
```

---

## 14. Environment Variables Required

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key (server-side only) |
| `ZOOM_ACCOUNT_ID` | Zoom Server-to-Server app account ID |
| `ZOOM_CLIENT_ID` | Zoom app client ID |
| `ZOOM_CLIENT_SECRET` | Zoom app client secret |
| `ZOOM_HOST_EMAIL` | Email of the Zoom host account |

---

## 15. What's Still In Progress

| Feature | Status |
|---------|--------|
| Student Dashboard | Placeholder ("Coming Soon") |
| Instructor Dashboard | Placeholder ("Coming Soon") |
| LMS (Student) | Placeholder ("Coming Soon") |
| LMS (Instructor) | Placeholder ("Coming Soon") |
| Student Group Overview | Placeholder ("Coming Soon") |
| Payment Integration | Not yet implemented (subscriptions created without payment gateway) |
| Zoom Credentials | Not yet configured in environment |
