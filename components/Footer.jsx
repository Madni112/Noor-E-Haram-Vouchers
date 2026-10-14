'use client';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  // Hide global website footer on ERP Portal and hotel-voucher for dedicated view experience
  if (pathname && (pathname.startsWith('/erp') || pathname.startsWith('/hotel-voucher'))) {
    return null;
  }

  return (
    <footer className="bg-emerald-950 text-emerald-300/80 py-6 border-t border-emerald-900 text-xs text-center no-print">
      <div className="max-w-7xl mx-auto px-4 space-y-1">
        <p className="font-semibold text-emerald-100">NOOR E HARAM TRAVELS • UMRAH VOUCHER MANAGEMENT SYSTEM</p>
        <p className="text-emerald-400/60">MUHAMMAD FAIZAN 0311-2324764 | G.MURTAZA (HAJI) 0312-3608683</p>
      </div>
    </footer>
  );
}
