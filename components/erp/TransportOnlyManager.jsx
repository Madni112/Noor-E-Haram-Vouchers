'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { 
  getAllTransportOnlyVouchers, 
  saveTransportOnlyVoucher, 
  deleteTransportOnlyVoucher,
  getNextTransportVoucherNo
} from '../../lib/erpData';
import { 
  Bus, 
  Search, 
  PlusCircle, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  Calendar, 
  Users, 
  Clock, 
  PhoneCall, 
  ShieldCheck, 
  X, 
  MapPin, 
  AlertCircle,
  Eye,
  Plus,
  Plane,
  ChevronDown,
  Hash
} from 'lucide-react';

const COMMON_LOCATIONS = [
  'Jeddah Airport (Terminal 1)',
  'Jeddah Airport (North Terminal)',
  'Makkah Hotel (Clock Tower / Ajyad)',
  'Makkah Hotel (Aziziyah / Ibrahim Khalil)',
  'Madinah Hotel (Central Markaziah)',
  'Madinah Airport (MED Terminal)',
  'Makkah Haramain Train Station',
  'Madinah Haramain Train Station',
  'Ziyarat Makkah Mukarramah',
  'Ziyarat Madinah Munawwarah'
];

const VEHICLE_OPTIONS = [
  '50-Seater Luxury Bus',
  'GMC Yukon (VIP)',
  'HiAce Executive (10-Seater)',
  'Coaster AC (VIP 22-Seater)',
  'Camry Sedan (Private)',
  'H1 Van (7-Seater)'
];

const DEFAULT_TERMS = [
  '1 - Cancellation with full refund is permissible only with a notification at least 24 hours prior to travelling.',
  '2 - It is the responsibility of the agent and/or client to have a valid Saudi number or an active roaming sim they can use to contact their designated driver at the airport or another pick up point. 100% of the service amount will be charged in case of no show.',
  '3 - The Transportation Service Company reserves the right to change the rates without any prior notification but will respect booked services with complete payment.',
  '- The passengers are expected to connect to the wifi as soon as they land at the respective Jeddah or Madinah airport and establish contact with the number provided for their trip.',
  '- Sim Kiosks are also available at both airports for the assistance of the passengers.',
  "- In the case that the passengers don't connect to the internet or fail to establish contact with the transporter we will not be responsible for any inconvenience."
];

export default function TransportOnlyManager({ parties = [], onVouchersUpdated }) {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('CARDS'); // 'CARDS' | 'TABLE'
  const [copiedId, setCopiedId] = useState(null);
  const [origin, setOrigin] = useState('');

  // Create / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Fields matching exact requirements:
  const [voucherNo, setVoucherNo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [totalPax, setTotalPax] = useState(1);
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [companyName, setCompanyName] = useState('NOOR E HARAM TRAVELS');

  // Searchable dropdown state for Customer Name (Party Heads only)
  const [partyDropdownOpen, setPartyDropdownOpen] = useState(false);
  const [partySearchQuery, setPartySearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Dynamic Booking Information rows: Pickup Date, Pickup Location, Time, Drop off Location, Vehicle, Details, Res No.
  const [bookings, setBookings] = useState([]);

  // Dynamic Flight Details rows: Flight No., Date, Departure, Arrival
  const [flights, setFlights] = useState([]);

  // Helplines & Terms
  const [ksaHelpline, setKsaHelpline] = useState('+966 53 649 2846 / +966 57 593 0550');
  const [headOfficeHelpline, setHeadOfficeHelpline] = useState('MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683');
  const [terms, setTerms] = useState(DEFAULT_TERMS);

  // Delete State
  const [deletingVoucher, setDeletingVoucher] = useState(null);

  const loadData = () => {
    const list = getAllTransportOnlyVouchers();
    setVouchers(list);
    setLoading(false);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
    loadData();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setPartyDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered party heads list for searchable dropdown (ONLY head names)
  const filteredPartyHeads = useMemo(() => {
    const q = partySearchQuery.trim().toLowerCase();
    return (parties || []).filter(p => {
      const name = (p.partyName || '').toLowerCase();
      const ref = (p.voucherRefNo || p.partyHeadUid || '').toLowerCase();
      return !q || name.includes(q) || ref.includes(q);
    });
  }, [parties, partySearchQuery]);

  const handleCopyLink = (v, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const url = `${origin}/transport-only-voucher/${v.voucherNo || v.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(v.id || v.voucherNo);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    const nextNo = getNextTransportVoucherNo('NTV-');
    setVoucherNo(nextNo);
    setIssueDate(new Date().toISOString().split('T')[0]);
    setCompanyName('NOOR E HARAM TRAVELS');

    setCustomerName('');
    setCustomerPhone('');
    setTotalPax(1);
    setPartySearchQuery('');

    // Default dynamic booking transfer
    setBookings([
      {
        id: `b-${Date.now()}-1`,
        pickupDate: new Date().toISOString().split('T')[0],
        pickupLocation: 'Jeddah Airport (Terminal 1)',
        time: '16:00',
        dropoffLocation: 'Makkah Hotel',
        vehicle: '50-Seater Luxury Bus',
        details: 'Arrival Airport Transfer',
        resNo: ''
      }
    ]);

    // Flights start empty until added
    setFlights([]);

    setKsaHelpline('+966 53 649 2846 / +966 57 593 0550');
    setHeadOfficeHelpline('MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683');
    setTerms(DEFAULT_TERMS);
    setShowModal(true);
  };

  const handleOpenEdit = (v) => {
    setEditingId(v.id || v.voucherNo);
    setVoucherNo(v.voucherNo || v.id);
    setCustomerName(v.customerName || v.partyName || '');
    setPartySearchQuery(v.customerName || v.partyName || '');
    setCustomerPhone(v.customerPhone || v.contactPhone || '');
    setTotalPax(v.totalPax || (v.passengers?.length || 1));
    setIssueDate(v.issueDate || new Date().toISOString().split('T')[0]);
    setCompanyName(v.companyName || 'NOOR E HARAM TRAVELS');

    setBookings(v.bookings && v.bookings.length > 0 ? v.bookings : [
      {
        id: `b-${Date.now()}`,
        pickupDate: v.issueDate || new Date().toISOString().split('T')[0],
        pickupLocation: 'Jeddah Airport (Terminal 1)',
        time: '16:00',
        dropoffLocation: 'Makkah Hotel',
        vehicle: '50-Seater Luxury Bus',
        details: 'Standard Transfer',
        resNo: 'RES-892101'
      }
    ]);

    setFlights(v.flights || []);
    setKsaHelpline(v.helplines?.ksaGround || '+966 53 649 2846 / +966 57 593 0550');
    setHeadOfficeHelpline(v.helplines?.headOffice || 'MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683');
    setTerms(v.termsAndConditions || DEFAULT_TERMS);
    setShowModal(true);
  };

  // Select Party Head from searchable dropdown
  const handleSelectPartyHead = (p) => {
    setCustomerName(p.partyName || '');
    setPartySearchQuery(p.partyName || '');
    if (p.contactPhone) setCustomerPhone(p.contactPhone);
    if (p.totalPax || p.passengers?.length) {
      setTotalPax(p.totalPax || p.passengers?.length || 1);
    }
    setPartyDropdownOpen(false);
  };

  // Dynamic booking operations
  const handleAddBooking = () => {
    setBookings([
      ...bookings,
      {
        id: `b-${Date.now()}`,
        pickupDate: issueDate,
        pickupLocation: 'Makkah Hotel',
        time: '12:00',
        dropoffLocation: 'Madinah Hotel',
        vehicle: '50-Seater Luxury Bus',
        details: 'Hotel to Hotel Transfer',
        resNo: `RES-${Math.floor(100000 + Math.random() * 900000)}`
      }
    ]);
  };

  const handleRemoveBooking = (idx) => {
    if (bookings.length <= 1) {
      alert('At least one booking transfer is required.');
      return;
    }
    setBookings(bookings.filter((_, i) => i !== idx));
  };

  const handleUpdateBooking = (idx, field, val) => {
    const updated = [...bookings];
    updated[idx] = { ...updated[idx], [field]: val };
    setBookings(updated);
  };

  // Dynamic flight operations
  const handleAddFlight = () => {
    setFlights([
      ...flights,
      {
        id: `f-${Date.now()}`,
        flightNo: 'SV-',
        date: issueDate,
        departure: 'KHI',
        arrival: 'JED'
      }
    ]);
  };

  const handleRemoveFlight = (idx) => {
    setFlights(flights.filter((_, i) => i !== idx));
  };

  const handleUpdateFlight = (idx, field, val) => {
    const updated = [...flights];
    updated[idx] = { ...updated[idx], [field]: val };
    setFlights(updated);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Please enter or select a Customer Name (Lead Pilgrim Head).');
      return;
    }

    const assignedNo = voucherNo.trim() || editingId || getNextTransportVoucherNo('NTV-');

    const record = {
      id: assignedNo,
      voucherNo: assignedNo,
      customerName: customerName.trim(),
      partyName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      totalPax: parseInt(totalPax) || 1,
      issueDate: issueDate || new Date().toISOString().split('T')[0],
      companyName,
      bookings: bookings.map((b, i) => ({
        id: b.id || `b-${i + 1}`,
        pickupDate: b.pickupDate || issueDate,
        pickupLocation: b.pickupLocation || 'Pickup Point',
        time: b.time || '12:00',
        dropoffLocation: b.dropoffLocation || 'Drop off Point',
        vehicle: b.vehicle || '50-Seater Luxury Bus',
        details: b.details || 'Standard Transfer',
        resNo: b.resNo || `RES-${Math.floor(100000 + Math.random() * 900000)}`
      })),
      flights: flights.map((f, i) => ({
        id: f.id || `f-${i + 1}`,
        flightNo: f.flightNo || '—',
        date: f.date || issueDate,
        departure: f.departure || '—',
        arrival: f.arrival || '—'
      })),
      helplines: {
        ksaGround: ksaHelpline.trim(),
        headOffice: headOfficeHelpline.trim()
      },
      termsAndConditions: terms,
      status: 'Confirmed'
    };

    saveTransportOnlyVoucher(record);
    loadData();
    setShowModal(false);
    if (onVouchersUpdated) onVouchersUpdated();
  };

  const handleDelete = () => {
    if (!deletingVoucher) return;
    deleteTransportOnlyVoucher(deletingVoucher.id || deletingVoucher.voucherNo);
    loadData();
    setDeletingVoucher(null);
    if (onVouchersUpdated) onVouchersUpdated();
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = vouchers.length;
    const totalBookings = vouchers.reduce((acc, v) => acc + (v.bookings?.length || 0), 0);
    const totalPaxSum = vouchers.reduce((acc, v) => acc + (parseInt(v.totalPax) || 1), 0);
    const luxuryBuses = vouchers.reduce((acc, v) => {
      const isBus = (v.bookings || []).some(b => (b.vehicle || '').toLowerCase().includes('bus'));
      return isBus ? acc + 1 : acc;
    }, 0);
    return { total, totalBookings, totalPaxSum, luxuryBuses };
  }, [vouchers]);

  // Filtered List
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vouchers.filter(v => {
      const matchesSearch = !q || (
        (v.voucherNo || '').toLowerCase().includes(q) ||
        (v.customerName || v.partyName || '').toLowerCase().includes(q) ||
        (v.customerPhone || '').toLowerCase().includes(q) ||
        (v.bookings || []).some(b => 
          (b.pickupLocation || '').toLowerCase().includes(q) ||
          (b.dropoffLocation || '').toLowerCase().includes(q) ||
          (b.resNo || '').toLowerCase().includes(q) ||
          (b.vehicle || '').toLowerCase().includes(q)
        ) ||
        (v.flights || []).some(f => (f.flightNo || '').toLowerCase().includes(q))
      );

      if (!matchesSearch) return false;
      if (vehicleFilter === 'BUS') {
        return (v.bookings || []).some(b => (b.vehicle || '').toLowerCase().includes('bus'));
      }
      if (vehicleFilter === 'VIP') {
        return (v.bookings || []).some(b => 
          (b.vehicle || '').toLowerCase().includes('gmc') || 
          (b.vehicle || '').toLowerCase().includes('vip')
        );
      }
      if (vehicleFilter === 'VAN') {
        return (v.bookings || []).some(b => 
          (b.vehicle || '').toLowerCase().includes('hiace') || 
          (b.vehicle || '').toLowerCase().includes('van')
        );
      }
      return true;
    });
  }, [vouchers, search, vehicleFilter]);

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0a192f] via-slate-900 to-[#0a192f] border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#dfba73]/15 border border-[#dfba73]/30 flex items-center justify-center shrink-0">
            <Bus className="w-6 h-6 text-[#dfba73]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white">
                Transport Vouchers
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dfba73]/20 text-[#dfba73] border border-[#dfba73]/30">
                Ground Movement Fleet
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Dedicated Umrah ground transportation vouchers with authorized route transfers, flight schedules, and KSA dispatch helplines.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-[#dfba73] hover:bg-[#d4ad60] active:scale-95 text-[#0a192f] font-black rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>New Transport Voucher</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Transport Vouchers</span>
            <Bus className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.total}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Active Fleet Bookings</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Transfer Legs</span>
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.totalBookings}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Transfer Legs Scheduled</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Total Passengers</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.totalPaxSum}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Manifest Pilgrims</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Luxury Buses</span>
            <Bus className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.luxuryBuses}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">50-Seater Fleets</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by voucher # (NTV-001), customer name, phone, res no, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0a192f]/20 focus:border-[#0a192f] font-medium transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Vehicles</option>
              <option value="BUS">Luxury Bus</option>
              <option value="VIP">VIP (GMC)</option>
              <option value="VAN">HiAce / Van</option>
            </select>

            <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-100">
              <button
                onClick={() => setViewMode('CARDS')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'CARDS' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Table
              </button>
            </div>
          </div>

        </div>

        <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
          <span>Showing {filtered.length} of {vouchers.length} transport vouchers</span>
          {search && (
            <button onClick={() => setSearch('')} className="text-[#0a192f] font-bold hover:underline cursor-pointer">
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Transport Vouchers Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {search ? `No vouchers matched "${search}".` : 'Get started by creating your first dedicated ground transport voucher.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0a192f] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#dfba73]" />
            <span>Create Transport Voucher</span>
          </button>
        </div>
      )}

      {/* CARDS VIEW */}
      {viewMode === 'CARDS' && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((v) => {
            const isCopied = copiedId === (v.id || v.voucherNo);
            const bookingList = v.bookings || [];
            const paxCount = v.totalPax || (v.passengers?.length || 1);
            const firstBooking = bookingList[0];

            return (
              <div
                key={v.id || v.voucherNo}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Card Top */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-[#0a192f] text-[#dfba73] shadow-2xs">
                      {v.voucherNo || v.id}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{v.issueDate || '2026-10-15'}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight group-hover:text-[#0a192f] transition-colors">
                      {v.customerName || v.partyName || 'VALUED PILGRIM'}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{paxCount} PAX</span>
                      </span>
                      {v.customerPhone && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{v.customerPhone}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Transfer Schedule Preview */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Transfers ({bookingList.length}):</span>
                    <span>{firstBooking?.vehicle || '50-Seater Luxury Bus'}</span>
                  </div>
                  <div className="space-y-1">
                    {bookingList.slice(0, 3).map((b, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-800 truncate max-w-[210px]">
                          {idx + 1}. {b.pickupLocation} → {b.dropoffLocation}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 font-semibold shrink-0">
                          {b.pickupDate} {b.time ? `@ ${b.time}` : ''}
                        </span>
                      </div>
                    ))}
                    {bookingList.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-bold block text-right">
                        +{bookingList.length - 3} more transfers in voucher
                      </span>
                    )}
                  </div>
                </div>

                {/* Flights Snippet */}
                {v.flights && v.flights.length > 0 && (
                  <div className="flex items-center gap-2 text-xs bg-blue-50/60 text-blue-900 p-2 rounded-xl border border-blue-100 font-medium">
                    <Plane className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">
                      Flights: {v.flights.map(f => `${f.flightNo || ''} (${f.departure || ''})`).join(' • ')}
                    </span>
                  </div>
                )}

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => handleCopyLink(v, e)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      isCopied ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/transport-only-voucher/${v.voucherNo || v.id}`}
                      target="_blank"
                      className="px-3 py-1.5 bg-[#0a192f] hover:bg-slate-800 text-[#dfba73] rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View &amp; Print</span>
                    </Link>

                    <button
                      onClick={() => handleOpenEdit(v)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer"
                      title="Edit Voucher"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeletingVoucher(v)}
                      className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Delete Voucher"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'TABLE' && filtered.length > 0 && (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Voucher #</th>
                  <th className="px-4 py-3">Customer / Head Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Pax</th>
                  <th className="px-4 py-3">Transfers</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((v) => {
                  const isCopied = copiedId === (v.id || v.voucherNo);
                  const paxCount = v.totalPax || (v.passengers?.length || 1);
                  const bookingList = v.bookings || [];

                  return (
                    <tr key={v.id || v.voucherNo} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {v.voucherNo || v.id}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 uppercase">
                        {v.customerName || v.partyName || 'VALUED PILGRIM'}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                        {v.customerPhone || '—'}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">
                        {paxCount} PAX
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-600">
                        {bookingList.length} Transfers
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {bookingList[0]?.vehicle || 'Luxury Bus'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => handleCopyLink(v, e)}
                            className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                              isCopied ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </button>

                          <Link
                            href={`/transport-only-voucher/${v.voucherNo || v.id}`}
                            target="_blank"
                            className="p-1 rounded-lg bg-[#0a192f] text-[#dfba73] hover:bg-slate-800"
                            title="View / Print"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => handleOpenEdit(v)}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeletingVoucher(v)}
                            className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT DEDICATED TRANSPORT VOUCHER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0a192f] text-[#dfba73] flex items-center justify-center font-bold">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    {editingId ? 'Edit Transport Voucher' : 'New Transport Voucher'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure customer, transfer schedule &amp; connecting flights</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              
              {/* Top Row: Voucher No, Issue Date, Total Pax */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Voucher No. *</label>
                  <div className="relative">
                    <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={voucherNo}
                      onChange={(e) => setVoucherNo(e.target.value)}
                      placeholder="e.g. NTV-001"
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Issue Date *</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-800 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Total Pax *</label>
                  <div className="relative">
                    <Users className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={totalPax}
                      onChange={(e) => setTotalPax(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Customer Name (Searchable dropdown with ONLY party head names) & Customer Phone (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Searchable dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                    <span>Customer Name (Party Head) *</span>
                    <span className="text-[10px] text-blue-600 font-semibold">Searchable</span>
                  </label>
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={partySearchQuery}
                      onChange={(e) => {
                        setPartySearchQuery(e.target.value);
                        setCustomerName(e.target.value);
                        setPartyDropdownOpen(true);
                      }}
                      onFocus={() => setPartyDropdownOpen(true)}
                      placeholder="Type or select Lead Pilgrim head name..."
                      className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white outline-none focus:ring-2 focus:ring-[#0a192f]/20 focus:border-[#0a192f]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setPartyDropdownOpen(!partyDropdownOpen)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Dropdown Options */}
                  {partyDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto py-1">
                      {filteredPartyHeads.length > 0 ? (
                        filteredPartyHeads.map((p) => (
                          <button
                            key={p.partyHeadUid}
                            type="button"
                            onClick={() => handleSelectPartyHead(p)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 transition flex items-center justify-between text-xs"
                          >
                            <div>
                              <strong className="text-slate-900 block font-bold uppercase">{p.partyName}</strong>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {p.voucherRefNo || p.partyHeadUid} • {p.totalPax || (p.passengers?.length || 1)} PAX
                              </span>
                            </div>
                            {p.contactPhone && (
                              <span className="text-[10px] text-slate-400 font-mono">{p.contactPhone}</span>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-slate-400 text-xs italic">
                          No matching head names found. You can keep typing custom name.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Customer Phone (Optional) */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Customer Phone (Optional)</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +92 311 2324764 / 055 819 2401"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium font-mono text-slate-800 bg-white outline-none focus:ring-2 focus:ring-[#0a192f]/20 focus:border-[#0a192f]"
                  />
                </div>

              </div>

              {/* BOOKING INFORMATION SECTION */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bus className="w-4 h-4 text-[#0a192f]" />
                    <span className="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                      Booking Information &amp; Transfer Schedule ({bookings.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddBooking}
                    className="px-2.5 py-1 bg-[#0a192f] hover:bg-slate-800 text-[#dfba73] rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Transfer</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {bookings.map((b, idx) => (
                    <div key={b.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 pb-1 border-b border-slate-200">
                        <span>Transfer #{idx + 1}</span>
                        {bookings.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBooking(idx)}
                            className="text-rose-600 hover:text-rose-700 text-xs font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Pickup Date */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Pickup Date</label>
                          <input
                            type="date"
                            value={b.pickupDate}
                            onChange={(e) => handleUpdateBooking(idx, 'pickupDate', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium"
                            required
                          />
                        </div>

                        {/* Pickup Location */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Pickup Location</label>
                          <input
                            type="text"
                            list={`pickup-locs-${idx}`}
                            value={b.pickupLocation}
                            onChange={(e) => handleUpdateBooking(idx, 'pickupLocation', e.target.value)}
                            placeholder="e.g. Jeddah Airport"
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium"
                            required
                          />
                          <datalist id={`pickup-locs-${idx}`}>
                            {COMMON_LOCATIONS.map(loc => <option key={loc} value={loc} />)}
                          </datalist>
                        </div>

                        {/* Time */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Time</label>
                          <input
                            type="time"
                            value={b.time}
                            onChange={(e) => handleUpdateBooking(idx, 'time', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium"
                          />
                        </div>

                        {/* Drop off Location */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Drop off Location</label>
                          <input
                            type="text"
                            list={`dropoff-locs-${idx}`}
                            value={b.dropoffLocation}
                            onChange={(e) => handleUpdateBooking(idx, 'dropoffLocation', e.target.value)}
                            placeholder="e.g. Makkah Hotel"
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium"
                            required
                          />
                          <datalist id={`dropoff-locs-${idx}`}>
                            {COMMON_LOCATIONS.map(loc => <option key={loc} value={loc} />)}
                          </datalist>
                        </div>

                        {/* Vehicle */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Vehicle</label>
                          <select
                            value={b.vehicle}
                            onChange={(e) => handleUpdateBooking(idx, 'vehicle', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-800"
                          >
                            {VEHICLE_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        {/* Res No. */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Res No.</label>
                          <input
                            type="text"
                            value={b.resNo}
                            onChange={(e) => handleUpdateBooking(idx, 'resNo', e.target.value)}
                            placeholder="e.g. RES-892101"
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-mono font-bold"
                          />
                        </div>
                      </div>

                      {/* Details row */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Details</label>
                        <input
                          type="text"
                          value={b.details}
                          onChange={(e) => handleUpdateBooking(idx, 'details', e.target.value)}
                          placeholder="e.g. Arrival Airport Transfer - Meet outside Gate 4"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FLIGHT DETAILS SECTION */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-[#0a192f]" />
                    <span className="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                      Flight Details ({flights.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFlight}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Flight</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {flights.map((f, idx) => (
                    <div key={f.id || idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span>Flight #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFlight(idx)}
                          className="text-rose-600 hover:text-rose-700 text-xs font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Flight No.</label>
                          <input
                            type="text"
                            value={f.flightNo}
                            onChange={(e) => handleUpdateFlight(idx, 'flightNo', e.target.value)}
                            placeholder="e.g. SV-701"
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Date</label>
                          <input
                            type="date"
                            value={f.date}
                            onChange={(e) => handleUpdateFlight(idx, 'date', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Departure</label>
                          <input
                            type="text"
                            value={f.departure}
                            onChange={(e) => handleUpdateFlight(idx, 'departure', e.target.value)}
                            placeholder="e.g. KHI 13:15"
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Arrival</label>
                          <input
                            type="text"
                            value={f.arrival}
                            onChange={(e) => handleUpdateFlight(idx, 'arrival', e.target.value)}
                            placeholder="e.g. JED 15:30"
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* HELPLINES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">KSA Ground Dispatch Helpline</label>
                  <input
                    type="text"
                    value={ksaHelpline}
                    onChange={(e) => setKsaHelpline(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pakistan Head Office Helpline</label>
                  <input
                    type="text"
                    value={headOfficeHelpline}
                    onChange={(e) => setHeadOfficeHelpline(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0a192f] hover:bg-slate-800 text-[#dfba73] rounded-xl font-black shadow-md cursor-pointer"
                >
                  Save Transport Voucher
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingVoucher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Delete Transport Voucher?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-800">{deletingVoucher.voucherNo || deletingVoucher.id}</strong>?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingVoucher(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
