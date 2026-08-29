import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<() => void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,

  setSession: (session) =>
    set({ session, user: session?.user ?? null, isLoading: false }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
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
