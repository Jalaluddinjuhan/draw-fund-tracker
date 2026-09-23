import { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Profile } from '../lib/supabase';
import { LogOut, Home, Users, DollarSign, Settings, Sparkles } from 'lucide-react';
import FundTracker from './FundTracker';
import WheelDraw from './WheelDraw';
import NoticeSender from './NoticeSender';

export default function Dashboard({ session, profile, onSignOut }: { session: Session, profile: Profile, onSignOut: () => void }) {
  const [activeTab, setActiveTab] = useState<'funds' | 'draw'>('funds');
  const isAdmin = profile.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-indigo-600">BachelorFund</span>
              </div>
              <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setActiveTab('funds')}
                  className={`${
                    activeTab === 'funds'
                      ? 'border-indigo-500 text-slate-900'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                >
                  <span className="mr-2 text-base font-bold leading-none">৳</span>
                  Fund Tracker
                </button>
                <button
                  onClick={() => setActiveTab('draw')}
                  className={`${
                    activeTab === 'draw'
                      ? 'border-indigo-500 text-slate-900'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Lottery Draw
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-600 hidden md:block">
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
          {activeTab === 'funds' ? (
            <FundTracker isAdmin={isAdmin} />
          ) : (
            <>
              <WheelDraw isAdmin={isAdmin} />
              {isAdmin && (
                <NoticeSender isAdmin={isAdmin} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}