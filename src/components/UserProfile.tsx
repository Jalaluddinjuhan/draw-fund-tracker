import { useState } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { User, Phone, MapPin, Save, Shield, Upload } from 'lucide-react';

export default function UserProfile({ profile, onUpdate }: { profile: Profile; onUpdate: () => void }) {
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(profile.phone_number || '');
  const [address, setAddress] = useState(profile.address || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // ছবি আপলোড হ্যান্ডলার
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Supabase storage-এ আপলোড
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // পাবলিক URL বের করা
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('ছবি আপলোড করতে সমস্যা হয়েছে।');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone_number: phoneNumber,
          address: address,
          avatar_url: avatarUrl,
        })
        .eq('id', profile.id);

      if (error) throw error;
      alert('প্রফাইল সফলভাবে আপডেট করা হয়েছে!');
      onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('প্রফাইল আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <User className="w-6 h-6 text-indigo-600" />
        ইউজার প্রফাইল সেটিংস
      </h2>

      <form onSubmit={handleUpdate} className="space-y-6">
        {/* Avatar Upload Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-slate-400" />
            )}
          </div>
          <label className="cursor-pointer bg-slate-50 border border-slate-300 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 flex items-center gap-2 transition-colors">
            <Upload className="w-4 h-4" />
            {uploading ? 'আপলোড হচ্ছে...' : 'ছবি পরিবর্তন করুন'}
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading} />
          </label>
        </div>

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
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">ঠিকানা (Address)</label>
          <div className="relative">
            <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">মেম্বারের ধরণ (Member Type)</label>
          <div className="relative">
            <Shield className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={(profile.member_type || 'draw').toUpperCase()}
              disabled
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-500 cursor-not-allowed uppercase"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {loading ? 'সংরক্ষণ হচ্ছে...' : 'প্রফাইল আপডেট করুন'}
        </button>
      </form>
    </div>
  );
}

// import { useState } from 'react';
// import { supabase, Profile } from '../lib/supabase';
// import { User, Phone, MapPin, Save, Shield } from 'lucide-react';

// export default function UserProfile({ profile, onUpdate }: { profile: Profile; onUpdate: () => void }) {
//   const [fullName, setFullName] = useState(profile.full_name || '');
//   const [phoneNumber, setPhoneNumber] = useState(profile.phone_number || '');
//   const [address, setAddress] = useState(profile.address || '');
//   const [loading, setLoading] = useState(false);

//   const handleUpdate = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const { error } = await supabase
//         .from('profiles')
//         .update({
//           full_name: fullName,
//           phone_number: phoneNumber,
//           address: address,
//           updated_at: new Date().toISOString(),
//         })
//         .eq('id', profile.id);

//       if (error) throw error;
//       alert('প্রফাইল সফলভাবে আপডেট করা হয়েছে!');
//       onUpdate();
//     } catch (error) {
//       console.error('Error updating profile:', error);
//       alert('প্রফাইল আপডেট করতে সমস্যা হয়েছে।');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
//       <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
//         <User className="w-6 h-6 text-indigo-600" />
//         ইউজার প্রফাইল সেটিংস
//       </h2>

//       <form onSubmit={handleUpdate} className="space-y-6">
//         <div>
//           <label className="block text-sm font-medium text-slate-700 mb-2">পূর্ণ নাম (Full Name)</label>
//           <div className="relative">
//             <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
//             <input
//               type="text"
//               value={fullName}
//               onChange={(e) => setFullName(e.target.value)}
//               className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
//               required
//             />
//           </div>
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-slate-700 mb-2">মোবাইল নম্বর (Phone Number)</label>
//           <div className="relative">
//             <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
//             <input
//               type="text"
//               value={phoneNumber}
//               onChange={(e) => setPhoneNumber(e.target.value)}
//               placeholder="01XXXXXXXXX"
//               className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
//               required
//             />
//           </div>
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-slate-700 mb-2">ঠিকানা (Address)</label>
//           <div className="relative">
//             <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
//             <textarea
//               value={address}
//               onChange={(e) => setAddress(e.target.value)}
//               rows={3}
//               className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
//               required
//             />
//           </div>
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-slate-700 mb-2">মেম্বারের ধরণ (Member Type)</label>
//           <div className="relative">
//             <Shield className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
//             <input
//               type="text"
//               value={(profile.member_type || 'draw').toUpperCase()}
//               disabled
//               className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-500 cursor-not-allowed uppercase"
//             />
//           </div>
//           <p className="text-xs text-slate-400 mt-1">মেম্বার টাইপ পরিবর্তন করতে অ্যাডমিনের সহায়তা নিন।</p>
//         </div>

//         <button
//           type="submit"
//           disabled={loading}
//           className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
//         >
//           <Save className="w-5 h-5" />
//           {loading ? 'সংরক্ষণ হচ্ছে...' : 'প্রফাইল আপডেট করুন'}
//         </button>
//       </form>
//     </div>
//   );
// }