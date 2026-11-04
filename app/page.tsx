'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (email === 'admin@school.com' && password === 'admin123') {
      router.push('/adminpages');
    } else if (email === 'teacher@school.com' && password === 'teacher123') {
      router.push('/teacherpages');
    } else if (email === 'parent@school.com' && password === 'parent123') {
      router.push('/parentpages');
    } else {
      setError('Invalid email or password. Please check the demo credentials.');
    }
  };

  const fillCredentials = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError('');
  };

  return (
    <main 
      className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center p-4 sm:p-6 antialiased selection:bg-orange-100 selection:text-[#ea580c]"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    >
      {/* Changed max-w-lg to max-w-md, and p-10 to p-8 */}
      <div className="bg-white border border-[#e5e5ea] p-6 sm:p-8 rounded-[32px] shadow-xl w-full max-w-md transition-all duration-300 relative overflow-hidden">
        
        {/* Decorative Background Accents */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#ea580c]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-100/50 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="text-center mb-6 flex flex-col items-center">
            
            {/* Title - scaled down from 4xl to 3xl */}
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1d1d1f] mb-1">
              Demo School
            </h1>
            <p className="text-[11px] sm:text-[12px] text-[#86868b] font-black uppercase tracking-[0.2em]">
              Secure Login Gateway
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input - reduced padding slightly (py-3 instead of py-3.5) */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-widest text-[#86868b] mb-1.5 pl-4">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., admin@school.com"
                className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[14px] text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:bg-white focus:border-[#ea580c] transition-all font-semibold"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-widest text-[#86868b] mb-1.5 pl-4">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[14px] text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:bg-white focus:border-[#ea580c] transition-all font-semibold"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-full text-red-600 text-[13px] font-black text-center shadow-sm animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-6 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-black text-[14px] rounded-full shadow-md hover:shadow-lg transition-all mt-2 uppercase tracking-widest"
            >
              Login to Portal
            </button>
          </form>

          {/* Helper text */}
          <div className="mt-6 pt-5 border-t border-[#e5e5ea]">
            <p className="text-[10px] text-[#ea580c] font-black mb-3 uppercase tracking-widest text-center">
              Click any demo account below to auto-fill
            </p>
            <ul className="text-[12px] text-[#6e6e73] space-y-2 font-semibold">
              <li 
                onClick={() => fillCredentials('admin@school.com', 'admin123')}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 bg-[#f5f5f7] hover:bg-[#fff2e8] border border-[#e5e5ea] hover:border-[#ea580c] rounded-2xl cursor-pointer transition-all shadow-sm group"
              >
                <span className="font-black text-[#1d1d1f] group-hover:text-[#ea580c]">Admin</span>
                <span className="font-mono text-[10px] sm:text-[11px] text-[#86868b]">admin@school.com / admin123</span>
              </li>
              <li 
                onClick={() => fillCredentials('teacher@school.com', 'teacher123')}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 bg-[#f5f5f7] hover:bg-[#fff2e8] border border-[#e5e5ea] hover:border-[#ea580c] rounded-2xl cursor-pointer transition-all shadow-sm group"
              >
                <span className="font-black text-[#1d1d1f] group-hover:text-[#ea580c]">Teacher</span>
                <span className="font-mono text-[10px] sm:text-[11px] text-[#86868b]">teacher@school.com / teacher123</span>
              </li>
              <li 
                onClick={() => fillCredentials('parent@school.com', 'parent123')}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 bg-[#f5f5f7] hover:bg-[#fff2e8] border border-[#e5e5ea] hover:border-[#ea580c] rounded-2xl cursor-pointer transition-all shadow-sm group"
              >
                <span className="font-black text-[#1d1d1f] group-hover:text-[#ea580c]">Parent</span>
                <span className="font-mono text-[10px] sm:text-[11px] text-[#86868b]">parent@school.com / parent123</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}