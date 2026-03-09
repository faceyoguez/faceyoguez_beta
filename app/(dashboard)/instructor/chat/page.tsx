import { redirect } from 'next/navigation';

// Chat is now integrated into the one-on-one panel
export default function InstructorChatPage() {
  redirect('/instructor/one-on-one');
}
