import { useState, useEffect, useRef } from 'react';
import { supabase, Profile } from '../lib/supabase';
import confetti from 'canvas-confetti';
import { motion, useAnimation } from 'motion/react';
import { Sparkles, Trophy, Download, X } from 'lucide-react';

type Participant = Profile & { draw_id: number; is_active: boolean };

export default function WheelDraw({ isAdmin }: { isAdmin: boolean }) {
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার्च', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  
  const currentMonthIndex = new Date().getMonth();
  const currentMonthName = BN_MONTHS[currentMonthIndex];
  const englishMonthName = MONTHS[currentMonthIndex];

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);

  // রসিদ (Receipt) স্টেট
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<{ winnerName: string; amount: number; month: string; year: number } | null>(null);

  const wheelControls = useAnimation();
  const rotationRef = useRef(0);
  const participantsRef = useRef<Participant[]>([]);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  useEffect(() => {
    fetchParticipants();

    const channel = supabase.channel('wheel_room', {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'start_spin' }, async ({ payload }) => {
        setIsSpinning(true);
        setWinner(null);

        await wheelControls.start({
          rotate: payload.finalRotation,
          transition: { duration: 6, ease: [0.15, 0.85, 0.15, 1] }
        });

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#818cf8', '#fbbf24', '#f59e0b']
        });

        const winningParticipant = participantsRef.current.find(p => p.id === payload.winnerId);
        if (winningParticipant) {
          setWinner(winningParticipant);
        }
        setIsSpinning(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const { data: drawData, error: drawError } = await supabase
        .from('draw_participants')
        .select('id, user_id, is_active')
        .eq('is_active', true);
        
      if (drawError) throw drawError;

      if (drawData && drawData.length > 0) {
        const userIds = drawData.map(d => d.user_id);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds)
          .eq('member_type', 'draw');

        if (profileError) throw profileError;

        if (profileData) {
          const merged = profileData.map(p => {
            const drawRecord = drawData.find(d => d.user_id === p.id);
            return { ...p, draw_id: drawRecord!.id, is_active: drawRecord!.is_active };
          });
          setParticipants(merged);
        }
      } else {
        setParticipants([]);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const spinWheel = async () => {
    if (participants.length === 0 || isSpinning || !isAdmin) return;

    setIsSpinning(true);
    setWinner(null);

    const segmentAngle = 360 / participants.length;
    const winnerIndex = Math.floor(Math.random() * participants.length);
    const winningParticipant = participants[winnerIndex];

    const extraSpins = 5 * 360; 
    const targetAngle = -(winnerIndex * segmentAngle) - (segmentAngle / 2);
    const totalRotation = rotationRef.current + extraSpins + (targetAngle - (rotationRef.current % 360));
    const randomOffset = (Math.random() - 0.5) * segmentAngle * 0.7;
    const finalRotation = totalRotation - randomOffset + 360;

    rotationRef.current = finalRotation;

    await supabase.channel('wheel_room').send({
      type: 'broadcast',
      event: 'start_spin',
      payload: {
        finalRotation,
        winnerId: winningParticipant.id
      },
    });

    await wheelControls.start({
      rotate: finalRotation,
      transition: { duration: 6, ease: [0.15, 0.85, 0.15, 1] }
    });

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4f46e5', '#818cf8', '#fbbf24', '#f59e0b']
    });

    setWinner(winningParticipant);
    setIsSpinning(false);
  };

  const confirmWinner = async () => {
    if (!winner || !isAdmin) return;

    const now = new Date();
    const currentMonth = englishMonthName;
    const currentYear = now.getFullYear();

    try {
      const [settingsRes, profilesCountRes] = await Promise.all([
        supabase.from('app_settings').select('monthly_amount').eq('id', 1).maybeSingle(),
        supabase.from('profiles').select('id', { count: 'exact', head: true })
      ]);

      const monthlyAmount = settingsRes.data?.monthly_amount || 5000;
      const totalMembers = profilesCountRes.count || participants.length; 
      const totalPool = monthlyAmount * totalMembers; 

      const { error: fundError } = await supabase
        .from('fund_entries')
        .upsert({
          user_id: winner.id,
          year: currentYear,
          month: currentMonth,
          amount: totalPool,
          is_winner: true,
        }, { onConflict: 'user_id, year, month' });

      if (fundError) throw fundError;

      const { error: drawError } = await supabase
        .from('draw_participants')
        .update({ is_active: false })
        .eq('id', winner.draw_id);

      if (drawError) throw drawError;

      // রসিদ ডাটা সেট করে রসিদ মডাল ওপেন করা
      setReceiptData({
        winnerName: winner.full_name,
        amount: totalPool,
        month: currentMonthName,
        year: currentYear
      });
      setShowReceipt(true);

      setWinner(null);
      fetchParticipants();
    } catch (error) {
      console.error('Error updating winner:', error);
      alert('বিজয়ী নিশ্চিত করা যায়নি। কনসোল চেক করুন।');
    }
  };
  
  const renderWheel = () => {
    if (participants.length === 0) {
      return (
        <div className="w-full h-full rounded-full border-4 border-slate-200 flex items-center justify-center bg-slate-50 text-slate-400">
          No active participants
        </div>
      );
    }

    const radius = 50;
    const center = 50;
    
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full rounded-full overflow-hidden shadow-xl drop-shadow-2xl">
        <motion.g animate={wheelControls} initial={{ rotate: 0 }} style={{ transformOrigin: '50px 50px' }}>
          {participants.map((p, index) => {
            const angle = 360 / participants.length;
            const startAngle = index * angle;
            const endAngle = (index + 1) * angle;
            
            const startRad = (startAngle - 90) * (Math.PI / 180);
            const endRad = (endAngle - 90) * (Math.PI / 180);
            
            const x1 = center + radius * Math.cos(startRad);
            const y1 = center + radius * Math.sin(startRad);
            const x2 = center + radius * Math.cos(endRad);
            const y2 = center + radius * Math.sin(endRad);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4'];
            const color = colors[index % colors.length];

            const textAngle = startAngle + (angle / 2);
            
            return (
              <g key={p.id}>
                {participants.length === 1 ? (
                  <circle cx="50" cy="50" r="50" fill={color} />
                ) : (
                  <path
                    d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="0.5"
                  />
                )}
                <text
                  x="97"
                  y="50"
                  fill="white"
                  fontSize="4"
                  fontWeight="normal"
                  textAnchor="end"
                  dominantBaseline="central"
                  alignmentBaseline="middle"
                  transform={`rotate(${textAngle - 90}, 50, 50)`}
                  className="drop-shadow-md select-none uppercase"
                >
                  {p.full_name.length > 12 ? p.full_name.split(' ').slice(0, 2).join(' ') : p.full_name}
                </text>
              </g>
            );
          })}
        </motion.g>
      </svg>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 flex flex-col items-center bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Bachelor Draw</h2>
        <p className="text-slate-500 mb-8">এই {currentMonthName} মাসের বিজয়ী বেছে নিতে হুইল ঘোরান!</p>
        
        <div className="relative w-80 h-80 md:w-96 md:h-96 mb-8">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[24px] border-t-slate-800 drop-shadow-md"></div>
          
          {loading ? (
            <div className="w-full h-full rounded-full border-4 border-slate-100 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            renderWheel()
          )}
        </div>

        {isAdmin && (
          <button
            onClick={spinWheel}
            disabled={isSpinning || participants.length === 0}
            className="px-8 py-3 bg-indigo-600 text-white text-lg font-bold rounded-full shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            {isSpinning ? 'Spinning...' : 'হুইল ঘুরান'}
          </button>
        )}
        {!isAdmin && (
          <div className="text-slate-500 italic bg-slate-50 px-4 py-2 rounded-lg text-sm">
            {isSpinning ? 'হুইল ঘুরছে, অপেক্ষা করুন...' : 'অ্যাডমিন হুইল ঘোরানোর অপেক্ষায়...'}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {winner && (
           <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 shadow-sm">
             <div className="flex items-center gap-3 mb-4 text-amber-700">
               <Trophy className="w-6 h-6" />
               <h3 className="text-lg font-bold">আমরা একজন বিজয়ী পেয়েছি!</h3>
             </div>
             <p className="text-slate-700 mb-6 font-medium uppercase">
               {winner.full_name} এই রাউন্ডে জিতেছে। {isAdmin ? 'আপনি কি এই বিজয়ীকে নিশ্চিত করে পরবর্তী ড্র থেকে বাদ দিতে চান?' : ''}
             </p>
             {isAdmin && (
               <button 
                 onClick={confirmWinner}
                 className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg transition-colors"
               >
                 বিজয়ী নিশ্চিত করুন
               </button>
             )}
           </div>
        )}

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex-1">
          <h3 className="font-bold text-slate-900 mb-4 flex justify-between items-center">
            Active Pool
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-sm">{participants.length} members</span>
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {participants.map(p => (
              <div key={p.id} className={`p-2 rounded-lg border text-sm flex items-center justify-between uppercase ${winner?.id === p.id ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold' : 'border-slate-100 bg-slate-50 text-slate-700'}`}>
                {p.full_name}
                {winner?.id === p.id && <Trophy className="w-4 h-4 text-amber-500" />}
              </div>
            ))}
            {participants.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">সবাইকে ইতিমধ্যে ড্র করা হয়ে গেছে!</p>
            )}
          </div>
        </div>
      </div>

      {/* ডিজিটাল রসিদ মডাল (Digital Receipt Modal) */}
      {showReceipt && receiptData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowReceipt(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center pb-6 border-b border-dashed border-slate-200">
              <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-full mb-3">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Brotherhoods' Mutual Fund (BMF)</h3>
              <p className="text-xs text-slate-500 mt-1">ভ্রাতৃত্বের বন্ধন, সমৃদ্ধির স্পন্দন</p>
              <span className="inline-block mt-3 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                অফিসিয়াল ড্র রসিদ
              </span>
            </div>

            <div className="py-6 space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">বিজয়ী সদস্য:</span>
                <span className="font-bold text-slate-900 uppercase">{receiptData.winnerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">মাসের নাম:</span>
                <span className="font-semibold text-slate-800">{receiptData.month}, {receiptData.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ফান্ডের পরিমাণ:</span>
                <span className="font-bold text-indigo-600 text-lg">৳{receiptData.amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                রসিদ প্রিন্ট / ডাউনলোড
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// import { useState, useEffect, useRef } from 'react';
// import { supabase, Profile } from '../lib/supabase';
// import confetti from 'canvas-confetti';
// import { motion, useAnimation } from 'motion/react';
// import { Sparkles, Trophy } from 'lucide-react';

// type Participant = Profile & { draw_id: number; is_active: boolean };

// export default function WheelDraw({ isAdmin }: { isAdmin: boolean }) {
//   const currentMonthName = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'][new Date().getMonth()];
//   const [participants, setParticipants] = useState<Participant[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [isSpinning, setIsSpinning] = useState(false);
//   const [winner, setWinner] = useState<Participant | null>(null);

//   const wheelControls = useAnimation();
//   const rotationRef = useRef(0);
//   const participantsRef = useRef<Participant[]>([]);

//   useEffect(() => {
//     participantsRef.current = participants;
//   }, [participants]);

//   useEffect(() => {
//     fetchParticipants();

//     const channel = supabase.channel('wheel_room', {
//       config: { broadcast: { self: false } },
//     });

//     channel
//       .on('broadcast', { event: 'start_spin' }, async ({ payload }) => {
//         setIsSpinning(true);
//         setWinner(null);

//         await wheelControls.start({
//           rotate: payload.finalRotation,
//           transition: { duration: 6, ease: [0.15, 0.85, 0.15, 1] }
//         });

//         confetti({
//           particleCount: 100,
//           spread: 70,
//           origin: { y: 0.6 },
//           colors: ['#4f46e5', '#818cf8', '#fbbf24', '#f59e0b']
//         });

//         const winningParticipant = participantsRef.current.find(p => p.id === payload.winnerId);
//         if (winningParticipant) {
//           setWinner(winningParticipant);
//         }
//         setIsSpinning(false);
//       })
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, []);

//   const fetchParticipants = async () => {
//     setLoading(true);
//     try {
//       const { data: drawData, error: drawError } = await supabase
//         .from('draw_participants')
//         .select('id, user_id, is_active')
//         .eq('is_active', true);
        
//       if (drawError) throw drawError;

//       if (drawData && drawData.length > 0) {
//         const userIds = drawData.map(d => d.user_id);
//         const { data: profileData, error: profileError } = await supabase
//           .from('profiles')
//           .select('*')
//           .in('id', userIds)
//           .eq('member_type', 'draw');

//         if (profileError) throw profileError;

//         if (profileData) {
//           const merged = profileData.map(p => {
//             const drawRecord = drawData.find(d => d.user_id === p.id);
//             return { ...p, draw_id: drawRecord!.id, is_active: drawRecord!.is_active };
//           });
//           setParticipants(merged);
//         }
//       } else {
//         setParticipants([]);
//       }
//     } catch (error) {
//       console.error('Error fetching participants:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const spinWheel = async () => {
//     if (participants.length === 0 || isSpinning || !isAdmin) return;

//     setIsSpinning(true);
//     setWinner(null);

//     const segmentAngle = 360 / participants.length;
//     const winnerIndex = Math.floor(Math.random() * participants.length);
//     const winningParticipant = participants[winnerIndex];

//     const extraSpins = 5 * 360; 
//     const targetAngle = -(winnerIndex * segmentAngle) - (segmentAngle / 2);
//     const totalRotation = rotationRef.current + extraSpins + (targetAngle - (rotationRef.current % 360));
//     const randomOffset = (Math.random() - 0.5) * segmentAngle * 0.7;
//     const finalRotation = totalRotation - randomOffset + 360;

//     rotationRef.current = finalRotation;

//     await supabase.channel('wheel_room').send({
//       type: 'broadcast',
//       event: 'start_spin',
//       payload: {
//         finalRotation,
//         winnerId: winningParticipant.id
//       },
//     });

//     await wheelControls.start({
//       rotate: finalRotation,
//       transition: { duration: 6, ease: [0.15, 0.85, 0.15, 1] }
//     });

//     confetti({
//       particleCount: 100,
//       spread: 70,
//       origin: { y: 0.6 },
//       colors: ['#4f46e5', '#818cf8', '#fbbf24', '#f59e0b']
//     });

//     setWinner(winningParticipant);
//     setIsSpinning(false);
//   };

//   const confirmWinner = async () => {
//     if (!winner || !isAdmin) return;

//     const now = new Date();
//     const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
//       'July', 'August', 'September', 'October', 'November', 'December'];
//     const currentMonth = MONTHS[now.getMonth()];
//     const currentYear = now.getFullYear();

//     try {
//       // 1. App settings থেকে মাসিক চাঁদার পরিমাণ এবং profiles থেকে মোট সদস্য সংখ্যা আনা
//       const [settingsRes, profilesCountRes] = await Promise.all([
//         supabase.from('app_settings').select('monthly_amount').eq('id', 1).maybeSingle(),
//         supabase.from('profiles').select('id', { count: 'exact', head: true })
//       ]);

//       const monthlyAmount = settingsRes.data?.monthly_amount || 5000;
//       const totalMembers = profilesCountRes.count || participants.length; 
//       // মোট পুলের হিসাব (যেমন: ৫০০০ * মোট সদস্য সংখ্যা) যা আপনার 'মোট পুল'-এর সাথে একদম মিলে যাবে
//       const totalPool = monthlyAmount * totalMembers; 

//       const { error: fundError } = await supabase
//         .from('fund_entries')
//         .upsert({
//           user_id: winner.id,
//           year: currentYear,
//           month: currentMonth,
//           amount: totalPool,
//           is_winner: true,
//         }, { onConflict: 'user_id, year, month' });

//       if (fundError) throw fundError;

//       const { error: drawError } = await supabase
//         .from('draw_participants')
//         .update({ is_active: false })
//         .eq('id', winner.draw_id);

//       if (drawError) throw drawError;

//       alert(`${winner.full_name} কে বিজয়ী হিসেবে ঘোষণা করা হয়েছে এবং ফান্ড খাতায় ৳${totalPool.toLocaleString()} যোগ করা হয়েছে!`);
//       setWinner(null);
//       fetchParticipants();
//     } catch (error) {
//       console.error('Error updating winner:', error);
//       alert('বিজয়ী নিশ্চিত করা যায়নি। কনসোল চেক করুন।');
//     }
//   };
  
//   const renderWheel = () => {
//     if (participants.length === 0) {
//       return (
//         <div className="w-full h-full rounded-full border-4 border-slate-200 flex items-center justify-center bg-slate-50 text-slate-400">
//           No active participants
//         </div>
//       );
//     }

//     const radius = 50;
//     const center = 50;
    
//     return (
//       <svg viewBox="0 0 100 100" className="w-full h-full rounded-full overflow-hidden shadow-xl drop-shadow-2xl">
//         <motion.g animate={wheelControls} initial={{ rotate: 0 }} style={{ transformOrigin: '50px 50px' }}>
//           {participants.map((p, index) => {
//             const angle = 360 / participants.length;
//             const startAngle = index * angle;
//             const endAngle = (index + 1) * angle;
            
//             const startRad = (startAngle - 90) * (Math.PI / 180);
//             const endRad = (endAngle - 90) * (Math.PI / 180);
            
//             const x1 = center + radius * Math.cos(startRad);
//             const y1 = center + radius * Math.sin(startRad);
//             const x2 = center + radius * Math.cos(endRad);
//             const y2 = center + radius * Math.sin(endRad);
            
//             const largeArcFlag = angle > 180 ? 1 : 0;
//             const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4'];
//             const color = colors[index % colors.length];

//             const textAngle = startAngle + (angle / 2);
            
//             return (
//               <g key={p.id}>
//                 {participants.length === 1 ? (
//                   <circle cx="50" cy="50" r="50" fill={color} />
//                 ) : (
//                   <path
//                     d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
//                     fill={color}
//                     stroke="#ffffff"
//                     strokeWidth="0.5"
//                   />
//                 )}
//                 <text
//                   x="97"
//                   y="50"
//                   fill="white"
//                   fontSize="4"
//                   fontWeight="normal"
//                   textAnchor="end"
//                   dominantBaseline="central"
//                   alignmentBaseline="middle"
//                   transform={`rotate(${textAngle - 90}, 50, 50)`}
//                   className="drop-shadow-md select-none uppercase"
//                 >
//                   {p.full_name.length > 12 ? p.full_name.split(' ').slice(0, 2).join(' ') : p.full_name}
//                 </text>
//               </g>
//             );
//           })}
//         </motion.g>
//       </svg>
//     );
//   };

//   return (
//     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//       <div className="lg:col-span-2 flex flex-col items-center bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
//         <h2 className="text-2xl font-bold text-slate-900 mb-2">Bachelor Draw</h2>
//         <p className="text-slate-500 mb-8">এই {currentMonthName} মাসের বিজয়ী বেছে নিতে হুইল ঘোরান!</p>
        
//         <div className="relative w-80 h-80 md:w-96 md:h-96 mb-8">
//           <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[24px] border-t-slate-800 drop-shadow-md"></div>
          
//           {loading ? (
//             <div className="w-full h-full rounded-full border-4 border-slate-100 flex items-center justify-center">
//               <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
//             </div>
//           ) : (
//             renderWheel()
//           )}
//         </div>

//         {isAdmin && (
//           <button
//             onClick={spinWheel}
//             disabled={isSpinning || participants.length === 0}
//             className="px-8 py-3 bg-indigo-600 text-white text-lg font-bold rounded-full shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
//           >
//             <Sparkles className="w-5 h-5" />
//             {isSpinning ? 'Spinning...' : 'হুইল ঘুরান'}
//           </button>
//         )}
//         {!isAdmin && (
//           <div className="text-slate-500 italic bg-slate-50 px-4 py-2 rounded-lg text-sm">
//             {isSpinning ? 'হুইল ঘুরছে, অপেক্ষা করুন...' : 'অ্যাডমিন হুইল ঘোরানোর অপেক্ষায়...'}
//           </div>
//         )}
//       </div>

//       <div className="flex flex-col gap-6">
//         {/* Winner Card - Visible to all members, confirm button only for admin */}
//         {winner && (
//            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 shadow-sm">
//              <div className="flex items-center gap-3 mb-4 text-amber-700">
//                <Trophy className="w-6 h-6" />
//                <h3 className="text-lg font-bold">আমরা একজন বিজয়ী পেয়েছি!</h3>
//              </div>
//              <p className="text-slate-700 mb-6 font-medium uppercase">
//                {winner.full_name} এই রাউন্ডে জিতেছে। {isAdmin ? 'আপনি কি এই বিজয়ীকে নিশ্চিত করে পরবর্তী ড্র থেকে বাদ দিতে চান?' : ''}
//              </p>
//              {isAdmin && (
//                <button 
//                  onClick={confirmWinner}
//                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg transition-colors"
//                >
//                  বিজয়ী নিশ্চিত করুন
//                </button>
//              )}
//            </div>
//         )}

//         <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex-1">
//           <h3 className="font-bold text-slate-900 mb-4 flex justify-between items-center">
//             Active Pool
//             <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-sm">{participants.length} members</span>
//           </h3>
//           <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
//             {participants.map(p => (
//               <div key={p.id} className={`p-2 rounded-lg border text-sm flex items-center justify-between uppercase ${winner?.id === p.id ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold' : 'border-slate-100 bg-slate-50 text-slate-700'}`}>
//                 {p.full_name}
//                 {winner?.id === p.id && <Trophy className="w-4 h-4 text-amber-500" />}
//               </div>
//             ))}
//             {participants.length === 0 && (
//               <p className="text-slate-500 text-sm text-center py-4">সবাইকে ইতিমধ্যে ড্র করা হয়ে গেছে!</p>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

