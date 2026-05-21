'use client';

import { useEffect } from 'react';
import clarity from '@microsoft/clarity';

const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

export default function MicrosoftClarity() {
  useEffect(() => {
    if (CLARITY_PROJECT_ID) {
      clarity.init(CLARITY_PROJECT_ID);
    } else {
      console.warn('Microsoft Clarity Project ID (NEXT_PUBLIC_CLARITY_PROJECT_ID) is not set in environment variables.');
    }
  }, []);

  return null;
}
