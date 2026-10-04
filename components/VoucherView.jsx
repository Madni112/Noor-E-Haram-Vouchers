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

  const voucherStartDate = voucher.accommodations?.[0]?.checkIn || voucher.flights?.[0]?.date || '2026-10-01';

  return (
    <>
      <div className="voucher-container max-w-[850px] mx-auto bg-white rounded-none shadow-2xl border border-slate-300 overflow-hidden text-slate-800 p-4 sm:p-7 print:p-3 print:border-2 print:border-[#0a192f] text-[11px] leading-tight print:max-w-full print:w-full print:m-0 print:flex print:flex-col print:justify-between">
        
        {/* Top Content wrapper */}
        <div className="space-y-2.5 print:space-y-1.5">
        
        {/* 1. TOP HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-center justify-between pb-3 border-b border-slate-200 gap-3 text-center sm:text-left">
        
        {/* Left: Agency Name & Voucher Meta */}
        <div className="space-y-1.5 flex-[1.3] text-center sm:text-left shrink-0 order-2 sm:order-1">
          <div>
            <h1 className="text-[13.5px] sm:text-[14.5px] print:text-[12.5pt] font-extrabold tracking-tight text-[#0a192f] uppercase sm:whitespace-nowrap">
              {voucher.companyName || 'NOOR E HARAM TRAVEL & TOURS'}
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wide">
              Official Umrah Voucher Portal
            </p>
          </div>

          {/* Voucher Meta details */}
          <div className="text-[10px] leading-tight space-y-0.5 text-slate-700 pt-1 print:text-[8pt]">
            <div>
              <span className="font-bold text-slate-900">Voucher Date:</span>{' '}
              <span className="font-semibold text-slate-800">
                {formatVoucherDate(voucherStartDate)}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-900">Package:</span>{' '}
              <span suppressHydrationWarning className="font-semibold text-slate-800">{totalNights} Standard Umrah</span>
            </div>
            <div>
              <span className="font-bold text-slate-900">PAX Count:</span>{' '}
              <span className="font-semibold text-slate-800">
                {voucher.totalPax || voucher.passengers?.length || 1} ({voucher.paxCounts || 'GENT(S):1 LAD(IES):1 CHILD(REN): 0 INFANT(S):0'}) • Beds: {voucher.totalPax || voucher.passengers?.length || 1}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Prominent Large Centered Logo + UB Ref Badge */}
        <div className="flex flex-col items-center justify-center text-center space-y-1.5 flex-[1.4] order-1 sm:order-2">
          <img 
            src="/logo.png" 
            alt="Noor E Haram Logo" 
            className="h-24 sm:h-36 max-w-[250px] sm:max-w-[300px] w-auto object-contain print:h-32 drop-shadow-sm transition-all" 
          />
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-[10.5px] tracking-wider text-[#0a192f] uppercase">
              HOTEL
            </span>
            <span className="bg-[#0a192f] text-[#dfba73] font-bold text-[9px] px-2.5 py-0.5 rounded tracking-wider shadow-sm">
              {voucherRefNo}
            </span>
          </div>
        </div>

        {/* Right: Self Visa & Islamabad */}
        <div className="text-center sm:text-right space-y-0.5 flex-[0.8] pr-0 sm:pr-1 order-3">
          <h2 className="text-[16px] sm:text-[17px] font-black text-[#0a192f] tracking-tight uppercase">
            Self Visa
          </h2>
          <p className="text-[12px] sm:text-[13px] font-bold text-slate-600 tracking-wide">
            Islamabad
          </p>
        </div>

      </div>

      {/* 2. FAMILY HEAD & VOUCHER NO BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-12 bg-[#f8fafc] border border-slate-300 rounded mt-3 py-2 sm:py-1.5 px-3 text-[11px] items-center gap-1.5 sm:gap-0 text-center sm:text-left">
        <div className="sm:col-span-6 flex items-center justify-center sm:justify-start gap-2">
          <span className="font-bold text-slate-600">Family Head:</span>
          <span className="font-extrabold text-[#0a192f] uppercase text-xs tracking-wide">
            {formatDisplayName(voucher.party || 'MUHAMMAD INSHAL SYED')}
          </span>
        </div>
        <div className="sm:col-span-3 flex items-center justify-center sm:justify-start gap-1.5">
          <span className="font-bold text-slate-600">Voucher No:</span>
          <span className="font-bold font-mono text-[#0a192f]">{voucherRefNo}</span>
        </div>
        <div className="sm:col-span-3 flex items-center justify-center sm:justify-end gap-1.5 sm:text-right">
          <span className="font-bold text-slate-600">Manual No:</span>
          <span className="font-mono text-slate-700">--</span>
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
                  <td className="border border-slate-300 py-1.5 px-2 text-center font-bold text-emerald-700">
                    Yes
                  </td>
                  <td className="border border-slate-300 py-1.5 px-3 text-center font-mono text-slate-600">
                    {pax.group || '480900760934'}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-2 text-center font-mono text-slate-600">
                    {pax.visaNo || '-'}
                  </td>
                  
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="border border-slate-300 text-center py-2 text-slate-400">
                  No mutamers listed.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* 4. ACCOMMODATION ITINERARY (With APPROVED diagonal watermark) */}
      <div className="mt-3.5 space-y-1 relative">
        
        {/* Transparent APPROVED Green Stamp Watermark (No Outline) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden select-none">
          <div className="transform -rotate-12 text-center">
            <span className="text-5xl sm:text-6xl font-black tracking-[0.25em] text-emerald-600/30 uppercase">
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
            <tr className="bg-[#0a192f] text-white font-bold uppercase text-[9.5px]">
              <th className="border border-slate-300 py-1 px-3">CITY</th>
              <th className="border border-slate-300 py-1 px-4">HOTEL NAME</th>
              <th className="border border-slate-300 py-1 px-2 text-center">VIEW</th>
              <th className="border border-slate-300 py-1 px-2 text-center">MEAL</th>
              <th className="border border-slate-300 py-1 px-2 text-center">HCN#</th>
              <th className="border border-slate-300 py-1 px-3">ROOM TYPE</th>
              <th className="border border-slate-300 py-1 px-3 text-center">CHECKIN</th>
              <th className="border border-slate-300 py-1 px-3 text-center">CHECKOUT</th>
              <th className="border border-slate-300 py-1 px-3 text-center w-14">NIGHTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300 bg-white">
            {voucher.accommodations && voucher.accommodations.length > 0 ? (
              voucher.accommodations.map((acc, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="border border-slate-300 py-1.5 px-3 font-bold text-[#0a192f]">
                    {acc.city === 'MAKKAH' ? 'Makkah' : (acc.city === 'MADINAH' ? 'Medinah' : acc.city)}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-4 font-bold text-slate-900">
                    {acc.hotelName}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-2 text-center text-slate-600">
                    Standard
                  </td>
                  <td className="border border-slate-300 py-1.5 px-2 text-center text-slate-600 font-semibold">
                    RO
                  </td>
                  <td className="border border-slate-300 py-1.5 px-2 text-center font-mono font-semibold text-slate-700">
                    {acc.hcn || acc.hotelCode || acc.confirmationNo || '378'}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-3 text-slate-800 font-medium">
                    {acc.roomType || 'Double Bed'}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-3 text-center font-mono text-slate-800 font-semibold">
                    {formatVoucherDate(acc.checkIn)}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-3 text-center font-mono text-slate-800 font-semibold">
                    {formatVoucherDate(acc.checkOut)}
                  </td>
                  <td suppressHydrationWarning className="border border-slate-300 py-1.5 px-3 text-center font-bold text-[#0a192f]">
                    {calculateNights(acc.checkIn, acc.checkOut, acc.nights)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="border border-slate-300 text-center py-2 text-slate-400">
                  No accommodation scheduled.
                </td>
              </tr>
            )}
            
            {/* Total Duration Nights Footer Row */}
            <tr className="bg-[#f8fafc] font-bold text-[#0a192f]">
              <td colSpan={8} className="border border-slate-300 py-1.5 px-3 text-right uppercase tracking-wider text-[10px]">
                TOTAL DURATION (NIGHTS):
              </td>
              <td suppressHydrationWarning className="border border-slate-300 py-1.5 px-3 text-center bg-[#dfba73] text-[#0a192f] font-black text-xs">
                {totalNights}
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      {/* 5. TRANSPORT & FLIGHT SCHEDULE (LEFT) + DIGITAL QR STAND (RIGHT) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 mt-3.5 items-start">
        
        {/* Left cols: Transport Services & Flight Schedule */}
        <div className="sm:col-span-8 space-y-3">
          
          {/* Transport Services */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[#0a192f] font-bold text-xs uppercase tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c29648]" />
              <span>TRANSPORT SERVICES</span>
            </div>

            <div className="overflow-x-auto w-full -mx-1 px-1 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[480px] sm:min-w-0 border-collapse border border-slate-300 text-left text-[10px]">
              <thead>
                <tr className="bg-[#0a192f] text-white font-bold uppercase text-[9px]">
                  <th className="border border-slate-300 py-1 px-3 w-36">TRANSPORTER</th>
                  <th className="border border-slate-300 py-1 px-3 w-28">TYPE</th>
                  <th className="border border-slate-300 py-1 px-3">SECTOR / DESCRIPTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 bg-white">
                {voucher.transports && voucher.transports.length > 0 ? (
                  voucher.transports.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="border border-slate-300 py-1 px-3 font-bold text-slate-900">
                        {t.transporter || (idx === 0 || t.vehicle?.toUpperCase() === 'BUS' ? 'Company Transport' : 'Private Transport')}
                      </td>
                      <td className="border border-slate-300 py-1 px-3 text-slate-700">
                        {t.vehicle || 'Economy By Bus'}
                      </td>
                      <td className="border border-slate-300 py-1 px-3 font-medium text-slate-800">
                        {t.service} {t.pickupDate ? `(${formatVoucherDate(t.pickupDate)})` : ''}
                      </td>
                    </tr>
                  ))
                ) : (
                  <>
                    <tr className="hover:bg-slate-50">
                      <td className="border border-slate-300 py-1.5 px-3 font-bold text-slate-900">
                        Company Transport
                      </td>
                      <td className="border border-slate-300 py-1.5 px-3 text-slate-700">
                        Economy By Bus
                      </td>
                      <td className="border border-slate-300 py-1.5 px-3 font-medium text-slate-800">
                        JED AIRPORT TO MAKKAH HOTEL
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="border border-slate-300 py-1.5 px-3 font-bold text-slate-900">
                        Private Transport
                      </td>
                      <td className="border border-slate-300 py-1.5 px-3 text-slate-700">
                        Sedan Car / Bus
                      </td>
                      <td className="border border-slate-300 py-1.5 px-3 font-medium text-slate-800">
                        Jeddah Airport - Makkah Hotel
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
            </div>
          </div>

          {/* Flight Schedule */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[#0a192f] font-bold text-xs uppercase tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c29648]" />
              <span>FLIGHT SCHEDULE</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
              
              {/* Departure Flight Card */}
              <div className="border border-slate-300 rounded p-2 bg-white flex flex-col justify-between">
                <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-200 gap-1">
                  <span className="font-bold text-[#0a192f] text-[9px] uppercase tracking-wider whitespace-nowrap">
                    DEPARTURE (PAK-KSA)
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {(departureFlight.pnr || voucher.pnr) && (
                      <span className="text-[8.5px] font-bold text-[#0a192f] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 font-mono whitespace-nowrap">
                        PNR: <strong className="text-emerald-800">{departureFlight.pnr || voucher.pnr}</strong>
                      </span>
                    )}
                    {departureFlight.date && (
                      <span className="text-[8.5px] font-bold text-[#926818] bg-[#fdf8ee] px-1.5 py-0.5 rounded border border-[#e8ce97] font-mono whitespace-nowrap">
                        {formatVoucherDate(departureFlight.date)}
                      </span>
                    )}
                    <span className="bg-[#0a192f] text-[#dfba73] font-bold text-[8.5px] px-1.5 py-0.5 rounded font-mono whitespace-nowrap">
                      {departureFlight.flight || 'F3-830'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 text-center pt-0.5">
                  <div className="border-r border-slate-100">
                    <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">SECTOR</span>
                    <span className="font-bold text-slate-900 text-[9.5px] font-mono whitespace-nowrap">{departureFlight.from || 'KHI'}-{departureFlight.to || 'JED'}</span>
                  </div>
                  <div className="border-r border-slate-100">
                    <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">DEPARTURE</span>
                    <span className="font-bold text-slate-900 text-[9.5px] font-mono whitespace-nowrap">{departureFlight.departure || '08:00'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">ARRIVAL</span>
                    <span className="font-bold text-slate-900 text-[9.5px] font-mono whitespace-nowrap">{departureFlight.arrival || '10:05'}</span>
                  </div>
                </div>
              </div>

              {/* Return Flight Card */}
              <div className="border border-slate-300 rounded p-2 bg-white flex flex-col justify-between">
                <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-200 gap-1">
                  <span className="font-bold text-[#0a192f] text-[9px] uppercase tracking-wider whitespace-nowrap">
                    RETURN (KSA-PAK)
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {(returnFlight.pnr || voucher.pnr) && (
                      <span className="text-[8.5px] font-bold text-[#0a192f] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 font-mono whitespace-nowrap">
                        PNR: <strong className="text-emerald-800">{returnFlight.pnr || voucher.pnr}</strong>
                      </span>
                    )}
                    {returnFlight.date && (
                      <span className="text-[8.5px] font-bold text-[#926818] bg-[#fdf8ee] px-1.5 py-0.5 rounded border border-[#e8ce97] font-mono whitespace-nowrap">
                        {formatVoucherDate(returnFlight.date)}
                      </span>
                    )}
                    <span className="bg-[#0a192f] text-[#dfba73] font-bold text-[8.5px] px-1.5 py-0.5 rounded font-mono whitespace-nowrap">
                      {returnFlight.flight || 'F3-829'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 text-center pt-0.5">
                  <div className="border-r border-slate-100">
                    <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">SECTOR</span>
                    <span className="font-bold text-slate-900 text-[9.5px] font-mono whitespace-nowrap">{returnFlight.from || 'JED'}-{returnFlight.to || 'KHI'}</span>
                  </div>
                  <div className="border-r border-slate-100">
                    <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">DEPARTURE</span>
                    <span className="font-bold text-slate-900 text-[9.5px] font-mono whitespace-nowrap">{returnFlight.departure || '12:45'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">ARRIVAL</span>
                    <span className="font-bold text-slate-900 text-[9.5px] font-mono whitespace-nowrap">{returnFlight.arrival || '07:00'}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right cols: Digital QR Stand Card */}
        <div className="sm:col-span-4 border border-slate-300 rounded-xl p-3 bg-white flex flex-col items-center justify-center text-center shadow-xs">
          <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-inner">
            {voucherUrl ? (
              <QRCodeSVG value={voucherUrl} size={92} level="H" />
            ) : (
              <div className="w-[92px] h-[92px] bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                QR Code
              </div>
            )}
          </div>
          <span className="font-mono font-bold text-[10px] text-slate-700 mt-2">
            {voucherRefNo}
          </span>
          <span className="mt-1 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[9px] border border-emerald-200 tracking-wider uppercase">
            SCANNED &amp; VALIDATED
          </span>
        </div>

      </div>

      {/* 6. KSA & PAKISTAN HELPLINES BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 mt-2.5 print:mt-1.5 print:gap-1.5">
        
        {/* Left Dark KSA Helplines Box */}
        <div className="sm:col-span-8 bg-[#0a192f] text-white rounded p-2 text-[8.5px] print:p-1.5 print:rounded flex flex-col justify-between">
          <div className="border-b border-slate-700/80 pb-1 mb-1">
            <span className="text-[#dfba73] font-bold text-[8.5px] tracking-wider uppercase print:text-[7pt]">
              KSA OPERATIONAL HELPLINES
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[7.5px] leading-tight print:text-[6pt]">
            <div className="border-r border-slate-700/60 pr-1">
              <span className="text-[#dfba73] font-bold block uppercase text-[7px] tracking-wider">JEDDAH AIRPORT</span>
              <span className="text-slate-300 block">Airport (24/7):</span>
              <span className="font-bold font-mono text-white">0568832059</span>
            </div>
            <div className="border-r border-slate-700/60 pr-1">
              <span className="text-[#dfba73] font-bold block uppercase text-[7px] tracking-wider">JEDDAH HEAD OFFICE</span>
              <span className="text-slate-300 block">Special: <strong className="text-white font-mono">0583000471</strong></span>
              <span className="text-slate-300 block">Sharing: <strong className="text-white font-mono">0596837655</strong></span>
            </div>
            <div className="border-r border-slate-700/60 pr-1">
              <span className="text-[#dfba73] font-bold block uppercase text-[7px] tracking-wider">MAKKAH</span>
              <span className="text-slate-300 block">Sharing: <strong className="text-white font-mono">0543666527</strong></span>
              <span className="text-slate-300 block">Special: <strong className="text-white font-mono">0596085887</strong></span>
            </div>
            <div>
              <span className="text-[#dfba73] font-bold block uppercase text-[7px] tracking-wider">MADINAH</span>
              <span className="text-slate-300 block">Sharing: <strong className="text-white font-mono">0596836845</strong></span>
              <span className="text-slate-300 block">Special: <strong className="text-white font-mono">0596836979</strong></span>
            </div>
          </div>
        </div>

        {/* Right Gold Pakistan Helpline Box */}
        <div className="sm:col-span-4 bg-[#fcf8ee] border-2 border-[#dfba73] rounded p-2 text-center flex flex-col justify-center print:p-1.5 print:rounded">
          <span className="text-[#805a1b] font-bold text-[9px] uppercase tracking-wider block print:text-[7.5pt]">
            PAKISTAN HELPLINE (24/7)
          </span>
          <span className="text-[#0a192f] font-black text-sm font-mono tracking-tight print:text-[9.5pt]">
            {voucher.pakistanHelpline || '+92 311 2264567'}
          </span>
        </div>

      </div>

      {/* 7. URDU INSTRUCTIONS BOX (ضروری ہدایات برائے معتمرین کرام) */}
      <div className="border border-slate-300 rounded-lg p-2.5 sm:p-3 mt-2.5 bg-[#fafafa] relative print:p-2 print:mt-1.5" dir="rtl">
        
        {/* Header with Title and Badge */}
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#dfba73]" />
            <h3 className="font-bold text-[11px] sm:text-xs text-[#0a192f] font-urdu print:text-[8pt]">
              ضروری ہدایات برائے معتمرین کرام (سعودی حکومتی قوانین)
            </h3>
          </div>
          <span className="border border-slate-300 rounded px-2 py-0.5 text-[8.5px] font-bold text-slate-700 bg-white font-urdu print:text-[6.5pt] print:py-0 shrink-0">
            قابل عمل شرائط
          </span>
        </div>

        {/* 8 Bullet Items cleanly structured with inline custom bullets */}
        <div className="space-y-1 font-urdu text-[9.5px] sm:text-[10px] text-slate-800 leading-relaxed print:text-[7pt] print:leading-tight print:space-y-0.5 pr-1 pl-1">
          <div className="flex items-start gap-1.5 text-right">
            <span className="text-[#c29648] font-bold select-none text-[10px] leading-none mt-0.5 shrink-0">•</span>
            <span>ہوٹل اور پیکیج اس دستاویز میں لکھ دیا گیا ہے۔ اس کے مطابق آپ کو رہائش اور دیگر سہولیات فراہم کی جائیں گی۔</span>
          </div>
          <div className="flex items-start gap-1.5 text-right">
            <span className="text-[#c29648] font-bold select-none text-[10px] leading-none mt-0.5 shrink-0">•</span>
            <span>سفری سامان حرمین شریفین کی طرف لے جانا سعودی انتظامیہ کی طرف سے ممنوع ہے۔ خلاف ورزی پر جرمانہ ہوگا۔</span>
          </div>
          <div className="flex items-start gap-1.5 text-right">
            <span className="text-[#c29648] font-bold select-none text-[10px] leading-none mt-0.5 shrink-0">•</span>
            <span>نشہ آور اشیاء کا لانا قانوناً ممنوع ہے، سعودیہ میں منشیات لے جانے کی سزا موت ہے۔</span>
          </div>
          <div className="flex items-start gap-1.5 text-right">
            <span className="text-[#c29648] font-bold select-none text-[10px] leading-none mt-0.5 shrink-0">•</span>
            <span>حرمین شریفین کے اندر زمین پر گری پڑی چیز (پرس، موبائل فون یا کوئی قیمتی چیز) ہرگز نہ اٹھائیں۔</span>
          </div>
          <div className="flex items-start gap-1.5 text-right">
            <span className="text-[#c29648] font-bold select-none text-[10px] leading-none mt-0.5 shrink-0">•</span>
            <span>جدہ ایئرپورٹ پر امیگریشن و سعودی کمپنی کے انتظام میں 3 سے 5 گھنٹے لگ سکتے ہیں۔</span>
          </div>
          <div className="flex items-start gap-1.5 text-right">
            <span className="text-[#c29648] font-bold select-none text-[10px] leading-none mt-0.5 shrink-0">•</span>
            <span>ہوٹل سے چیک آؤٹ ٹائم دوپہر 2 بجے ہے۔ اس کے بعد اگلی Night چارج ہوگی، واؤچر کی 4 کاپیاں پاس رکھیں۔</span>
          </div>
          <div className="flex items-start gap-1.5 text-right">
            <span className="text-[#c29648] font-bold select-none text-[10px] leading-none mt-0.5 shrink-0">•</span>
            <span>واپسی فلائٹ سے دس گھنٹے پہلے معتمر اپنے سامان سمیت ہوٹل ریسپشن پر موجود رہیں۔</span>
          </div>
          <div className="flex items-start gap-1.5 text-right">
            <span className="text-[#c29648] font-bold select-none text-[10px] leading-none mt-0.5 shrink-0">•</span>
            <span>سعودی قانون کے مطابق کمپنی کے علاوہ کسی غیر رجسٹرڈ ہوٹل میں قیام کرنا سنگین جرم ہے۔</span>
          </div>
        </div>
      </div>
      {/* End of Top Content wrapper */}
      </div>

      {/* Bottom Section */}
      <div className="space-y-1.5 print:space-y-1 mt-auto">
        {/* 8. STANDARD TERMS & CONDITIONS (ENGLISH) */}
        <div className="text-[8px] leading-tight text-slate-600 space-y-0.5 print:text-[6.8pt] print:leading-none">
          <h4 className="font-bold text-[8.5px] uppercase tracking-wider text-slate-800 print:text-[7pt]">
            STANDARD TERMS &amp; CONDITIONS
          </h4>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <p>1. Connect to airport Wi-Fi on landing and establish contact with designated operational numbers.</p>
            <p>5. Economy Hotels feature compact room layouts with essential functional furnishings.</p>
            <p>2. 'Similar' refers to hotels in a similar vicinity strictly for a comparable distance.</p>
            <p>6. Overstay beyond 30 days is illegal and strictly subject to hefty penalties &amp; fines.</p>
            <p>3. Distances noted are approximate and subject to on-ground traffic scenarios.</p>
            <p>7. Contact helpline at least 24h prior to avail bus transport.</p>
          </div>
        </div>
      </div>

      {/* End of voucher-container */}
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
