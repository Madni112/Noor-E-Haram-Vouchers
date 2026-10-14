'use client';

import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Lock, KeyRound, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function AdminLoginForm({ onLoginSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = login(password);
    if (success) {
      setError(false);
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
        
        {/* Top Accent */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 p-8 text-white text-center relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 mb-3 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading">
            Admin Access Required
          </h2>
          <p className="text-emerald-200/80 text-xs mt-1">
            Restricted portal for Noor E Haram Travels staff
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Enter Admin Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                autoFocus
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>
            {error && (
              <p className="flex items-center gap-1 text-xs text-red-600 font-medium pt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Incorrect password. Please try again.</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-900 to-teal-800 hover:from-emerald-800 hover:to-teal-700 text-white font-bold text-sm shadow-md transition-all group"
          >
            <span>Unlock Admin Portal</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="pt-2 text-center">
            <p className="text-[11px] text-slate-400">
              Scanned voucher customers do not need to log in — public vouchers open directly from QR codes.
            </p>
          </div>
        </form>

      </div>
    </div>
  );
}
