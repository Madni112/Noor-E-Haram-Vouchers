'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { initialVouchers, getAllVouchers, fetchSupabaseVouchers } from '../lib/vouchersData';
import { useAuth } from '../lib/AuthContext';
import AdminLoginForm from '../components/AdminLoginForm';
import { 
  Search, 
  PlusCircle, 
  Users, 
  Building2, 
  Calendar, 
  QrCode, 
  ExternalLink, 
  Printer, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Compass, 
  PhoneCall, 
  Layers,
  Edit3
} from 'lucide-react';

export default function HomePage() {
  const { isAdmin, isLoaded } = useAuth();
  const [vouchers, setVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(true);
  const [search, setSearch] = useState('');
  const [origin, setOrigin] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      fetchSupabaseVouchers().then((liveList) => {
        setVouchers(liveList || []);
        setLoadingVouchers(false);
      });
    }
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not logged in as admin, require login to see all vouchers
  if (!isAdmin) {
    return <AdminLoginForm />;
  }

  const filtered = vouchers.filter((v) => {
    const q = search.toLowerCase();
    return (
      (v.party || '').toLowerCase().includes(q) ||
      (v.sheetName || '').toLowerCase().includes(q) ||
      (v.ubNumber || '').toLowerCase().includes(q) ||
      (v.voucherRefNo || '').toLowerCase().includes(q) ||
      (v.id || '').toString().includes(q) ||
      (v.passengers || []).some((p) => (p.name || '').toLowerCase().includes(q) || (p.passportNo || '').toLowerCase().includes(q)) ||
      (v.accommodations || []).some((a) => (a.hotelName || '').toLowerCase().includes(q) || (a.city || '').toLowerCase().includes(q))
    );
  });

  const handleCopyLink = (v, e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${origin}/voucher/${v.slug || v.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(v.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white pt-12 pb-16 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 text-amber-300 text-xs font-semibold border border-amber-400/20 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Noor E Haram Travel & Tours Portal</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading tracking-tight text-white">
                Umrah Package Vouchers &amp; QR Verification
              </h1>
              <p className="text-emerald-200/90 text-sm sm:text-base leading-relaxed">
                Complete digitised Umrah vouchers for <strong>Noor E Haram Travel & Tours</strong>. Each voucher is linked with dynamic live QR codes for instant mobile viewing and print handover.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/erp"
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-emerald-950 font-black text-sm shadow-lg hover:shadow-amber-500/25 transition-all"
              >
                <Building2 className="w-5 h-5 stroke-[2.2]" />
                <span>Launch ERP Portal</span>
              </Link>

              <Link
                href="/create"
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-800/90 hover:bg-emerald-700 text-white font-bold text-sm border border-emerald-600/50 shadow transition-all"
              >
                <PlusCircle className="w-5 h-5 stroke-[2.2]" />
                <span>New Voucher</span>
              </Link>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-emerald-800/60">
            <div className="bg-emerald-900/50 backdrop-blur-sm rounded-xl p-3.5 border border-emerald-700/40">
              <div className="text-2xl font-bold font-heading text-amber-300">{vouchers.length}</div>
              <div className="text-xs text-emerald-200/70 font-medium">Total Vouchers</div>
            </div>
            <div className="bg-emerald-900/50 backdrop-blur-sm rounded-xl p-3.5 border border-emerald-700/40">
              <div className="text-2xl font-bold font-heading text-white">
                {vouchers.reduce((acc, v) => acc + (parseInt(v.totalPax) || v.passengers?.length || 1), 0)}
              </div>
              <div className="text-xs text-emerald-200/70 font-medium">Total Passengers</div>
            </div>
            <div className="bg-emerald-900/50 backdrop-blur-sm rounded-xl p-3.5 border border-emerald-700/40">
              <div className="text-2xl font-bold font-heading text-white">100%</div>
              <div className="text-xs text-emerald-200/70 font-medium">QR Redirect Ready</div>
            </div>
            <div className="bg-emerald-900/50 backdrop-blur-sm rounded-xl p-3.5 border border-emerald-700/40">
              <div className="text-2xl font-bold font-heading text-white">24/7</div>
              <div className="text-xs text-emerald-200/70 font-medium">KSA Emergency Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Party Name, Passport #, Hotel or Route..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 w-full sm:w-auto justify-between sm:justify-end">
            <span>Showing <strong>{filtered.length}</strong> of {vouchers.length} vouchers</span>
          </div>
        </div>

        {/* Voucher Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((voucher) => {
            const voucherUrl = `${origin}/voucher/${voucher.slug || voucher.id}`;
            const isCopied = copiedId === voucher.id;
            const ubBadge = voucher.ubNumber || voucher.voucherRefNo || `UB-${String(parseInt(voucher.id || 1) || 1).padStart(4, '0')}`;

            return (
              <div
                key={voucher.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Header */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/80">
                          {ubBadge}
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider truncate max-w-[140px]">
                          NOOR E HARAM
                        </span>
                      </div>
                      <h3 className="font-heading font-bold text-slate-900 text-base sm:text-lg group-hover:text-emerald-800 transition-colors mt-1 uppercase truncate max-w-[200px]">
                        {(voucher.party || '').replace(/(\s*\/\s*(MR|MRS|MS|MISS|CHD|INF|MSTR|MASTER|CHILD|INFANT|LADY|GENT))+\s*$/gi, '').replace(/\s*\(8\)$/i, '').trim().toUpperCase()}
                      </h3>
                    </div>

                    {/* Mini QR Code Preview */}
                    <Link
                      href={`/voucher/${voucher.slug || voucher.id}`}
                      className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl group-hover:border-amber-400 group-hover:bg-amber-50/50 transition-colors shadow-sm flex-shrink-0"
                      title="Click to open voucher and scan"
                    >
                      <QRCodeSVG value={voucherUrl} size={50} level="M" />
                    </Link>
                  </div>

                  {/* PAX & Hotels summary */}
                  <div className="space-y-2 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between font-medium">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Passengers:</span>
                      </span>
                      <span className="font-bold text-slate-900">
                        {voucher.totalPax || voucher.passengers?.length || 1} PAX
                      </span>
                    </div>

                    {voucher.accommodations && voucher.accommodations.length > 0 && (
                      <div className="flex items-start gap-1.5 pt-1 border-t border-slate-200/60 text-[11px]">
                        <Building2 className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span className="truncate text-slate-600">
                          {voucher.accommodations.map((a) => a.hotelName).filter(Boolean).join(' • ') || 'Hotel scheduled'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                  <button
                    onClick={(e) => handleCopyLink(voucher, e)}
                    className="flex items-center gap-1 text-slate-500 hover:text-emerald-700 font-medium transition-colors"
                    title="Copy direct voucher URL"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold text-[11px]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Copy Link</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/edit/${voucher.slug || voucher.id}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-[11px] transition-colors"
                    >
                      <Edit3 className="w-3 h-3 text-emerald-700" />
                      <span>Edit</span>
                    </Link>

                    <Link
                      href={`/voucher/${voucher.slug || voucher.id}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-[11px] transition-colors shadow-sm"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && !loadingVouchers && (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-4">
            {search ? (
              <>
                <p className="text-slate-500 text-base">No vouchers found matching "{search}"</p>
                <button
                  onClick={() => setSearch('')}
                  className="text-xs text-emerald-700 font-semibold underline"
                >
                  Clear Search Filter
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-lg">No Vouchers in Noor E Haram Travel & Tours Portal Yet</h3>
                  <p className="text-slate-500 text-xs sm:text-sm">Get started by creating your first digital Umrah package voucher.</p>
                </div>
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create First Voucher</span>
                </Link>
              </>
            )}
          </div>
        )}

      </section>

    </div>
  );
}
