'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Building2, 
  PlusCircle, 
  MapPin, 
  Calendar, 
  ExternalLink, 
  Printer, 
  QrCode, 
  Users, 
  CheckCircle2, 
  Search, 
  Bed, 
  FileText 
} from 'lucide-react';
import { saveHotelVoucher } from '../../lib/erpData';

export default function HotelVoucherManager({ hotelVouchers = [], parties = [], onVouchersUpdated }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [targetPartyUid, setTargetPartyUid] = useState(parties[0]?.partyHeadUid || '');
  const [makkahHotel, setMakkahHotel] = useState('VOCO 5 STAR');
  const [makkahCheckIn, setMakkahCheckIn] = useState('2026-10-10');
  const [makkahCheckOut, setMakkahCheckOut] = useState('2026-10-18');
  const [makkahRoomType, setMakkahRoomType] = useState('QUAD');
  const [makkahMeal, setMakkahMeal] = useState('RO');
  const [makkahHcn, setMakkahHcn] = useState('HCN-108047');

  const [madinahHotel, setMadinahHotel] = useState('GULNAR HV');
  const [madinahCheckIn, setMadinahCheckIn] = useState('2026-10-18');
  const [madinahCheckOut, setMadinahCheckOut] = useState('2026-10-27');
  const [madinahRoomType, setMadinahRoomType] = useState('QUAD');
  const [madinahMeal, setMadinahMeal] = useState('RO');
  const [madinahHcn, setMadinahHcn] = useState('HCN-108048');

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const diff = new Date(end) - new Date(start);
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
  };

  const handleCreateHotelVoucher = (e) => {
    e.preventDefault();
    const party = parties.find(p => p.partyHeadUid === targetPartyUid);
    if (!party) {
      alert('Selected party not found');
      return;
    }

    const vId = `HV-${party.voucherRefNo || party.partyHeadUid}`;
    const makkahNights = calculateDays(makkahCheckIn, makkahCheckOut);
    const madinahNights = calculateDays(madinahCheckIn, madinahCheckOut);

    const newVoucher = {
      id: vId,
      voucherNo: vId,
      partyHeadUid: party.partyHeadUid,
      partyName: party.partyName,
      companyName: party.companyName || 'NOOR E HARAM TRAVELS & TOURS',
      totalPax: party.totalPax || 1,
      passengers: party.passengers || [],
      stays: [
        {
          id: `stay-${Date.now()}-1`,
          city: 'Makkah',
          hotelName: makkahHotel.trim().toUpperCase(),
          checkIn: makkahCheckIn,
          checkOut: makkahCheckOut,
          nights: makkahNights,
          roomType: makkahRoomType,
          roomsCount: 1,
          mealPlan: makkahMeal,
          hcn: makkahHcn.trim().toUpperCase() || 'HCN-CONFIRMED',
          hotelPhone: '+966 53 649 2846',
        },
        {
          id: `stay-${Date.now()}-2`,
          city: 'Medinah',
          hotelName: madinahHotel.trim().toUpperCase(),
          checkIn: madinahCheckIn,
          checkOut: madinahCheckOut,
          nights: madinahNights,
          roomType: madinahRoomType,
          roomsCount: 1,
          mealPlan: madinahMeal,
          hcn: madinahHcn.trim().toUpperCase() || 'HCN-CONFIRMED',
          hotelPhone: '+966 57 593 0550',
        }
      ],
      issueDate: new Date().toISOString().split('T')[0],
      emergencyHelpline: 'UBAID RAZA MEMON 0311-2264567 / BACKUP: MADNI RAZA MEMON 0312-8039911',
      status: 'Confirmed & Verified',
    };

    saveHotelVoucher(newVoucher);
    if (onVouchersUpdated) onVouchersUpdated([newVoucher, ...hotelVouchers]);

    setShowCreateModal(false);
  };

  const filteredVouchers = hotelVouchers.filter((v) => {
    const q = searchTerm.toLowerCase();
    return (
      (v.voucherNo || '').toLowerCase().includes(q) ||
      (v.partyName || '').toLowerCase().includes(q) ||
      (v.partyHeadUid || '').toLowerCase().includes(q) ||
      (v.stays || []).some(s => (s.hotelName || '').toLowerCase().includes(q) || (s.city || '').toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      
      {/* Module Title Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
              Module B
            </span>
            <h2 className="text-base sm:text-lg font-black text-emerald-950 uppercase">
              Dynamic Multi-Stay Hotel Voucher Engine
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Generates legal proof of accommodation with chronological Makkah &amp; Madinah blocks, dual English/Urdu compliance footer &amp; live QR verification.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>Generate Hotel Voucher</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search hotel vouchers by party or hotel name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>
        <span className="text-xs text-slate-500 font-mono">
          Showing {filteredVouchers.length} Hotel Vouchers
        </span>
      </div>

      {/* Hotel Vouchers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVouchers.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs italic">
            No hotel vouchers found. Click "Generate Hotel Voucher" above to create one.
          </div>
        ) : (
          filteredVouchers.map((v) => {
            const totalN = (v.stays || []).reduce((acc, curr) => acc + (parseInt(curr.nights) || 0), 0);
            return (
              <div 
                key={v.id} 
                className="bg-white border border-slate-200 hover:border-emerald-700/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {v.voucherNo}
                        </span>
                        <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {v.partyHeadUid}
                        </span>
                      </div>
                      <h3 className="font-black text-sm text-slate-900 mt-1 uppercase">
                        {v.partyName}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {v.totalPax} Passengers • {totalN} Nights Total
                      </p>
                    </div>

                    <div className="p-1 bg-white border border-slate-200 rounded shrink-0 shadow-sm">
                      <QRCodeSVG 
                        value={typeof window !== 'undefined' ? `${window.location.origin}/hotel-voucher/${v.id}` : ''}
                        size={48} 
                      />
                    </div>
                  </div>

                  {/* Stays Itinerary Timeline */}
                  <div className="space-y-1.5 pt-2.5">
                    {(v.stays || []).map((stay, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-800 uppercase block">{stay.city}: {stay.hotelName}</span>
                            <span className="text-[9px] text-slate-500 font-mono">{stay.checkIn} ➔ {stay.checkOut}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-emerald-900 bg-emerald-100/70 px-1.5 py-0.5 rounded text-[9px] block">
                            {stay.roomType} • {stay.mealPlan}
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold block mt-0.5">{stay.nights}N</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action Links */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider">
                    Dual Urdu/Eng Rules
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/hotel-voucher/${v.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10.5px] font-bold border border-slate-300 transition-colors"
                    >
                      <span>View &amp; Print (A4)</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create Hotel Voucher */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full p-5 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-black text-slate-900 text-sm uppercase">Generate Multi-Stay Hotel Voucher</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateHotelVoucher} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Select Parent Party Head *</label>
                <select 
                  value={targetPartyUid}
                  onChange={(e) => setTargetPartyUid(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 font-bold text-slate-800"
                >
                  {parties.map(p => (
                    <option key={p.partyHeadUid} value={p.partyHeadUid}>
                      {p.partyHeadUid}: {p.partyName} ({p.passengers?.length || p.totalPax} PAX)
                    </option>
                  ))}
                </select>
              </div>

              {/* Makkah Block */}
              <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200 space-y-2">
                <span className="font-bold text-amber-950 uppercase text-[10.5px] block">
                  Stay #1: Makkah Mukarramah Property
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Hotel Name</label>
                    <input 
                      type="text" 
                      value={makkahHotel} 
                      onChange={(e) => setMakkahHotel(e.target.value)} 
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded uppercase font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Confirmation / HCN #</label>
                    <input 
                      type="text" 
                      value={makkahHcn} 
                      onChange={(e) => setMakkahHcn(e.target.value)} 
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded uppercase font-mono" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Check-In</label>
                    <input 
                      type="date" 
                      value={makkahCheckIn} 
                      onChange={(e) => setMakkahCheckIn(e.target.value)} 
                      className="w-full px-2 py-1 border border-slate-300 rounded" 
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Check-Out</label>
                    <input 
                      type="date" 
                      value={makkahCheckOut} 
                      onChange={(e) => setMakkahCheckOut(e.target.value)} 
                      className="w-full px-2 py-1 border border-slate-300 rounded" 
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Room Setup</label>
                    <select 
                      value={makkahRoomType} 
                      onChange={(e) => setMakkahRoomType(e.target.value)} 
                      className="w-full px-2 py-1 border border-slate-300 rounded"
                    >
                      <option value="QUAD">QUAD</option>
                      <option value="QUINT">QUINT</option>
                      <option value="SHARING">SHARING</option>
                      <option value="DOUBLE">DOUBLE</option>
                      <option value="TRIPLE">TRIPLE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Meal Plan</label>
                    <select 
                      value={makkahMeal} 
                      onChange={(e) => setMakkahMeal(e.target.value)} 
                      className="w-full px-2 py-1 border border-slate-300 rounded"
                    >
                      <option value="RO">RO (Room Only)</option>
                      <option value="BB">BB (Bed &amp; Breakfast)</option>
                      <option value="HB">HB (Half Board)</option>
                      <option value="FB">FB (Full Board)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Madinah Block */}
              <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-2">
                <span className="font-bold text-emerald-950 uppercase text-[10.5px] block">
                  Stay #2: Madinah Munawwarah Property
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Hotel Name</label>
                    <input 
                      type="text" 
                      value={madinahHotel} 
                      onChange={(e) => setMadinahHotel(e.target.value)} 
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded uppercase font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Confirmation / HCN #</label>
                    <input 
                      type="text" 
                      value={madinahHcn} 
                      onChange={(e) => setMadinahHcn(e.target.value)} 
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded uppercase font-mono" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Check-In</label>
                    <input 
                      type="date" 
                      value={madinahCheckIn} 
                      onChange={(e) => setMadinahCheckIn(e.target.value)} 
                      className="w-full px-2 py-1 border border-slate-300 rounded" 
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Check-Out</label>
                    <input 
                      type="date" 
                      value={madinahCheckOut} 
                      onChange={(e) => setMadinahCheckOut(e.target.value)} 
                      className="w-full px-2 py-1 border border-slate-300 rounded" 
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Room Setup</label>
                    <select 
                      value={madinahRoomType} 
                      onChange={(e) => setMadinahRoomType(e.target.value)} 
                      className="w-full px-2 py-1 border border-slate-300 rounded"
                    >
                      <option value="QUAD">QUAD</option>
                      <option value="QUINT">QUINT</option>
                      <option value="SHARING">SHARING</option>
                      <option value="DOUBLE">DOUBLE</option>
                      <option value="TRIPLE">TRIPLE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Meal Plan</label>
                    <select 
                      value={madinahMeal} 
                      onChange={(e) => setMadinahMeal(e.target.value)} 
                      className="w-full px-2 py-1 border border-slate-300 rounded"
                    >
                      <option value="RO">RO (Room Only)</option>
                      <option value="BB">BB (Bed &amp; Breakfast)</option>
                      <option value="HB">HB (Half Board)</option>
                      <option value="FB">FB (Full Board)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold shadow"
                >
                  Confirm &amp; Generate Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
