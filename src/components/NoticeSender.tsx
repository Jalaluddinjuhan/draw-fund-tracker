import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, Plus, Trash2, Sparkles, Users, Trophy } from 'lucide-react';

type Notice = {
  id: number;
  title: string;
  content: string;
  created_at: string;
};

export default function OverviewNotice({ isAdmin }: { isAdmin: boolean }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setNotices(data);
    } catch (err) {
      console.error('Error fetching notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !isAdmin) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('notices')
        .insert([{ title: newTitle, content: newContent }]);

      if (error) throw error;

      setNewTitle('');
      setNewContent('');
      fetchNotices();
    } catch (err) {
      console.error('Error adding notice:', err);
      alert('নোটিশ যোগ করতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (id: number) => {
    if (!isAdmin || !confirm('আপনি কি এই নোটিশটি ডিলিট করতে চান?')) return;

    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchNotices();
    } catch (err) {
      console.error('Error deleting notice:', err);
      alert('নোটিশ ডিলিট করা যায়নি।');
    }
  };

  return (
    <div className="space-y-6">
      {/* Short Overview Cards (Updated Text) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3 text-indigo-600">
            <Trophy className="w-6 h-6" />
            <h3 className="text-lg font-bold">Bachelor Draw System</h3>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            ব্যাচেলর ড্র হলো একটি মাসিক লটারি সিস্টেম, যেখানে প্রতি মাসের নির্দিষ্ট তারিখে (সাধারণত ১১ তারিখে) হুইল ঘোরানোর মাধ্যমে একজন বিজয়ী নির্বাচন করা হয়। বিজয়ী সদস্য ওই মাসের জন্য পুরো পুলের নির্ধারিত ফান্ড (যেমন: ৮০,০০০ টাকা) পেয়ে থাকেন। একবার বিজয়ী হওয়ার পর তিনি পরবর্তী ড্রগুলোর জন্য সক্রিয় পুল থেকে বাদ পড়েন।
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3 text-emerald-600">
            <Users className="w-6 h-6" />
            <h3 className="text-lg font-bold">Mutual Fund System</h3>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            ব্রাদারহুড মিউচুয়াল ফান্ড (বিএমএফ) হলো একটি সম্পূরক সঞ্চয় ও পারস্পরিক কল্যাণ সমিতি। এটি সদস্যদের পারস্পরিক আর্থিক সহযোগিতা, সঞ্চয় বৃদ্ধি এবং জরুরি প্রয়োজনে সহযোগিতার জন্য সম্পূর্ণ স্বচ্ছতা ও জবাবদিহিতার সাথে পৃথকভাবে পরিচালিত হয়ে থাকে।
          </p>
        </div>
      </div>

      {/* Admin Add Notice Form */}
      {isAdmin && (
        <div className="bg-white rounded-2xl p-6 border border-indigo-100 shadow-sm bg-gradient-to-r from-indigo-50/30 to-white">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            নতুন নোটিশ বা ঘোষণা যোগ করুন
          </h3>
          <form onSubmit={handleAddNotice} className="space-y-4">
            <input
              type="text"
              placeholder="নোটিশের শিরোনাম (Title)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 text-sm"
              required
            />
            <textarea
              placeholder="নোটিশের বিস্তারিত বিবরণ এখানে লিখুন..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 text-sm"
              rows={3}
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              {submitting ? 'প্রকাশ করা হচ্ছে...' : 'নোটিশ প্রকাশ করুন'}
            </button>
          </form>
        </div>
      )}

      {/* Notice Board List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-500" />
          জরুরি নোটিশ ও ঘোষণা বোর্ড
        </h3>

        {loading ? (
          <p className="text-center text-slate-500 py-6">নোটিশ লোড হচ্ছে...</p>
        ) : notices.length === 0 ? (
          <p className="text-center text-slate-500 py-6">এই মুহূর্তে কোনো নোটিশ নেই।</p>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div key={notice.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-start gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{notice.title}</h4>
                  <p className="text-slate-600 text-sm mt-1 whitespace-pre-line">{notice.content}</p>
                  <span className="text-xs text-slate-400 mt-2 block">
                    প্রকাশিত: {new Date(notice.created_at).toLocaleDateString('bn-BD')}
                  </span>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteNotice(notice.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="নোটিশ ডিলিট করুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}