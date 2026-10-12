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
  FileCheck2, 
  Calendar, 
  ShieldCheck, 
  Layers, 
  Plane, 
  Building2, 
  Bus, 
  Percent, 
  DollarSign, 
  Receipt 
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
  const [isStaffMode, setIsStaffMode] = useState(false);
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
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 text-white rounded-lg text-sm font-semibold hover:bg-emerald-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to ERP Portal</span>
        </Link>
      </div>
    );
  }

  const liveQrUrl = `${origin}/estimate/${estimate.id || id}`;
  const items = estimate.items || {};

  return (
    <div className="min-h-screen bg-slate-100/80 py-6 sm:py-10">
      
      {/* Action Header (Screen Only) */}
      <div className="max-w-[850px] mx-auto px-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <Link 
          href="/erp" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-900 hover:text-emerald-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Operations ERP</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {/* Staff Mode Toggle */}
          <button
            onClick={() => setIsStaffMode(!isStaffMode)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              isStaffMode 
                ? 'bg-amber-100 text-amber-900 border-amber-300' 
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>{isStaffMode ? 'Staff Margins: ON' : 'Draft Customer Layout'}</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied' : 'Share QR Link'}</span>
          </button>

          {/* 1-Click Convert Trigger */}
          {estimate.status !== 'Converted to Invoice' && (
            <button
              onClick={handleConvert}
              disabled={isConverting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-lg text-xs font-black shadow-md transition-all active:scale-95"
            >
              <Receipt className="w-4 h-4 stroke-[2.5]" />
              <span>{isConverting ? 'Converting...' : '1-Click To Invoice'}</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Quote (A4)</span>
          </button>
        </div>
      </div>

      {/* Main Quotation Sheet (A4 Dimensions) */}
      <div className="max-w-[850px] mx-auto bg-white shadow-2xl border border-slate-300 print:shadow-none print:border-none p-6 sm:p-8 print:p-4 text-slate-800 text-[11px] leading-tight print:w-full print:max-w-full">
        
        {/* Header Block */}
        <div className="flex items-start justify-between border-b-2 border-emerald-950 pb-4 mb-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                Pre-Sales Package Estimate
              </span>
              <span className="text-[9.5px] font-bold text-slate-500 font-mono">
                REF: {estimate.estimateNo}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-emerald-950 uppercase tracking-tight">
              {estimate.companyName || 'NOOR E HARAM TRAVELS & TOURS'}
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              B2B Travel Operations • Customized Umrah &amp; Hajj Package Quotation
            </p>
            <p className="text-[10px] text-slate-500">
              Valid for: <strong className="text-slate-800">{estimate.validityDays || 14} Days</strong> from issue date
            </p>
          </div>

          {/* QR Verification Node */}
          <div className="flex flex-col items-center text-center shrink-0">
            <div className="p-1.5 bg-white border-2 border-emerald-900 rounded-lg shadow-sm">
              <QRCodeSVG 
                value={liveQrUrl} 
                size={80} 
                level="M" 
                includeMargin={false}
              />
            </div>
            <span className="text-[8.5px] font-black uppercase text-emerald-900 mt-1 tracking-wider">
              Scan For Quote
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 font-extrabold text-[8px] border border-amber-200 mt-0.5">
              Online Verified
            </span>
          </div>
        </div>

        {/* Client & Group Header Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
          <div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Customer / Party Head</span>
            <span className="font-black text-xs sm:text-sm text-slate-900 block mt-0.5 uppercase">
              {estimate.partyName}
            </span>
          </div>

          <div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Group UID</span>
            <span className="font-mono font-bold text-xs text-emerald-800 block mt-0.5">
              {estimate.partyHeadUid}
            </span>
          </div>

          <div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Total Travelers</span>
            <span className="font-black text-xs sm:text-sm text-slate-900 block mt-0.5">
              {estimate.paxCount} Pilgrims (PAX)
            </span>
          </div>

          <div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Package Type</span>
            <span className="font-bold text-xs text-amber-800 block mt-0.5">
              {estimate.packageDuration || '18 Days Umrah'}
            </span>
          </div>
        </div>

        {/* Itemized Allocation Table */}
        <div className="mb-4">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-2.5">
            <h2 className="font-black text-xs sm:text-sm text-emerald-950 uppercase tracking-wide">
              Itemized Package Cost Allocations
            </h2>
            <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Currency: {estimate.currency}
            </span>
          </div>

          <table className="w-full text-left border-collapse border border-slate-300 text-[10.5px]">
            <thead>
              <tr className="bg-emerald-950 text-white font-extrabold text-[10px] uppercase tracking-wider">
                <th className="py-2 px-3 border-r border-emerald-900">Line Item Description</th>
                <th className="py-2 px-3 border-r border-emerald-900 text-center">Allocation Basis</th>
                <th className="py-2 px-3 border-r border-emerald-900 text-right">Unit Rate ({estimate.currency})</th>
                <th className="py-2 px-3 text-right">Net Subtotal ({estimate.currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-900">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <div>
                      <p>Saudi Umrah Electronic Visa Processing</p>
                      <p className="text-[9px] text-slate-500 font-normal">Nusuk / MoFA electronic visa fees &amp; health medical insurance</p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-center font-medium">
                  {estimate.paxCount} Persons
                </td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-bold">
                  {(items.visaCostPerPax || 0).toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  {(items.visaTotal || 0).toLocaleString()}
                </td>
              </tr>

              <tr className="bg-slate-50/50">
                <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-900">
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-blue-700" />
                    <div>
                      <p>Direct Carrier Airline Tickets</p>
                      <p className="text-[9px] text-slate-500 font-normal">Roundtrip baggage confirmed international flights</p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-center font-medium">
                  {estimate.paxCount} Tickets
                </td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-bold">
                  {(items.flightCostPerPax || 0).toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  {(items.flightTotal || 0).toLocaleString()}
                </td>
              </tr>

              <tr>
                <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-900">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-700" />
                    <div>
                      <p>Makkah &amp; Madinah Multi-Stay Hotel Blocks</p>
                      <p className="text-[9px] text-slate-500 font-normal">Confirmed hotel accommodation blocks across entire stay</p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-center font-medium">
                  Group Block
                </td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-bold">
                  —
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  {(items.hotelBlocksCost || 0).toLocaleString()}
                </td>
              </tr>

              <tr className="bg-slate-50/50">
                <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-900">
                  <div className="flex items-center gap-2">
                    <Bus className="w-4 h-4 text-emerald-800" />
                    <div>
                      <p>Dedicated KSA Ground Transport Fleet</p>
                      <p className="text-[9px] text-slate-500 font-normal">Airport to Makkah, Inter-city to Madinah, and Airport departure</p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-center font-medium">
                  Full Circuit
                </td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-bold">
                  —
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  {(items.transportSegmentCost || 0).toLocaleString()}
                </td>
              </tr>

              <tr>
                <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-900">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <div>
                      <p>Holy Ziyarat &amp; Logistics Ground Escort</p>
                      <p className="text-[9px] text-slate-500 font-normal">Historical sites guidance and 24/7 ground liaison</p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-center font-medium">
                  Complementary
                </td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-bold">
                  —
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  {(items.ziyaratAndLogistics || 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Cost Summary & Margins Block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          
          {/* Terms & Notes */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-[10px] space-y-2">
            <span className="font-bold text-slate-800 uppercase tracking-wide block border-b border-slate-200 pb-1">
              Quotation Terms &amp; Provisions
            </span>
            <ul className="text-slate-600 space-y-1 list-disc list-inside">
              <li>Fare rates are subject to airline fuel tariff variations until ticket issuance.</li>
              <li>Hotels reserved are subject to Saudi Ministry check-in rules (14:00 check-in).</li>
              <li>Official corporate tax invoice is issued upon customer contract confirmation.</li>
              <li>Valid for 14 calendar days from the date of issuance.</li>
            </ul>
          </div>

          {/* Pricing Totals Box */}
          <div className="bg-emerald-950 text-white rounded-lg p-4 space-y-2 text-right">
            <div className="flex justify-between text-emerald-200 text-[11px]">
              <span>Base Package Cost:</span>
              <span className="font-mono font-bold">{estimate.currency} {(items.subtotal || 0).toLocaleString()}</span>
            </div>

            {isStaffMode && (
              <div className="flex justify-between text-amber-300 text-[11px] border-t border-emerald-900/80 pt-1">
                <span>Internal Markup Margin ({items.marginPercent}%):</span>
                <span className="font-mono font-bold">+{estimate.currency} {(items.marginAmount || 0).toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-white text-base sm:text-lg font-black border-t border-emerald-800 pt-2">
              <span>Total Estimated Quote:</span>
              <span className="text-amber-300 font-mono">
                {estimate.currency} {(items.grandTotal || 0).toLocaleString()}
              </span>
            </div>

            <div className="text-[10px] text-emerald-300 font-medium">
              Average Cost Per Pilgrim:{' '}
              <strong className="text-white font-mono text-xs font-black">
                {estimate.currency} {(items.perPaxQuote || 0).toLocaleString()}
              </strong>
            </div>
          </div>

        </div>

        {/* Footer Helpline */}
        <div className="border-t border-slate-300 pt-3 text-center text-[10px] text-slate-500">
          <p className="font-bold text-emerald-950 uppercase">
            NOOR E HARAM TRAVELS &amp; TOURS • OPERATIONS SALES DESK
          </p>
          <p className="font-mono mt-0.5">
            Pakistan Helpline: 0311-2264567 / 0312-8039911 • Email: operations@nooreharam.com
          </p>
        </div>

      </div>

    </div>
  );
}
