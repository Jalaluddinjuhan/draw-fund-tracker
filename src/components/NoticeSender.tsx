import emailjs from '@emailjs/browser';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Sparkles, Send } from 'lucide-react';

export default function NoticeSender({ isAdmin }: { isAdmin: boolean }) {
  const [noticeText, setNoticeText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendNotice = async () => {
    if (!noticeText.trim()) {
      alert('দয়া করে নোটিশের লেখা লিখুন।');
      return;
    }

    setSending(true);
    try {
      // Supabase থেকে সব মেম্বারের ইমেইল ও নাম নিয়ে আসা
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('email, full_name');

      if (error) throw error;

      if (!profiles || profiles.length === 0) {
        alert('কোনো মেম্বার পাওয়া যায়নি।');
        setSending(false);
        return;
      }

      // সবার কাছে এক এক করে ইমেইল পাঠানো
      for (const member of profiles) {
        if (member.email) {
          const templateParams = {
            to_name: member.full_name || 'Member',
            to_email: member.email,
            message: noticeText,
          };

          await emailjs.send(
            'service_740w6sm',      // Service ID
            'template_z8it6hm',     // Template ID[cite: 20]
            templateParams,
            'SOirsDBfZZR5Khw4W'     // Public Key[cite: 19]
          );
        }
      }

      alert('সফলভাবে সকল মেম্বারের কাছে নোটিশ ইমেইল পাঠানো হয়েছে!');
      setNoticeText('');
    } catch (err) {
      console.error('Error sending notice:', err);
      alert('ইমেইল পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSending(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mt-6">
      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        মেম্বারদের জন্য নোটিশ পাঠান (Email)
      </h3>
      <textarea
        value={noticeText}
        onChange={(e) => setNoticeText(e.target.value)}
        placeholder="এখানে আপনার নোটিশ লিখুন..."
        className="w-full p-3 border border-slate-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700"
        rows={4}
      />
      <button
        onClick={handleSendNotice}
        disabled={sending}
        className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        <Send className="w-4 h-4" />
        {sending ? 'পাঠানো হচ্ছে...' : 'সবাইকে ইমেইল পাঠান'}
      </button>
    </div>
  );
}