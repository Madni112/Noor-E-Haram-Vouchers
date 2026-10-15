'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { getTransportOnlyVoucherById } from '../../../lib/erpData';
import { 
  Bus, 
  Calendar, 
  Clock, 
  MapPin, 
  PhoneCall, 
  Printer, 
  Share2, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  Users, 
  Plane, 
  AlertCircle,
  Copy,
  Check,
  FileText
} from 'lucide-react';

export default function TransportVoucherViewPage() {
  const params = useParams();
  const id = params?.id ? decodeURIComponent(params.id) : '';
  const router = useRouter();

  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      if (id) {
        const found = getTransportOnlyVoucherById(id);
        if (found) {
          setVoucher(found);
        }
      }
      setLoading(false);
    }
  }, [id]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${origin}/transport-voucher/${voucher?.voucherNo || id}`;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
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
            The transport voucher reference <span className="font-mono font-bold">{id}</span> could not be loaded from records.
          </p>
          <Link
            href="/transport-voucher"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Transport Manager</span>
          </Link>
        </div>
      </div>
    );
  }

  const sectors = voucher.sectors || [];
  const passengers = voucher.passengers || [];

  return (
    <div className="min-h-screen bg-slate-100/90 py-6 sm:py-10 text-slate-900 print:bg-white print:py-0">
      
      {/* Top Floating Command Bar (Hidden on Print) */}
      <div className="max-w-4xl mx-auto px-4 mb-4 flex items-center justify-between gap-3 no-print">
        <Link
          href="/transport-voucher"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Manager</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer ${
              copied ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Voucher</span>
          </button>
        </div>
      </div>

      {/* Main Official Printable Voucher Sheet */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 shadow-md print:shadow-none print:border-none rounded-2xl print:rounded-none overflow-hidden p-6 sm:p-8 space-y-6">
        
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-slate-900">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Bus className="w-8 h-8 text-emerald-400 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-xl sm:text-2xl tracking-tight text-slate-900 uppercase">
                  {voucher.companyName || 'NOOR E HARAM TRAVELS'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  OFFICIAL
                </span>
              </div>
              <h1 className="text-xs sm:text-sm font-extrabold tracking-wider text-slate-500 uppercase mt-0.5">
                UMRAH GROUND TRANSPORTATION VOUCHER
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                KSA Ground Dispatch &amp; Pilgrims Transfer Authorization
              </p>
            </div>
          </div>

          {/* Voucher Ref & QR Code */}
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                VOUCHER NO
              </span>
              <span className="font-mono font-black text-base sm:text-lg text-slate-900 block">
                {voucher.voucherNo || voucher.id}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                Issue: {voucher.issueDate || '2026-10-08'}
              </span>
            </div>

            <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
              <QRCodeSVG
                value={`${origin}/transport-voucher/${voucher.voucherNo || voucher.id}`}
                size={64}
                level="M"
              />
            </div>
          </div>
        </div>

        {/* Lead Pilgrim & Booking Specifications */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lead Pilgrim</span>
            <span className="text-sm font-black text-slate-900 block truncate uppercase mt-0.5">
              {voucher.partyName || 'Valued Pilgrim'}
            </span>
            <span className="text-[11px] text-slate-500 font-medium block">
              {voucher.contactPhone || '—'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vehicle Type</span>
            <span className="text-sm font-black text-slate-900 block truncate mt-0.5">
              {voucher.vehicleType || '50-Seater Luxury Bus'}
            </span>
            <span className="text-[11px] text-slate-500 font-medium block">
              Plate: {voucher.vehicleNumber || 'KSA-7821'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transport Provider</span>
            <span className="text-sm font-black text-slate-900 block truncate mt-0.5">
              {voucher.transportCompany || 'Noor E Haram Transport Fleet'}
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-600 block">
              {voucher.brnNumber || 'BRN-10842'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pilgrims</span>
            <span className="text-sm font-black text-slate-900 block font-mono mt-0.5">
              {voucher.totalPax || passengers.length || 1} PAX
            </span>
            <span className="text-[11px] text-slate-500 font-medium block">
              Baggage: {voucher.luggageCount || 'Standard'}
            </span>
          </div>
        </div>

        {/* Driver & Dispatch Emergency Contact Callout */}
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-amber-900 block">
                Assigned Driver: <span className="font-black">{voucher.driverName || 'Tariq Mehmood'}</span> ({voucher.driverPhone || '+966 55 819 2401'})
              </span>
              <span className="text-amber-700/90 text-[11px]">
                Direct line for airport pickup &amp; inter-city hotel transfers
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[10px] font-bold text-amber-800 uppercase block">KSA Transport Dispatch</span>
            <span className="font-mono font-black text-amber-950 text-xs sm:text-sm block">
              {voucher.emergencyHelpline || '+966 53 649 2846'}
            </span>
          </div>
        </div>

        {/* Sectors & Itinerary Timeline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Bus className="w-4 h-4 text-emerald-600" />
              <span>Authorized Route Sectors &amp; Transfer Schedule</span>
            </h2>
            <span className="text-[11px] font-bold text-slate-400 font-mono">
              {sectors.length} {sectors.length === 1 ? 'Sector' : 'Sectors'}
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white text-[10.5px] font-black uppercase tracking-wider">
                <tr>
                  <th className="px-3.5 py-2.5 w-12 text-center">#</th>
                  <th className="px-3.5 py-2.5">Route / Transfer Sector</th>
                  <th className="px-3.5 py-2.5">Date &amp; Time</th>
                  <th className="px-3.5 py-2.5">Flight Ref</th>
                  <th className="px-3.5 py-2.5">Vehicle</th>
                  <th className="px-3.5 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {sectors.map((sec, idx) => (
                  <tr key={sec.id || idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3.5 py-3 text-center font-mono font-bold text-slate-900">
                      {idx + 1}
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="font-black text-slate-900 uppercase block">
                        {sec.route}
                      </span>
                      {sec.driverName && (
                        <span className="text-[10px] text-slate-400">Driver: {sec.driverName}</span>
                      )}
                    </td>
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <span className="font-bold text-slate-900 block">{sec.pickupDate || '—'}</span>
                      <span className="font-mono text-[11px] text-slate-500 font-bold block">{sec.pickupTime || 'Standard'}</span>
                    </td>
                    <td className="px-3.5 py-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {sec.flightNumber || '—'}
                    </td>
                    <td className="px-3.5 py-3 text-slate-600 whitespace-nowrap">
                      {sec.vehicleType || voucher.vehicleType || 'Luxury Bus'}
                    </td>
                    <td className="px-3.5 py-3 text-right whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {sec.status || 'CONFIRMED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Passenger Manifest Table */}
        {passengers.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Authorized Passengers Manifest ({passengers.length} Pilgrims)</span>
            </h2>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 text-[10.5px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 w-10 text-center">S#</th>
                    <th className="px-3 py-2">Pilgrim Name</th>
                    <th className="px-3 py-2">Passport No</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2 text-right">Luggage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {passengers.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-center font-mono font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-900 uppercase">
                        {p.prefix ? `${p.prefix} ` : ''}{p.name}
                      </td>
                      <td className="px-3 py-2 font-mono font-bold text-slate-700 uppercase">
                        {p.passportNo || '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {p.category || (p.gender === 'Female' ? 'Adult (Female)' : 'Adult (Male)')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-500">
                        Included
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Important Terms & Compliance (Bilingual) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
          <span className="font-black text-slate-900 uppercase text-[11px] block">
            Important Transport Regulations &amp; Pilgrims Guidelines:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-600 leading-relaxed">
            <div>
              <p>• Passengers must arrive at the hotel lobby or pickup gate <strong>30 minutes</strong> prior to the designated departure time.</p>
              <p className="mt-1">• Keep valid passport copy, Umrah visa copy, and this transport voucher readily available for highway checkpoints.</p>
              <p className="mt-1">• Maximum 2 luggage bags permitted per seat. Drivers are authorized to decline excess unauthorized baggage.</p>
            </div>
            <div className="font-urdu text-right text-xs leading-loose text-slate-800" dir="rtl">
              <p>• تمام معزز مسافر روانگی کے وقت سے ۳۰ منٹ قبل ہوٹل لابی میں تشریف رکھیں۔</p>
              <p>• راستے کے چیک پوسٹوں کیلئے اپنے پاسپورٹ اور ویزا کی کاپیاں ہمراہ رکھیں۔</p>
              <p>• کسی بھی ہنگامی صورتحال میں اوپر دیئے گئے KSA ٹرانسپورٹ ڈسپیچ نمبر پر فوری رابطہ کریں۔</p>
            </div>
          </div>
        </div>

        {/* Verification Sign-Off Footer */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-700">Digitally Verified &amp; Authorized Ground Movement</span>
          </div>

          <div className="text-right">
            <span className="font-mono text-[11px] text-slate-400">
              System Authorized: {voucher.voucherNo || voucher.id}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
