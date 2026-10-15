'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { 
  getAllVouchers, 
  fetchSupabaseVouchers, 
  deleteVoucher, 
  slugify 
} from '../../lib/vouchersData';
import { 
  Bus, 
  Search, 
  PlusCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Printer, 
  Edit3, 
  Trash2, 
  Building2, 
  Calendar, 
  Users, 
  Plane, 
  QrCode, 
  RotateCw, 
  Eye, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Hotel, 
  Share2,
  X,
  MapPin,
  Clock,
  Layers,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function TransportVoucherManager({ parties = [], onGenerateHotelVoucher }) {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'SELF_VISA' | 'REGULAR' | 'WITH_STAYS'
  const [sortBy, setSortBy] = useState('NEWEST'); // 'NEWEST' | 'PARTY_ASC' | 'UB_ASC' | 'PAX_DESC'
  const [viewMode, setViewMode] = useState('CARDS'); // 'CARDS' | 'TABLE'
  const [origin, setOrigin] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  
  // QR Preview Modal
  const [qrModalVoucher, setQrModalVoucher] = useState(null);
  
  // Delete Confirmation State
  const [deletingVoucher, setDeletingVoucher] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadVouchers = async () => {
    // 1. Instant local fallback
    if (typeof window !== 'undefined') {
      const local = getAllVouchers();
      if (local && local.length > 0) {
        setVouchers(local);
        setLoading(false);
      }
    }
    // 2. Fresh live sync from Supabase
    try {
      const live = await fetchSupabaseVouchers();
      if (live && live.length > 0) {
        setVouchers(live);
      }
    } catch (e) {
      console.warn('Error fetching transport vouchers:', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
    loadVouchers();
  }, []);

  const handleCopyLink = (v, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const url = `${origin}/voucher/${v.slug || v.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(v.id || v.slug);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingVoucher) return;
    setIsDeleting(true);
    try {
      await deleteVoucher(deletingVoucher.slug || deletingVoucher.id);
      setVouchers(prev => prev.filter(v => v.id !== deletingVoucher.id && v.slug !== deletingVoucher.slug));
      setDeletingVoucher(null);
    } catch (err) {
      alert('Failed to delete voucher. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = vouchers.length;
    const totalPax = vouchers.reduce((sum, v) => sum + (parseInt(v.totalPax) || (v.passengers?.length) || 1), 0);
    const withHotels = vouchers.filter(v => Array.isArray(v.accommodations) && v.accommodations.length > 0).length;
    const withFlights = vouchers.filter(v => Array.isArray(v.flights) && v.flights.length > 0).length;
    return { total, totalPax, withHotels, withFlights };
  }, [vouchers]);

  // Filtered & Sorted vouchers
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let res = vouchers.filter((v) => {
      const matchesSearch = !q || (
        (v.party || '').toLowerCase().includes(q) ||
        (v.sheetName || '').toLowerCase().includes(q) ||
        (v.ubNumber || '').toLowerCase().includes(q) ||
        (v.voucherRefNo || '').toLowerCase().includes(q) ||
        (v.id || '').toString().toLowerCase().includes(q) ||
        (v.passengers || []).some((p) => 
          (p.name || '').toLowerCase().includes(q) || 
          (p.passportNo || '').toLowerCase().includes(q)
        ) ||
        (v.accommodations || []).some((a) => 
          (a.hotelName || '').toLowerCase().includes(q) || 
          (a.city || '').toLowerCase().includes(q)
        ) ||
        (v.flights || []).some((f) => 
          (f.pnr || '').toLowerCase().includes(q) || 
          (f.flight || '').toLowerCase().includes(q)
        )
      );

      if (!matchesSearch) return false;

      if (filterType === 'SELF_VISA') return v.isSelfVisa === true;
      if (filterType === 'REGULAR') return v.isSelfVisa === false;
      if (filterType === 'WITH_STAYS') return Array.isArray(v.accommodations) && v.accommodations.length > 0;
      return true;
    });

    res.sort((a, b) => {
      if (sortBy === 'PARTY_ASC') return (a.party || '').localeCompare(b.party || '');
      if (sortBy === 'UB_ASC') return (a.ubNumber || '').localeCompare(b.ubNumber || '');
      if (sortBy === 'PAX_DESC') {
        const paxA = a.passengers?.length || parseInt(a.totalPax) || 0;
        const paxB = b.passengers?.length || parseInt(b.totalPax) || 0;
        return paxB - paxA;
      }
      // Default: NEWEST first
      const dateA = new Date(a.createdAt || a.voucherDate || 0).getTime();
      const dateB = new Date(b.createdAt || b.voucherDate || 0).getTime();
      return dateB - dateA;
    });

    return res;
  }, [vouchers, search, filterType, sortBy]);

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <Bus className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white">
                Transport + Hotel Vouchers
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Live Cloud Sync
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Official Umrah package vouchers combining ground transportation itineraries, multi-stay hotel allocations, verified QR redirect links, and passenger manifests.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          <button
            onClick={() => {
              setIsRefreshing(true);
              loadVouchers();
            }}
            disabled={isRefreshing}
            className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Refresh from Supabase"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            href="/create"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Create Voucher</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Total Vouchers</span>
            <Bus className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.total}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Active Umrah Groups</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Total Pilgrims</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.totalPax}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Manifest Passengers</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Hotel Stays</span>
            <Building2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.withHotels}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Groups with Accommodations</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Flight Sectors</span>
            <Plane className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.withFlights}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Groups with PNRs</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by party head, UB #, passport no, passenger name, flight PNR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-slate-400"
            >
              <option value="ALL">All Categories</option>
              <option value="SELF_VISA">Self-Visa Only</option>
              <option value="REGULAR">Standard Umrah</option>
              <option value="WITH_STAYS">With Hotel Stays</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-slate-400"
            >
              <option value="NEWEST">Sort: Newest First</option>
              <option value="PARTY_ASC">Sort: Party (A-Z)</option>
              <option value="UB_ASC">Sort: UB Number</option>
              <option value="PAX_DESC">Sort: Pax Count (High)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-100">
              <button
                onClick={() => setViewMode('CARDS')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'CARDS' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Card Grid View"
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Compact Table View"
              >
                Table
              </button>
            </div>
          </div>

        </div>

        {/* Results Counter */}
        <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
          <span>Showing {filtered.length} of {vouchers.length} transport vouchers</span>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-emerald-600 hover:underline cursor-pointer"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 animate-pulse">
              <div className="h-6 bg-slate-200 rounded-md w-1/3" />
              <div className="h-8 bg-slate-200 rounded-md w-2/3" />
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-10 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Transport Vouchers Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {search ? `No vouchers matched "${search}". Try searching by another keyword.` : 'You haven’t created any Umrah transport vouchers yet.'}
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create First Voucher</span>
          </Link>
        </div>
      )}

      {/* CARDS VIEW MODE */}
      {!loading && viewMode === 'CARDS' && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((v) => {
            const voucherUrl = `${origin}/voucher/${v.slug || v.id}`;
            const paxCount = v.passengers?.length || parseInt(v.totalPax) || 1;
            const stays = v.accommodations || [];
            const flights = v.flights || [];
            const transports = v.transports || [];

            return (
              <div
                key={v.id || v.slug}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Card Top: Badges & Party Head */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-white shadow-2xs">
                        {v.ubNumber || v.voucherRefNo || 'UB-0001'}
                      </span>
                      {v.isSelfVisa ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Self-Visa
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Standard Visa
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{v.voucherDate ? String(v.voucherDate).split('T')[0] : 'Active'}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors uppercase tracking-tight">
                      {v.party || 'Unnamed Group'}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{paxCount} {paxCount === 1 ? 'Passenger' : 'Passengers'}</span>
                      </span>
                      {v.phone && (
                        <span className="text-xs text-slate-400 font-medium truncate max-w-[200px]">
                          • {v.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Middle: Sectors & Summary Tags */}
                <div className="space-y-2 bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs">
                  
                  {/* Transport Sectors */}
                  <div className="flex items-start gap-2">
                    <Bus className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-bold text-slate-700">Transport: </span>
                      {transports.length > 0 ? (
                        <span className="text-slate-600 font-medium">
                          {transports.map(t => `${t.service || 'Sector'} (${t.vehicle || 'BUS'})`).join(' • ')}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Standard KSA Ground Transport</span>
                      )}
                    </div>
                  </div>

                  {/* Accommodations */}
                  <div className="flex items-start gap-2">
                    <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-bold text-slate-700">Stays: </span>
                      {stays.length > 0 ? (
                        <span className="text-slate-600 font-medium">
                          {stays.map(s => `${s.city || 'KSA'}: ${s.hotelName || 'TBA'} (${s.nights || 5}N)`).join(' • ')}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No stays listed</span>
                      )}
                    </div>
                  </div>

                  {/* Flights */}
                  {flights.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Plane className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-bold text-slate-700">Flights: </span>
                        <span className="text-slate-600 font-medium">
                          {flights.map(f => `${f.flight || 'FLIGHT'} (${f.from || 'KHI'}-${f.to || 'JED'}) PNR: ${f.pnr || 'N/A'}`).join(' • ')}
                        </span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Card Bottom: Actions */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  
                  {/* Suggestion 1-Click Hotel Voucher Button (Prominent) */}
                  {stays.length > 0 && onGenerateHotelVoucher && (
                    <button
                      type="button"
                      onClick={() => onGenerateHotelVoucher(v)}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-98 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      title="1-Click pre-fill and create Multi-Stay Hotel Voucher with this party's stays & passengers"
                    >
                      <Hotel className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                      <span>1-Click Generate Hotel Voucher</span>
                      <ArrowRight className="w-3 h-3 text-slate-950 ml-0.5 stroke-[2.5]" />
                    </button>
                  )}

                  {/* Standard Operations Actions */}
                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    
                    <div className="flex items-center gap-1">
                      {/* Copy Customer Link */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(v, e)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          copiedId === (v.id || v.slug)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        title="Copy verified public link for customer"
                      >
                        {copiedId === (v.id || v.slug) ? (
                          <>
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-500" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      {/* Quick QR Thumbnail Button */}
                      <button
                        type="button"
                        onClick={() => setQrModalVoucher(v)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                        title="Quick View & Download QR Code"
                      >
                        <QrCode className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* View Customer Voucher */}
                      <Link
                        href={`/voucher/${v.slug || v.id}`}
                        target="_blank"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all"
                        title="Open verified customer voucher page in new tab"
                      >
                        <Eye className="w-3 h-3 text-slate-500" />
                        <span>View</span>
                      </Link>

                      {/* Edit Voucher */}
                      <Link
                        href={`/edit/${v.slug || v.id}`}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all"
                        title="Edit transport voucher details"
                      >
                        <Edit3 className="w-3 h-3 text-slate-500" />
                        <span>Edit</span>
                      </Link>

                      {/* Delete Voucher */}
                      <button
                        type="button"
                        onClick={() => setDeletingVoucher(v)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                        title="Delete voucher"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW MODE */}
      {!loading && viewMode === 'TABLE' && filtered.length > 0 && (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">UB Number</th>
                  <th className="px-4 py-3">Party Head</th>
                  <th className="px-4 py-3">Pax</th>
                  <th className="px-4 py-3">Visa Type</th>
                  <th className="px-4 py-3">Hotel Stays</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((v) => {
                  const paxCount = v.passengers?.length || parseInt(v.totalPax) || 1;
                  const stays = v.accommodations || [];
                  const isCopied = copiedId === (v.id || v.slug);

                  return (
                    <tr key={v.id || v.slug} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {v.ubNumber || v.voucherRefNo || 'UB-0001'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 uppercase block">{v.party}</span>
                        {v.phone && <span className="text-[10px] text-slate-400">{v.phone}</span>}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">
                        {paxCount} PAX
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {v.isSelfVisa ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Self-Visa
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Standard
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[220px] truncate text-slate-600">
                        {stays.length > 0 ? (
                          stays.map(s => `${s.city}: ${s.hotelName || 'TBA'}`).join(', ')
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {v.voucherDate ? String(v.voucherDate).split('T')[0] : '—'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          
                          {stays.length > 0 && onGenerateHotelVoucher && (
                            <button
                              type="button"
                              onClick={() => onGenerateHotelVoucher(v)}
                              className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center gap-1 border border-amber-200 cursor-pointer"
                              title="1-Click Generate Hotel Voucher"
                            >
                              <Hotel className="w-3 h-3 text-amber-700" />
                              <span className="hidden sm:inline">Hotel Voucher</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => handleCopyLink(v, e)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                              isCopied ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                            title="Copy link"
                          >
                            {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 text-slate-500" />}
                          </button>

                          <Link
                            href={`/voucher/${v.slug || v.id}`}
                            target="_blank"
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                            title="View Voucher"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            href={`/edit/${v.slug || v.id}`}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeletingVoucher(v)}
                            className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QR Code Quick Modal */}
      {qrModalVoucher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setQrModalVoucher(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                {qrModalVoucher.ubNumber || qrModalVoucher.voucherRefNo}
              </span>
              <h3 className="text-base font-black text-slate-900 mt-2 uppercase">
                {qrModalVoucher.party}
              </h3>
              <p className="text-xs text-slate-500">Scan to verify authentic Umrah voucher</p>
            </div>

            {/* QR Render */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl inline-block shadow-2xs">
              <QRCodeSVG
                value={`${origin}/voucher/${qrModalVoucher.slug || qrModalVoucher.id}`}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>

            <p className="font-mono text-[11px] text-slate-500 break-all bg-slate-100 p-2 rounded-lg">
              {`${origin}/voucher/${qrModalVoucher.slug || qrModalVoucher.id}`}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleCopyLink(qrModalVoucher, e)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedId === (qrModalVoucher.id || qrModalVoucher.slug) ? 'Copied Link!' : 'Copy Link'}</span>
              </button>

              <Link
                href={`/voucher/${qrModalVoucher.slug || qrModalVoucher.id}`}
                target="_blank"
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingVoucher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Delete Transport Voucher?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <span className="font-bold text-slate-800">{deletingVoucher.party}</span> ({deletingVoucher.ubNumber || deletingVoucher.voucherRefNo})? This action will remove it from Supabase cloud database.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingVoucher(null)}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
