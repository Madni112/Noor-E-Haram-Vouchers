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
  FileText 
} from 'lucide-react';
import { getHotelVoucherById, getAllHotelVouchers } from '../../../lib/erpData';

export default function HotelVoucherViewPage() {
  const params = useParams();
  const id = params?.id ? decodeURIComponent(params.id) : '';
  
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      const data = getHotelVoucherById(id);
      setVoucher(data);
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <Building2 className="w-16 h-16 text-slate-400 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-800">Hotel Voucher Not Found</h2>
        <p className="text-slate-500 text-sm">
          No accommodation voucher exists with reference <code className="bg-slate-200 px-2 py-0.5 rounded font-mono">{id}</code>.
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

  const liveQrUrl = `${origin}/hotel-voucher/${voucher.id || id}`;
  const totalNights = (voucher.stays || []).reduce((acc, curr) => acc + (parseInt(curr.nights) || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100/80 py-6 sm:py-10">
      
      {/* Top Action Bar (Screen Only) */}
      <div className="max-w-[850px] mx-auto px-4 mb-4 flex items-center justify-between no-print">
        <Link 
          href="/erp" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-900 hover:text-emerald-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Operations ERP</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Link Copied!' : 'Copy Mobile QR Link'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Hotel Voucher (A4)</span>
          </button>
        </div>
      </div>

      {/* Main Voucher Container - Standard A4 Geometry */}
      <div className="max-w-[850px] mx-auto bg-white shadow-2xl border border-slate-300 print:shadow-none print:border-none p-5 sm:p-8 print:p-4 text-slate-800 text-[11px] leading-tight print:w-full print:max-w-full">
        
        {/* Header Block */}
        <div className="flex items-start justify-between border-b-2 border-emerald-950 pb-4 mb-4 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 inline-block mb-1">
              Official Accommodation Voucher
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-emerald-950 uppercase tracking-tight">
              {voucher.companyName || 'NOOR E HARAM TRAVELS & TOURS'}
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Kingdom of Saudi Arabia • Authorized Ministry of Hajj &amp; Umrah Hotel Certificate
            </p>
            <p className="text-[10.5px] text-slate-500 font-mono">
              VOUCHER REF: <strong className="text-emerald-950 font-black">{voucher.voucherNo}</strong> • ISSUE DATE: {voucher.issueDate}
            </p>
          </div>

          {/* QR Verification Node */}
          <div className="flex flex-col items-center text-center shrink-0">
            <div className="p-1.5 bg-white border-2 border-emerald-900 rounded-lg shadow-sm">
              <QRCodeSVG 
                value={liveQrUrl} 
                size={84} 
                level="M" 
                includeMargin={false}
              />
            </div>
            <span className="text-[9px] font-black uppercase text-emerald-900 mt-1 tracking-wider">
              Scan To Verify
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-extrabold text-[8.5px] border border-emerald-200 mt-0.5">
              Live Verified
            </span>
          </div>
        </div>

        {/* Party Head & Group Manifest Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-emerald-950 text-white rounded-lg p-3 mb-4 print:p-2.5">
          <div>
            <span className="text-[9px] font-bold text-amber-300/90 uppercase tracking-wider block">Lead Passenger / Party Head</span>
            <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white block mt-0.5 uppercase">
              {voucher.partyName}
            </span>
          </div>

          <div>
            <span className="text-[9px] font-bold text-amber-300/90 uppercase tracking-wider block">Party Head UID</span>
            <span className="font-mono font-bold text-xs text-emerald-200 block mt-0.5">
              {voucher.partyHeadUid}
            </span>
          </div>

          <div>
            <span className="text-[9px] font-bold text-amber-300/90 uppercase tracking-wider block">Total Group PAX</span>
            <span className="font-black text-xs sm:text-sm text-white block mt-0.5">
              {voucher.totalPax} Mutamers
            </span>
          </div>

          <div>
            <span className="text-[9px] font-bold text-amber-300/90 uppercase tracking-wider block">Total Duration</span>
            <span className="font-black text-xs sm:text-sm text-amber-300 block mt-0.5">
              {totalNights} Nights Confirmed
            </span>
          </div>
        </div>

        {/* Accommodation Chronology Timeline */}
        <div className="mb-5">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-2.5">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-800" />
              <h2 className="font-black text-xs sm:text-sm text-emerald-950 uppercase tracking-wide">
                Accommodation Chronology Timeline (Makkah &amp; Madinah)
              </h2>
            </div>
            <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Direct Hotel Contract Blocks
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300 text-[10.5px] print:text-[9.5pt]">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-300">
                  <th className="py-2 px-2.5 border-r border-slate-300">City Sector</th>
                  <th className="py-2 px-2.5 border-r border-slate-300">Hotel Name &amp; Property</th>
                  <th className="py-2 px-2.5 border-r border-slate-300 text-center">HCN / Conf #</th>
                  <th className="py-2 px-2.5 border-r border-slate-300 text-center">Room Setup</th>
                  <th className="py-2 px-2.5 border-r border-slate-300 text-center">Meal Plan</th>
                  <th className="py-2 px-2.5 border-r border-slate-300 text-center">Check-In</th>
                  <th className="py-2 px-2.5 border-r border-slate-300 text-center">Check-Out</th>
                  <th className="py-2 px-2.5 text-center bg-emerald-50 text-emerald-950 font-black">Nights</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(voucher.stays || []).map((stay, idx) => (
                  <tr key={stay.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-2.5 border-r border-slate-200 font-black text-emerald-900 uppercase">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{stay.city}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200 font-black text-slate-900 uppercase">
                      {stay.hotelName}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200 text-center font-mono font-bold text-slate-700">
                      {stay.hcn || 'VERIFIED'}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200 text-center">
                      <span className="inline-block font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 text-[9.5px]">
                        {stay.roomType || 'QUAD'} {stay.roomsCount > 1 ? `(${stay.roomsCount} Rms)` : ''}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200 text-center">
                      <span className="font-bold font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[9.5px]">
                        {stay.mealPlan || 'RO'}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200 text-center font-medium font-mono text-slate-700">
                      {stay.checkIn}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200 text-center font-medium font-mono text-slate-700">
                      {stay.checkOut}
                    </td>
                    <td className="py-2 px-2.5 text-center font-black text-emerald-950 bg-emerald-50/50">
                      {stay.nights}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interlinked Passenger Matrix */}
        <div className="mb-5">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-2.5">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-800" />
              <h2 className="font-black text-xs sm:text-sm text-emerald-950 uppercase tracking-wide">
                Room Allocation &amp; Guest Manifest
              </h2>
            </div>
            <span className="text-[9.5px] font-bold text-slate-500">
              Total {voucher.passengers?.length || voucher.totalPax} Guests
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
            {(voucher.passengers || []).map((pax, pIdx) => (
              <div key={pax.id || pIdx} className="flex items-center justify-between p-2 rounded border border-slate-200 bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-400 w-4">#{pIdx + 1}</span>
                  <div>
                    <p className="font-black text-slate-900 uppercase">{pax.name}</p>
                    <p className="text-[9px] text-slate-500 font-mono">Passport: {pax.passportNo || '—'} • Visa: {pax.visaNo || '—'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900">
                    {pax.category || 'Adult'}
                  </span>
                  <p className="text-[8.5px] text-slate-500 mt-0.5">Bed: {pax.hasBed !== false ? 'Yes' : 'No'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dual English & Urdu Compliance Rules Footer */}
        <div className="border-t-2 border-emerald-950 pt-3 mt-4 space-y-3">
          
          {/* Urdu Compliance Rules (Original Certified Layout) */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-1 mb-2">
              <span className="font-bold text-[11px] text-amber-950">
                ضروری ہدایات برائے معتمرین کرام (سعودی حکومتی قوانین و ہوٹل ضوابط)
              </span>
              <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                قابلِ عمل شرائط
              </span>
            </div>
            <ul className="text-[10px] text-slate-800 space-y-1.5 leading-relaxed font-sans list-disc list-inside">
              <li>ہوٹل اور پیکیج اس دستاویز میں لکھ دیا گیا ہے۔ بعد میں کسی قسم کی تبدیلی ممکن نہیں۔</li>
              <li>سفری سامان حرمین شریفین کی طرف لے جانا سعودی انتظامیہ کی طرف سے ممنوع ہے۔ خلاف ورزی پر جرمانہ ہوگا۔</li>
              <li>نشہ آور اشیاء کا لانا قانوناً ممنوع ہے، سعودیہ میں منشیات لے جانے کی سزا موت ہے۔</li>
              <li>حرمین شریفین کے اندر زمین پر گری پڑی چیز (پرس، موبائل فون یا کوئی قیمتی چیز) ہرگز نہ اٹھائیں۔</li>
              <li>ہوٹل سے چیک آؤٹ ٹائم دوپہر 2 بجے ہے۔ اس کے بعد اگلی Night چارج ہوگی، واؤچر کی 4 کاپیاں پاس رکھیں۔</li>
            </ul>
          </div>

          {/* English Standard Hotel Regulations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[9.5px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div>
              <p className="font-bold text-slate-800 mb-0.5">Hotel Check-In &amp; Check-Out Guidelines:</p>
              <p>Standard hotel check-in is 14:00 (2:00 PM). Check-out strictly at 12:00 PM (Noon). Late check-outs without prior written approval are charged an additional night automatically by property management.</p>
            </div>
            <div>
              <p className="font-bold text-slate-800 mb-0.5">Identity Verification &amp; Security:</p>
              <p>All pilgrims must present their original Pakistani passport and Saudi Umrah Electronic Visa at the reception desk. Keep this verifiable QR document accessible throughout your pilgrimage.</p>
            </div>
          </div>

          {/* Pakistan & KSA 24/7 Ground Helplines */}
          <div className="bg-emerald-950 text-white rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <span className="text-[9px] font-black tracking-wider text-amber-300 uppercase block">
                NOOR E HARAM 24/7 PAKISTAN HELPLINE
              </span>
              <p className="font-mono font-black text-xs text-white mt-0.5">
                UBAID RAZA MEMON 0311-2264567 | BACKUP: MADNI RAZA MEMON 0312-8039911
              </p>
            </div>

            <div className="text-center sm:text-right">
              <span className="text-[9px] font-black tracking-wider text-amber-300 uppercase block">
                KSA GROUND &amp; HOTEL SUPPORT
              </span>
              <p className="font-mono font-bold text-xs text-emerald-200 mt-0.5">
                Makkah: +966 53 649 2846 | Madinah: +966 57 593 0550
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
