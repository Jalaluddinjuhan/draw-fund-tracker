/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types
export type Profile = {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  address: string;
  role: 'admin' | 'member';
  created_at: string;
};

export type FundEntry = {
  id: number;
  user_id: string;
  year: number;
  month: string;
  amount: number;
  is_winner: boolean;
  created_at: string;
};

export type DrawParticipant = {
  id: number;
  user_id: string;
  is_active: boolean;
  updated_at: string;
};
