'use server';

/**
 * lib/actions/whatsapp.ts
 * Logic for interacting with Meta's WhatsApp Business API.
 */

const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

/**
 * Sends a WhatsApp message via Meta Graph API.
 * Note: For Business API, you usually need to use Templates for "Business-Initiated" messages
 * if there has been no interaction in the last 24 hours.
 */
export async function sendWhatsAppMessage(to: string, message: string) {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    console.error('WhatsApp credentials missing');
    return { success: false, error: 'WhatsApp API not configured' };
  }

  // Clean phone number: remove non-digits
  const cleanTo = to.replace(/\D/g, '');

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanTo,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API Error:', data);
      return { success: false, error: data.error?.message || 'Failed to send message' };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('WhatsApp Request Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Template version (Required for initiating chats)
 */
export async function sendWhatsAppTemplate(to: string, templateName: string, languageCode: string = 'en_US') {
   if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    return { success: false, error: 'WhatsApp API not configured' };
  }

  const cleanTo = to.replace(/\D/g, '');

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanTo,
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
          },
        }),
      }
    );

    const data = await response.json();
    return response.ok ? { success: true, data } : { success: false, error: data.error?.message };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
