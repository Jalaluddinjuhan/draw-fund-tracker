import { supabase } from '../lib/supabase';

export default function Auth() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) console.error('Error logging in:', error.message);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Bachelor Draw & Fund Tracker
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Sign in to access the system
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div>
            <button
              onClick={handleGoogleLogin}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign in with Google
            </button>
          </div>
          
          <div className="mt-6 text-left bg-slate-50 p-3 rounded-md text-xs text-slate-600 border border-slate-200">
            <p className="font-semibold text-slate-700 mb-1">লগইন করার নিয়ম:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>"Sign in with Google" ক্লিক করুন।</li>
              <li>আপনার গুগল অ্যাকাউন্ট সিলেক্ট করে অনুমতি দিন।</li>
              <li>লগইন সফল হলে স্বয়ংক্রিয়ভাবে ড্যাশবোর্ডে চলে যাবেন।</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
