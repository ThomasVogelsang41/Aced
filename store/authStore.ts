import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
  loginAsGuest: () => void;
  initialize: () => Promise<() => void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,

  setSession: (session) =>
    set({ session, user: session?.user ?? null, isLoading: false }),

  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    set({ session: null, user: null });
  },

  loginAsGuest: () => {
    const mockUser: any = {
      id: 'demo-user-123',
      app_metadata: {},
      user_metadata: { username: 'Guest Golfer' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'guest@aced.app',
    };
    const mockSession: any = {
      access_token: 'mock-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh',
      user: mockUser,
    };
    set({ session: mockSession, user: mockUser, isLoading: false });
  },

  initialize: async () => {
    // Get existing session
    const { data } = await supabase.auth.getSession();
    set({
      session: data.session,
      user: data.session?.user ?? null,
      isLoading: false,
    });

    // Subscribe to auth changes
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, isLoading: false });
    });

    // Return cleanup function
    return () => subscription.subscription.unsubscribe();
  },
}));
