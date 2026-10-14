'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import { 
  Calculator, 
  ArrowLeft, 
  Printer, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Plane, 
  Building2, 
  Bus, 
  Percent, 
  Receipt,
  Users,
  Compass,
  MessageCircle,
  CheckCircle2
} from 'lucide-react';
import { getEstimateById, convertEstimateToInvoice } from '../../../lib/erpData';

export default function EstimateViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id ? decodeURIComponent(params.id) : '';
  
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');
  const [viewMode, setViewMode] = useState('CUSTOMER'); // 'CUSTOMER' | 'STAFF'
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      const data = getEstimateById(id);
      setEstimate(data);
      setLoading(false);
    }
  }, [id]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && estimate) {
      const url = `${origin}/estimate/${estimate.id || id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    if (typeof window !== 'undefined' && estimate) {
      const quoteUrl = `${origin}/estimate/${estimate.id || id}`;
      const items = estimate.items || {};
      const bDetails = estimate.breakdownDetails || {};
      const company = estimate.companyName || 'Noor E Haram Travel & Tours';

      let computedDur = '';
      if (bDetails.flightDateFrom && bDetails.flightDateTo) {
        const d1 = new Date(bDetails.flightDateFrom);
        const d2 = new Date(bDetails.flightDateTo);
        if (!isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d2 > d1) {
          const n = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
          const fromStr = d1.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          const toStr = d2.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          computedDur = `${n} Nights (${fromStr} – ${toStr})`;
        }
      }
      const dur = computedDur || estimate.packageDuration || 'Umrah Stay';
      const flightLabel = bDetails.flightType === 'Connecting' ? 'Connecting Airline Ticket' : 'Direct Airline Ticket';

      const text = encodeURIComponent(
        `*Assalam-o-Alaikum ${estimate.partyName}*,\n\n` +
        `Here is your official *Umrah Package Proposal* from *${company}*:\n\n` +
        `📋 *Reference:* ${estimate.estimateNo}\n` +
        `👥 *Pilgrims:* ${estimate.paxCount} Persons\n` +
        `🌙 *Package Duration:* ${dur}\n` +
        `✈ *Flights:* ${flightLabel}\n` +
        `💰 *Per Pilgrim:* ${estimate.currency} ${(items.perPaxQuote || 0).toLocaleString()}\n` +
        `🌟 *Total Investment:* ${estimate.currency} ${(items.grandTotal || 0).toLocaleString()} (All-Inclusive)\n\n` +
        `🔗 *View Full Itinerary & Proposal Online:*\n${quoteUrl}`
      );
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    }
  };

  const handleConvert = () => {
    if (!estimate) return;
    try {
      setIsConverting(true);
      const invoice = convertEstimateToInvoice(estimate.id);
      router.push(`/invoice/${invoice.id}`);
    } catch (e) {
      alert(`Error converting to invoice: ${e.message}`);
      setIsConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <Calculator className="w-16 h-16 text-slate-400 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-800">Quotation Not Found</h2>
        <p className="text-slate-500 text-sm">
          No estimate proposal exists with identifier <code className="bg-slate-200 px-2 py-0.5 rounded font-mono">{id}</code>.
        </p>
        <Link 
          href="/erp" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to ERP Portal</span>
        </Link>
      </div>
    );
  }

  const liveQrUrl = `${origin}/estimate/${estimate.id || id}`;
  const items = estimate.items || {};
  const b = estimate.breakdownDetails || {};

  // Raw list of hotels
  const rawHotels = b.hotels && Array.isArray(b.hotels) && b.hotels.length > 0
    ? b.hotels
    : [
        {
          city: 'Makkah',
          hotelName: b.makkahHotel || 'VOCO 5 STAR',
          nights: b.makkahNights || 8,
          roomType: b.makkahRoomType || 'Double',
        },
        {
          city: 'Medinah',
          hotelName: b.madinahHotel || 'GULNAR HV',
          nights: b.madinahNights || 7,
          roomType: b.madinahRoomType || 'Double',
        }
      ];

  // DEDUPLICATE: "if there is a common hotel name + room type for any 2 stays = 1"
  const uniqueHotels = [];
  const seenHotelKeys = new Set();

  rawHotels.forEach(h => {
    const cleanName = (h.hotelName || '').trim();
    const cleanRoom = (h.roomType || 'Double').trim();
    const cleanCity = (h.city || 'Makkah').trim();
    const distance = (h.distance || '').trim();
    const key = `${cleanName.toLowerCase()}___${cleanRoom.toLowerCase()}`;

    if (!seenHotelKeys.has(key)) {
      seenHotelKeys.add(key);
      uniqueHotels.push({
        city: cleanCity,
        hotelName: cleanName,
        roomType: cleanRoom,
        distance: distance,
      });
    }
  });

  const totalNights = rawHotels.reduce((acc, h) => acc + (parseInt(h.nights) || 0), 0);
  const airline = b.airlineCarrier || 'Confirmed Direct Airline Carrier';

  // Decide duration by flight dates if available, otherwise fallback to hotel nights / packageDuration
  let computedDuration = '';
  if (b.flightDateFrom && b.flightDateTo) {
    const d1 = new Date(b.flightDateFrom);
    const d2 = new Date(b.flightDateTo);
    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d2 > d1) {
      const nights = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      const fromStr = d1.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const toStr = d2.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      computedDuration = `${nights} Nights (${fromStr} – ${toStr})`;
    }
  }
  const displayDuration = computedDuration || (totalNights > 0 ? `${totalNights} Nights` : (estimate.packageDuration || 'Umrah Stay'));
  const ticketLabel = b.flightType === 'Connecting' ? 'Connecting Airline Ticket' : 'Direct Airline Ticket';

  // Ziyarat places list
  const ziyaratPlaces = b.ziyaratPlaces && Array.isArray(b.ziyaratPlaces) && b.ziyaratPlaces.length > 0
    ? b.ziyaratPlaces
    : (b.includeZiyarat !== false ? ['Makkah', 'Madinah'] : []);
  const ziyaratLabel = ziyaratPlaces.join(', ');

  const formattedDate = estimate.createdAt
    ? new Date(estimate.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '14 Oct 2026';

  return (
    <div className="min-h-screen bg-slate-50/90 py-6 sm:py-10 font-sans text-slate-800 print:bg-white print:py-0">
      
      {/* Top Utility Bar (Screen Only) */}
      <div className="max-w-[820px] mx-auto px-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <Link 
          href="/erp/package-calculator" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
          <span>Back to Calculator</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle between Customer View and Staff Cost Matrix */}
          <div className="flex bg-slate-200/90 p-0.5 rounded-lg border border-slate-300/80 text-xs font-semibold">
            <button
              onClick={() => setViewMode('CUSTOMER')}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === 'CUSTOMER'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Customer Proposal
            </button>
            <button
              onClick={() => setViewMode('STAFF')}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === 'STAFF'
                  ? 'bg-slate-900 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Staff Cost Matrix
            </button>
          </div>

          <button
            onClick={handleShareWhatsApp}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            title="Share with customer via WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium shadow-2xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </button>

          {estimate.status !== 'Converted to Invoice' && (
            <button
              onClick={handleConvert}
              disabled={isConverting}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg text-xs font-bold shadow-2xs transition-colors"
            >
              <Receipt className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isConverting ? 'Converting...' : 'To Invoice'}</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CLEAN LUXURY CUSTOMER PROPOSAL (CLIENT VIEW)                          */}
      {/* ========================================================================= */}
      {viewMode === 'CUSTOMER' && (
        <div className="max-w-[820px] mx-auto bg-white rounded-xl shadow-lg border border-slate-200/90 overflow-hidden print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-full">
          
          {/* A. Minimalist Executive Header */}
          <div className="p-6 sm:p-8 border-b border-slate-100 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Official Quotation
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    REF: {estimate.estimateNo}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {estimate.companyName || 'NOOR E HARAM TRAVELS & TOURS'}
                </h1>
                
                <p className="text-xs text-slate-500 font-medium">
                  Umrah &amp; Hajj Travel Operations • Authorized Services
                </p>

                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                  <span>Date: <strong className="text-slate-800 font-semibold">{formattedDate}</strong></span>
                </div>
              </div>

              {/* Clean QR Verification Node */}
              <div className="flex items-center sm:flex-col gap-3 sm:gap-1 text-center shrink-0 border border-slate-200 rounded-lg p-2 bg-slate-50/60 self-start sm:self-auto">
                <QRCodeSVG 
                  value={liveQrUrl} 
                  size={64} 
                  level="M" 
                  includeMargin={false}
                />
                <span className="text-[8px] font-bold uppercase text-slate-600 tracking-wider">
                  Scan To Verify
                </span>
              </div>
            </div>
          </div>

          {/* B. Customer & Travel Composition Overview (Clean 3-column card) */}
          <div className="bg-slate-50/80 px-6 sm:px-8 py-3.5 border-b border-slate-200/80">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide block">Prepared For</span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm block uppercase mt-0.5">
                  {estimate.partyName}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide block">Total Pilgrims</span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm block mt-0.5">
                  {estimate.paxCount} Travelers (PAX)
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide block">Duration</span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm block mt-0.5">
                  {displayDuration}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">

            {/* C. Clean Luxury Investment Card (What customer actually pays) */}
            <div className="rounded-xl bg-slate-900 text-white p-5 sm:p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                  All-Inclusive Package Quotation
                </span>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                    {estimate.currency} {(items.perPaxQuote || 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-300 font-semibold">
                    / Pilgrim (All-Inclusive)
                  </span>
                </div>

                <p className="text-xs text-slate-400 pt-0.5">
                  Total Package for {estimate.paxCount} Travelers: <strong className="text-emerald-300 font-mono text-sm">{estimate.currency} {(items.grandTotal || 0).toLocaleString()}</strong>
                </p>
              </div>

              <div className="border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-5 text-xs text-slate-300 space-y-1 shrink-0">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Visa</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{ticketLabel}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Hotel</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Transport &amp; Ziyarat</span>
                </div>
              </div>
            </div>

            {/* D. Hotels & Accommodations (ONLY Hotel Name, City & Room Type, Deduplicated) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Building2 className="w-4 h-4 text-slate-700" />
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Hotels &amp; Accommodations
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {uniqueHotels.map((h, idx) => {
                  const isMakkah = (h.city || '').toLowerCase().includes('makkah');

                  return (
                    <div 
                      key={idx}
                      className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-slate-300 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <span className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isMakkah 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                            : 'bg-teal-50 text-teal-800 border border-teal-200'
                        }`}>
                          {isMakkah ? 'Makkah' : 'Medinah'}
                        </span>

                        <h3 className="text-sm font-black text-slate-900 pt-0.5">
                          {h.hotelName}
                        </h3>

                        {h.distance && (
                          <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <span>📍</span>
                            <span>{h.distance}</span>
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                          {h.roomType} Room
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* E. Package Inclusions (Clean 5-card grid: Visa, Ticket, Hotel, Transport, Ziyarat) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Sparkles className="w-4 h-4 text-slate-700" />
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Package Inclusions
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                {/* 1. Visa */}
                <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">Visa</span>
                    <span className="text-[10px] text-slate-500 font-medium">Included</span>
                  </div>
                </div>

                {/* 2. Ticket */}
                <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
                    <Plane className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">{ticketLabel}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{b.airlineCarrier ? b.airlineCarrier : 'Included'}</span>
                  </div>
                </div>

                {/* 3. Hotel */}
                <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">Hotel</span>
                    <span className="text-[10px] text-slate-500 font-medium">Included</span>
                  </div>
                </div>

                {/* 4. Transport */}
                <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center shrink-0">
                    <Bus className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">Transport</span>
                    <span className="text-[10px] text-slate-500 font-medium">Included</span>
                  </div>
                </div>

                {/* 5. Ziyarat */}
                <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-bold text-slate-900 text-xs block">Ziyarat</span>
                    <span className="text-[10px] text-slate-500 font-medium truncate block" title={ziyaratLabel || 'Makkah, Madinah'}>
                      {ziyaratLabel || 'Included'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* F. Terms & Guidance */}
            <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 space-y-1.5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span>• Hotel check-in is at 14:00 (2:00 PM) and check-out is at 12:00 PM per Saudi Ministry regulations.</span>
              </div>
              <div className="border-t border-slate-200 pt-3 text-center space-y-0.5">
                <p className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                  {estimate.companyName || 'NOOR E HARAM TRAVELS & TOURS'}
                </p>
                <p className="text-slate-500 font-mono text-[10.5px]">
                  Helpline: 0311-2324764 / 0312-3608683 • Email: info@nooreharam.com
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. STAFF COST MATRIX (INTERNAL OPERATIONS VIEW)                          */}
      {/* ========================================================================= */}
      {viewMode === 'STAFF' && (
        <div className="max-w-[820px] mx-auto bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8 text-slate-800 text-[11px] leading-tight print:w-full print:max-w-full">
          
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  Operations Cost Matrix
                </span>
                <span className="text-[9.5px] font-bold text-slate-500 font-mono">
                  REF: {estimate.estimateNo}
                </span>
              </div>

              <h2 className="text-xl font-black text-slate-900 uppercase">
                {estimate.companyName || 'NOOR E HARAM TRAVELS & TOURS'}
              </h2>
              <p className="text-xs text-slate-600">
                Internal Operations Cost Ledger • Itemized Unit Allocations &amp; Margins
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase block">Party Head</span>
              <span className="text-xs font-bold text-slate-900 block">{estimate.partyName} ({estimate.paxCount} PAX)</span>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-left border-collapse border border-slate-300 text-[10.5px] mb-4">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider">
                <th className="py-2 px-3 border-r border-slate-800">Line Item Description</th>
                <th className="py-2 px-3 border-r border-slate-800 text-center">Basis</th>
                <th className="py-2 px-3 border-r border-slate-800 text-right">Unit Rate ({estimate.currency})</th>
                <th className="py-2 px-3 text-right">Net Subtotal ({estimate.currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-2 px-3 border-r border-slate-200 font-bold">Visa</td>
                <td className="py-2 px-3 border-r border-slate-200 text-center">{estimate.paxCount} Persons</td>
                <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-bold">{(items.visaCostPerPax || 0).toLocaleString()}</td>
                <td className="py-2 px-3 text-right font-mono font-bold">{(items.visaTotal || 0).toLocaleString()}</td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="py-2 px-3 border-r border-slate-200 font-bold">{ticketLabel}</td>
                <td className="py-2 px-3 border-r border-slate-200 text-center">{estimate.paxCount} Tickets</td>
                <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-bold">{(items.flightCostPerPax || 0).toLocaleString()}</td>
                <td className="py-2 px-3 text-right font-mono font-bold">{(items.flightTotal || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 border-r border-slate-200 font-bold">Hotel</td>
                <td className="py-2 px-3 border-r border-slate-200 text-center">{totalNights} Nights Total</td>
                <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-bold">—</td>
                <td className="py-2 px-3 text-right font-mono font-bold">{(items.hotelBlocksCost || 0).toLocaleString()}</td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="py-2 px-3 border-r border-slate-200 font-bold">Transport</td>
                <td className="py-2 px-3 border-r border-slate-200 text-center">Full Circuit</td>
                <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-bold">—</td>
                <td className="py-2 px-3 text-right font-mono font-bold">{(items.transportSegmentCost || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 border-r border-slate-200 font-bold">Ziyarat</td>
                <td className="py-2 px-3 border-r border-slate-200 text-center">Guided Tour</td>
                <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-bold">—</td>
                <td className="py-2 px-3 text-right font-mono font-bold">{(items.ziyaratAndLogistics || 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          {/* Pricing Totals Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-[10px] space-y-1">
              <span className="font-bold text-slate-800 uppercase block border-b border-slate-200 pb-1">
                Internal Configuration
              </span>
              <p className="text-slate-600">Rate: 1 SAR = PKR {estimate.exchangeRateSarPkr || 74.5}</p>
              <p className="text-slate-600">Margin: {b.marginType === 'FIXED_PER_PAX' ? `Fixed PKR ${b.marginFixedPerPax}/pax` : `${items.marginPercent}%`}</p>
              <p className="text-slate-600">Margin Amount: +{estimate.currency} {(items.marginAmount || 0).toLocaleString()}</p>
            </div>

            <div className="bg-slate-900 text-white rounded-lg p-4 space-y-2 text-right">
              <div className="flex justify-between text-slate-300 text-[11px]">
                <span>Base Net Cost:</span>
                <span className="font-mono font-bold">{estimate.currency} {(items.subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-amber-300 text-[11px] border-t border-slate-800 pt-1">
                <span>Profit Margin ({items.marginPercent}%):</span>
                <span className="font-mono font-bold">+{estimate.currency} {(items.marginAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white text-base font-black border-t border-slate-800 pt-2">
                <span>Total Estimated Quote:</span>
                <span className="text-emerald-400 font-mono">
                  {estimate.currency} {(items.grandTotal || 0).toLocaleString()}
                </span>
              </div>
              <div className="text-[10px] text-slate-300">
                Per Pilgrim: <strong className="text-white font-mono text-xs">{estimate.currency} {(items.perPaxQuote || 0).toLocaleString()}</strong>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
