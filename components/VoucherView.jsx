'use client';

import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import { useAuth } from '../lib/AuthContext';
import { 
  Building2, 
  Plane, 
  Bus, 
  Users, 
  Calendar, 
  Clock, 
  PhoneCall, 
  ShieldCheck, 
  CheckCircle2, 
  Printer, 
  Share2, 
  MapPin, 
  FileText,
  Award,
  Sparkles,
  Bed,
  Check,
  Edit3
} from 'lucide-react';
import { formatVoucherDate, calculateNights, parseDateObj } from '../lib/dateUtils';

export { formatVoucherDate, calculateNights, parseDateObj };

function formatDisplayName(name) {
  if (!name) return '—';
  let str = String(name).trim();
  str = str.replace(/(\s*\/\s*(MR|MRS|MS|MISS|CHD|INF|MSTR|MASTER|CHILD|INFANT|LADY|GENT))+\s*$/gi, '').trim();
  str = str.replace(/\s*\/+\s*$/g, '').trim();
  return str.toUpperCase();
}

function getGender(pax) {
  const pfx = (pax?.prefix || '').toUpperCase();
  const name = (pax?.name || '').toUpperCase();
  if (
    pfx === 'MRS' || pfx === 'MS' || pfx === 'MISS' || pfx === 'CHD_MISS' || pfx === 'INF_MISS' || pfx === 'LADY' ||
    name.includes('/MRS') || name.includes('/MISS') || name.includes('/MS') ||
    name.includes('BEGUM') || name.includes('PARVEEN') || name.includes('KHATOON') || name.includes('BIBI') || name.includes('FATIMA') || name.includes('SAIMA') || name.includes('AASIA') || name.includes('SADIA') || name.includes('UMAIMA') || name.includes('RUKHSANA') || name.includes('SUGHRAN')
  ) {
    return 'F';
  }
  return 'M';
}

function getPaxCategory(pax) {
  const pfx = (pax?.prefix || '').toUpperCase();
  const name = (pax?.name || '').toUpperCase();
  if (pfx.startsWith('INF') || name.includes('/INF')) return 'Infant';
  if (pfx.startsWith('CHD') || pfx === 'CHILD' || pfx === 'MSTR' || name.includes('/CHD') || name.includes('MSTR')) return 'Child';
  return 'Adult';
}

function formatPakistaniPhone(str) {
  if (!str) return '';
  return String(str)
    .replace(/\b(03\d{2})[\s-]*(\d{3})[\s-]*(\d{4})\b/g, '$1-$2$3')
    .replace(/\b(03\d{2})[\s-]*(\d{7})\b/g, '$1-$2');
}

export default function VoucherView({ voucher, origin = '' }) {
  if (!voucher) return null;
  const { isAdmin } = useAuth();
  const voucherUrl = origin ? `${origin}/voucher/${voucher.slug || voucher.id}` : '';
  const idNum = parseInt(voucher.id || 1) || 1;
  const voucherRefNo = voucher.ubNumber || voucher.voucherRefNo || `UB-${String(idNum).padStart(4, '0')}`;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Calculate total nights dynamically from dates
  const totalNights = voucher.accommodations?.reduce((acc, curr) => acc + (calculateNights(curr.checkIn, curr.checkOut, curr.nights) || 0), 0) || 18;

  // Extract flight departure and return
  const departureFlight = voucher.flights?.[0] || {
    flight: 'F3-830',
    from: 'KHI',
    to: 'JED',
    date: '2026-10-01',
    departure: '08:00',
    arrival: '10:05'
  };

  const returnFlight = voucher.flights?.[1] || {
    flight: 'F3-829',
    from: 'JED',
    to: 'KHI',
    date: '2026-10-19',
    departure: '12:45',
    arrival: '07:00'
  };

  const voucherCreationDate = voucher.voucherDate || voucher.created_at || voucher.createdAt || new Date().toISOString();

  // Calculate total beds dynamically
  const totalBeds = voucher.passengers && voucher.passengers.length > 0
    ? voucher.passengers.reduce((acc, p) => {
        const cat = getPaxCategory(p);
        const hasBed = cat === 'Adult' ? (p.hasBed !== false) : Boolean(p.hasBed);
        return acc + (hasBed ? 1 : 0);
      }, 0)
    : (voucher.totalPax || 1);

  // Calculate pax category breakdown
  let gents = 0, ladies = 0, children = 0, infants = 0;
  if (voucher.passengers && voucher.passengers.length > 0) {
    voucher.passengers.forEach(p => {
      const cat = getPaxCategory(p);
      const g = getGender(p);
      if (cat === 'Adult') {
        if (g === 'M') gents++;
        else ladies++;
      } else if (cat === 'Child') {
        children++;
      } else if (cat === 'Infant') {
        infants++;
      }
    });
  }
  const paxSummaryText = (voucher.passengers && voucher.passengers.length > 0)
    ? `GENT(S) - ${gents}   LAD(IES) - ${ladies}   CHILD(REN) - ${children}   INFANT(S) - ${infants}`
    : (voucher.paxCounts ? voucher.paxCounts.replaceAll(':', ' - ') : 'GENT(S) - 1   LAD(IES) - 0   CHILD(REN) - 0   INFANT(S) - 0');

  const ksaJeddahAirport = voucher.ksaJeddahAirport ?? voucher.ksa_jeddah_airport ?? (voucher.passengers && voucher.passengers[0]?.ksaJeddahAirport) ?? '';
  const ksaJeddahSpecial = voucher.ksaJeddahSpecial ?? voucher.ksa_jeddah_special ?? (voucher.passengers && voucher.passengers[0]?.ksaJeddahSpecial) ?? '';
  const ksaJeddahSharing = voucher.ksaJeddahSharing ?? voucher.ksa_jeddah_sharing ?? (voucher.passengers && voucher.passengers[0]?.ksaJeddahSharing) ?? '';
  const ksaMakkahSharing = voucher.ksaMakkahSharing ?? voucher.ksa_makkah_sharing ?? (voucher.passengers && voucher.passengers[0]?.ksaMakkahSharing) ?? '';
  const ksaMakkahSpecial = voucher.ksaMakkahSpecial ?? voucher.ksa_makkah_special ?? (voucher.passengers && voucher.passengers[0]?.ksaMakkahSpecial) ?? '';
  const ksaMadinahSharing = voucher.ksaMadinahSharing ?? voucher.ksa_madinah_sharing ?? (voucher.passengers && voucher.passengers[0]?.ksaMadinahSharing) ?? '';
  const ksaMadinahSpecial = voucher.ksaMadinahSpecial ?? voucher.ksa_madinah_special ?? (voucher.passengers && voucher.passengers[0]?.ksaMadinahSpecial) ?? '';

  return (
    <>
      <div className="voucher-container voucher-page-1 max-w-[850px] mx-auto bg-white rounded-none shadow-2xl border border-slate-300 overflow-hidden text-slate-800 p-4 sm:p-7 print:p-3 print:border-2 print:border-[#0a192f] text-[11px] leading-tight print:max-w-full print:w-full print:m-0 print:flex print:flex-col print:justify-start">
        
        {/* Top Content wrapper */}
        <div className="space-y-2.5 print:space-y-1.5">
        
        {/* 1. TOP HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-center justify-between pb-3 print:pb-2 border-b border-slate-200 gap-3 print:gap-2 text-center sm:text-left">
        
        {/* Left: Agency Name & Voucher Meta */}
        <div className="space-y-2 print:space-y-1 flex-[1.3] text-center sm:text-left shrink-0 order-2 sm:order-1">
          <div>
            <h1 className="text-[17px] sm:text-[20px] print:text-[15.5pt] font-black tracking-tight text-[#0a192f] uppercase sm:whitespace-nowrap leading-tight">
              {voucher.companyName || 'CHEEPA FJ TRAVELS'}
            </h1>
            <p className="text-[11px] sm:text-[12px] print:text-[8.5pt] text-slate-500 font-bold tracking-wide">
              Official Umrah Portal
            </p>
          </div>

          {/* Voucher Meta details */}
          <div className="text-[11px] leading-snug space-y-1 print:space-y-0.5 text-slate-700 pt-1 print:pt-0.5 print:text-[8.5pt]">
            <div>
              <span className="font-bold text-slate-900">Voucher Date:</span>{' '}
              <span className="font-semibold text-slate-800">
                {formatVoucherDate(voucherCreationDate)}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-900">Package:</span>{' '}
              <span suppressHydrationWarning className="font-semibold text-slate-800">{totalNights} Standard Umrah</span>
            </div>
          </div>
        </div>

        {/* Center: Prominent Large Centered Logo + UB Ref Badge */}
        <div className="flex flex-col items-center justify-center text-center space-y-2 print:space-y-1 flex-[1.4] order-1 sm:order-2">
          <img 
            src="/logo.png" 
            alt="Cheepa Travels Logo" 
            className="h-28 sm:h-40 max-w-[280px] sm:max-w-[340px] w-auto object-contain print:h-28 drop-shadow-md transition-all" 
          />
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-[11px] print:text-[9pt] tracking-wider text-[#0a192f] uppercase">
              HOTEL
            </span>
            <span className="bg-[#0a192f] text-[#dfba73] font-bold text-[10px] print:text-[8.5pt] px-3 py-0.5 rounded tracking-wider shadow-sm">
              {voucherRefNo}
            </span>
          </div>
        </div>

        {/* Right: Self Visa Badge */}
        <div className="text-center sm:text-right flex-[0.9] pr-0 sm:pr-1 order-3 flex justify-center sm:justify-end">
          {voucher.isSelfVisa !== false && (
            <div className="border-2 border-[#dfba73] bg-[#fdf8ee] rounded-xl px-4 py-2.5 print:px-3 print:py-2 shadow-xs text-center inline-block min-w-[140px] print:min-w-[125px]">
              <h2 className="text-[17px] sm:text-[20px] print:text-[15pt] font-black text-[#0a192f] tracking-tight uppercase leading-none">
                SELF VISA
              </h2>
              <p className="text-[12px] sm:text-[13px] print:text-[9.5pt] font-black text-[#926818] tracking-widest uppercase mt-1 print:mt-0.5">
                ISLAMABAD
              </p>
            </div>
          )}
        </div>

      </div>

      {/* 2. FAMILY HEAD BAR */}
      <div className="bg-[#f8fafc] border border-slate-300 rounded mt-3 py-2 sm:py-1.5 px-3 text-[11px] flex items-center justify-between text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <span className="font-bold text-slate-600">Family Head:</span>
          <span className="font-extrabold text-[#0a192f] uppercase text-xs tracking-wide">
            {formatDisplayName(voucher.party || 'MUHAMMAD INSHAL SYED')}
          </span>
        </div>
      </div>

      {/* 3. MUTAMERS & PILGRIMS DETAILS */}
      <div className="mt-3 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[#0a192f] font-bold text-xs uppercase tracking-wide">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c29648]" />
            <span>MUTAMERS &amp; PILGRIMS DETAILS</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            TOTAL PASSENGERS: <strong className="text-[#0a192f]">{String(voucher.totalPax || voucher.passengers?.length || 1).padStart(2, '0')}</strong>
          </span>
        </div>

        <div className="overflow-x-auto w-full -mx-1 px-1 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[620px] sm:min-w-0 border-collapse border border-slate-300 text-left text-[10.5px]">
          <thead>
            <tr className="bg-[#0a192f] text-white font-bold uppercase text-[9.5px]">
              <th className="border border-slate-300 py-1 px-2 text-center w-10">SNO</th>
              <th className="border border-slate-300 py-1 px-3">PASSPORT</th>
              <th className="border border-slate-300 py-1 px-4">MUTAMER NAME</th>
              <th className="border border-slate-300 py-1 px-2 text-center w-12">GENDER</th>
              <th className="border border-slate-300 py-1 px-2 text-center w-14">PAX</th>
              <th className="border border-slate-300 py-1 px-2 text-center w-12">BED</th>
              <th className="border border-slate-300 py-1 px-3 text-center">GROUP NO</th>
              <th className="border border-slate-300 py-1 px-2 text-center">VISA #</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300 bg-white">
            {voucher.passengers && voucher.passengers.length > 0 ? (
              voucher.passengers.map((pax, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="border border-slate-300 py-1.5 px-2 text-center font-bold text-slate-600">
                    {pax.sNo || i + 1}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-3 font-mono font-bold text-[#0a192f] uppercase">
                    {(pax.passportNo || '—').toUpperCase()}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-4 font-bold text-slate-900 uppercase">
                    {formatDisplayName(pax.name)}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-2 text-center font-bold text-slate-700">
                    {getGender(pax)}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-2 text-center font-medium text-slate-700">
                    {getPaxCategory(pax)}
                  </td>
                  <td className={`border border-slate-300 py-1.5 px-2 text-center font-bold ${(getPaxCategory(pax) === 'Adult' ? pax.hasBed !== false : Boolean(pax.hasBed)) ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {(getPaxCategory(pax) === 'Adult' ? pax.hasBed !== false : Boolean(pax.hasBed)) ? 'Yes' : 'No'}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-3 text-center font-mono text-slate-600">
                    {pax.group || '-'}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-2 text-center font-mono text-slate-600">
                    {pax.visaNo || '-'}
                  </td>
                </tr>
              ))
            ) : null}
            {/* Summary Row for Pax Details and Beds (Spanned Structure) */}
            <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
              <td colSpan={5} className="border border-slate-300 py-1.5 px-3 text-[#0a192f] text-[9px] sm:text-[9.5px] font-bold tracking-wide whitespace-nowrap">
                <span>GENT(S) - {gents}</span>
                <span className="text-emerald-600 font-black px-1.5 select-none">•</span>
                <span>LAD(IES) - {ladies}</span>
                <span className="text-emerald-600 font-black px-1.5 select-none">•</span>
                <span>CHILD(REN) - {children}</span>
                <span className="text-emerald-600 font-black px-1.5 select-none">•</span>
                <span>INFANT(S) - {infants}</span>
              </td>
              <td colSpan={3} className="border border-slate-300 py-1.5 px-3 text-center font-bold text-[#0a192f] text-[9.5px] whitespace-nowrap bg-[#fdf8ee]">
                Bed - {totalBeds}
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      {/* 4. ACCOMMODATION ITINERARY (With APPROVED diagonal watermark) */}
      <div className="mt-3.5 space-y-1 relative">
        
        {/* Transparent APPROVED Green Stamp Watermark (15% Opacity) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none">
          <div className="transform -rotate-12 text-center">
            <span 
              className="text-5xl sm:text-6xl font-black tracking-[0.25em] uppercase select-none"
              style={{ color: '#059669', opacity: 0.15 }}
            >
              APPROVED
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[#0a192f] font-bold text-xs uppercase tracking-wide">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c29648]" />
            <span>ACCOMMODATION ITINERARY</span>
          </div>
          <span className="text-[9.5px] font-bold px-2.5 py-0.5 rounded bg-[#fdf8ee] text-[#b48226] border border-[#e8ce97] uppercase tracking-wider">
            HOTEL CONFIRMATION VERIFIED
          </span>
        </div>

        <div className="overflow-x-auto w-full -mx-1 px-1 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[620px] sm:min-w-0 border-collapse border border-slate-300 text-left text-[10.5px]">
          <thead>
            <tr className="bg-[#0a192f] text-white font-bold uppercase text-[9.5px] whitespace-nowrap">
              <th className="border border-slate-300 py-1 px-3 whitespace-nowrap">CITY</th>
              <th className="border border-slate-300 py-1 px-4 whitespace-nowrap">HOTEL NAME</th>
              <th className="border border-slate-300 py-1 px-2.5 text-center font-mono whitespace-nowrap">UB #</th>
              <th className="border border-slate-300 py-1 px-2 text-center whitespace-nowrap">MEAL</th>
              <th className="border border-slate-300 py-1 px-2 text-center whitespace-nowrap">HCN#</th>
              <th className="border border-slate-300 py-1 px-3 whitespace-nowrap">ROOM TYPE</th>
              <th className="border border-slate-300 py-1 px-3 text-center whitespace-nowrap">CHECKIN</th>
              <th className="border border-slate-300 py-1 px-3 text-center whitespace-nowrap">CHECKOUT</th>
              <th className="border border-slate-300 py-1 px-3 text-center w-14 whitespace-nowrap">NIGHTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300 bg-white">
            {voucher.accommodations && voucher.accommodations.length > 0 ? (
              voucher.accommodations.map((acc, i) => (
                <tr key={i} className="hover:bg-slate-50 whitespace-nowrap">
                  <td className="border border-slate-300 py-1.5 px-3 font-bold text-[#0a192f] whitespace-nowrap">
                    {acc.city === 'MAKKAH' ? 'Makkah' : (acc.city === 'MADINAH' ? 'Medinah' : acc.city)}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {acc.hotelName}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-2.5 text-center font-mono font-bold text-[#0a192f] whitespace-nowrap">
                    {String(acc.ubNo || acc.ubNumber || voucher.ubNumber || '—').toUpperCase()}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-2 text-center text-slate-600 font-semibold whitespace-nowrap">
                    RO
                  </td>
                  <td className="border border-slate-300 py-1.5 px-2 text-center font-mono font-semibold text-slate-700 whitespace-nowrap">
                    {acc.hcn || acc.hotelCode || acc.confirmationNo || '378'}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-3 text-slate-800 font-medium whitespace-nowrap">
                    {acc.roomType || acc.room_type || acc.rpp || acc.type || 'Double Bed'}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-3 text-center font-mono text-slate-800 font-semibold whitespace-nowrap">
                    {formatVoucherDate(acc.checkIn)}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-3 text-center font-mono text-slate-800 font-semibold whitespace-nowrap">
                    {formatVoucherDate(acc.checkOut)}
                  </td>
                  <td suppressHydrationWarning className="border border-slate-300 py-1.5 px-3 text-center font-bold text-[#0a192f] whitespace-nowrap">
                    {calculateNights(acc.checkIn, acc.checkOut, acc.nights)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="border border-slate-300 text-center py-2 text-slate-400 whitespace-nowrap">
                  No accommodation scheduled.
                </td>
              </tr>
            )}
            
            {/* Total Duration Nights Footer Row */}
            <tr className="bg-[#f8fafc] font-bold text-[#0a192f] whitespace-nowrap">
              <td colSpan={8} className="border border-slate-300 py-1.5 px-3 text-right uppercase tracking-wider text-[10px] whitespace-nowrap">
                TOTAL DURATION (NIGHTS):
              </td>
              <td suppressHydrationWarning className="border border-slate-300 py-1.5 px-3 text-center bg-[#dfba73] text-[#0a192f] font-black text-xs whitespace-nowrap">
                {totalNights}
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      {/* 5. TRANSPORT SERVICES (FULL WIDTH) */}
      <div className="space-y-1 mt-2.5 print:mt-2">
        <div className="flex items-center gap-1.5 text-[#0a192f] font-bold text-xs uppercase tracking-wide">
          <span className="w-2.5 h-2.5 rounded-full bg-[#c29648]" />
          <span>TRANSPORT SERVICES</span>
        </div>

        <div className="overflow-x-auto w-full -mx-1 px-1 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[480px] sm:min-w-0 border-collapse border border-slate-300 text-left text-[10px]">
            <thead>
              <tr className="bg-[#0a192f] text-white font-bold uppercase text-[9px] whitespace-nowrap">
                <th className="border border-slate-300 py-1 px-3 w-28 text-center whitespace-nowrap">DATE</th>
                <th className="border border-slate-300 py-1 px-3 whitespace-nowrap">DESCRIPTION</th>
                <th className="border border-slate-300 py-1 px-3 w-40 whitespace-nowrap">TRANSPORTER</th>
                <th className="border border-slate-300 py-1 px-3 w-24 text-center whitespace-nowrap">TYPE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 bg-white">
              {voucher.transports && voucher.transports.length > 0 ? (
                voucher.transports.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 whitespace-nowrap">
                    <td className="border border-slate-300 py-1 px-3 text-center font-mono font-semibold text-slate-700 whitespace-nowrap">
                      {t.pickupDate ? formatVoucherDate(t.pickupDate) : '—'}
                    </td>
                    <td className="border border-slate-300 py-1 px-3 font-medium text-slate-900 whitespace-nowrap">
                      {t.service || t.description || '—'}
                    </td>
                    <td className="border border-slate-300 py-1 px-3 font-bold text-slate-800 whitespace-nowrap">
                      {t.transporter || (idx === 0 || t.vehicle?.toUpperCase() === 'BUS' ? 'Company Transport' : 'Private Transport')}
                    </td>
                    <td className="border border-slate-300 py-1 px-3 text-center text-slate-700 font-mono uppercase whitespace-nowrap">
                      {t.vehicle || 'BUS'}
                    </td>
                  </tr>
                ))
              ) : (
                <>
                  <tr className="hover:bg-slate-50 whitespace-nowrap">
                    <td className="border border-slate-300 py-1.5 px-3 text-center font-mono font-semibold text-slate-700 whitespace-nowrap">
                      01-Oct-2026
                    </td>
                    <td className="border border-slate-300 py-1.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                      JED AIRPORT TO MAKKAH HOTEL
                    </td>
                    <td className="border border-slate-300 py-1.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                      Company Transport
                    </td>
                    <td className="border border-slate-300 py-1.5 px-3 text-center text-slate-700 font-mono uppercase whitespace-nowrap">
                      BUS
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 whitespace-nowrap">
                    <td className="border border-slate-300 py-1.5 px-3 text-center font-mono font-semibold text-slate-700 whitespace-nowrap">
                      06-Oct-2026
                    </td>
                    <td className="border border-slate-300 py-1.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                      MAKKAH HOTEL TO MADINAH HOTEL
                    </td>
                    <td className="border border-slate-300 py-1.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                      Company Transport
                    </td>
                    <td className="border border-slate-300 py-1.5 px-3 text-center text-slate-700 font-mono uppercase whitespace-nowrap">
                      BUS
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. FLIGHT SCHEDULE (FULL WIDTH - 1 PER ROW) */}
      <div className="space-y-1.5 mt-2.5 print:mt-2">
        <div className="flex items-center gap-1.5 text-[#0a192f] font-bold text-xs uppercase tracking-wide">
          <span className="w-2.5 h-2.5 rounded-full bg-[#c29648]" />
          <span>FLIGHT SCHEDULE</span>
        </div>

        <div className="space-y-1.5 text-[10px]">
          {/* Departure Flight Card (Full Width) */}
          <div className="border border-slate-300 rounded p-1.5 sm:p-2 bg-white flex flex-col justify-between">
            <div className="pb-1 mb-1 border-b border-slate-200">
              <span className="font-bold text-[#0a192f] text-[9px] sm:text-[9.5px] uppercase tracking-wider whitespace-nowrap">
                DEPARTURE FLIGHT (PAK-KSA)
              </span>
            </div>
            <div className="grid grid-cols-6 text-center pt-0.5">
              <div className="border-r border-slate-100">
                <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">DATE</span>
                <span className="font-bold text-[#0a192f] text-[9.5px] font-mono whitespace-nowrap">
                  {departureFlight.date ? formatVoucherDate(departureFlight.date) : '—'}
                </span>
              </div>
              <div className="border-r border-slate-100">
                <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">FLIGHT NO.</span>
                <span className="font-bold text-slate-900 text-[9.5px] font-mono whitespace-nowrap uppercase">
                  {departureFlight.flight || '—'}
                </span>
              </div>
              <div className="border-r border-slate-100">
                <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">SECTOR</span>
                <span className="font-bold text-slate-900 text-[9.5px] font-mono whitespace-nowrap uppercase">
                  {(departureFlight.from || 'KHI')}-{(departureFlight.to || 'JED')}
                </span>
              </div>
              <div className="border-r border-slate-100">
                <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">DEPARTURE</span>
                <span className="font-bold text-slate-900 text-[9.5px] font-mono whitespace-nowrap">
                  {departureFlight.departure || '—'}
                </span>
              </div>
              <div className="border-r border-slate-100">
                <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">ARRIVAL</span>
                <span className="font-bold text-slate-900 text-[9.5px] font-mono whitespace-nowrap">
                  {departureFlight.arrival || '—'}
                </span>
              </div>
              <div>
                <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">PNR</span>
                <span className="font-bold text-[#0a192f] text-[9.5px] font-mono whitespace-nowrap uppercase">
                  {departureFlight.pnr || voucher.pnr || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Return Flight Card (Full Width) */}
          <div className="border border-slate-300 rounded p-1.5 sm:p-2 bg-white flex flex-col justify-between">
            <div className="pb-1 mb-1 border-b border-slate-200">
              <span className="font-bold text-[#0a192f] text-[9px] sm:text-[9.5px] uppercase tracking-wider whitespace-nowrap">
                RETURN FLIGHT (KSA-PAK)
              </span>
            </div>
            <div className="grid grid-cols-6 text-center pt-0.5">
              <div className="border-r border-slate-100">
                <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">DATE</span>
                <span className="font-bold text-[#0a192f] text-[9.5px] font-mono whitespace-nowrap">
                  {returnFlight.date ? formatVoucherDate(returnFlight.date) : '—'}
                </span>
              </div>
              <div className="border-r border-slate-100">
                <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">FLIGHT NO.</span>
                <span className="font-bold text-slate-900 text-[9.5px] font-mono whitespace-nowrap uppercase">
                  {returnFlight.flight || '—'}
                </span>
              </div>
              <div className="border-r border-slate-100">
                <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">SECTOR</span>
                <span className="font-bold text-slate-900 text-[9.5px] font-mono whitespace-nowrap uppercase">
                  {(returnFlight.from || 'JED')}-{(returnFlight.to || 'KHI')}
                </span>
              </div>
              <div className="border-r border-slate-100">
                <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">DEPARTURE</span>
                <span className="font-bold text-slate-900 text-[9.5px] font-mono whitespace-nowrap">
                  {returnFlight.departure || '—'}
                </span>
              </div>
              <div className="border-r border-slate-100">
                <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">ARRIVAL</span>
                <span className="font-bold text-slate-900 text-[9.5px] font-mono whitespace-nowrap">
                  {returnFlight.arrival || '—'}
                </span>
              </div>
              <div>
                <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">PNR</span>
                <span className="font-bold text-[#0a192f] text-[9.5px] font-mono whitespace-nowrap uppercase">
                  {returnFlight.pnr || voucher.pnr || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. DIGITAL VERIFICATION & PAKISTAN HELPLINE (OPTION B) */}
      <div className="mt-2.5 print:mt-2 border border-slate-300 rounded-lg p-2 sm:p-2.5 print:p-2 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 print:gap-2 shadow-xs">
        <div className="flex items-center gap-3 print:gap-2.5">
          <div className="p-1.5 print:p-1 bg-white border border-slate-200 rounded-lg shadow-inner shrink-0">
            {voucherUrl ? (
              <QRCodeSVG value={voucherUrl} size={80} className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] print:w-[68px] print:h-[68px]" level="H" />
            ) : (
              <div className="w-14 h-14 print:w-16 print:h-16 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                QR Code
              </div>
            )}
          </div>
          <div className="space-y-1 print:space-y-0.5 text-left">
            <span className="px-3 py-0.5 print:px-2.5 print:py-0.5 rounded bg-emerald-50 text-emerald-700 font-extrabold text-[10px] print:text-[9pt] border border-emerald-200 tracking-wider uppercase inline-block">
              Authorized
            </span>
          </div>
        </div>

        {/* Pakistan Helpline Text */}
        <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-1.5 sm:pt-0 sm:pl-4 print:pt-0 print:pl-3 w-full sm:w-auto">
          <span className="text-[#805a1b] font-black text-[9.5px] print:text-[8.5pt] uppercase tracking-wider block mb-1 print:mb-0.5">
            PAKISTAN HELPLINE (24/7)
          </span>
          <div className="text-[#0a192f] font-black text-xs sm:text-[12.5px] print:text-[9.5pt] font-mono tracking-tight leading-tight space-y-0.5 print:space-y-0.5">
            {(() => {
              const isNoor = (voucher.companyName && voucher.companyName.toUpperCase().includes('NOOR')) || 
                             (voucher.logo && voucher.logo.toLowerCase().includes('noor')) ||
                             (voucher.domain && voucher.domain.includes('noor'));
              let helplineStr = voucher.pakistanHelpline;
              
              if (isNoor && (!helplineStr || helplineStr.toUpperCase().includes('FAIZAN') || helplineStr.toUpperCase().includes('MURTAZA'))) {
                helplineStr = 'UBAID RAZA MEMON 0311-2264567 / BACKUP: MADNI RAZA MEMON 0312-8039911';
              } else if (!helplineStr) {
                helplineStr = isNoor 
                  ? 'UBAID RAZA MEMON 0311-2264567 / BACKUP: MADNI RAZA MEMON 0312-8039911'
                  : 'MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683';
              }

              if (helplineStr && helplineStr.includes('/')) {
                return helplineStr.split('/').map((line, idx) => (
                  <div key={idx} className="whitespace-nowrap">
                    {formatPakistaniPhone(line.trim())}
                  </div>
                ));
              }
              return (
                <div className="whitespace-nowrap">
                  {formatPakistaniPhone(helplineStr)}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* 8. KSA OPERATIONAL HELPLINES (FULL WIDTH FOOTER) */}
      <div className="mt-3 print:mt-2 bg-[#0a192f] text-white rounded-lg p-3 sm:p-3.5 print:p-2 text-[10.5px] print:rounded">
        <div className="border-b border-slate-700/80 pb-1.5 print:pb-1 mb-2 print:mb-1.5 text-center sm:text-left">
          <span className="text-[#dfba73] font-black text-[11px] sm:text-[12px] tracking-wider uppercase print:text-[9pt]">
            KSA OPERATIONAL HELPLINES (24/7 GROUND SUPPORT)
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3 print:gap-2 text-[9.5px] sm:text-[10.5px] leading-snug print:text-[8pt]">
          <div className="border-r border-slate-700/60 pr-2 print:pr-1.5">
            <span className="text-[#dfba73] font-black block uppercase text-[9.5px] sm:text-[10.5px] print:text-[8pt] tracking-wider">JEDDAH AIRPORT</span>
            <span className="text-slate-300 block text-[9px] sm:text-[10px] print:text-[7.5pt] mt-0.5">Airport (24/7):</span>
            <span className="font-black font-mono text-white text-[12px] sm:text-[13.5px] print:text-[10pt] block mt-0.5">{ksaJeddahAirport}</span>
          </div>
          <div className="border-r border-slate-700/60 pr-2 print:pr-1.5">
            <span className="text-[#dfba73] font-black block uppercase text-[9.5px] sm:text-[10.5px] print:text-[8pt] tracking-wider">JEDDAH HEAD OFFICE</span>
            <span className="text-slate-300 block text-[9px] sm:text-[10px] print:text-[7.5pt] mt-0.5">Special: <strong className="text-white font-mono text-[11px] sm:text-[12.5px] print:text-[9pt] font-black">{ksaJeddahSpecial}</strong></span>
            <span className="text-slate-300 block text-[9px] sm:text-[10px] print:text-[7.5pt] mt-0.5">Sharing: <strong className="text-white font-mono text-[11px] sm:text-[12.5px] print:text-[9pt] font-black">{ksaJeddahSharing}</strong></span>
          </div>
          <div className="border-r border-slate-700/60 pr-2 print:pr-1.5">
            <span className="text-[#dfba73] font-black block uppercase text-[9.5px] sm:text-[10.5px] print:text-[8pt] tracking-wider">MAKKAH</span>
            <span className="text-slate-300 block text-[9px] sm:text-[10px] print:text-[7.5pt] mt-0.5">Sharing: <strong className="text-white font-mono text-[11px] sm:text-[12.5px] print:text-[9pt] font-black">{ksaMakkahSharing}</strong></span>
            <span className="text-slate-300 block text-[9px] sm:text-[10px] print:text-[7.5pt] mt-0.5">Special: <strong className="text-white font-mono text-[11px] sm:text-[12.5px] print:text-[9pt] font-black">{ksaMakkahSpecial}</strong></span>
          </div>
          <div>
            <span className="text-[#dfba73] font-black block uppercase text-[9.5px] sm:text-[10.5px] print:text-[8pt] tracking-wider">MADINAH</span>
            <span className="text-slate-300 block text-[9px] sm:text-[10px] print:text-[7.5pt] mt-0.5">Sharing: <strong className="text-white font-mono text-[11px] sm:text-[12.5px] print:text-[9pt] font-black">{ksaMadinahSharing}</strong></span>
            <span className="text-slate-300 block text-[9px] sm:text-[10px] print:text-[7.5pt] mt-0.5">Special: <strong className="text-white font-mono text-[11px] sm:text-[12.5px] print:text-[9pt] font-black">{ksaMadinahSpecial}</strong></span>
          </div>
        </div>
      </div>
      {/* End of Page 1 Top Content wrapper */}
      </div>

      {/* End of Page 1 Voucher Container */}
      </div>

      {/* WEB VIEW PAGE SEPARATOR */}
      <div className="max-w-[850px] mx-auto my-6 no-print flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-300"></div>
        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase bg-slate-100 px-3 py-1 rounded-full border border-slate-300">
          PAGE 2 — TERMS &amp; IMPORTANT GUIDELINES
        </span>
        <div className="flex-1 h-px bg-slate-300"></div>
      </div>

      {/* PAGE 2 VOUCHER CONTAINER */}
      <div 
        className="voucher-container voucher-page-2 max-w-[850px] mx-auto bg-white rounded-none shadow-2xl border border-slate-300 overflow-hidden text-slate-800 p-4 sm:p-7 print:p-3 print:border-2 print:border-[#0a192f] text-[11px] leading-tight print:max-w-full print:w-full print:m-0 print:flex print:flex-col print:justify-between print:break-before-page"
        style={{ pageBreakBefore: 'always', breakBefore: 'page' }}
      >
        <div className="space-y-3 print:space-y-1.5">
          
          {/* Page 2 Top Header */}
          <div className="flex items-center justify-between pb-2 border-b-2 border-[#0a192f]">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-[#0a192f] uppercase tracking-wide">
                {voucher.companyName || 'CHEEPA FJ TRAVELS'}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">• TERMS &amp; IMPORTANT GUIDELINES</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-600">Voucher No:</span>
              <span className="font-mono text-xs font-bold text-[#0a192f]">{voucherRefNo}</span>
            </div>
          </div>

          {/* 7. URDU INSTRUCTIONS BOX (ضروری ہدایات برائے معتمرین کرام) */}
          <div className="border border-slate-300 rounded-lg p-3 sm:p-4 bg-[#fafafa] relative print:p-2.5" dir="rtl">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#dfba73]" />
                <h3 className="font-bold text-xs sm:text-[13px] text-[#0a192f] font-urdu print:text-[9pt]">
                  ضروری ہدایات برائے معتمرین کرام (سعودی حکومتی قوانین)
                </h3>
              </div>
              <span className="border border-slate-300 rounded-lg px-5 py-2.5 sm:py-3 sm:px-6 text-[11px] sm:text-[12px] font-bold text-slate-800 bg-white font-urdu print:text-[8.5pt] print:py-1.5 print:px-3.5 shrink-0 inline-flex items-center justify-center leading-loose shadow-2xs">
                قابل عمل شرائط
              </span>
            </div>

            <div className="space-y-4 sm:space-y-6 print:space-y-4.5 font-urdu text-[11px] sm:text-[12.5px] text-slate-800 leading-[2.2] print:text-[10pt] print:leading-[2.2] pr-1 pl-1 py-2">
              <div className="flex items-start gap-2 text-right py-0.5 print:py-1">
                <span className="text-[#c29648] font-bold select-none text-[11px] leading-none mt-0.5 shrink-0">•</span>
                <span>ہوٹل اور پیکیج اس دستاویز میں لکھ دیا گیا ہے۔</span>
              </div>
              <div className="flex items-start gap-2 text-right py-0.5 print:py-1">
                <span className="text-[#c29648] font-bold select-none text-[11px] leading-none mt-0.5 shrink-0">•</span>
                <span>سفری سامان حرمین شریفین کی طرف لے جانا سعودی انتظامیہ کی طرف سے ممنوع ہے۔ خلاف ورزی پر جرمانہ ہوگا۔</span>
              </div>
              <div className="flex items-start gap-2 text-right py-0.5 print:py-1">
                <span className="text-red-600 font-bold select-none text-[11px] leading-none mt-0.5 shrink-0">•</span>
                <span className="text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200 print:text-red-700">
                  نشہ آور اشیاء کا لانا قانوناً ممنوع ہے، سعودیہ میں منشیات لے جانے کی سزا موت ہے۔
                </span>
              </div>
              <div className="flex items-start gap-2 text-right py-0.5 print:py-1">
                <span className="text-[#c29648] font-bold select-none text-[11px] leading-none mt-0.5 shrink-0">•</span>
                <span>حرمین شریفین کے اندر زمین پر گری پڑی چیز (پرس، موبائل فون یا کوئی قیمتی چیز) ہرگز نہ اٹھائیں۔</span>
              </div>
              <div className="flex items-start gap-2 text-right py-0.5 print:py-1">
                <span className="text-[#c29648] font-bold select-none text-[11px] leading-none mt-0.5 shrink-0">•</span>
                <span>جدہ ایئرپورٹ پر امیگریشن و سعودی کمپنی کے انتظام میں 3 سے 5 گھنٹے لگ سکتے ہیں۔</span>
              </div>
              <div className="flex items-start gap-2 text-right py-0.5 print:py-1">
                <span className="text-[#c29648] font-bold select-none text-[11px] leading-none mt-0.5 shrink-0">•</span>
                <span>ہوٹل سے چیک آؤٹ ٹائم دوپہر 2 بجے ہے۔ اس کے بعد اگلی Night چارج ہوگی، واؤچر کی 4 کاپیاں پاس رکھیں۔</span>
              </div>
              <div className="flex items-start gap-2 text-right py-0.5 print:py-1">
                <span className="text-[#c29648] font-bold select-none text-[11px] leading-none mt-0.5 shrink-0">•</span>
                <span>واپسی فلائٹ سے دس گھنٹے پہلے معتمر اپنے سامان سمیت ہوٹل ریسپشن پر موجود رہیں۔</span>
              </div>
              <div className="flex items-start gap-2 text-right py-0.5 print:py-1">
                <span className="text-[#c29648] font-bold select-none text-[11px] leading-none mt-0.5 shrink-0">•</span>
                <span>سعودی قانون کے مطابق کمپنی کے علاوہ کسی غیر رجسٹرڈ ہوٹل میں قیام کرنا سنگین جرم ہے۔</span>
              </div>
            </div>
          </div>

          {/* 8. STANDARD TERMS & CONDITIONS (ENGLISH) */}
          <div className="text-[9px] leading-relaxed text-slate-600 space-y-1 print:text-[7.5pt] print:leading-tight border border-slate-200 rounded-lg p-3 bg-white">
            <h4 className="font-bold text-[9.5px] uppercase tracking-wider text-[#0a192f] print:text-[8pt] border-b border-slate-100 pb-1">
              STANDARD TERMS &amp; CONDITIONS
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-1">
              <p>1. Connect to airport Wi-Fi on landing and establish contact with designated operational numbers.</p>
              <p>5. Economy Hotels feature compact room layouts with essential functional furnishings.</p>
              <p>2. 'Similar' refers to hotels in a similar vicinity strictly for a comparable distance.</p>
              <p>6. Overstay beyond 30 days is illegal and strictly subject to hefty penalties &amp; fines.</p>
              <p>3. Distances noted are approximate and subject to on-ground traffic scenarios.</p>
              <p>7. Contact helpline at least 24h prior to avail bus transport.</p>
            </div>
          </div>

        </div>

        {/* Agency Contact & Address Footer (Page 2 Bottom) */}
        <div className="border-t-2 border-slate-300 pt-2.5 text-center text-[9.5px] print:text-[8pt] text-slate-700 bg-slate-50/90 rounded-lg py-2 px-3 mt-4 print:mt-auto">
          <p className="font-extrabold text-[#0a192f] uppercase tracking-wide text-[11px]">
            {voucher.companyName || 'CHEEPA FJ TRAVELS'}
          </p>
          <p className="font-mono font-bold text-slate-800 mt-0.5 text-[10px]">
            {formatPakistaniPhone(voucher.address || voucher.phone || 'MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683')}
          </p>
        </div>

      {/* End of Page 2 Voucher Container */}
      </div>

      {/* Action Toolbar (hidden during print & only visible to Admin) */}
      {isAdmin && (
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 mt-4 flex items-center justify-between no-print max-w-[850px] mx-auto gap-3">
          <div className="text-xs text-slate-600">
            Ready to print or modify official Umrah voucher for <strong className="text-slate-900">{voucher.party}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/edit/${voucher.slug || voucher.id}`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xs transition-all"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Edit Voucher</span>
            </Link>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0a192f] hover:bg-[#112a4f] text-white font-bold text-xs shadow transition-all"
            >
              <Printer className="w-4 h-4 text-[#dfba73]" />
              <span>Print Official Voucher (A4)</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
