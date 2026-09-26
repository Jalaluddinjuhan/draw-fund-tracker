import { useState, useEffect, useRef } from 'react';
import { supabase, Profile } from '../lib/supabase';
import confetti from 'canvas-confetti';
import { motion, useAnimation } from 'motion/react';
import { Sparkles, Trophy, Mic2 } from 'lucide-react';

type Participant = Profile & { draw_id: number; is_active: boolean };

export default function WheelDraw({ isAdmin }: { isAdmin: boolean }) {
  const currentMonthName = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'][new Date().getMonth()];
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);

  const wheelControls = useAnimation();
  const rotationRef = useRef(0);

  useEffect(() => {
    fetchParticipants();
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
          .in('id', userIds);

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
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonth = MONTHS[now.getMonth()];
    const currentYear = now.getFullYear();

    try {
      // 1. App settings theke monthly_amount ba total pool ber kore ana
      const { data: settingsRes } = await supabase
        .from('app_settings')
        .select('monthly_amount')
        .eq('id', 1)
        .maybeSingle();

      const monthlyAmount = settingsRes?.monthly_amount || 5000;
      const totalPool = monthlyAmount * participants.length;

      // 2. fund_entries e winner-er amount-ke totalPool amount-e update ba insert kora
      const { error: fundError } = await supabase
        .from('fund_entries')
        .upsert({
          user_id: winner.id,
          year: currentYear,
          month: currentMonth,
          amount: totalPool, // Ekhon theke auto total pool (jemon 80000) bosbe
          is_winner: true,
        }, { onConflict: 'user_id, year, month' });

      if (fundError) throw fundError;

      // 3. draw_participants e is_active false kora jate wheel theke nam bad pore jay
      const { error: drawError } = await supabase
        .from('draw_participants')
        .update({ is_active: false })
        .eq('id', winner.draw_id);

      if (drawError) throw drawError;

      alert(`${winner.full_name} কে বিজয়ী হিসেবে ঘোষণা করা হয়েছে এবং ফান্ড খাতায় ৳${totalPool.toLocaleString()} যোগ করা হয়েছে!`);
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
                {/* Lomalombi/Vertical Text Styling */}
                <text
                  x="88"
                  y="50"
                  fill="white"
                  fontSize="4"
                  fontWeight="bold"
                  textAnchor="end"
                  dominantBaseline="central"
                  alignmentBaseline="middle"
                  transform={`rotate(${textAngle - 90}, 50, 50)`}
                  className="drop-shadow-md select-none"
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
      {/* Left Column: Wheel */}
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
            অ্যাডমিন হুইল ঘোরানোর অপেক্ষায়...
          </div>
        )}
      </div>

      {/* Right Column: Winner Card & Long Participant List */}
      <div className="flex flex-col gap-6">

        {winner && isAdmin && (
           <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 shadow-sm">
             <div className="flex items-center gap-3 mb-4 text-amber-700">
               <Trophy className="w-6 h-6" />
               <h3 className="text-lg font-bold">আমরা একজন বিজয়ী পেয়েছি!</h3>
             </div>
             <p className="text-slate-700 mb-6 font-medium">
               {winner.full_name} এই রাউন্ডে জিতেছে। আপনি কি এই বিজয়ীকে নিশ্চিত করে পরবর্তী ড্র থেকে বাদ দিতে চান?
             </p>
             <button 
               onClick={confirmWinner}
               className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg transition-colors"
             >
               বিজয়ী নিশ্চিত করুন
             </button>
           </div>
        )}

        {/* Participant List (Height increased to max-h-[500px]) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex-1">
          <h3 className="font-bold text-slate-900 mb-4 flex justify-between items-center">
            Active Pool
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-sm">{participants.length} members</span>
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {participants.map(p => (
              <div key={p.id} className={`p-2 rounded-lg border text-sm flex items-center justify-between ${winner?.id === p.id ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold' : 'border-slate-100 bg-slate-50 text-slate-700'}`}>
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
    </div>
  );
}