'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import { Compass, PlusCircle, Layers, Lock, LogOut, ShieldCheck, Building2 } from 'lucide-react';

import whiteLogo from './White-Logo.png';
import Image from 'next/image';

export default function Navbar() {
  const pathname = usePathname();
  const { isAdmin, logout } = useAuth();

  // If inside ERP Portal or Hotel Voucher View, let the dedicated layout manage its own header
  if (pathname && (pathname.startsWith('/erp') || pathname.startsWith('/hotel-voucher'))) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-emerald-950/90 backdrop-blur-md border-b border-emerald-800/40 text-white no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href={isAdmin ? '/' : pathname} className="flex items-center gap-3 group">
            <Image 
              src={whiteLogo} 
              alt="NOOR E HARAM TRAVELS Logo" 
              className="h-10 w-auto object-contain drop-shadow" 
              priority
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-lg tracking-wide text-white group-hover:text-amber-300 transition-colors">
                  NOOR E HARAM TRAVELS
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-800/80 text-amber-300 border border-amber-400/20">
                  {isAdmin ? 'Admin Portal' : 'Official Voucher'}
                </span>
              </div>
              <p className="text-xs text-emerald-300/80 -mt-0.5 font-medium">
                Travel &amp; Tours • Umrah Package
              </p>
            </div>
          </Link>

          {/* Navigation Links - Conditional based on Admin */}
          <nav className="flex items-center gap-2 sm:gap-3">
            {isAdmin ? (
              <>
                <Link
                  href="/"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname === '/'
                      ? 'bg-emerald-800 text-white shadow-sm border border-emerald-700'
                      : 'text-emerald-200 hover:text-white hover:bg-emerald-900/60'
                  }`}
                >
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Vouchers</span>
                </Link>

                <Link
                  href="/erp"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all ${
                    pathname.startsWith('/erp')
                      ? 'bg-amber-400 text-emerald-950 shadow-md ring-1 ring-amber-300'
                      : 'text-amber-300 hover:text-white hover:bg-emerald-900/60 border border-amber-400/30'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>ERP Portal</span>
                </Link>

                <Link
                  href="/create"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all shadow-md ${
                    pathname === '/create'
                      ? 'bg-amber-400 text-emerald-950 ring-2 ring-amber-300'
                      : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-emerald-950'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                  <span className="hidden sm:inline">Create</span>
                </Link>

                <button
                  onClick={logout}
                  title="Log out of admin"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-300 hover:text-white hover:bg-red-900/50 border border-red-800/40 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 hover:text-white border border-emerald-700/50 transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Login</span>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
