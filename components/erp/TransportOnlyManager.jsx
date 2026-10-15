'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  getAllTransportOnlyVouchers, 
  saveTransportOnlyVoucher, 
  deleteTransportOnlyVoucher 
} from '../../lib/erpData';
import { 
  Bus, 
  Search, 
  PlusCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Printer, 
  Edit3, 
  Trash2, 
  Calendar, 
  Users, 
  Clock, 
  PhoneCall, 
  ShieldCheck, 
  X, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  RotateCw,
  Eye,
  Plus,
  Car
} from 'lucide-react';

const STANDARD_ROUTES = [
  'Jeddah Airport to Makkah Hotel',
  'Makkah Hotel to Madinah Hotel',
  'Madinah Hotel to Madinah Airport',
  'Madinah Hotel to Jeddah Airport',
  'Ziyarat Makkah Mukarramah',
  'Ziyarat Madinah Munawwarah',
  'Makkah Hotel to Jeddah Airport',
  'Madinah Airport to Madinah Hotel',
  'Jeddah Airport to Madinah Hotel'
];

const VEHICLE_OPTIONS = [
  '50-Seater Luxury Bus',
  'GMC Yukon (VIP)',
  'HiAce Executive (10-Seater)',
  'Coaster AC (VIP 22-Seater)',
  'Camry Sedan (Private)',
  'H1 Van (7-Seater)'
];

const TRANSPORT_COMPANIES = [
  'Noor E Haram Transport Fleet',
  'SAPTCO Umrah Transport',
  'Dallah Transport KSA',
  'Rawafed Al-Madinah',
  'Al-Safeer Transport Fleet',
  'Al-Qaid VIP Transport'
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
  const [targetPartyUid, setTargetPartyUid] = useState(parties[0]?.partyHeadUid || '');
  const [partyName, setPartyName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('50-Seater Luxury Bus');
  const [transportCompany, setTransportCompany] = useState('Noor E Haram Transport Fleet');
  const [driverName, setDriverName] = useState('Tariq Mehmood');
  const [driverPhone, setDriverPhone] = useState('+966 55 819 2401');
  const [vehicleNumber, setVehicleNumber] = useState('KSA-9142');
  const [brnNumber, setBrnNumber] = useState('BRN-789042');
  const [luggageCount, setLuggageCount] = useState('Standard');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [emergencyHelpline, setEmergencyHelpline] = useState('+966 53 649 2846');
  const [specialInstructions, setSpecialInstructions] = useState('Please assemble in hotel lobby 30 minutes prior to scheduled departure. Keep passports & Umrah visa handy.');
  const [sectors, setSectors] = useState([]);
  const [paxList, setPaxList] = useState([]);

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

  const handleCopyLink = (v, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const url = `${origin}/transport-voucher/${v.voucherNo || v.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(v.id || v.voucherNo);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    const firstParty = parties[0];
    const initialPartyUid = firstParty?.partyHeadUid || '';
    setTargetPartyUid(initialPartyUid);
    setPartyName(firstParty?.partyName || 'Valued Pilgrim');
    setContactPhone(firstParty?.contactPhone || '');
    setPaxList(firstParty?.passengers || []);
    setVehicleType('50-Seater Luxury Bus');
    setTransportCompany('Noor E Haram Transport Fleet');
    setDriverName('Tariq Mehmood');
    setDriverPhone('+966 55 819 2401');
    setVehicleNumber(`KSA-${Math.floor(1000 + Math.random() * 9000)}`);
    setBrnNumber(`BRN-${Math.floor(100000 + Math.random() * 900000)}`);
    setLuggageCount(`${(firstParty?.passengers?.length || 1) * 2} Bags`);
    setIssueDate(new Date().toISOString().split('T')[0]);
    setEmergencyHelpline('+966 53 649 2846');
    setSpecialInstructions('Please assemble in hotel lobby 30 minutes prior to scheduled departure. Keep passports & Umrah visa handy.');
    setSectors([
      {
        id: 'sec-1',
        route: 'Jeddah Airport to Makkah Hotel',
        pickupDate: firstParty?.accommodations?.[0]?.checkIn || '2026-10-10',
        pickupTime: '16:00',
        flightNumber: 'SV-701',
        vehicleType: '50-Seater Luxury Bus',
        driverName: 'Tariq Mehmood',
        status: 'Confirmed'
      },
      {
        id: 'sec-2',
        route: 'Makkah Hotel to Madinah Hotel',
        pickupDate: firstParty?.accommodations?.[1]?.checkIn || '2026-10-15',
        pickupTime: '08:30',
        flightNumber: '—',
        vehicleType: '50-Seater Luxury Bus',
        driverName: 'Saeed Al-Ghamdi',
        status: 'Confirmed'
      },
      {
        id: 'sec-3',
        route: 'Ziyarat Madinah Munawwarah',
        pickupDate: '2026-10-18',
        pickupTime: '07:30',
        flightNumber: '—',
        vehicleType: 'Coaster AC (VIP)',
        driverName: 'Farhan Rafiq',
        status: 'Confirmed'
      },
      {
        id: 'sec-4',
        route: 'Madinah Hotel to Madinah Airport',
        pickupDate: firstParty?.accommodations?.[1]?.checkOut || '2026-10-22',
        pickupTime: '13:00',
        flightNumber: 'PA-471',
        vehicleType: '50-Seater Luxury Bus',
        driverName: 'Tariq Mehmood',
        status: 'Confirmed'
      }
    ]);
    setShowModal(true);
  };

  const handlePartySelect = (uid) => {
    setTargetPartyUid(uid);
    const p = parties.find(party => party.partyHeadUid === uid);
    if (p) {
      setPartyName(p.partyName || '');
      setContactPhone(p.contactPhone || '');
      setPaxList(p.passengers || []);
      setLuggageCount(`${(p.passengers?.length || 1) * 2} Bags`);
    }
  };

  const handleOpenEdit = (v) => {
    setEditingId(v.id || v.voucherNo);
    setTargetPartyUid(v.partyHeadUid || '');
    setPartyName(v.partyName || '');
    setContactPhone(v.contactPhone || '');
    setVehicleType(v.vehicleType || '50-Seater Luxury Bus');
    setTransportCompany(v.transportCompany || 'Noor E Haram Transport Fleet');
    setDriverName(v.driverName || '');
    setDriverPhone(v.driverPhone || '');
    setVehicleNumber(v.vehicleNumber || '');
    setBrnNumber(v.brnNumber || '');
    setLuggageCount(v.luggageCount || 'Standard');
    setIssueDate(v.issueDate || new Date().toISOString().split('T')[0]);
    setEmergencyHelpline(v.emergencyHelpline || '+966 53 649 2846');
    setSpecialInstructions(v.specialInstructions || '');
    setSectors(v.sectors || []);
    setPaxList(v.passengers || []);
    setShowModal(true);
  };

  const handleAddSector = () => {
    setSectors([
      ...sectors,
      {
        id: `sec-${Date.now()}`,
        route: 'Jeddah Airport to Makkah Hotel',
        pickupDate: issueDate,
        pickupTime: '12:00',
        flightNumber: '',
        vehicleType: vehicleType,
        driverName: driverName,
        status: 'Confirmed'
      }
    ]);
  };

  const handleRemoveSector = (idx) => {
    if (sectors.length <= 1) {
      alert('At least one route sector is required for a transport voucher.');
      return;
    }
    setSectors(sectors.filter((_, i) => i !== idx));
  };

  const handleUpdateSector = (idx, field, val) => {
    const updated = [...sectors];
    updated[idx] = { ...updated[idx], [field]: val };
    setSectors(updated);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const selParty = parties.find(p => p.partyHeadUid === targetPartyUid);
    const vId = editingId || `TV-${selParty?.voucherRefNo || selParty?.partyHeadUid || Date.now().toString().slice(-6)}`;
    
    const record = {
      id: vId,
      voucherNo: vId,
      partyHeadUid: targetPartyUid,
      partyName: partyName || selParty?.partyName || 'Valued Pilgrim',
      companyName: selParty?.companyName || 'NOOR E HARAM TRAVELS',
      contactPhone: contactPhone || selParty?.contactPhone || '',
      totalPax: paxList.length || selParty?.totalPax || 1,
      passengers: paxList,
      vehicleType,
      transportCompany,
      driverName,
      driverPhone,
      vehicleNumber,
      brnNumber,
      luggageCount,
      issueDate,
      emergencyHelpline,
      specialInstructions,
      sectors,
      status: 'Confirmed & Scheduled'
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

  // KPIs
  const stats = useMemo(() => {
    const total = vouchers.length;
    const totalSectors = vouchers.reduce((acc, v) => acc + (v.sectors?.length || 0), 0);
    const totalPax = vouchers.reduce((acc, v) => acc + (parseInt(v.totalPax) || v.passengers?.length || 1), 0);
    const busCount = vouchers.filter(v => (v.vehicleType || '').toLowerCase().includes('bus')).length;
    return { total, totalSectors, totalPax, busCount };
  }, [vouchers]);

  // Filtered List
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vouchers.filter(v => {
      const matchesSearch = !q || (
        (v.voucherNo || '').toLowerCase().includes(q) ||
        (v.partyName || '').toLowerCase().includes(q) ||
        (v.driverName || '').toLowerCase().includes(q) ||
        (v.driverPhone || '').toLowerCase().includes(q) ||
        (v.brnNumber || '').toLowerCase().includes(q) ||
        (v.vehicleType || '').toLowerCase().includes(q) ||
        (v.sectors || []).some(s => (s.route || '').toLowerCase().includes(q))
      );

      if (!matchesSearch) return false;
      if (vehicleFilter === 'BUS') return (v.vehicleType || '').toLowerCase().includes('bus');
      if (vehicleFilter === 'VIP') return (v.vehicleType || '').toLowerCase().includes('gmc') || (v.vehicleType || '').toLowerCase().includes('vip');
      if (vehicleFilter === 'VAN') return (v.vehicleType || '').toLowerCase().includes('hiace') || (v.vehicleType || '').toLowerCase().includes('van');
      return true;
    });
  }, [vouchers, search, vehicleFilter]);

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
            <Bus className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white">
                Transport Vouchers
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Ground Movement Fleet
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Dedicated Umrah ground transportation vouchers with authorized route transfers, vehicle fleets, assigned drivers, and passenger manifest.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 active:scale-95 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer self-start md:self-auto"
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
            <span>Route Sectors</span>
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.totalSectors}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Transfer Legs Scheduled</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Pilgrims in Transit</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.totalPax}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Manifest Passengers</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Luxury Buses</span>
            <Car className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.busCount}
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
              placeholder="Search by voucher #, lead pilgrim, driver, phone, BRN or sector..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all"
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
            <button onClick={() => setSearch('')} className="text-blue-600 hover:underline cursor-pointer">
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
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Transport Voucher</span>
          </button>
        </div>
      )}

      {/* CARDS VIEW */}
      {viewMode === 'CARDS' && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((v) => {
            const isCopied = copiedId === (v.id || v.voucherNo);
            const sectors = v.sectors || [];
            const paxCount = v.totalPax || v.passengers?.length || 1;

            return (
              <div
                key={v.id || v.voucherNo}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Card Top */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-blue-950 text-blue-200 shadow-2xs">
                      {v.voucherNo || v.id}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{v.issueDate || '2026-10-08'}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-700 transition-colors">
                      {v.partyName || 'Valued Pilgrim'}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{paxCount} Pilgrims</span>
                      </span>
                      <span>•</span>
                      <span>{v.vehicleType || 'Luxury Bus'}</span>
                      {v.vehicleNumber && <span>({v.vehicleNumber})</span>}
                    </div>
                  </div>
                </div>

                {/* Driver & BRN Callout */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Driver: <strong className="text-slate-900">{v.driverName || 'Tariq Mehmood'}</strong></span>
                    <span className="font-mono font-bold text-slate-600">{v.driverPhone || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Provider: <span className="text-slate-600 font-semibold">{v.transportCompany || 'Fleet'}</span></span>
                    <span className="font-mono">{v.brnNumber || 'BRN-N/A'}</span>
                  </div>
                </div>

                {/* Sectors Timeline Preview */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Authorized Sectors ({sectors.length}):
                  </span>
                  <div className="space-y-1">
                    {sectors.slice(0, 3).map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-slate-50/60 px-2.5 py-1.5 rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-800 truncate max-w-[200px]">
                          {idx + 1}. {s.route}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 font-semibold">
                          {s.pickupDate} {s.pickupTime ? `@ ${s.pickupTime}` : ''}
                        </span>
                      </div>
                    ))}
                    {sectors.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-bold block text-right">
                        +{sectors.length - 3} more sectors in voucher
                      </span>
                    )}
                  </div>
                </div>

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
                      href={`/transport-voucher/${v.voucherNo || v.id}`}
                      target="_blank"
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
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
                  <th className="px-4 py-3">Lead Pilgrim</th>
                  <th className="px-4 py-3">Pax</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">Sectors</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((v) => {
                  const isCopied = copiedId === (v.id || v.voucherNo);
                  const paxCount = v.totalPax || v.passengers?.length || 1;

                  return (
                    <tr key={v.id || v.voucherNo} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {v.voucherNo || v.id}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 uppercase">
                        {v.partyName}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">
                        {paxCount} PAX
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold block">{v.vehicleType || 'Bus'}</span>
                        <span className="text-[10px] text-slate-400">{v.vehicleNumber || ''}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold block">{v.driverName || 'Assigned'}</span>
                        <span className="text-[10px] font-mono text-slate-400">{v.driverPhone || ''}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-600">
                        {v.sectors?.length || 0} Sectors
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
                            href={`/transport-voucher/${v.voucherNo || v.id}`}
                            target="_blank"
                            className="p-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-8">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingId ? 'Edit Transport Voucher' : 'New Transport Voucher'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure vehicle fleet, route transfers &amp; driver</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              
              {/* Party / Pilgrim Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Select Group / Party Head *</label>
                  <select
                    value={targetPartyUid}
                    onChange={(e) => handlePartySelect(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-800 outline-none"
                  >
                    {parties.map((p) => (
                      <option key={p.partyHeadUid} value={p.partyHeadUid}>
                        {p.partyName} ({p.voucherRefNo || p.partyHeadUid}) • {p.totalPax || (p.passengers?.length || 1)} PAX
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Lead Pilgrim Contact Phone</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. 0311-2324764"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium outline-none"
                  />
                </div>
              </div>

              {/* Vehicle & Transport Provider */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Vehicle Type *</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-800 outline-none"
                  >
                    {VEHICLE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Transport Company</label>
                  <select
                    value={transportCompany}
                    onChange={(e) => setTransportCompany(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-800 outline-none"
                  >
                    {TRANSPORT_COMPANIES.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Vehicle Plate / Bus #</label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="e.g. KSA-9142"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Transport BRN #</label>
                  <input
                    type="text"
                    value={brnNumber}
                    onChange={(e) => setBrnNumber(e.target.value)}
                    placeholder="e.g. BRN-789042"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium font-mono outline-none"
                  />
                </div>
              </div>

              {/* Driver Details & Helplines */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assigned Driver Name</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. Tariq Mehmood"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Driver WhatsApp / Phone</label>
                  <input
                    type="text"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="e.g. +966 55 819 2401"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">KSA Dispatch Helpline</label>
                  <input
                    type="text"
                    value={emergencyHelpline}
                    onChange={(e) => setEmergencyHelpline(e.target.value)}
                    placeholder="e.g. +966 53 649 2846"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium font-mono outline-none"
                  />
                </div>
              </div>

              {/* Route Sectors Dynamic List */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                    Authorized Transfer Sectors ({sectors.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddSector}
                    className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Sector</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {sectors.map((sec, idx) => (
                    <div key={sec.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 text-[11px]">Sector #{idx + 1}</span>
                        {sectors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSector(idx)}
                            className="text-rose-600 hover:text-rose-700 text-xs font-bold"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div className="sm:col-span-2">
                          <select
                            value={sec.route}
                            onChange={(e) => handleUpdateSector(idx, 'route', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
                          >
                            {STANDARD_ROUTES.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <input
                            type="date"
                            value={sec.pickupDate || ''}
                            onChange={(e) => handleUpdateSector(idx, 'pickupDate', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <input
                            type="time"
                            value={sec.pickupTime || ''}
                            onChange={(e) => handleUpdateSector(idx, 'pickupTime', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
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
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
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
