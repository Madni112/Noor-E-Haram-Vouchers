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
  QrCode
} from 'lucide-react';
import { getHotelVoucherById, saveHotelVoucher } from '../../../lib/erpData';

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
  if (stay?.stars) return parseInt(stay.stars) || 5;
  if (stay?.starRating) return parseInt(stay.starRating) || 5;
  const name = (stay?.hotelName || '').toLowerCase();
  if (name.includes('5 star') || name.includes('5★') || name.includes('5-star')) return 5;
  if (name.includes('4 star') || name.includes('4★') || name.includes('4-star')) return 4;
  if (name.includes('3 star') || name.includes('3★') || name.includes('3-star')) return 3;
  if (name.includes('2 star') || name.includes('2★') || name.includes('2-star')) return 2;
  if (name.includes('1 star') || name.includes('1★')) return 1;
  if (typeof window !== 'undefined') {
    try {
      const saved = JSON.parse(localStorage.getItem('neh_erp_hotel_stars_v1') || '{}');
      const key = (stay?.hotelName || '').trim().toUpperCase();
      if (saved[key]) return parseInt(saved[key]) || 5;
    } catch (e) {}
  }
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
  
  // Emergency contacts custom edit modal state (supports dynamic multi-row contacts)
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
  
  // Extract Lead Passenger / Family Head details ONLY
  const passengers = voucher.passengers || [];
  const headPax = passengers.find(p => 
    p.manifestRole === 'HEAD' || 
    p.relationship?.toLowerCase() === 'head'
  ) || passengers[0] || { name: voucher.partyName || 'LEAD GUEST' };

  const leadName = headPax.name || voucher.partyName || 'LEAD GUEST';
  const leadPrefix = headPax.prefix ? `${headPax.prefix} ` : '';
  const leadPassport = headPax.passportNo || '—';
  const leadPhone = headPax.contactPhone || voucher.contactPhone || voucher.phone || '+92 328 8189989';

  const adultCount = passengers.filter(p => (p.category || 'Adult').toLowerCase() === 'adult').length || 1;
  const childCount = passengers.filter(p => (p.category || '').toLowerCase() === 'child').length;
  const infantCount = passengers.filter(p => (p.category || '').toLowerCase() === 'infant').length;
  const totalPax = passengers.length || voucher.totalPax || 1;
  const bedsCount = passengers.filter(p => p.hasBed !== false).length;

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
    || 'MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683';

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 pb-12 font-sans selection:bg-[#dfba73] selection:text-[#0a192f]">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP EXECUTIVE NAVIGATION BAR (Screen Only - Deep Navy #0a192f) */}
      {/* ------------------------------------------------------------- */}
      <header className="bg-[#0a192f] text-white border-b border-slate-800 shadow-md sticky top-0 z-40 no-print">
        <div className="max-w-[1100px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
          
          {/* Left: Voucher Brand Title & Verified Badge */}
          <div className="flex items-center gap-3">
            <Link 
              href="/erp/hotel-voucher" 
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Return to Multi-Stay Hotel Vouchers"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#dfba73]" />
              <span className="font-mono font-black text-xs sm:text-sm tracking-wider uppercase text-white">
                HOTEL VOUCHER • {voucher.voucherNo}
              </span>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>CONFIRMED &amp; GUARANTEED</span>
            </span>
          </div>

          {/* Center Tabs (Executive Document Viewer) */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-bold text-slate-300">
            <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-white border border-slate-700 shadow-xs cursor-default">
              Document Viewer
            </span>
            <span className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition cursor-pointer">
              Stay Manifest
            </span>
            <span className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition cursor-pointer">
              Fiscal Settlement
            </span>
            <span className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition cursor-pointer">
              Policies &amp; Access
            </span>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold shadow-xs transition"
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
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-white hover:bg-slate-100 text-[#0a192f] rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#0a192f]" />
              <span>Print / Save as PDF</span>
            </button>
          </div>

        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. SUB PREVIEW BAR (Screen Only) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border-b border-slate-200 py-2.5 px-4 no-print shadow-xs mb-6">
        <div className="max-w-[900px] mx-auto flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span className="font-extrabold text-slate-900">Executive Voucher Preview Mode</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
              A4 Portrait (210x297mm)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-slate-400">Zoom: <strong className="text-slate-700">Fit Width</strong></span>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0a192f] hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5 text-[#dfba73]" />
              <span>Print Voucher</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ------------------------------------------------------------- */}
      {/* ------------------------------------------------------------- */}
      {/* ------------------------------------------------------------- */}
      {/* 3. A4 CERTIFIED ACCOMMODATION VOUCHER SHEET */}
      {/* ------------------------------------------------------------- */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 4mm 6mm 4mm 6mm !important;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            font-size: 10.5pt !important;
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
            border: 2px solid #0a192f !important;
            border-radius: 6px !important;
            margin: 0 auto !important;
            padding: 4mm 6mm !important;
            box-shadow: none !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-before: avoid !important;
            break-before: avoid !important;
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

      {(() => {
        const staysCount = (voucher.stays || []).length;
        const isThreeOrMore = staysCount >= 3;

        return (
          <main className={`hotel-voucher-sheet max-w-[780px] mx-auto bg-white shadow-xl border border-slate-300 print:shadow-none print:border-2 print:border-[#0a192f] print:m-0 text-slate-800 print:w-full print:max-w-full print:text-black ${
            isThreeOrMore ? 'p-3.5 sm:p-4 print:p-3' : 'p-4 sm:p-5 print:p-3.5'
          }`}>
            
            {/* ========================================================= */}
            {/* A. HEADER: LOGO AT LEFT, CENTER TITLE, CONFIRMED AT RIGHT */}
            {/* ========================================================= */}
            <section className={`relative flex flex-col sm:flex-row items-center justify-between border-b-2 border-slate-900 gap-2 ${
              isThreeOrMore 
                ? 'pb-2 mb-2 min-h-[96px] sm:min-h-[105px] print:min-h-[105px] print:pb-2 print:mb-2.5' 
                : 'pb-2.5 mb-2.5 min-h-[100px] sm:min-h-[115px] print:min-h-[115px] print:pb-2.5 print:mb-3'
            }`}>
              {/* Left: Company Logo */}
              <div className="flex items-center justify-start shrink-0 z-10">
                <img 
                  src={voucher.logo || "/logo.png"} 
                  alt={voucher.companyName || "Cheepa Travels Logo"} 
                  className={`${
                    isThreeOrMore ? 'h-24 sm:h-28 print:h-[105px]' : 'h-28 sm:h-32 print:h-[112px]'
                  } max-w-[250px] sm:max-w-[300px] print:max-w-[300px] w-auto object-contain drop-shadow-sm`} 
                />
              </div>

              {/* Center: Hotel Voucher Heading */}
              <div className="sm:absolute sm:inset-0 flex flex-col items-center justify-center pointer-events-none">
                <h1 className={`${
                  isThreeOrMore ? 'text-lg sm:text-xl print:text-[22pt]' : 'text-xl sm:text-2xl print:text-[23pt]'
                } font-black text-[#0a192f] tracking-tight uppercase text-center pointer-events-auto leading-tight`}>
                  HOTEL VOUCHER
                </h1>
                <span className={`${
                  isThreeOrMore ? 'text-[9.5px] print:text-[10pt]' : 'text-[10px] sm:text-xs print:text-[10.5pt]'
                } font-extrabold text-slate-700 uppercase tracking-widest mt-0.5 print:text-slate-800`}>
                  Accommodation Confirmation
                </span>
              </div>

              {/* Top Right: Confirmed Badge */}
              <div className="flex items-center justify-end shrink-0 z-10">
                <span className={`${
                  isThreeOrMore ? 'px-2 py-0.5 text-[10px] print:text-[10pt]' : 'px-2.5 py-1 text-xs print:text-[10.5pt]'
                } rounded-md font-black uppercase bg-[#0a192f] text-[#dfba73] tracking-wider shadow-xs inline-flex items-center gap-1.5 print:border print:border-[#dfba73]`}>
                  <Check className="w-3.5 h-3.5 print:w-4 print:h-4 text-[#dfba73] stroke-[3]" />
                  <span>CONFIRMED</span>
                </span>
              </div>
            </section>

            {/* ========================================================= */}
            {/* B. KEY METRIC TILES (3 BOXES) */}
            {/* ========================================================= */}
            <section className={`grid grid-cols-1 sm:grid-cols-3 ${
              isThreeOrMore ? 'gap-1.5 mb-2 print:gap-2 print:mb-2.5' : 'gap-2 mb-2.5 print:gap-2.5 print:mb-3'
            }`}>
              <div className={`${isThreeOrMore ? 'p-1.5 print:p-2' : 'p-2 print:p-2.5'} bg-slate-50 border border-slate-200 rounded-lg print:border-slate-300`}>
                <span className={`${isThreeOrMore ? 'text-[9px] print:text-[9pt]' : 'text-[10px] print:text-[9.5pt]'} font-bold text-slate-500 uppercase tracking-wider block`}>
                  VOUCHER REFERENCE
                </span>
                <span className={`font-mono font-black ${isThreeOrMore ? 'text-xs sm:text-sm print:text-[12pt]' : 'text-sm sm:text-base print:text-[13pt]'} text-slate-900 block mt-0.5`}>
                  {voucher.voucherNo}
                </span>
              </div>

              <div className={`${isThreeOrMore ? 'p-1.5 print:p-2' : 'p-2 print:p-2.5'} bg-slate-50 border border-slate-200 rounded-lg relative group print:border-slate-300`}>
                <div className="flex items-center justify-between">
                  <span className={`${isThreeOrMore ? 'text-[9px] print:text-[9pt]' : 'text-[10px] print:text-[9.5pt]'} font-bold text-slate-500 uppercase tracking-wider block`}>
                    ISSUE DATE
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingIssueDate(!isEditingIssueDate)}
                    className="no-print opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-200 rounded text-slate-500 transition cursor-pointer"
                    title="Edit Issue Date"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
                {isEditingIssueDate ? (
                  <div className="no-print mt-1 flex items-center gap-1">
                    <input
                      type="date"
                      value={editIssueDate}
                      onChange={(e) => setEditIssueDate(e.target.value)}
                      className="px-2 py-0.5 border border-slate-300 rounded font-bold text-xs bg-white text-slate-900 outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveIssueDate(editIssueDate)}
                      className="p-1 bg-[#0a192f] hover:bg-slate-800 text-[#dfba73] rounded text-xs cursor-pointer"
                      title="Save Date"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingIssueDate(false)}
                      className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span className={`font-bold ${isThreeOrMore ? 'text-xs sm:text-sm print:text-[12pt]' : 'text-sm sm:text-base print:text-[13pt]'} text-slate-900 block mt-0.5`}>
                    {voucher.issueDate}
                  </span>
                )}
                {/* Print version always clean */}
                {isEditingIssueDate && (
                  <span className={`font-bold ${isThreeOrMore ? 'text-xs sm:text-sm print:text-[12pt]' : 'text-sm sm:text-base print:text-[13pt]'} text-slate-900 hidden print:block mt-0.5`}>
                    {voucher.issueDate}
                  </span>
                )}
              </div>

              <div className={`${isThreeOrMore ? 'p-1.5 print:p-2' : 'p-2 print:p-2.5'} bg-slate-50 border border-slate-200 rounded-lg print:border-slate-300`}>
                <span className={`${isThreeOrMore ? 'text-[9px] print:text-[9pt]' : 'text-[10px] print:text-[9.5pt]'} font-bold text-slate-500 uppercase tracking-wider block`}>
                  TOTAL DURATION
                </span>
                <span className={`font-black ${isThreeOrMore ? 'text-xs sm:text-sm print:text-[12pt]' : 'text-sm sm:text-base print:text-[13pt]'} text-slate-900 block mt-0.5`}>
                  {totalNights} Nights
                </span>
              </div>
            </section>

            {/* ========================================================= */}
            {/* C. PRIMARY LEAD GUEST BLOCK (ONLY FAMILY HEAD NAME) */}
            {/* ========================================================= */}
            <section className={`border border-slate-200 rounded-lg bg-slate-50/70 relative overflow-hidden print:border-slate-300 ${
              isThreeOrMore ? 'p-2 mb-1.5 print:p-2.5 print:mb-2.5' : 'p-2.5 mb-2 print:p-3 print:mb-3'
            }`}>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                
                {/* Left: Lead Guest Info */}
                <div className={`${isThreeOrMore ? 'space-y-1' : 'space-y-1.5'} flex-1`}>

                  {/* Single Guest Card for Family Head */}
                  <div className={`bg-white border border-slate-200 rounded-md flex items-center justify-between shadow-2xs ${
                    isThreeOrMore ? 'p-1.5 print:p-2' : 'p-2 print:p-2.5'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`${isThreeOrMore ? 'w-7 h-7 print:w-8 print:h-8' : 'w-8 h-8 print:w-10 print:h-10'} rounded-md bg-slate-100 border border-slate-200 text-[#0a192f] flex items-center justify-center font-bold shrink-0`}>
                        <User className={`${isThreeOrMore ? 'w-3.5 h-3.5 print:w-4 print:h-4' : 'w-4 h-4 print:w-5 print:h-5'} text-slate-700`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`font-black ${isThreeOrMore ? 'text-xs sm:text-sm print:text-[12.5pt]' : 'text-sm sm:text-base print:text-[13.5pt]'} text-slate-900 uppercase`}>
                            {leadPrefix}{leadName}
                          </h4>
                          <span className={`px-1.5 py-0.5 rounded ${isThreeOrMore ? 'text-[8.5px] print:text-[8.5pt]' : 'text-[9.5px] print:text-[9.5pt]'} font-black uppercase bg-[#0a192f] text-[#dfba73] tracking-wider shadow-2xs`}>
                            Party Head
                          </span>
                        </div>
                        <p className={`${isThreeOrMore ? 'text-[10px] print:text-[9.5pt]' : 'text-xs print:text-[10pt]'} text-slate-600 font-mono font-bold mt-0.5`}>
                          Adult • Passport #{leadPassport}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary Stats Row */}
                  <div className="flex items-center pt-0.5 print:pt-1">
                    <span className={`${isThreeOrMore ? 'px-2 py-0.5 text-[10.5px] print:text-[9.5pt]' : 'px-2.5 py-1 text-xs print:text-[10pt]'} rounded-md font-black uppercase bg-[#0a192f] text-[#dfba73] tracking-wider shadow-2xs inline-flex items-center gap-1.5`}>
                      <Users className={`${isThreeOrMore ? 'w-3 h-3 print:w-3.5 print:h-3.5' : 'w-3.5 h-3.5 print:w-4 print:h-4'} text-[#dfba73]`} />
                      <span>TOTAL PAX: {totalPax}</span>
                    </span>
                  </div>

                </div>

                {/* Right: Live QR Node */}
                <div className={`flex items-center justify-center bg-white border border-slate-200 rounded-lg shrink-0 shadow-2xs self-center ${
                  isThreeOrMore ? 'p-1 print:p-1.5' : 'p-1.5 print:p-2'
                }`}>
                  <div className="p-1 bg-white rounded border border-slate-100">
                    <QRCodeSVG 
                      value={liveQrUrl} 
                      size={isThreeOrMore ? 74 : 78} 
                      className="print:w-[86px] print:h-[86px]"
                      level="M" 
                      includeMargin={false} 
                    />
                  </div>
                </div>

              </div>

            </section>

            {/* ========================================================= */}
            {/* D. CHRONOLOGICAL ACCOMMODATION STAYS (AS MANY AS CONFIGURED) */}
            {/* ========================================================= */}
            <section className={`${isThreeOrMore ? 'space-y-1.5 mb-1.5 print:space-y-2 print:mb-2.5' : 'space-y-2 mb-2 print:space-y-2.5 print:mb-3'}`}>
              {(voucher.stays || []).map((stay, idx) => {
                const cityInfo = formatCityDetails(stay.city, idx);
                const stayNights = parseInt(stay.nights) || 1;
                const mealLabel = getMealPlanLabel(stay.mealPlan);
                const starCount = getStayStars(stay);
                const roomTypeRaw = (stay.roomType || 'QUAD').toUpperCase();
                const roomTypeDisplay = (roomTypeRaw.includes('ROOM') || roomTypeRaw.includes('SHARING')) 
                  ? roomTypeRaw 
                  : `${roomTypeRaw} ROOM`;

                return (
                  <div 
                    key={stay.id || idx}
                    className={`border border-slate-200 rounded-lg bg-white shadow-2xs break-inside-avoid print:border-slate-300 ${
                      isThreeOrMore 
                        ? 'p-2 print:p-2 space-y-1 print:space-y-1' 
                        : 'p-2.5 print:p-2.5 space-y-1.5 print:space-y-1.5'
                    }`}
                  >
                    {/* Stay Header Bar */}
                    <div className={`flex items-center justify-between border-b border-slate-100 ${
                      isThreeOrMore ? 'pb-1 print:pb-1' : 'pb-1.5 print:pb-1.5'
                    }`}>
                      <div className="flex items-center">
                        <span className={`rounded-md bg-[#0a192f] text-white flex items-center justify-center font-black uppercase tracking-wider shadow-2xs ${
                          isThreeOrMore ? 'px-2 py-0.5 text-[10px] print:text-[9.5pt]' : 'px-2.5 py-0.5 text-xs print:text-[10pt]'
                        }`}>
                          {cityInfo.cityName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`rounded-full font-black uppercase bg-slate-100 text-slate-800 border border-slate-200 ${
                          isThreeOrMore ? 'px-1.5 py-0.5 text-[9px] print:text-[8.5pt]' : 'px-2 py-0.5 text-[10px] print:text-[9.5pt]'
                        }`}>
                          {stayNights} NIGHTS
                        </span>
                        <span className={`font-mono text-slate-600 font-bold ${
                          isThreeOrMore ? 'text-[10px] print:text-[8.5pt]' : 'text-xs print:text-[9.5pt]'
                        }`}>
                          {stay.hcn || 'HCN-108047'}
                        </span>
                      </div>
                    </div>

                    {/* Hotel Property Title & Dynamic Category Rating */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                      <div>
                        <h4 className={`font-black uppercase tracking-tight text-slate-900 ${
                          isThreeOrMore ? 'text-xs sm:text-sm print:text-[12pt]' : 'text-sm sm:text-base print:text-[13.5pt]'
                        }`}>
                          {stay.hotelName}
                        </h4>
                        {stay.distance && (
                          <span className={`text-slate-600 font-semibold flex items-center gap-1 ${
                            isThreeOrMore ? 'text-[9px] print:text-[8pt]' : 'text-[10px] print:text-[8.5pt]'
                          }`}>
                            <span>📍</span>
                            <span>{stay.distance}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 sm:self-start shrink-0">
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: starCount }).map((_, sIdx) => (
                            <Star key={sIdx} className="w-3 h-3 print:w-3.5 print:h-3.5 fill-amber-400 stroke-amber-500" />
                          ))}
                        </div>
                        <span className={`${isThreeOrMore ? 'text-[9.5px] print:text-[8.5pt]' : 'text-[10.5px] print:text-[9.5pt]'} font-bold text-slate-600`}>
                          {stay.category || `${starCount} Star Hotel`}
                        </span>
                      </div>
                    </div>

                    {/* 4 Clean Metric Boxes for Stay Information */}
                    <div className={`grid grid-cols-2 sm:grid-cols-4 pt-0.5 print:pt-1 ${
                      isThreeOrMore ? 'gap-1 print:gap-1.5' : 'gap-1.5 print:gap-2'
                    }`}>
                      
                      {/* Box 1: Check-in */}
                      <div className={`${isThreeOrMore ? 'p-1 print:p-1.5 print:py-1.5' : 'p-1.5 print:p-2'} bg-slate-50 border border-slate-200 rounded-md`}>
                        <span className={`${isThreeOrMore ? 'text-[8.5px] print:text-[8.5pt]' : 'text-[9.5px] print:text-[9pt]'} font-bold text-slate-500 uppercase tracking-wider block`}>
                          CHECK-IN
                        </span>
                        <span className={`font-mono font-black ${isThreeOrMore ? 'text-[10.5px] print:text-[10.5pt]' : 'text-xs sm:text-sm print:text-[11.5pt]'} text-slate-900 block mt-0.5`}>
                          {stay.checkIn}
                        </span>
                        <span className={`${isThreeOrMore ? 'text-[8px] print:text-[7.5pt]' : 'text-[9px] print:text-[8.5pt]'} text-slate-500 font-semibold block mt-0.5`}>
                          From 16:00 (Standard)
                        </span>
                      </div>

                      {/* Box 2: Check-out */}
                      <div className={`${isThreeOrMore ? 'p-1 print:p-1.5 print:py-1.5' : 'p-1.5 print:p-2'} bg-slate-50 border border-slate-200 rounded-md`}>
                        <span className={`${isThreeOrMore ? 'text-[8.5px] print:text-[8.5pt]' : 'text-[9.5px] print:text-[9pt]'} font-bold text-slate-500 uppercase tracking-wider block`}>
                          CHECK-OUT
                        </span>
                        <span className={`font-mono font-black ${isThreeOrMore ? 'text-[10.5px] print:text-[10.5pt]' : 'text-xs sm:text-sm print:text-[11.5pt]'} text-slate-900 block mt-0.5`}>
                          {stay.checkOut}
                        </span>
                        <span className={`${isThreeOrMore ? 'text-[8px] print:text-[7.5pt]' : 'text-[9px] print:text-[8.5pt]'} text-slate-500 font-semibold block mt-0.5`}>
                          Until 12:00 PM
                        </span>
                      </div>

                      {/* Box 3: Room Type */}
                      <div className={`${isThreeOrMore ? 'p-1 print:p-1.5 print:py-1.5' : 'p-1.5 print:p-2'} bg-slate-50 border border-slate-200 rounded-md`}>
                        <span className={`${isThreeOrMore ? 'text-[8.5px] print:text-[8.5pt]' : 'text-[9.5px] print:text-[9pt]'} font-bold text-slate-500 uppercase tracking-wider block`}>
                          Room Type :
                        </span>
                        <span className={`font-black ${isThreeOrMore ? 'text-[10.5px] print:text-[10.5pt]' : 'text-xs sm:text-sm print:text-[11.5pt]'} text-slate-900 block mt-0.5 uppercase`}>
                          {roomTypeDisplay}
                        </span>
                      </div>

                      {/* Box 4: Meal Basis */}
                      <div className={`${isThreeOrMore ? 'p-1 print:p-1.5 print:py-1.5' : 'p-1.5 print:p-2'} bg-slate-50 border border-slate-200 rounded-md`}>
                        <span className={`${isThreeOrMore ? 'text-[8.5px] print:text-[8.5pt]' : 'text-[9.5px] print:text-[9pt]'} font-bold text-slate-500 uppercase tracking-wider block`}>
                          MEAL BASIS
                        </span>
                        <span className={`font-black ${isThreeOrMore ? 'text-[10.5px] print:text-[10.5pt]' : 'text-xs sm:text-sm print:text-[11.5pt]'} text-slate-900 block mt-0.5 uppercase`}>
                          {stay.mealPlan || 'RO'} ({mealLabel})
                        </span>
                      </div>

                    </div>

                  </div>
                );
              })}
            </section>

            {/* ========================================================= */}
            {/* E. BOTTOM: ADVISORIES (BIG) & 24-HR EMERGENCY HELPLINE (SMALL BOTTOM RIGHT) */}
            {/* ========================================================= */}
            <section className={`grid grid-cols-1 sm:grid-cols-12 break-inside-avoid items-stretch ${
              isThreeOrMore ? 'gap-1.5 mb-1.5 print:gap-2 print:mb-2' : 'gap-2 mb-2 print:gap-2.5 print:mb-2.5'
            }`}>
              
              {/* Column 1 (BIG): Important Remarks & Guest Advisories */}
              <div className={`sm:col-span-8 border border-slate-200 rounded-lg bg-slate-50/70 flex flex-col justify-between ${
                isThreeOrMore ? 'p-1.5 print:p-2 space-y-1 print:space-y-1' : 'p-2.5 print:p-2.5 space-y-1.5'
              }`}>
                <div>
                  <div className={`flex items-center gap-1.5 border-b border-slate-200 ${
                    isThreeOrMore ? 'pb-0.5 mb-0.5 print:pb-1 print:mb-1' : 'pb-1 mb-1'
                  }`}>
                    <FileText className="w-3.5 h-3.5 text-slate-700" />
                    <h4 className={`font-extrabold text-slate-900 uppercase tracking-tight ${
                      isThreeOrMore ? 'text-[11px] print:text-[9.5pt]' : 'text-xs sm:text-sm print:text-[10.5pt]'
                    }`}>
                      Important Remarks &amp; Guest Advisories
                    </h4>
                  </div>

                  <ul className={`text-slate-700 list-disc list-inside leading-snug font-medium ${
                    isThreeOrMore ? 'text-[9.5px] print:text-[8pt] space-y-0.5 print:space-y-0.5' : 'text-[11px] sm:text-xs print:text-[9.5pt] space-y-0.5'
                  }`}>
                    <li>Standard check-in begins at 16:00; check-out deadline is strictly 12:00 PM. Late check-out incurs a full-night tariff.</li>
                    <li>Original Passports, Umrah Visas, and this voucher must be surrendered upon front desk arrival for check-in registry.</li>
                    <li>Room allocation is strictly as reserved. Upgrades or adjustments are subject to availability and direct hotel fee.</li>
                    <li>Municipal city taxes and KSA VAT (15%) are fully prepaid. Incidentals (minibar, room phone) are billed directly to guests.</li>
                  </ul>
                </div>

                {/* Urdu Compliance Note */}
                <div className={`bg-amber-50 border border-amber-200 rounded-md text-right font-sans ${
                  isThreeOrMore ? 'p-1 print:p-1.5' : 'p-1.5 print:p-2'
                }`} dir="rtl">
                  <p className={`font-urdu font-bold text-amber-950 leading-normal ${
                    isThreeOrMore ? 'text-[10px] print:text-[8.5pt]' : 'text-xs print:text-[10.5pt]'
                  }`}>
                    ضروری ہدایات: ہوٹل چیک آؤٹ وقت دوپہر 12 بجے ہے اور باقاعدہ واؤچر کا ہمراہ ہونا ضروری ہے۔
                  </p>
                </div>
              </div>

              {/* Column 2 (SMALL AT BOTTOM RIGHT): 24-Hour Emergency (Helpline) */}
              <div className={`sm:col-span-4 border border-slate-200 rounded-lg bg-slate-50/70 flex flex-col justify-between self-end w-full ${
                isThreeOrMore ? 'p-1.5 print:p-2 space-y-1 print:space-y-1' : 'p-2.5 print:p-2.5 space-y-1.5'
              }`}>
                <div>
                  <div className={`flex items-center justify-between border-b border-slate-200 ${
                    isThreeOrMore ? 'pb-0.5 mb-0.5 print:pb-1 print:mb-1' : 'pb-1 mb-1'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <PhoneCall className="w-3 h-3 text-emerald-700" />
                      <h4 className={`font-extrabold text-slate-900 uppercase tracking-tight ${
                        isThreeOrMore ? 'text-[10px] print:text-[9pt]' : 'text-[11px] print:text-[10pt]'
                      }`}>
                        24-Hour Emergency (Helpline)
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowEditEmergency(true)}
                      className="no-print text-[9px] font-bold text-slate-500 hover:text-slate-800 inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className={`text-xs ${isThreeOrMore ? 'space-y-0.5 print:space-y-1' : 'space-y-1'}`}>
                    {Array.isArray(activeContactsList) && activeContactsList.length > 0 ? (
                      activeContactsList.map((contact, cIdx) => {
                        const isMulti = (contact.value || '').length > 30 || (contact.label || '').toLowerCase().includes('pk') || (contact.label || '').toLowerCase().includes('head');
                        if (isMulti) {
                          return (
                            <div 
                              key={contact.id || cIdx} 
                              className={`bg-white border border-slate-200 rounded-md space-y-0.5 ${
                                isThreeOrMore ? 'p-0.5 print:p-1' : 'p-1 print:p-1'
                              }`}
                            >
                              <span className={`font-bold text-slate-500 block text-[9px] ${isThreeOrMore ? 'print:text-[8pt]' : 'print:text-[8.5pt]'}`}>
                                {contact.label}:
                              </span>
                              <span className={`font-mono font-black text-slate-900 leading-snug block text-[9.5px] ${isThreeOrMore ? 'print:text-[8.5pt]' : 'print:text-[9pt]'}`}>
                                {contact.value}
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div 
                            key={contact.id || cIdx} 
                            className={`flex items-center justify-between bg-white border border-slate-200 rounded-md ${
                              isThreeOrMore ? 'p-0.5 print:p-1' : 'p-1 print:p-1'
                            }`}
                          >
                            <span className={`font-bold text-slate-500 text-[10px] ${isThreeOrMore ? 'print:text-[8.5pt]' : 'print:text-[9pt]'}`}>
                              {contact.label}:
                            </span>
                            <span className={`font-mono font-black text-slate-900 text-[10.5px] ${isThreeOrMore ? 'print:text-[9pt]' : 'print:text-[10pt]'}`}>
                              {contact.value}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <>
                        <div className={`flex items-center justify-between bg-white border border-slate-200 rounded-md ${
                          isThreeOrMore ? 'p-0.5 print:p-1' : 'p-1 print:p-1'
                        }`}>
                          <span className={`font-bold text-slate-500 text-[10px] ${isThreeOrMore ? 'print:text-[8.5pt]' : 'print:text-[9pt]'}`}>KSA Ground:</span>
                          <span className={`font-mono font-black text-slate-900 text-[10.5px] ${isThreeOrMore ? 'print:text-[9pt]' : 'print:text-[10pt]'}`}>{currentKsaGround}</span>
                        </div>

                        <div className={`flex items-center justify-between bg-white border border-slate-200 rounded-md ${
                          isThreeOrMore ? 'p-0.5 print:p-1' : 'p-1 print:p-1'
                        }`}>
                          <span className={`font-bold text-slate-500 text-[10px] ${isThreeOrMore ? 'print:text-[8.5pt]' : 'print:text-[9pt]'}`}>Madinah:</span>
                          <span className={`font-mono font-black text-slate-900 text-[10.5px] ${isThreeOrMore ? 'print:text-[9pt]' : 'print:text-[10pt]'}`}>{currentMadinah}</span>
                        </div>

                        <div className={`bg-white border border-slate-200 rounded-md space-y-0.5 ${
                          isThreeOrMore ? 'p-0.5 print:p-1' : 'p-1 print:p-1'
                        }`}>
                          <span className={`font-bold text-slate-500 block text-[9px] ${isThreeOrMore ? 'print:text-[8pt]' : 'print:text-[8.5pt]'}`}>PK Head Office:</span>
                          <span className={`font-mono font-black text-slate-900 leading-snug block text-[9.5px] ${isThreeOrMore ? 'print:text-[8.5pt]' : 'print:text-[9pt]'}`}>
                            {currentPkHeadOffice}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

            </section>

            {/* ========================================================= */}
            {/* F. DOCUMENT LEGAL FOOTER */}
            {/* ========================================================= */}
            <footer className={`border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-1 text-slate-500 font-semibold text-center sm:text-left ${
              isThreeOrMore ? 'pt-1.5 print:pt-1.5 text-[8.5px] print:text-[8pt]' : 'pt-1.5 print:pt-2 text-[9.5px] print:text-[8.5pt]'
            }`}>
              <span>
                Official Corporate Itinerary &amp; Hospitality Settlement Archive • ISO 216 Ready
              </span>
              <span className="font-mono text-slate-600">
                CRS Reference: {voucher.pnr || voucher.voucherNo} • Voucher Valid for Direct Check-In Surrender
              </span>
            </footer>

          </main>
        );
      })()}

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
