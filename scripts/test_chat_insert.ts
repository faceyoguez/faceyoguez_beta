import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// We need a real user to test RLS, but for now let's just test the insert logic with admin
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testChatMessage() {
    console.log('Testing chat message insertion...');
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Find an active 1-on-1 conversation
    const { data: convs } = await admin
        .from('conversations')
        .select('id')
        .eq('type', 'direct')
        .limit(1);

    if (!convs || convs.length === 0) {
        console.log('No direct conversations found to test with.');
        return;
    }

    const convId = convs[0].id;
    console.log('Using conversation:', convId);

    // 2. Find a participant
    const { data: parts } = await admin
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', convId)
        .limit(1);

    if (!parts || parts.length === 0) {
        console.log('No participants found for this conversation.');
        return;
    }

    const userId = parts[0].user_id;

    // 3. Try to insert a message
    const { data: msg, error } = await admin
        .from('chat_messages')
        .insert({
            conversation_id: convId,
            sender_id: userId,
            content: 'Test message from script',
            content_type: 'text'
        })
        .select()
        .single();

    if (error) {
        console.error('Insert error:', error);
    } else {
        console.log('Success! Inserted message:', msg.id);
        // Delete it to keep clean
        await admin.from('chat_messages').delete().eq('id', msg.id);
    }
}

testChatMessage();
