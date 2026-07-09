import posthog from 'posthog-js';
import { supabase } from '@/integrations/supabase/client';

const KEY = 'phc_Ash9deyPuwHrYq5RG4F5JPRBo2ncqXYpePRK9tWHQUCR';
const HOST = 'https://us.i.posthog.com';

let started = false;

export function initPostHog() {
  if (started || typeof window === 'undefined') return;
  started = true;

  posthog.init(KEY, {
    api_host: HOST,
    defaults: '2026-05-30',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    disable_session_recording: false,
    loaded: (ph) => {
      // Identify current user if already signed in
      supabase.auth.getUser().then(({ data }) => {
        const u = data.user;
        if (u) ph.identify(u.id, { email: u.email });
      });
    },
  });

  // Track auth changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      posthog.identify(session.user.id, { email: session.user.email });
      posthog.capture('user_signed_in');
    } else if (event === 'SIGNED_OUT') {
      posthog.capture('user_signed_out');
      posthog.reset();
    }
  });
}

export { posthog };

export function track(event: string, props?: Record<string, unknown>) {
  try {
    posthog.capture(event, props);
  } catch {
    // no-op
  }
}