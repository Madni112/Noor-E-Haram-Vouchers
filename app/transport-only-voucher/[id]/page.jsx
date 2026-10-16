'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTransportOnlyVoucherById, saveTransportOnlyVoucher } from '../../../lib/erpData';
import { 
  Bus, 
  Calendar, 
  Clock, 
  MapPin, 
  PhoneCall, 
  Printer, 
  ArrowLeft, 
  Check, 
  Copy,
  Edit3,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Plane
} from 'lucide-react';

function formatTimeWithoutSeconds(timeVal) {
  if (!timeVal) return '';
  const str = String(timeVal).trim();
  if (!str) return '';
  const match = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (match) {
    const hh = match[1].padStart(2, '0');
    const mm = match[2];
    const ampm = match[3] ? ` ${match[3].toUpperCase()}` : '';
    return `${hh}:${mm}${ampm}`.trim();
  }
  if (str.includes('T')) {
    const part = str.split('T')[1];
    return part.slice(0, 5);
  }
  return str.replace(/:\d{2}$/, '').trim();
}

export default function TransportVoucherViewPage() {
  const params = useParams();
  const id = params?.id ? decodeURIComponent(params.id) : '';
  const router = useRouter();

  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);

  // Inline edit issue date
  const [isEditingIssueDate, setIsEditingIssueDate] = useState(false);
  const [editIssueDate, setEditIssueDate] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      if (id) {
        const found = getTransportOnlyVoucherById(id);
        if (found) {
          setVoucher(found);
          setEditIssueDate(found.issueDate || new Date().toISOString().split('T')[0]);
        }
      }
      setLoading(false);
    }
  }, [id]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${origin}/transport-only-voucher/${voucher?.voucherNo || id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleSaveIssueDate = (newDate) => {
    if (!voucher) return;
    const updated = { ...voucher, issueDate: newDate };
    saveTransportOnlyVoucher(updated);
    setVoucher(updated);
    setIsEditingIssueDate(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-[#0a192f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-sm border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Transport Voucher Not Found</h2>
          <p className="text-xs text-slate-500">
            The transport voucher reference <span className="font-mono font-bold">{id}</span> could not be loaded.
          </p>
          <Link
            href="/transport-only-voucher"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0a192f] text-white rounded-xl text-xs font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Transport Manager</span>
          </Link>
        </div>
      </div>
    );
  }

  const bookings = voucher.bookings || [];
  const flights = voucher.flights || [];
  const helplines = voucher.helplines || {
    ksaGround: '+966 53 649 2846 / +966 57 593 0550',
    headOffice: 'MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683'
  };

  const defaultTerms = [
    "1 - Cancellation with full refund is permissible only with a notification at least 24 hours prior to travelling.",
    "2 - It is the responsibility of the agent and/or client to have a valid Saudi number or an active roaming sim they can use to contact their designated driver at the airport or another pick up point. 100% of the service amount will be charged in case of no show.",
    "3 - The Transportation Service Company reserves the right to change the rates without any prior notification but will respect booked services with complete payment.",
    "- The passengers are expected to connect to the wifi as soon as they land at the respective Jeddah or Madinah airport and establish contact with the number provided for their trip.",
    "- Sim Kiosks are also available at both airports for the assistance of the passengers.",
    "- In the case that the passengers don't connect to the internet or fail to establish contact with the transporter we will not be responsible for any inconvenience."
  ];

  const termsList = Array.isArray(voucher.termsAndConditions) && voucher.termsAndConditions.length > 0 
    ? voucher.termsAndConditions 
    : defaultTerms;

  return (
    <div className="min-h-screen bg-slate-100 py-6 sm:py-8 text-slate-800 antialiased print:bg-white print:py-0">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP INTERACTIVE TOOLBAR (HIDDEN IN PRINT) */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-[780px] mx-auto px-4 mb-3 no-print">
        <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-sm rounded-xl px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <Link
            href="/transport-only-voucher"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Transport Vouchers</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0a192f] hover:bg-slate-800 text-white rounded-lg text-xs font-black shadow-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#dfba73]" />
              <span>Print Voucher</span>
            </button>
          </div>

        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. PRINT STYLES - IDENTICAL TO HOTEL VOUCHER */}
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
          .no-print, header, nav, footer {
            display: none !important;
          }
          main.transport-voucher-sheet {
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
          .transport-voucher-sheet * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}} />

      {/* ------------------------------------------------------------- */}
      {/* 3. A4 CERTIFIED TRANSPORT VOUCHER SHEET */}
      {/* ------------------------------------------------------------- */}
      <main className="transport-voucher-sheet max-w-[780px] mx-auto bg-white shadow-xl border border-slate-300 print:shadow-none print:border-2 print:border-[#0a192f] print:m-0 text-slate-800 print:w-full print:max-w-full print:text-black p-4 sm:p-5 print:p-3.5 space-y-3">
        
        {/* ========================================================= */}
        {/* A. HEADER: LOGO AT LEFT, CENTER TITLE, CONFIRMED AT RIGHT */}
        {/* ========================================================= */}
        <section className="relative flex flex-col sm:flex-row items-center justify-between border-b-2 border-slate-900 gap-2 pb-2.5 mb-2.5 min-h-[96px] sm:min-h-[105px] print:min-h-[105px] print:pb-2 print:mb-2">
          {/* Left: Company Logo */}
          <div className="flex items-center justify-start shrink-0 z-10">
            <img 
              src={voucher.logo || "/logo.png"} 
              alt={voucher.companyName || "Noor E Haram Travels Logo"} 
              className="h-24 sm:h-28 print:h-[105px] max-w-[250px] sm:max-w-[300px] print:max-w-[300px] w-auto object-contain drop-shadow-sm" 
            />
          </div>

          {/* Center: Transport Voucher Heading */}
          <div className="sm:absolute sm:inset-0 flex flex-col items-center justify-center pointer-events-none">
            <h1 className="text-xl sm:text-2xl print:text-[23pt] font-black text-[#0a192f] tracking-tight uppercase text-center pointer-events-auto leading-tight">
              TRANSPORT VOUCHER
            </h1>
            <span className="text-[10px] sm:text-xs print:text-[10.5pt] font-extrabold text-slate-700 uppercase tracking-widest mt-0.5 print:text-slate-800">
              Ground Transportation Confirmation
            </span>
          </div>

          {/* Top Right: Confirmed Badge */}
          <div className="flex items-center justify-end shrink-0 z-10">
            <span className="px-2.5 py-1 text-xs print:text-[10.5pt] rounded-md font-black uppercase bg-[#0a192f] text-[#dfba73] tracking-wider shadow-xs inline-flex items-center gap-1.5 print:border print:border-[#dfba73]">
              <Check className="w-3.5 h-3.5 print:w-4 print:h-4 text-[#dfba73] stroke-[3]" />
              <span>CONFIRMED</span>
            </span>
          </div>
        </section>

        {/* ========================================================= */}
        {/* B. KEY METRIC TILES (3 BOXES) */}
        {/* ========================================================= */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2 print:gap-2 print:mb-2">
          
          {/* Tile 1: Voucher Reference */}
          <div className="p-2 print:p-2 bg-slate-50 border border-slate-200 rounded-lg print:border-slate-300">
            <span className="text-[9.5px] print:text-[9pt] font-bold text-slate-500 uppercase tracking-wider block">
              VOUCHER REFERENCE
            </span>
            <span className="font-mono font-black text-sm sm:text-base print:text-[13pt] text-slate-900 block mt-0.5">
              {voucher.voucherNo || voucher.id}
            </span>
          </div>

          {/* Tile 2: Issue Date (with inline edit) */}
          <div className="p-2 print:p-2 bg-slate-50 border border-slate-200 rounded-lg relative group print:border-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] print:text-[9pt] font-bold text-slate-500 uppercase tracking-wider block">
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
                  ✕
                </button>
              </div>
            ) : (
              <span className="font-mono font-black text-sm sm:text-base print:text-[13pt] text-slate-900 block mt-0.5">
                {voucher.issueDate || '2026-10-15'}
              </span>
            )}
          </div>

          {/* Tile 3: Total Pax */}
          <div className="p-2 print:p-2 bg-slate-50 border border-slate-200 rounded-lg print:border-slate-300">
            <span className="text-[9.5px] print:text-[9pt] font-bold text-slate-500 uppercase tracking-wider block">
              TOTAL PASSENGERS
            </span>
            <span className="font-mono font-black text-sm sm:text-base print:text-[13pt] text-slate-900 block mt-0.5">
              {voucher.totalPax || 1} PAX
            </span>
          </div>

        </section>

        {/* ========================================================= */}
        {/* C. CUSTOMER INFORMATION (LEAD PILGRIM & OPTIONAL PHONE) */}
        {/* ========================================================= */}
        <section className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 print:p-2.5 print:border-slate-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <span className="text-[9px] print:text-[8.5pt] font-bold text-slate-500 uppercase tracking-wider block">
                CUSTOMER / LEAD PILGRIM NAME
              </span>
              <span className="text-sm sm:text-base print:text-[13pt] font-black text-[#0a192f] block uppercase tracking-tight mt-0.5">
                {voucher.customerName || voucher.partyName || 'VALUED PILGRIM'}
              </span>
            </div>

            <div>
              <span className="text-[9px] print:text-[8.5pt] font-bold text-slate-500 uppercase tracking-wider block">
                CUSTOMER CONTACT PHONE
              </span>
              <span className="text-xs sm:text-sm print:text-[11pt] font-bold text-slate-800 block font-mono mt-0.5">
                {voucher.customerPhone || 'On File / Optional'}
              </span>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* D. BOOKING INFORMATION & TRANSFER SCHEDULE */}
        {/* ========================================================= */}
        <section className="space-y-1.5 break-inside-avoid">
          <div className="bg-[#0a192f] text-white px-3 py-1.5 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bus className="w-3.5 h-3.5 text-[#dfba73]" />
              <h2 className="text-[10.5px] print:text-[10pt] font-black uppercase tracking-wider text-[#dfba73]">
                BOOKING INFORMATION &amp; TRANSFER SCHEDULE
              </h2>
            </div>
            <span className="text-[9.5px] print:text-[9pt] font-bold text-slate-300">
              {bookings.length} {bookings.length === 1 ? 'Transfer' : 'Transfers'}
            </span>
          </div>

          <div className="border border-slate-200 rounded-b-lg overflow-hidden print:border-slate-300">
            <table className="w-full text-left text-xs print:text-[9.5pt]">
              <thead className="bg-slate-100 text-slate-700 text-[9.5px] print:text-[8.5pt] font-black uppercase tracking-wider border-b border-slate-200 print:border-slate-300">
                <tr>
                  <th className="px-2 py-1.5 w-7 text-center">#</th>
                  <th className="px-2 py-1.5 whitespace-nowrap">Pickup Date</th>
                  <th className="px-2 py-1.5">Pickup Location</th>
                  <th className="px-2 py-1.5 whitespace-nowrap">Time</th>
                  <th className="px-2 py-1.5">Drop off Location</th>
                  <th className="px-2 py-1.5 whitespace-nowrap">Vehicle</th>
                  <th className="px-2 py-1.5">Details</th>
                  <th className="px-2 py-1.5 text-right whitespace-nowrap">Res No.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-200 font-medium">
                {bookings.map((b, idx) => (
                  <tr key={b.id || idx} className="hover:bg-slate-50 print:hover:bg-transparent">
                    <td className="px-2 py-1.5 text-center font-mono font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap font-bold text-slate-900">
                      {b.pickupDate || '—'}
                    </td>
                    <td className="px-2 py-1.5 font-bold text-slate-900">
                      {b.pickupLocation || '—'}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap font-mono font-bold text-slate-700">
                      {formatTimeWithoutSeconds(b.time) || '12:00'}
                    </td>
                    <td className="px-2 py-1.5 font-bold text-slate-900">
                      {b.dropoffLocation || '—'}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-slate-700 font-semibold">
                      {b.vehicle || 'Luxury Bus'}
                    </td>
                    <td className="px-2 py-1.5 text-slate-600 text-[10px] print:text-[8.5pt]">
                      {b.details || 'Standard Transfer'}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                      {b.resNo || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ========================================================= */}
        {/* E. FLIGHT DETAILS */}
        {/* ========================================================= */}
        {flights.length > 0 && (
          <section className="space-y-1.5 break-inside-avoid">
            <div className="bg-[#0a192f] text-white px-3 py-1.5 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plane className="w-3.5 h-3.5 text-[#dfba73]" />
                <h2 className="text-[10.5px] print:text-[10pt] font-black uppercase tracking-wider text-[#dfba73]">
                  FLIGHT DETAILS
                </h2>
              </div>
              <span className="text-[9.5px] print:text-[9pt] font-bold text-slate-300">
                Connecting Flights
              </span>
            </div>

            <div className="border border-slate-200 rounded-b-lg overflow-hidden print:border-slate-300">
              <table className="w-full text-left text-xs print:text-[9.5pt]">
                <thead className="bg-slate-100 text-slate-700 text-[9.5px] print:text-[9pt] font-black uppercase tracking-wider border-b border-slate-200 print:border-slate-300">
                  <tr>
                    <th className="px-3 py-1.5">Flight No.</th>
                    <th className="px-3 py-1.5">Date</th>
                    <th className="px-3 py-1.5">Departure</th>
                    <th className="px-3 py-1.5">Dep. Time</th>
                    <th className="px-3 py-1.5">Arrival</th>
                    <th className="px-3 py-1.5">Arr. Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-200 font-medium">
                  {flights.map((f, idx) => (
                    <tr key={f.id || idx} className="hover:bg-slate-50 print:hover:bg-transparent">
                      <td className="px-3 py-1.5 font-mono font-black text-slate-900">
                        {f.flightNo || '—'}
                      </td>
                      <td className="px-3 py-1.5 font-mono font-bold text-slate-800">
                        {f.date || '—'}
                      </td>
                      <td className="px-3 py-1.5 text-slate-700 font-semibold">
                        {f.departure || '—'}
                      </td>
                      <td className="px-3 py-1.5 font-mono font-bold text-slate-800">
                        {formatTimeWithoutSeconds(f.departureTime || f.depTime) || '—'}
                      </td>
                      <td className="px-3 py-1.5 text-slate-700 font-semibold">
                        {f.arrival || '—'}
                      </td>
                      <td className="px-3 py-1.5 font-mono font-bold text-slate-800">
                        {formatTimeWithoutSeconds(f.arrivalTime || f.arrTime) || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* F. HELPLINES (DUAL CALLOUT) */}
        {/* ========================================================= */}
        <section className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 print:p-2 print:border-slate-300 break-inside-avoid">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs print:text-[9.5pt]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[#0a192f] text-[#dfba73] flex items-center justify-center shrink-0">
                <PhoneCall className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[9px] print:text-[8pt] font-bold text-slate-500 uppercase tracking-wider block">
                  KSA GROUND DISPATCH HELPLINE
                </span>
                <span className="font-mono font-black text-slate-900 block">
                  {helplines.ksaGround}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:justify-end">
              <div className="w-7 h-7 rounded-md bg-[#0a192f] text-[#dfba73] flex items-center justify-center shrink-0">
                <PhoneCall className="w-3.5 h-3.5" />
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[9px] print:text-[8pt] font-bold text-slate-500 uppercase tracking-wider block">
                  PAKISTAN HEAD OFFICE HELPLINE
                </span>
                <span className="font-mono font-black text-slate-900 block">
                  {helplines.headOffice}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* G. TERMS & CONDITIONS (EXACT TEXT FROM IMAGE 2) */}
        {/* ========================================================= */}
        <section className="bg-white border border-slate-200 rounded-lg p-3 print:p-2.5 print:border-slate-300 break-inside-avoid space-y-2">
          <h3 className="text-xs print:text-[10pt] font-black uppercase tracking-wider text-slate-900">
            Terms &amp; Conditions
          </h3>
          
          <div className="space-y-1.5 text-[10px] sm:text-[10.5px] print:text-[8.5pt] text-slate-700 leading-relaxed font-normal">
            {termsList.map((clause, idx) => {
              const isBullet = clause.startsWith('-');
              return (
                <p key={idx} className={`${isBullet ? 'pl-2 text-slate-800 font-medium' : ''}`}>
                  {clause}
                </p>
              );
            })}
          </div>
        </section>

        {/* ========================================================= */}
        {/* H. DIGITAL VERIFICATION FOOTER */}
        {/* ========================================================= */}
        <footer className="pt-2 border-t border-slate-200 flex items-center justify-between text-[9.5px] print:text-[8pt] text-slate-500 print:text-slate-600">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-bold">Official Certified Ground Movement Voucher</span>
          </div>

          <div className="font-mono text-right font-bold text-slate-700">
            {voucher.voucherNo || voucher.id}
          </div>
        </footer>

      </main>

    </div>
  );
}
