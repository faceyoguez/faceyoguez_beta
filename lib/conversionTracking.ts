export const trackConversionEvent = async (params: {
  event_type: 'pricing_view' | 'buy_click' | 'payment_screen' | 'payment_complete' | 'payment_failed' | 'payment_retry' | 'contact_form_fill' | 'whatsapp_click';
  page_path?: string;
  plan_type?: string;
  amount?: number;
  metadata?: Record<string, any>;
}) => {
  try {
    // Check if we have an existing session ID in localStorage to tie events together
    let sessionId = null;
    if (typeof window !== 'undefined') {
      sessionId = localStorage.getItem('faceyoguez_session_id');
    }

    const payload = {
      ...params,
      session_id: sessionId
    };

    const res = await fetch('/api/conversion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      // Store the session ID to connect subsequent events across pages
      if (data.session_id && typeof window !== 'undefined' && !sessionId) {
        localStorage.setItem('faceyoguez_session_id', data.session_id);
      }
    }
  } catch (error) {
    console.error('Failed to track conversion:', error);
  }
};
