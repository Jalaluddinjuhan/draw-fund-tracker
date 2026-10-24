import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Phone, Shield, Save } from 'lucide-react';

export default function UserProfile() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [memberType, setMemberType] = useState('draw');

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setMemberType(data.member_type || 'draw');
      }
    } catch (error) {
      console.error('Error loading user profile!', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const updates = {
        id: user.id,
        full_name: fullName,
        phone: phone,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        throw error;
      }
      alert('প্রফাইল সফলভাবে আপডেট করা হয়েছে!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('প্রফাইল আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <User className="w-6 h-6 text-indigo-600" />
        ইউজার প্রফাইল সেটিংস
      </h2>

      <form onSubmit={updateProfile} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">পূর্ণ নাম (Full Name)</label>
          <div className="relative">
            <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">মোবাইল নম্বর (Phone Number)</label>
          <div className="relative">
            <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">মেম্বারের ধরণ (Member Type)</label>
          <div className="relative">
            <Shield className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={memberType.toUpperCase()}
              disabled
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-500 cursor-not-allowed uppercase"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">মেম্বার টাইপ পরিবর্তন করতে অ্যাডമിന്റെ সহায়তা নিন।</p>
        </div>

        <button
          type="submit"
          disabled={updating}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {updating ? 'সংরক্ষণ হচ্ছে...' : 'প্রফাইল আপডেট করুন'}
        </button>
      </form>
    </div>
  );
}