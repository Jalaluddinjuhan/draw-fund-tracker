import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, Plus, Trash2, Sparkles, Users, Trophy, Edit2, Save, X } from 'lucide-react';

type Notice = {
  id: number;
  title: string;
  content: string;
  created_at: string;
};

type SiteContent = {
  key: string;
  title: string;
  content: string;
};

export default function OverviewNotice({ isAdmin }: { isAdmin: boolean }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Card Content States
  const [cardsData, setCardsData] = useState<Record<string, SiteContent>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Notice Form States
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNotices();
    fetchSiteContent();
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

  const fetchSiteContent = async () => {
    try {
      const { data, error } = await supabase.from('site_content').select('*');
      if (error) throw error;
      if (data) {
        const map: Record<string, SiteContent> = {};
        data.forEach(item => { map[item.key] = item; });
        setCardsData(map);
      }
    } catch (err) {
      console.error('Error fetching site content:', err);
    }
  };

  const handleEditClick = (key: string) => {
    setEditingKey(key);
    setEditTitle(cardsData[key]?.title || '');
    setEditContent(cardsData[key]?.content || '');
  };

  const handleSaveCard = async (key: string) => {
    try {
      const { error } = await supabase
        .from('site_content')
        .update({ title: editTitle, content: editContent, updated_at: new Date() })
        .eq('key', key);

      if (error) throw error;
      setEditingKey(null);
      fetchSiteContent();
    } catch (err) {
      console.error('Error updating card:', err);
      alert('কার্ডের তথ্য আপডেট করা যায়নি।');
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

  const renderCard = (key: string, defaultIcon: any, defaultColor: string) => {
    const card = cardsData[key] || { title: '', content: '' };
    const isEditing = editingKey === key;

    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative group">
        {isAdmin && !isEditing && (
          <button
            onClick={() => handleEditClick(key)}
            className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors shadow-sm"
            title="কার্ড এডিট করুন"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}

        {isEditing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-900 text-base"
              placeholder="Card Title"
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-slate-700 text-sm"
              rows={5}
              placeholder="Card Content"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setEditingKey(null)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> বাতিল
              </button>
              <button
                onClick={() => handleSaveCard(key)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" /> সেভ করুন
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={`flex items-center gap-3 mb-3 ${defaultColor}`}>
              {defaultIcon}
              <h3 className="text-lg font-bold">{card.title}</h3>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
              {card.content}
            </p>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Short Overview Cards (Editable by Admin) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderCard('draw_card', <Trophy className="w-6 h-6" />, 'text-indigo-600')}
        {renderCard('mutual_card', <Users className="w-6 h-6" />, 'text-emerald-600')}
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

// import { useState, useEffect } from 'react';
// import { supabase } from '../lib/supabase';
// import { Bell, Plus, Trash2, Sparkles, Users, Trophy } from 'lucide-react';

// type Notice = {
//   id: number;
//   title: string;
//   content: string;
//   created_at: string;
// };

// export default function OverviewNotice({ isAdmin }: { isAdmin: boolean }) {
//   const [notices, setNotices] = useState<Notice[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [newTitle, setNewTitle] = useState('');
//   const [newContent, setNewContent] = useState('');
//   const [submitting, setSubmitting] = useState(false);

//   useEffect(() => {
//     fetchNotices();
//   }, []);

//   const fetchNotices = async () => {
//     setLoading(true);
//     try {
//       const { data, error } = await supabase
//         .from('notices')
//         .select('*')
//         .order('created_at', { ascending: false });

//       if (error) throw error;
//       if (data) setNotices(data);
//     } catch (err) {
//       console.error('Error fetching notices:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAddNotice = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!newTitle.trim() || !newContent.trim() || !isAdmin) return;

//     setSubmitting(true);
//     try {
//       const { error } = await supabase
//         .from('notices')
//         .insert([{ title: newTitle, content: newContent }]);

//       if (error) throw error;

//       setNewTitle('');
//       setNewContent('');
//       fetchNotices();
//     } catch (err) {
//       console.error('Error adding notice:', err);
//       alert('নোটিশ যোগ করতে সমস্যা হয়েছে।');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleDeleteNotice = async (id: number) => {
//     if (!isAdmin || !confirm('আপনি কি এই নোটিশটি ডিলিট করতে চান?')) return;

//     try {
//       const { error } = await supabase
//         .from('notices')
//         .delete()
//         .eq('id', id);

//       if (error) throw error;
//       fetchNotices();
//     } catch (err) {
//       console.error('Error deleting notice:', err);
//       alert('নোটিশ ডিলিট করা যায়নি।');
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* Short Overview Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
//           <div className="flex items-center gap-3 mb-3 text-indigo-600">
//             <Trophy className="w-6 h-6" />
//             <h3 className="text-lg font-bold">Bachelor Draw System</h3>
//           </div>
//           <p className="text-slate-600 text-sm leading-relaxed">
//             প্রতি মাসের নির্দিষ্ট তারিখে লটারির মাধ্যমে ড্র অনুষ্ঠিত হয়। বিজয়ী সদস্য পুরো পুলের ফান্ড (যেমন: ৮০,০০০ টাকা) পেয়ে থাকেন। একবার বিজয়ী হলে তিনি পরবর্তী ড্রগুলোর জন্য সক্রিয় পুল থেকে বাদ পড়েন।
//           </p>
//         </div>

//         <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
//           <div className="flex items-center gap-3 mb-3 text-emerald-600">
//             <Users className="w-6 h-6" />
//             <h3 className="text-lg font-bold">Mutual Fund System</h3>
//           </div>
//           <p className="text-slate-600 text-sm leading-relaxed">
//             মিউচুয়াল ফান্ড হলো একটি আলাদা সঞ্চয় ব্যবস্থা। এটি সদস্যদের পারস্পরিক আর্থিক সহযোগিতা ও নিরাপত্তার জন্য সম্পূর্ণ পৃথকভাবে পরিচালিত হয়ে থাকে।
//           </p>
//         </div>
//       </div>

//       {/* Admin Add Notice Form */}
//       {isAdmin && (
//         <div className="bg-white rounded-2xl p-6 border border-indigo-100 shadow-sm bg-gradient-to-r from-indigo-50/30 to-white">
//           <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
//             <Sparkles className="w-5 h-5 text-indigo-600" />
//             নতুন নোটিশ বা ঘোষণা যোগ করুন
//           </h3>
//           <form onSubmit={handleAddNotice} className="space-y-4">
//             <input
//               type="text"
//               placeholder="নোটিশের শিরোনাম (Title)"
//               value={newTitle}
//               onChange={(e) => setNewTitle(e.target.value)}
//               className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 text-sm"
//               required
//             />
//             <textarea
//               placeholder="নোটিশের বিস্তারিত বিবরণ এখানে লিখুন..."
//               value={newContent}
//               onChange={(e) => setNewContent(e.target.value)}
//               className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 text-sm"
//               rows={3}
//               required
//             />
//             <button
//               type="submit"
//               disabled={submitting}
//               className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
//             >
//               <Plus className="w-4 h-4" />
//               {submitting ? 'প্রকাশ করা হচ্ছে...' : 'নোটিশ প্রকাশ করুন'}
//             </button>
//           </form>
//         </div>
//       )}

//       {/* Notice Board List */}
//       <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
//         <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
//           <Bell className="w-5 h-5 text-amber-500" />
//           জরুরি নোটিশ ও ঘোষণা বোর্ড
//         </h3>

//         {loading ? (
//           <p className="text-center text-slate-500 py-6">নোটিশ লোড হচ্ছে...</p>
//         ) : notices.length === 0 ? (
//           <p className="text-center text-slate-500 py-6">এই মুহূর্তে কোনো নোটিশ নেই।</p>
//         ) : (
//           <div className="space-y-4">
//             {notices.map((notice) => (
//               <div key={notice.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-start gap-4">
//                 <div>
//                   <h4 className="font-bold text-slate-900 text-base">{notice.title}</h4>
//                   <p className="text-slate-600 text-sm mt-1 whitespace-pre-line">{notice.content}</p>
//                   <span className="text-xs text-slate-400 mt-2 block">
//                     প্রকাশিত: {new Date(notice.created_at).toLocaleDateString('bn-BD')}
//                   </span>
//                 </div>
//                 {isAdmin && (
//                   <button
//                     onClick={() => handleDeleteNotice(notice.id)}
//                     className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
//                     title="নোটিশ ডিলিট করুন"
//                   >
//                     <Trash2 className="w-4 h-4" />
//                   </button>
//                 )}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }