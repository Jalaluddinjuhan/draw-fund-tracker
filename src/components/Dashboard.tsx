import { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Profile } from '../lib/supabase';
import { LogOut, Sparkles, Users, Home } from 'lucide-react';
import FundTracker from './FundTracker';
import WheelDraw from './WheelDraw';
import NoticeSender from './NoticeSender';
import Constitution from './Constitution';
import MutualFundTracker from './MutualFundTracker';
import OverviewNotice from './OverviewNotice';

export default function Dashboard({ session, profile, onSignOut }: { session: Session, profile: Profile, onSignOut: () => void }) {
  const isAdmin = profile.role === 'admin';
  const memberType = profile.member_type; // 'draw' ba 'mutual' (অথবা admin সবার জন্যই সব দেখতে পারবে)

  // ডিফল্ট ট্যাব ইউজার টাইপ অনুযায়ী সেট করা
  const [activeTab, setActiveTab] = useState<string>(
    isAdmin || memberType === 'draw' ? 'overview' : 'mutual'
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-3 sm:h-16 gap-3">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <span className="text-xl font-bold text-indigo-600">BachelorFund</span>
              <div className="flex items-center gap-2 sm:hidden">
                <div className="text-xs text-slate-600">
                  <span className="font-semibold">{profile.full_name}</span>
                </div>
                <button
                  onClick={onSignOut}
                  className="p-1.5 border border-transparent text-xs font-medium rounded-md text-slate-500 hover:text-slate-700"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Navigation Tabs (Conditional based on member_type or admin) */}
            <div className="flex items-center space-x-4 sm:space-x-8 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {/* Overview সবার জন্য কমন */}
              <button
                onClick={() => setActiveTab('overview')}
                className={`${
                  activeTab === 'overview'
                    ? 'border-indigo-500 text-slate-900'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
              >
                <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Overview
              </button>

              {/* Draw Member বা Admin দের জন্য Fund Tracker & Lottery Draw */}
              {(isAdmin || memberType === 'draw') && (
                <>
                  <button
                    onClick={() => setActiveTab('funds')}
                    className={`${
                      activeTab === 'funds'
                        ? 'border-indigo-500 text-slate-900'
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
                  >
                    <span className="mr-1.5 text-base font-bold leading-none">৳</span>
                    Fund Tracker
                  </button>

                  <button
                    onClick={() => setActiveTab('draw')}
                    className={`${
                      activeTab === 'draw'
                        ? 'border-indigo-500 text-slate-900'
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
                  >
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Lottery Draw
                  </button>
                </>
              )}

              {/* Mutual Member বা Admin দের জন্য Mutual Fund & Constitution */}
              {(isAdmin || memberType === 'mutual') && (
                <>
                  <button
                    onClick={() => setActiveTab('mutual')}
                    className={`${
                      activeTab === 'mutual'
                        ? 'border-indigo-500 text-slate-900'
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
                  >
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Mutual Fund
                  </button>

                  <button
                    onClick={() => setActiveTab('constitution')}
                    className={`${
                      activeTab === 'constitution'
                        ? 'border-indigo-500 text-slate-900'
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
                  >
                    <span className="mr-1.5 text-base leading-none">📜</span>
                    Mutual Fund Constitution
                  </button>
                </>
              )}
            </div>

            {/* Desktop User Info & Sign Out */}
            <div className="hidden sm:flex items-center gap-4">
              <div className="text-sm text-slate-600">
                Welcome, <span className="font-semibold">{profile.full_name}</span> 
                {isAdmin && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">Admin</span>}
              </div>
              <button
                onClick={onSignOut}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-slate-500 hover:text-slate-700 focus:outline-none transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-4 sm:px-0">
          {activeTab === 'overview' ? (
            <OverviewNotice isAdmin={isAdmin} />
          ) : activeTab === 'funds' && (isAdmin || memberType === 'draw') ? (
            <FundTracker isAdmin={isAdmin} />
          ) : activeTab === 'mutual' && (isAdmin || memberType === 'mutual') ? (
            <MutualFundTracker isAdmin={isAdmin} />
          ) : activeTab === 'draw' && (isAdmin || memberType === 'draw') ? (
            <>
              <WheelDraw isAdmin={isAdmin} />
              {isAdmin && <NoticeSender isAdmin={isAdmin} />}
            </>
          ) : activeTab === 'constitution' && (isAdmin || memberType === 'mutual') ? (
            <Constitution />
          ) : (
            <div className="text-center py-12 text-slate-500">আপনার এই পেজটি দেখার অনুমতি নেই।</div>
          )}
        </div>
      </main>
    </div>
  );
}

// import { useState } from 'react';
// import { Session } from '@supabase/supabase-js';
// import { Profile } from '../lib/supabase';
// import { LogOut, Sparkles, Users, Home } from 'lucide-react';
// import FundTracker from './FundTracker';
// import WheelDraw from './WheelDraw';
// import NoticeSender from './NoticeSender';
// import Constitution from './Constitution';
// import MutualFundTracker from './MutualFundTracker';
// import OverviewNotice from './OverviewNotice';

// export default function Dashboard({ session, profile, onSignOut }: { session: Session, profile: Profile, onSignOut: () => void }) {
//   const [activeTab, setActiveTab] = useState<'overview' | 'funds' | 'mutual' | 'draw' | 'constitution'>('overview');
//   const isAdmin = profile.role === 'admin';

//   return (
//     <div className="min-h-screen bg-slate-100 font-sans">
//       {/* Navigation */}
//       <nav className="bg-white border-b border-slate-200">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex flex-col sm:flex-row justify-between items-center py-3 sm:h-16 gap-3">
//             <div className="flex items-center justify-between w-full sm:w-auto">
//               <span className="text-xl font-bold text-indigo-600">BachelorFund</span>
//               <div className="flex items-center gap-2 sm:hidden">
//                 <div className="text-xs text-slate-600">
//                   <span className="font-semibold">{profile.full_name}</span>
//                 </div>
//                 <button
//                   onClick={onSignOut}
//                   className="p-1.5 border border-transparent text-xs font-medium rounded-md text-slate-500 hover:text-slate-700"
//                 >
//                   Sign Out
//                 </button>
//               </div>
//             </div>

//             {/* Navigation Tabs */}
//             <div className="flex items-center space-x-4 sm:space-x-8 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
//               {/* Overview Tab */}
//               <button
//                 onClick={() => setActiveTab('overview')}
//                 className={`${
//                   activeTab === 'overview'
//                     ? 'border-indigo-500 text-slate-900'
//                     : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
//                 } inline-flex items-center px-1 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
//               >
//                 <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
//                 Overview
//               </button>

//               <button
//                 onClick={() => setActiveTab('funds')}
//                 className={`${
//                   activeTab === 'funds'
//                     ? 'border-indigo-500 text-slate-900'
//                     : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
//                 } inline-flex items-center px-1 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
//               >
//                 <span className="mr-1.5 text-base font-bold leading-none">৳</span>
//                 Fund Tracker
//               </button>

//               <button
//                 onClick={() => setActiveTab('mutual')}
//                 className={`${
//                   activeTab === 'mutual'
//                     ? 'border-indigo-500 text-slate-900'
//                     : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
//                 } inline-flex items-center px-1 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
//               >
//                 <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
//                 Mutual Fund
//               </button>

//               <button
//                 onClick={() => setActiveTab('draw')}
//                 className={`${
//                   activeTab === 'draw'
//                     ? 'border-indigo-500 text-slate-900'
//                     : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
//                 } inline-flex items-center px-1 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
//               >
//                 <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
//                 Lottery Draw
//               </button>
              
//               <button
//                 onClick={() => setActiveTab('constitution')}
//                 className={`${
//                   activeTab === 'constitution'
//                     ? 'border-indigo-500 text-slate-900'
//                     : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
//                 } inline-flex items-center px-1 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
//               >
//                 <span className="mr-1.5 text-base leading-none">📜</span>
//                 Mutual Fund Constitution
//               </button>
//             </div>

//             {/* Desktop User Info & Sign Out */}
//             <div className="hidden sm:flex items-center gap-4">
//               <div className="text-sm text-slate-600">
//                 Welcome, <span className="font-semibold">{profile.full_name}</span> 
//                 {isAdmin && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">Admin</span>}
//               </div>
//               <button
//                 onClick={onSignOut}
//                 className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-slate-500 hover:text-slate-700 focus:outline-none transition-colors"
//               >
//                 <LogOut className="w-4 h-4 mr-2" />
//                 Sign Out
//               </button>
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* Main Content */}
//       <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
//         <div className="px-4 py-4 sm:px-0">
//           {activeTab === 'overview' ? (
//             <OverviewNotice isAdmin={isAdmin} />
//           ) : activeTab === 'funds' ? (
//             <FundTracker isAdmin={isAdmin} />
//           ) : activeTab === 'mutual' ? (
//             <MutualFundTracker isAdmin={isAdmin} />
//           ) : activeTab === 'draw' ? (
//             <>
//               <WheelDraw isAdmin={isAdmin} />
//               {isAdmin && (
//                 <NoticeSender isAdmin={isAdmin} />
//               )}
//             </>
//           ) : (
//             <Constitution />
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }

// import { useState } from 'react';
// import { Session } from '@supabase/supabase-js';
// import { Profile } from '../lib/supabase';
// import { LogOut, Sparkles, Users } from 'lucide-react';
// import FundTracker from './FundTracker';
// import WheelDraw from './WheelDraw';
// import NoticeSender from './NoticeSender';
// import Constitution from './Constitution';
// import MutualFundTracker from './MutualFundTracker'; // Import kora holo

// export default function Dashboard({ session, profile, onSignOut }: { session: Session, profile: Profile, onSignOut: () => void }) {
//   const [activeTab, setActiveTab] = useState<'overview' | 'funds' | 'mutual' | 'draw' | 'constitution'>('overview');
//   const isAdmin = profile.role === 'admin';

//   return (
//     <div className="min-h-screen bg-slate-100 font-sans">
//       {/* Navigation */}
//       <nav className="bg-white border-b border-slate-200">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex flex-col sm:flex-row justify-between items-center py-3 sm:h-16 gap-3">
//             <div className="flex items-center justify-between w-full sm:w-auto">
//               <span className="text-xl font-bold text-indigo-600">BachelorFund</span>
//               <div className="flex items-center gap-2 sm:hidden">
//                 <div className="text-xs text-slate-600">
//                   <span className="font-semibold">{profile.full_name}</span>
//                 </div>
//                 <button
//                   onClick={onSignOut}
//                   className="p-1.5 border border-transparent text-xs font-medium rounded-md text-slate-500 hover:text-slate-700"
//                 >
//                   Sign Out
//                 </button>
//               </div>
//             </div>

//             {/* Navigation Tabs */}
//             <div className="flex items-center space-x-4 sm:space-x-8 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
//               <button
//                 onClick={() => setActiveTab('funds')}
//                 className={`${
//                   activeTab === 'funds'
//                     ? 'border-indigo-500 text-slate-900'
//                     : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
//                 } inline-flex items-center px-1 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
//               >
//                 <span className="mr-1.5 text-base font-bold leading-none">৳</span>
//                 Fund Tracker
//               </button>

//               {/* Mutual Fund Tab */}
//               <button
//                 onClick={() => setActiveTab('mutual')}
//                 className={`${
//                   activeTab === 'mutual'
//                     ? 'border-indigo-500 text-slate-900'
//                     : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
//                 } inline-flex items-center px-1 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
//               >
//                 <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
//                 Mutual Fund
//               </button>

//               <button
//                 onClick={() => setActiveTab('draw')}
//                 className={`${
//                   activeTab === 'draw'
//                     ? 'border-indigo-500 text-slate-900'
//                     : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
//                 } inline-flex items-center px-1 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
//               >
//                 <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
//                 Lottery Draw
//               </button>
//               <button
//                 onClick={() => setActiveTab('constitution')}
//                 className={`${
//                   activeTab === 'constitution'
//                     ? 'border-indigo-500 text-slate-900'
//                     : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
//                 } inline-flex items-center px-1 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
//               >
//                 <span className="mr-1.5 text-base leading-none">📜</span>
//                 Mutual Fund Constitution
//               </button>
//             </div>

//             {/* Desktop User Info & Sign Out */}
//             <div className="hidden sm:flex items-center gap-4">
//               <div className="text-sm text-slate-600">
//                 Welcome, <span className="font-semibold">{profile.full_name}</span> 
//                 {isAdmin && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">Admin</span>}
//               </div>
//               <button
//                 onClick={onSignOut}
//                 className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-slate-500 hover:text-slate-700 focus:outline-none transition-colors"
//               >
//                 <LogOut className="w-4 h-4 mr-2" />
//                 Sign Out
//               </button>
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* Main Content */}
//       <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
//         <div className="px-4 py-4 sm:px-0">
//           {activeTab === 'funds' ? (
//             <FundTracker isAdmin={isAdmin} />
//           ) : activeTab === 'mutual' ? (
//             <MutualFundTracker isAdmin={isAdmin} />
//           ) : activeTab === 'draw' ? (
//             <>
//               <WheelDraw isAdmin={isAdmin} />
//               {isAdmin && (
//                 <NoticeSender isAdmin={isAdmin} />
//               )}
//             </>
//           ) : (
//             <Constitution />
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }

// import { useState } from 'react';
// import { Session } from '@supabase/supabase-js';
// import { Profile } from '../lib/supabase';
// import { LogOut, Sparkles } from 'lucide-react';
// import FundTracker from './FundTracker';
// import WheelDraw from './WheelDraw';
// import NoticeSender from './NoticeSender';
// import Constitution from './Constitution';

// export default function Dashboard({ session, profile, onSignOut }: { session: Session, profile: Profile, onSignOut: () => void }) {
//   const [activeTab, setActiveTab] = useState<'funds' | 'draw' | 'constitution'>('funds');
//   const isAdmin = profile.role === 'admin';

//   return (
//     <div className="min-h-screen bg-slate-100 font-sans">
//       {/* Navigation */}
//       <nav className="bg-white border-b border-slate-200">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex flex-col sm:flex-row justify-between items-center py-3 sm:h-16 gap-3">
//             <div className="flex items-center justify-between w-full sm:w-auto">
//               <span className="text-xl font-bold text-indigo-600">BachelorFund</span>
//               <div className="flex items-center gap-2 sm:hidden">
//                 <div className="text-xs text-slate-600">
//                   <span className="font-semibold">{profile.full_name}</span>
//                 </div>
//                 <button
//                   onClick={onSignOut}
//                   className="p-1.5 border border-transparent text-xs font-medium rounded-md text-slate-500 hover:text-slate-700"
//                 >
//                   Sign Out
//                 </button>
//               </div>
//             </div>

//             {/* Navigation Tabs - Mobile & Desktop Responsive */}
//             <div className="flex items-center space-x-4 sm:space-x-8 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
//               <button
//                 onClick={() => setActiveTab('funds')}
//                 className={`${
//                   activeTab === 'funds'
//                     ? 'border-indigo-500 text-slate-900'
//                     : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
//                 } inline-flex items-center px-1 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
//               >
//                 <span className="mr-1.5 text-base font-bold leading-none">৳</span>
//                 Fund Tracker
//               </button>
//               <button
//                 onClick={() => setActiveTab('draw')}
//                 className={`${
//                   activeTab === 'draw'
//                     ? 'border-indigo-500 text-slate-900'
//                     : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
//                 } inline-flex items-center px-1 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
//               >
//                 <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
//                 Lottery Draw
//               </button>
//               <button
//                 onClick={() => setActiveTab('constitution')}
//                 className={`${
//                   activeTab === 'constitution'
//                     ? 'border-indigo-500 text-slate-900'
//                     : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
//                 } inline-flex items-center px-1 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
//               >
//                 <span className="mr-1.5 text-base leading-none">📜</span>
//                 Mutual Fund Constitution
//               </button>
//             </div>

//             {/* Desktop User Info & Sign Out */}
//             <div className="hidden sm:flex items-center gap-4">
//               <div className="text-sm text-slate-600">
//                 Welcome, <span className="font-semibold">{profile.full_name}</span> 
//                 {isAdmin && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">Admin</span>}
//               </div>
//               <button
//                 onClick={onSignOut}
//                 className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-slate-500 hover:text-slate-700 focus:outline-none transition-colors"
//               >
//                 <LogOut className="w-4 h-4 mr-2" />
//                 Sign Out
//               </button>
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* Main Content */}
//       <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
//         <div className="px-4 py-4 sm:px-0">
//           {activeTab === 'funds' ? (
//             <FundTracker isAdmin={isAdmin} />
//           ) : activeTab === 'draw' ? (
//             <>
//               <WheelDraw isAdmin={isAdmin} />
//               {isAdmin && (
//                 <NoticeSender isAdmin={isAdmin} />
//               )}
//             </>
//           ) : (
//             <Constitution />
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }