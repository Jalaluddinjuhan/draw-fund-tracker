import { useState, useEffect } from 'react';
import { supabase, Profile, FundEntry } from '../lib/supabase';
import { Check } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const BN_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export default function FundTracker({ isAdmin }: { isAdmin: boolean }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [funds, setFunds] = useState<FundEntry[]>([]);
  const [drawStatus, setDrawStatus] = useState<Record<string, boolean>>({}); // user_id -> is_active
  const [loading, setLoading] = useState(true);

  // total amount show 
  const [monthlyAmount, setMonthlyAmount] = useState(5000);
  const [editingAmount, setEditingAmount] = useState(false);
  const [amountInput, setAmountInput] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
       const [profilesRes, fundsRes, drawRes, settingsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('full_name'),
        supabase.from('fund_entries').select('*').eq('year', selectedYear).eq('month', selectedMonth),
        supabase.from('draw_participants').select('user_id, is_active'),
        supabase.from('app_settings').select('monthly_amount').eq('id', 1).maybeSingle()
      ]);

      if (profilesRes.data) setProfiles(profilesRes.data);
      if (fundsRes.data) setFunds(fundsRes.data);
      if (settingsRes.data) setMonthlyAmount(settingsRes.data.monthly_amount);
      if (drawRes.data) {
        const map: Record<string, boolean> = {};
        drawRes.data.forEach(d => { map[d.user_id] = d.is_active; });
        setDrawStatus(map);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFundForUser = (userId: string) => funds.find(f => f.user_id === userId);
  const hasAlreadyWon = (userId: string) => drawStatus[userId] === false;

  // --- সামারি ক্যালকুলেশন ---
  const totalMembers = profiles.length;
  const totalPool = monthlyAmount * totalMembers;
  const collectedAmount = funds.reduce((sum, f) => sum + (f.amount || 0), 0);
  const paidCount = funds.filter(f => (f.amount || 0) > 0).length;
  const winnersCount = Object.values(drawStatus).filter(v => v === false).length;

  // --- পরবর্তী ড্র তারিখ ক্যালকুলেশন (আজকের আসল তারিখ অনুযায়ী, ফিল্টারের উপর নির্ভর না) ---
  const today = new Date();
  const DRAW_DAY = 11;
  let nextDrawMonth = today.getMonth();
  let nextDrawYear = today.getFullYear();
  if (today.getDate() > DRAW_DAY) {
    nextDrawMonth += 1;
    if (nextDrawMonth > 11) {
      nextDrawMonth = 0;
      nextDrawYear += 1;
    }
  }

  const saveMonthlyAmount = async () => {
    if (!isAdmin) return;
    const newAmount = parseFloat(amountInput);
    if (isNaN(newAmount) || newAmount <= 0) return;
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ monthly_amount: newAmount })
        .eq('id', 1);
      if (error) throw error;
      setMonthlyAmount(newAmount);
      setEditingAmount(false);
    } catch (error) {
      console.error('Error updating monthly amount:', error);
      alert('মাসিক অ্যামাউন্ট আপডেট করা যায়নি।');
    }
  };
  
  const nextDrawMonthName = BN_MONTHS[nextDrawMonth];

  const togglePaid = async (userId: string, currentAmount: number) => {
    if (!isAdmin) return;
    try {
      const existing = getFundForUser(userId);
      const newAmount = currentAmount > 0 ? 0 : monthlyAmount;

      const { error } = await supabase.from('fund_entries').upsert({
        id: existing?.id,
        user_id: userId,
        year: selectedYear,
        month: selectedMonth,
        amount: newAmount,
        is_winner: existing?.is_winner || false
      }, { onConflict: 'user_id, year, month' });

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error toggling paid status:', error);
      alert('পেমেন্ট স্ট্যাটাস আপডেট করা যায়নি।');
    }
  };

  const toggleWinner = async (userId: string, currentWinner: boolean) => {
    if (!isAdmin) return;
    try {
      const existing = getFundForUser(userId);
      if (!existing && currentWinner) return;

      const { error } = await supabase.from('fund_entries').upsert({
        id: existing?.id,
        user_id: userId,
        year: selectedYear,
        month: selectedMonth,
        amount: existing?.amount || 0,
        is_winner: !currentWinner
      }, { onConflict: 'user_id, year, month' });

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error toggling winner:', error);
      alert('Failed to update winner status. Ensure there is only one winner per month.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-medium leading-6 text-slate-900">তহবিল খাতা</h3>
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="block w-auto min-w-[150px] flex-shrink-0 pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {[new Date().getFullYear(), new Date().getFullYear() - 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* সামারি বার */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-200 border-b border-slate-200">
 <div className="bg-white px-6 py-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">মোট পুল</p>
          {editingAmount ? (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm">৳</span>
              <input
                type="number"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-20 px-1 py-0.5 border rounded text-sm"
                autoFocus
              />
              <button onClick={saveMonthlyAmount} className="text-emerald-600 text-xs font-semibold px-1">✓</button>
              <button onClick={() => setEditingAmount(false)} className="text-slate-400 text-xs font-semibold px-1">✕</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-slate-900">৳{totalPool.toLocaleString()}</p>
              {isAdmin && (
                <button
                  onClick={() => { setEditingAmount(true); setAmountInput(monthlyAmount.toString()); }}
                  className="text-indigo-500 hover:text-indigo-700 text-xs"
                  title="মাসিক অ্যামাউন্ট বদলান"
                >
                  ✏️
                </button>
              )}
            </div>
          )}
          <p className="text-[11px] text-slate-400 mt-0.5">প্রতি সদস্য: ৳{monthlyAmount.toLocaleString()}/মাস</p>
        </div>
        <div className="bg-white px-6 py-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">জমা হয়েছে</p>
          <p className="text-lg font-bold text-emerald-600">৳{collectedAmount.toLocaleString()} <span className="text-sm text-slate-400 font-normal">({paidCount}/{totalMembers} জন)</span></p>
        </div>
        <div className="bg-white px-6 py-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">পরবর্তী ড্র</p>
          <p className="text-lg font-bold text-indigo-600">১১ {nextDrawMonthName}, {nextDrawYear}</p>
        </div>
        <div className="bg-white px-6 py-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">রাউন্ড অগ্রগতি</p>
          <p className="text-lg font-bold text-amber-600">{winnersCount} / {totalMembers} জন জিতেছে</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-150">
            <tr>
              <th scope="col" className="px-6 py-3.5 text-left text-base font-bold text-slate-700 uppercase tracking-wider">সদস্যের নাম ও মোবাইল নাম্বার</th>
              <th scope="col" className="px-6 py-3.5 text-left text-base font-bold text-slate-700 uppercase tracking-wider">পরিশোধিত টাকার পরিমাণ</th>
              <th scope="col" className="px-6 py-3.5 text-center text-base font-bold text-slate-700 uppercase tracking-wider">বিজয়ী কিনা?</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-500">Loading records...</td></tr>
            ) : profiles.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-500">No members found.</td></tr>
            ) : (
              profiles.map(profile => {
                const fund = getFundForUser(profile.id);

                return (
                  <tr key={profile.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">নামঃ {profile.full_name}</span>
                        <span className="text-sm text-slate-500">মোবাইল নাম্বারঃ {profile.phone_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isAdmin ? (
                        <button
                          onClick={() => togglePaid(profile.id, fund?.amount || 0)}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                            fund?.amount
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {fund?.amount ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span className="text-lg">৳</span>{fund.amount.toLocaleString()} পরিশোধিত
                            </>
                          ) : (
                            'বাকি আছে'
                          )}
                        </button>
                      ) : (
                        <span className={`text-sm font-semibold ${fund?.amount ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {fund?.amount ? (
                            <><span className="text-lg mr-0.5">৳</span>{fund.amount.toLocaleString()}</>
                          ) : 'বাকি আছে'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {hasAlreadyWon(profile.id) ? (
                        <span
                          title={`এই মেম্বার আগের একটি ড্র জিতে ৳${totalPool.toLocaleString()} পেয়েছে`}
                          className="inline-flex items-center justify-center w-6 h-6 rounded border bg-amber-100 border-amber-300 text-amber-600"
                        >
                          <Check className="w-4 h-4" />
                        </span>
                      ) : isAdmin ? (
                        <button
                          onClick={() => toggleWinner(profile.id, fund?.is_winner || false)}
                          className={`inline-flex items-center justify-center w-6 h-6 rounded border ${
                            fund?.is_winner
                              ? 'bg-amber-100 border-amber-300 text-amber-600'
                              : 'bg-white border-slate-300 text-transparent hover:border-indigo-300'
                          }`}
                          title="Mark as Winner"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      ) : (
                        fund?.is_winner && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            🏆 বিজয়ী — ৳{totalPool.toLocaleString()}
                          </span>
                        )
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}