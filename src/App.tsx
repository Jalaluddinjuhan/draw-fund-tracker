import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, Profile } from './lib/supabase';
import Auth from './components/Auth';
import ProfileComplete from './components/ProfileComplete';
import Dashboard from './components/Dashboard';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Exception fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return <Auth />;
  }

  // Logged in but profile not complete
  if (!profile || !profile.full_name || !profile.phone_number || !profile.address) {
    return <ProfileComplete session={session} onComplete={() => fetchProfile(session.user.id)} />;
  }

  // Logged in and profile complete -> Dashboard
  return <Dashboard session={session} profile={profile} onSignOut={() => supabase.auth.signOut()} />;
}
