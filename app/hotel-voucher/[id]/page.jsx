'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import { 
  Building2, 
  Calendar, 
  Users, 
  MapPin, 
  Printer, 
  ArrowLeft, 
  CheckCircle2, 
  PhoneCall, 
  ShieldCheck, 
  Copy, 
  Check, 
  Bed, 
  Clock, 
  Utensils, 
  FileText,
  Star,
  User,
  ExternalLink,
  Edit3,
  Plus,
  Trash2,
  X,
  Shield,
  Wifi,
  Smartphone,
  AlertCircle,
  Award,
  ChevronRight
} from 'lucide-react';
import { getHotelVoucherById, saveHotelVoucher, getAllParties, isAgencyPhone } from '../../../lib/erpData';

function getMealPlanLabel(code) {
  switch ((code || '').toUpperCase()) {
    case 'RO': return 'Room Only';
    case 'BB': return 'Bed & Breakfast';
    case 'HB': return 'Half Board';
    case 'FB': return 'Full Board';
    default: return 'Room Only';
  }
}

function formatCityDetails(city, index) {
  const norm = (city || '').toLowerCase();
  if (norm.includes('madin') || norm.includes('medin')) {
    return {
      cityName: 'Medinah',
      shortCity: 'Medinah',
      category: 'Central Zone Category',
      defaultAddress: 'Central Northern Area, Near Prophet\'s Mosque (Al-Masjid an-Nabawi), Madinah, KSA'
    };
  }
  if (norm.includes('jed')) {
    return {
      cityName: 'Jeddah',
      shortCity: 'Jeddah',
      category: 'Coastal Transit Category',
      defaultAddress: 'Al Madinah Al Munawwarah Rd, King Abdulaziz International Airport Zone, Jeddah, KSA'
    };
  }
  return {
    cityName: 'Makkah',
    shortCity: 'Makkah',
    category: 'Standard Star Hospitality',
    defaultAddress: 'Ajyad Road / Ibrahim Al Khalil District, Makkah, Kingdom of Saudi Arabia'
  };
}

function getStayStars(stay) {
  if (stay?.stars !== undefined && stay?.stars !== null && stay?.stars !== '') {
    const s = parseInt(stay.stars, 10);
    return isNaN(s) ? 5 : s;
  }
  if (stay?.starRating !== undefined && stay?.starRating !== null && stay?.starRating !== '') {
    const s = parseInt(stay.starRating, 10);
    return isNaN(s) ? 5 : s;
  }
  if (stay?.noStar) return 0;
  if (typeof window !== 'undefined') {
    try {
      const saved = JSON.parse(localStorage.getItem('neh_erp_hotel_stars_v1') || '{}');
      const key = (stay?.hotelName || '').trim().toUpperCase();
      if (saved[key] !== undefined && saved[key] !== null && saved[key] !== '') {
        const s = parseInt(saved[key], 10);
        return isNaN(s) ? 5 : s;
      }
    } catch (e) {}
  }
  const name = (stay?.hotelName || '').toLowerCase();
  if (name.includes('5 star') || name.includes('5★') || name.includes('5-star')) return 5;
  if (name.includes('4 star') || name.includes('4★') || name.includes('4-star')) return 4;
  if (name.includes('3 star') || name.includes('3★') || name.includes('3-star')) return 3;
  if (name.includes('2 star') || name.includes('2★') || name.includes('2-star')) return 2;
  if (name.includes('1 star') || name.includes('1★')) return 1;
  if (name.includes('voco') || name.includes('fairmont') || name.includes('hilton') || name.includes('swissotel') || name.includes('clock tower') || name.includes('pullman') || name.includes('oberoi') || name.includes('dar al taqwa') || name.includes('dar al eman')) return 5;
  return 4;
}

export default function HotelVoucherViewPage() {
  const params = useParams();
  const id = params?.id ? decodeURIComponent(params.id) : '';
  
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');
  
  // Emergency contacts custom edit modal state
  const [showEditEmergency, setShowEditEmergency] = useState(false);
  const [emergencyList, setEmergencyList] = useState([
    { id: 1, label: 'KSA Ground', value: '+966 53 649 2846' },
    { id: 2, label: 'Madinah', value: '+966 57 593 0550' },
    { id: 3, label: 'PK Head Office', value: 'MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683' }
  ]);

  // Issue date inline edit state
  const [isEditingIssueDate, setIsEditingIssueDate] = useState(false);
  const [editIssueDate, setEditIssueDate] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      const data = getHotelVoucherById(id);
      if (data) {
        setVoucher(data);
        setEditIssueDate(data.issueDate || new Date().toISOString().split('T')[0]);
        if (Array.isArray(data.emergencyContactsList) && data.emergencyContactsList.length > 0) {
          setEmergencyList(data.emergencyContactsList);
        } else if (data.emergencyContacts) {
          const ksa = data.emergencyContacts.ksaGround || '+966 53 649 2846';
          const med = data.emergencyContacts.madinah || '+966 57 593 0550';
          const pk = data.emergencyContacts.pkHeadOffice;
          const pkVal = (!pk || pk === '+92 321 8450030') ? 'MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683' : pk;
          setEmergencyList([
            { id: 1, label: 'KSA Ground', value: ksa },
            { id: 2, label: 'Madinah', value: med },
            { id: 3, label: 'PK Head Office', value: pkVal }
          ]);
        } else {
          setEmergencyList([
            { id: 1, label: 'KSA Ground', value: '+966 53 649 2846' },
            { id: 2, label: 'Madinah', value: '+966 57 593 0550' },
            { id: 3, label: 'PK Head Office', value: 'MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683' }
          ]);
        }
      }
      setLoading(false);
    }
  }, [id]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && voucher) {
      const url = `${origin}/hotel-voucher/${voucher.id || id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddEmergencyRow = () => {
    setEmergencyList(prev => [
      ...prev,
      { id: Date.now(), label: 'Contact', value: '' }
    ]);
  };

  const handleRemoveEmergencyRow = (index) => {
    setEmergencyList(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateEmergencyRow = (index, field, val) => {
    setEmergencyList(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleSaveEmergencyNumbers = (e) => {
    e.preventDefault();
    if (!voucher) return;
    const cleaned = emergencyList.filter(r => (r.label || '').trim() || (r.value || '').trim());
    const ksaRow = cleaned.find(r => (r.label || '').toLowerCase().includes('ground') || (r.label || '').toLowerCase().includes('ksa'));
    const medRow = cleaned.find(r => (r.label || '').toLowerCase().includes('madinah') || (r.label || '').toLowerCase().includes('medina'));
    const pkRow = cleaned.find(r => (r.label || '').toLowerCase().includes('pk') || (r.label || '').toLowerCase().includes('head'));

    const updatedVoucher = {
      ...voucher,
      emergencyContactsList: cleaned,
      emergencyContacts: {
        ksaGround: ksaRow?.value || cleaned[0]?.value || '+966 53 649 2846',
        madinah: medRow?.value || cleaned[1]?.value || '+966 57 593 0550',
        pkHeadOffice: pkRow?.value || cleaned[2]?.value || 'MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683'
      }
    };
    saveHotelVoucher(updatedVoucher);
    setVoucher(updatedVoucher);
    setEmergencyList(cleaned);
    setShowEditEmergency(false);
  };

  const handleSaveIssueDate = (newDate) => {
    if (!voucher || !newDate) return;
    const updatedVoucher = {
      ...voucher,
      issueDate: newDate,
    };
    saveHotelVoucher(updatedVoucher);
    setVoucher(updatedVoucher);
    setIsEditingIssueDate(false);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-900">
        <div className="w-10 h-10 border-4 border-[#dfba73] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-16 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4 shadow-2xl">
          <Building2 className="w-16 h-16 text-[#dfba73] mx-auto" />
          <h2 className="text-xl font-black text-white uppercase">Accommodation Voucher Not Found</h2>
          <p className="text-slate-400 text-xs">
            No accommodation voucher exists with reference <code className="bg-slate-800 text-amber-300 px-2 py-0.5 rounded font-mono">{id}</code>.
          </p>
          <Link 
            href="/erp/hotel-voucher" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#dfba73] text-[#0a192f] rounded-xl text-xs font-black hover:bg-amber-400 transition-colors shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Operations ERP</span>
          </Link>
        </div>
      </div>
    );
  }

  const liveQrUrl = `${origin}/hotel-voucher/${voucher.id || id}`;
  const totalNights = (voucher.stays || []).reduce((acc, curr) => acc + (parseInt(curr.nights) || 0), 0);
  
  // Extract Lead Passenger / Family Head details
  const passengers = voucher.passengers || [];
  const headPax = passengers.find(p => 
    p.manifestRole === 'HEAD' || 
    p.relationship?.toLowerCase() === 'head'
  ) || passengers[0] || { name: voucher.partyName || 'LEAD GUEST' };

  let rawLeadName = headPax.name || voucher.partyName || 'LEAD GUEST';
  if ((!rawLeadName || rawLeadName.toLowerCase().includes('unnamed')) && voucher.partyName && !voucher.partyName.toLowerCase().includes('unnamed')) {
    rawLeadName = voucher.partyName;
  }
  const leadName = rawLeadName;
  const leadPrefix = (headPax.prefix && !leadName.toUpperCase().startsWith(headPax.prefix.toUpperCase())) ? `${headPax.prefix} ` : '';
  const leadPassport = headPax.passportNo || '—';

  const allParties = typeof window !== 'undefined' ? getAllParties() : [];
  const matchedParty = allParties.find(p => 
    (voucher.partyHeadUid && p.partyHeadUid === voucher.partyHeadUid) || 
    (voucher.partyName && p.partyName?.toLowerCase() === voucher.partyName?.toLowerCase())
  );
  const rawCandidate = voucher.customerPhone || voucher.contactPhone || headPax.contactPhone || matchedParty?.contactPhone || (!isAgencyPhone(voucher.phone) ? voucher.phone : '') || '';
  const leadPhone = (rawCandidate && !isAgencyPhone(rawCandidate)) ? rawCandidate.trim() : '';
  const hasCustomerPhone = Boolean(leadPhone && leadPhone !== '—');

  const totalPax = passengers.length || voucher.totalPax || 1;

  const activeContactsList = Array.isArray(voucher.emergencyContactsList) && voucher.emergencyContactsList.length > 0
    ? voucher.emergencyContactsList
    : emergencyList;

  const currentKsaGround = activeContactsList.find(r => (r.label || '').toLowerCase().includes('ground') || (r.label || '').toLowerCase().includes('ksa'))?.value 
    || voucher?.emergencyContacts?.ksaGround 
    || '+966 53 649 2846';

  const currentMadinah = activeContactsList.find(r => (r.label || '').toLowerCase().includes('madinah') || (r.label || '').toLowerCase().includes('medina'))?.value 
    || voucher?.emergencyContacts?.madinah 
    || '+966 57 593 0550';

  const currentPkHeadOffice = activeContactsList.find(r => (r.label || '').toLowerCase().includes('pk') || (r.label || '').toLowerCase().includes('head'))?.value 
    || voucher?.emergencyContacts?.pkHeadOffice 
    || '+92 321 8450030';

  return (
    <div className="min-h-screen bg-[#f3f4f8] text-slate-800 pb-16 font-sans selection:bg-[#dfba73] selection:text-[#0a192f]">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP EXECUTIVE NAVIGATION BAR (Screen Only - Deep Navy #0a192f) */}
      {/* ------------------------------------------------------------- */}
      <header className="bg-[#0a192f] text-white border-b border-slate-800 shadow-md sticky top-0 z-40 no-print">
        <div className="max-w-[1100px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
          
          {/* Left: Brand Title & Verified Badge */}
          <div className="flex items-center gap-3">
            <Link 
              href="/erp/hotel-voucher" 
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Return to Hotel Vouchers"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="flex items-center gap-2">
              <span className="font-black text-xs uppercase tracking-wider text-[#dfba73]">AERO VOUCHER</span>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#dfba73]/15 text-[#dfba73] border border-[#dfba73]/30">
              <CheckCircle2 className="w-3 h-3 text-[#dfba73]" />
              <span>VERIFIED</span>
            </span>
          </div>

          {/* Center Tabs (Executive Document Viewer) */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-bold text-slate-300">
            <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-white border border-slate-700 shadow-xs cursor-default">
              Manifest
            </span>
            <span className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition cursor-pointer">
              Logistics
            </span>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={() => setShowEditEmergency(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-[#dfba73] border border-[#dfba73]/40 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              title="Edit Emergency Numbers"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Emergency #s</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#dfba73] hover:bg-amber-400 text-[#0a192f] rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#0a192f]" />
              <span>Save PDF / Print</span>
            </button>
          </div>

        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. SUB PREVIEW BAR (Screen Only) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border-b border-slate-200 py-2.5 px-4 no-print shadow-xs mb-6">
        <div className="max-w-[860px] mx-auto flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span className="font-extrabold text-slate-900">Executive Voucher Document Engine</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
              A4 Portrait Archival (ISO 216)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-slate-400">Zoom: <strong className="text-slate-700">100%</strong></span>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0a192f] hover:bg-slate-800 text-[#dfba73] rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. A4 CERTIFIED ACCOMMODATION VOUCHER SHEET */}
      {/* ------------------------------------------------------------- */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 5mm 7mm 5mm 7mm !important;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            font-size: 10pt !important;
            line-height: 1.35 !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, header, nav {
            display: none !important;
          }
          main.hotel-voucher-sheet {
            max-width: 100% !important;
            width: 100% !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .hotel-voucher-sheet * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}} />

      <main className="hotel-voucher-sheet max-w-[860px] mx-auto bg-white shadow-xl rounded-2xl border border-slate-200/90 p-6 sm:p-7 print:p-0 print:border-none print:shadow-none space-y-4 print:space-y-3">
        
        {/* ========================================================= */}
        {/* A. HEADER: CHEEPA FJ TRAVELS (LARGE) & LOGO, HOTEL VOUCHER BELOW */}
        {/* ========================================================= */}
        <section className="pb-3 border-b-2 border-slate-900 space-y-2">
          {/* Top Row: Noor E Haram Travels (Large) & Logo */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-[#dfba73] inline-block shadow-2xs shrink-0" />
              <span className="text-2xl sm:text-3xl font-black text-[#0a192f] tracking-tight uppercase leading-none">
                Noor E Haram Travels
              </span>
            </div>

            <div className="shrink-0">
              <img 
                src="/logo.png" 
                alt="Noor E Haram Travels Logo" 
                className="h-24 sm:h-32 md:h-36 max-w-[280px] sm:max-w-[360px] w-auto object-contain drop-shadow-sm" 
              />
            </div>
          </div>

          {/* Below Row: Hotel Voucher Heading (Small, Centered) */}
          <div className="text-center">
            <h1 className="text-xs sm:text-sm font-black text-[#0a192f] tracking-widest uppercase">
              Hotel Voucher
            </h1>
          </div>
        </section>

        {/* ========================================================= */}
        {/* B. PRINCIPAL GUEST & ITINERARY MANIFEST */}
        {/* ========================================================= */}
        <section className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-700">
            <User className="w-3.5 h-3.5 text-[#0a192f]" />
            <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-900">
              PRINCIPAL GUEST &amp; ITINERARY MANIFEST
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
            {/* Left Details Card */}
            <div className="md:col-span-9 bg-slate-50/80 border border-slate-200/90 rounded-xl p-3 flex flex-col justify-between space-y-2.5">
              <div className={`grid grid-cols-1 ${hasCustomerPhone ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-2`}>
                {/* Customer Name */}
                <div>
                  <span className="block text-[8.5px] font-extrabold uppercase tracking-wider text-slate-400">
                    CUSTOMER NAME
                  </span>
                  <h3 className="font-black text-sm text-slate-900 uppercase truncate mt-0.5">
                    {leadPrefix}{leadName}
                  </h3>
                </div>

                {/* Customer Phone (Omitted completely if blank) */}
                {hasCustomerPhone && (
                  <div>
                    <span className="block text-[8.5px] font-extrabold uppercase tracking-wider text-slate-400">
                      CUSTOMER PHONE
                    </span>
                    <p className="font-mono font-black text-sm text-slate-900 mt-0.5">
                      {leadPhone}
                    </p>
                    <span className="text-[9.5px] font-medium text-slate-500">
                      Voice / Roaming Active
                    </span>
                  </div>
                )}

                {/* Total Pax */}
                <div>
                  <span className="block text-[8.5px] font-extrabold uppercase tracking-wider text-slate-400">
                    TOTAL PAX
                  </span>
                  <div className="mt-0.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
                      <Users className="w-3.5 h-3.5 text-amber-800" />
                      <span>{totalPax} {totalPax === 1 ? 'ADULT' : 'ADULTS'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Inner bottom strip */}
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[9.5px] font-mono">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="font-bold text-slate-500 uppercase">VOUCHER NO.:</span>
                  <span className="font-black text-slate-900">{voucher.voucherNo}</span>
                  <span className="text-slate-400">/</span>
                  
                  {/* Inline edit issue date */}
                  <div className="relative group inline-flex items-center gap-1">
                    {isEditingIssueDate ? (
                      <span className="no-print inline-flex items-center gap-1">
                        <input
                          type="date"
                          value={editIssueDate}
                          onChange={(e) => setEditIssueDate(e.target.value)}
                          className="px-1.5 py-0.5 border border-slate-300 rounded font-bold text-[10px] bg-white text-slate-900 outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveIssueDate(editIssueDate)}
                          className="p-0.5 bg-[#0a192f] text-[#dfba73] rounded text-[10px] cursor-pointer"
                          title="Save Date"
                        >
                          <Check className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingIssueDate(false)}
                          className="p-0.5 bg-slate-200 text-slate-700 rounded text-[10px] cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ) : (
                      <span className="text-slate-700 font-bold inline-flex items-center gap-1">
                        <span>{voucher.issueDate}</span>
                        <button
                          type="button"
                          onClick={() => setIsEditingIssueDate(true)}
                          className="no-print opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-200 rounded text-slate-500 transition cursor-pointer"
                          title="Edit Issue Date"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Digital QR Card */}
            <div className="md:col-span-3 bg-white border border-slate-200/90 rounded-xl p-2.5 flex flex-col items-center justify-center text-center shadow-2xs">
              <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                <QRCodeSVG
                  value={liveQrUrl}
                  size={72}
                  level="M"
                  includeMargin={false}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* C. CONFIRMED HOTEL ACCOMMODATIONS */}
        {/* ========================================================= */}
        <section className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-[#0a192f]" />
            <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-900">
              CONFIRMED HOTEL ACCOMMODATIONS
            </h2>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#0a192f] text-white font-mono text-[9px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-2 px-2.5 text-center w-8">S#</th>
                  <th className="py-2 px-2.5">Hotel Property &amp; City</th>
                  <th className="py-2 px-2.5 whitespace-nowrap">Check-In</th>
                  <th className="py-2 px-2.5 whitespace-nowrap">Check-Out</th>
                  <th className="py-2 px-2 text-center whitespace-nowrap">Nights</th>
                  <th className="py-2 px-2.5">Room &amp; Meal</th>
                  <th className="py-2 px-2 text-center whitespace-nowrap">Rooms</th>
                  <th className="py-2 px-2.5 text-right whitespace-nowrap">Res / HCN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {(voucher.stays || []).map((stay, idx) => {
                  const cityInfo = formatCityDetails(stay.city, idx);
                  const starCount = getStayStars(stay);
                  const stayNights = parseInt(stay.nights) || 1;
                  const mealLabel = getMealPlanLabel(stay.mealPlan);

                  return (
                    <tr key={stay.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-2.5 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#dfba73] shrink-0" />
                          <span className="font-black text-slate-900 uppercase">
                            {stay.hotelName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 pl-3.5">
                          <span className="text-[10px] font-extrabold uppercase text-amber-800">
                            {cityInfo.cityName}
                          </span>
                          {starCount > 0 && (
                            <span className="flex items-center text-amber-500">
                              {Array.from({ length: starCount }).map((_, sIdx) => (
                                <Star key={sIdx} className="w-2.5 h-2.5 fill-amber-400 stroke-amber-500" />
                              ))}
                            </span>
                          )}
                          {stay.view && (
                            <span className="text-[9px] text-slate-500">
                              • {stay.view}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-2.5 whitespace-nowrap font-mono">
                        <span className="font-bold text-slate-900 block">{stay.checkIn}</span>
                        <span className="text-[9px] text-slate-500 font-semibold block">From 16:00</span>
                      </td>

                      <td className="py-2.5 px-2.5 whitespace-nowrap font-mono">
                        <span className="font-bold text-slate-900 block">{stay.checkOut}</span>
                        <span className="text-[9px] text-slate-500 font-semibold block">Until 12:00</span>
                      </td>

                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase bg-slate-100 text-slate-800 border border-slate-200">
                          {stayNights} N
                        </span>
                      </td>

                      <td className="py-2.5 px-2.5">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#0a192f] text-[#dfba73]">
                          {stay.roomType || 'QUAD'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-700 block mt-0.5">
                          {stay.mealPlan || 'RO'} ({mealLabel})
                        </span>
                      </td>

                      <td className="py-2.5 px-2 text-center font-bold text-slate-800 whitespace-nowrap">
                        {stay.rooms || 1}
                      </td>

                      <td className="py-2.5 px-2.5 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                        {stay.hcn || stay.bookingRef || 'HCN-108047'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ========================================================= */}
        {/* D. KSA HELPLINE & IMMEDIATE OPERATIONAL DISPATCH (24/7 PRIORITY SUPPORT) */}
        {/* ========================================================= */}
        <section className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-700">
            <div className="flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-[#0a192f]" />
              <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-900">
                KSA HELPLINE &amp; IMMEDIATE OPERATIONAL DISPATCH
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEditEmergency(true)}
                className="no-print text-[9px] font-bold text-slate-500 hover:text-slate-800 inline-flex items-center gap-0.5 cursor-pointer"
              >
                <Edit3 className="w-2.5 h-2.5" />
                <span>Edit</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Makkah */}
            <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3 flex flex-col justify-center space-y-1">
              <span className="block text-[10px] font-bold text-slate-600 uppercase">
                MAKKAH HELPLINE
              </span>
              <p className="font-mono font-black text-xs sm:text-sm text-slate-900 tracking-tight mt-0.5">
                {currentKsaGround}
              </p>
            </div>

            {/* Madinah */}
            <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3 flex flex-col justify-center space-y-1">
              <span className="block text-[10px] font-bold text-slate-600 uppercase">
                MADINAH HELPLINE
              </span>
              <p className="font-mono font-black text-xs sm:text-sm text-slate-900 tracking-tight mt-0.5">
                {currentMadinah}
              </p>
            </div>

            {/* Pakistan */}
            <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3 flex flex-col justify-center space-y-1">
              <span className="block text-[10px] font-bold text-slate-600 uppercase">
                PAKISTAN HELPLINE
              </span>
              <p className="font-mono font-bold text-[10.5px] leading-snug text-slate-900 tracking-tight mt-0.5 break-words">
                {currentPkHeadOffice}
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* E. TERMS & CONDITIONS • SERVICE PROTOCOL */}
        {/* ========================================================= */}
        <section className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-700">
            <FileText className="w-3.5 h-3.5 text-[#0a192f]" />
            <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-900">
              TERMS &amp; CONDITIONS • SERVICE PROTOCOL
            </h2>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3 space-y-2 text-[10px] text-slate-700 leading-relaxed">
            {/* Item 1 */}
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <p className="flex-1">
                Cancellation with full refund is permissible only with a notification at least 24 hours prior to travelling.
              </p>
            </div>

            {/* Item 2 */}
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <p className="flex-1">
                It is the responsibility of the agent and/or client to have a valid Saudi number or an active roaming sim they can use to contact their designated driver/hotel coordinator. <strong>100% of the service amount will be charged in case of no show.</strong>
              </p>
            </div>

            {/* Item 3 */}
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <p className="flex-1">
                The Transportation &amp; Accommodation Service Company reserves the right to change the rates without any prior notification but will respect booked services with complete payment.
              </p>
            </div>

            {/* Sub-bullets with icons */}
            <div className="pt-2 border-t border-slate-200/70 space-y-1.5 text-[9.5px]">
              <div className="flex items-center gap-2 text-slate-600">
                <Wifi className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>The passengers are expected to connect to the wifi as soon as they land at the respective Jeddah or Madinah airport and establish contact with the number provided for their trip.</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Sim Kiosks are also available at both airports for the assistance of the passengers.</span>
              </div>
              <div className="flex items-center gap-2 text-rose-700 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>In the case that the passengers don't connect to the internet or fail to establish contact with the transporter we will not be responsible for any inconvenience.</span>
              </div>
            </div>

            {/* Urdu Note */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-md p-1.5 text-right font-sans mt-1" dir="rtl">
              <p className="font-urdu font-bold text-amber-950 text-[10px] leading-normal">
                ضروری ہدایات: ہوٹل چیک آؤٹ وقت دوپہر 12 بجے ہے اور باقاعدہ واؤچر کا ہمراہ ہونا ضروری ہے۔
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* F. FOOTER */}
        {/* ========================================================= */}
        <footer className="pt-1">
          <div className="bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-1.5 flex items-center justify-between text-[8.5px] font-mono text-slate-500">
            <span>OPERATOR: NOOR E HARAM OPERATIONS • {voucher.issueDate}</span>
          </div>
        </footer>

      </main>

      {/* ------------------------------------------------------------- */}
      {/* 4. MODAL: EDIT EMERGENCY NUMBERS (Screen Only) */}
      {/* ------------------------------------------------------------- */}
      {showEditEmergency && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 no-print">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">Custom Emergency Numbers</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowEditEmergency(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEmergencyNumbers} className="space-y-3.5 text-xs">
              <div className="max-h-[360px] overflow-y-auto space-y-2.5 pr-1">
                {emergencyList.map((row, idx) => (
                  <div key={row.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative group shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <label className="block text-slate-600 font-bold mb-1 text-[10px] uppercase tracking-wider">
                          Contact Label / Department
                        </label>
                        <input
                          type="text"
                          value={row.label}
                          onChange={(e) => handleUpdateEmergencyRow(idx, 'label', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold text-xs bg-white text-slate-900 outline-none focus:border-slate-800"
                          placeholder="e.g. KSA Ground, Madinah, Supervisor..."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmergencyRow(idx)}
                        disabled={emergencyList.length <= 1}
                        className="self-end p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                        title="Delete Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1 text-[10px] uppercase tracking-wider">
                        Phone Number(s) / Details
                      </label>
                      <input
                        type="text"
                        value={row.value}
                        onChange={(e) => handleUpdateEmergencyRow(idx, 'value', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-xs bg-white text-slate-900 outline-none focus:border-slate-800"
                        placeholder="e.g. +966 53 649 2846"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleAddEmergencyRow}
                  className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-slate-800 text-slate-700 hover:text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition hover:bg-slate-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Another Contact Row</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditEmergency(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0a192f] hover:bg-slate-800 text-[#dfba73] rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                >
                  Save Emergency Contacts
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
