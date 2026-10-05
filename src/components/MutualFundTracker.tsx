import { useState, useEffect } from 'react';
import { supabase, Profile } from '../lib/supabase';

export default function MutualFundTracker({ isAdmin }: { isAdmin: boolean }) {
  const [mutualMembers, setMutualMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMutualMembers();
  }, []);

  const fetchMutualMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('member_type', 'mutual') // Shudhu mutual fund member-ra ekhane asbe
        .order('full_name');

      if (error) throw error;
      if (data) setMutualMembers(data);
    } catch (error) {
      console.error('Error fetching mutual members:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <h3 className="text-lg font-medium leading-6 text-slate-900">মিউচুয়াল ফান্ড মেম্বার তালিকা (Mutual Fund Members)</h3>
        <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
          Total: {mutualMembers.length} জন
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">সদস্যের নাম</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">মোবাইল নাম্বার</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ইমেইল</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ঠিকানা</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500">লোড হচ্ছে...</td></tr>
            ) : mutualMembers.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500">কোনো মিউচুয়াল ফান্ড মেম্বার পাওয়া যায়নি।</td></tr>
            ) : (
              mutualMembers.map(member => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 uppercase">{member.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{member.phone_number || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{member.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{member.address || 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}