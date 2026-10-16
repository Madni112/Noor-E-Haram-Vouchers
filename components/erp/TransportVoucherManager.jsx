'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { 
  getAllVouchers, 
  fetchSupabaseVouchers, 
  deleteVoucher, 
  saveCustomVoucher,
  updateVoucher,
  slugify 
} from '../../lib/vouchersData';
import { calculateNights, computePaxSummary } from '../../lib/dateUtils';
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
  Building2, 
  Calendar, 
  Users, 
  Plane, 
  QrCode, 
  RotateCw, 
  Eye, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Hotel, 
  Share2,
  X,
  MapPin,
  Clock,
  Layers,
  Filter,
  CheckCircle2,
  AlertCircle,
  Plus,
  ChevronDown,
  User,
  PhoneCall,
  Bed,
  Phone,
  FileText
} from 'lucide-react';

const SERVICE_PRESETS = [
  'JED AIRPORT TO MAKKAH HOTEL',
  'MAKKAH HOTEL TO MADINAH HOTEL',
  'MADINAH HOTEL TO MAKKAH HOTEL',
  'MAKKAH HOTEL TO JED AIRPORT',
  'MADINAH HOTEL TO JED AIRPORT',
  'MADINAH HOTEL TO MED AIRPORT',
  'MED AIRPORT TO MADINAH HOTEL',
  'ZIYARAT MAKKAH',
  'ZIYARAT MADINAH',
  'MAKKAH TO JEDDAH TOUR',
  'TAIF ZIYARAT / TOUR'
];

export default function TransportVoucherManager({ parties = [], onGenerateHotelVoucher, openCreateTrigger }) {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'SELF_VISA' | 'REGULAR' | 'WITH_STAYS'
  const [sortBy, setSortBy] = useState('NEWEST'); // 'NEWEST' | 'PARTY_ASC' | 'UB_ASC' | 'PAX_DESC'
  const [viewMode, setViewMode] = useState('CARDS'); // 'CARDS' | 'TABLE'
  const [origin, setOrigin] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  
  // QR Preview Modal
  const [qrModalVoucher, setQrModalVoucher] = useState(null);
  
  // Delete Confirmation State
  const [deletingVoucher, setDeletingVoucher] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // -------------------------------------------------------------
  // CREATE / EDIT MODAL STATE
  // -------------------------------------------------------------
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState('MANIFEST'); // 'MANIFEST' | 'STAYS' | 'TRANSPORTS' | 'FLIGHTS' | 'HELPLINES'
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [party, setParty] = useState('');
  const [partySearchQuery, setPartySearchQuery] = useState('');
  const [partyDropdownOpen, setPartyDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [ubNumber, setUbNumber] = useState('');
  const [isSelfVisa, setIsSelfVisa] = useState(true);
  const [voucherDate, setVoucherDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [companyName, setCompanyName] = useState('NOOR E HARAM TRAVELS & TOURS');
  const [executive, setExecutive] = useState('MUHAMMAD FAIZAN');
  const [phone, setPhone] = useState('MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683');
  const [emergencyContact, setEmergencyContact] = useState('+966 50 627 7492');

  const [passengers, setPassengers] = useState([]);
  const [paxCounts, setPaxCounts] = useState('GENT(S): 1  LAD(IES): 0  CHILD(REN): 0  INFANT(S): 0');
  const [accommodations, setAccommodations] = useState([]);
  const [transports, setTransports] = useState([]);
  const [flights, setFlights] = useState([]);

  // Helplines & KSA Concierge
  const [groundTransport, setGroundTransport] = useState('+92 328 8189989');
  const [makkahHelpline, setMakkahHelpline] = useState('+966 53 649 2846');
  const [madinahHelpline, setMadinahHelpline] = useState('+966 57 593 0550');
  const [pakistanHelpline, setPakistanHelpline] = useState('MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683');
  const [ksaJeddahAirport, setKsaJeddahAirport] = useState('');
  const [ksaJeddahSpecial, setKsaJeddahSpecial] = useState('');
  const [ksaJeddahSharing, setKsaJeddahSharing] = useState('');
  const [ksaMakkahSharing, setKsaMakkahSharing] = useState('');
  const [ksaMakkahSpecial, setKsaMakkahSpecial] = useState('');
  const [ksaMadinahSharing, setKsaMadinahSharing] = useState('');
  const [ksaMadinahSpecial, setKsaMadinahSpecial] = useState('');

  const loadVouchers = async () => {
    // 1. Instant local fallback
    if (typeof window !== 'undefined') {
      const local = getAllVouchers();
      if (local && local.length > 0) {
        setVouchers(local);
        setLoading(false);
      }
    }
    // 2. Fresh live sync from Supabase
    try {
      const live = await fetchSupabaseVouchers();
      if (live && live.length > 0) {
        setVouchers(live);
      }
    } catch (e) {
      console.warn('Error fetching transport vouchers:', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
    loadVouchers();
  }, []);

  // Listen to openCreateTrigger from parent tab bar
  useEffect(() => {
    if (openCreateTrigger && openCreateTrigger > 0) {
      handleOpenCreate();
    }
  }, [openCreateTrigger]);

  // Close party dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setPartyDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered party heads list for searchable dropdown
  const filteredPartyHeads = useMemo(() => {
    const q = partySearchQuery.trim().toLowerCase();
    return (parties || []).filter(p => {
      const name = (p.partyName || '').toLowerCase();
      const ref = (p.voucherRefNo || p.partyHeadUid || '').toLowerCase();
      return !q || name.includes(q) || ref.includes(q);
    });
  }, [parties, partySearchQuery]);

  const getNextUbNumber = () => {
    let maxNum = 0;
    vouchers.forEach(v => {
      const ref = v.ubNumber || v.voucherRefNo || '';
      const match = ref.match(/UB-(d+)/i);
      if (match) {
        const n = parseInt(match[1]);
        if (!isNaN(n) && n > maxNum && n < 9000) maxNum = n;
      } else if (v.id && !isNaN(parseInt(v.id))) {
        const n = parseInt(v.id);
        if (n > maxNum) maxNum = n;
      }
    });
    const next = (maxNum || vouchers.length || 0) + 1;
    return `UB-${String(next).padStart(4, '0')}`;
  };

  const handleOpenCreate = () => {
    setEditingVoucher(null);
    const nextUb = getNextUbNumber();
    setUbNumber(nextUb);
    setParty('');
    setPartySearchQuery('');
    setIsSelfVisa(true);
    setVoucherDate(new Date().toISOString().split('T')[0]);
    const defaultCo = parties[0]?.companyName || 'NOOR E HARAM TRAVELS & TOURS';
    setCompanyName(defaultCo);
    setExecutive('MUHAMMAD FAIZAN');
    setPhone('MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683');
    setEmergencyContact('+966 50 627 7492');

    const initialPax = [
      { sNo: '1', prefix: 'MR', name: '', passportNo: '', group: '', visaNo: '', hasBed: true }
    ];
    setPassengers(initialPax);
    setPaxCounts(computePaxSummary(initialPax));

    setAccommodations([
      { city: 'MAKKAH', hotelCode: '378', hotelName: '', view: '', meal: 'RO', roomType: 'DOUBLE', checkIn: '', checkOut: '', nights: '5' },
      { city: 'MADINAH', hotelCode: '378', hotelName: '', view: '', meal: 'RO', roomType: 'DOUBLE', checkIn: '', checkOut: '', nights: '5' },
    ]);

    setTransports([
      { sNo: '1', tnNo: '317', service: 'JED AIRPORT TO MAKKAH HOTEL', vehicle: 'BUS', pickupDate: '', contactPerson: '', bookingRefNo: '' },
    ]);

    setFlights([
      { pnr: '', date: '', flight: '', from: 'KHI', to: 'JED', departure: '', arrival: '' },
    ]);

    setGroundTransport('+92 328 8189989');
    setMakkahHelpline('+966 53 649 2846');
    setMadinahHelpline('+966 57 593 0550');
    setPakistanHelpline('MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683');
    setKsaJeddahAirport('');
    setKsaJeddahSpecial('');
    setKsaJeddahSharing('');
    setKsaMakkahSharing('');
    setKsaMakkahSpecial('');
    setKsaMadinahSharing('');
    setKsaMadinahSpecial('');

    setModalTab('MANIFEST');
    setShowModal(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVoucher(v);
    setParty(v.party || '');
    setPartySearchQuery(v.party || '');
    setUbNumber(v.ubNumber || v.voucherRefNo || '');
    setIsSelfVisa(v.isSelfVisa !== false);
    setVoucherDate(v.voucherDate ? v.voucherDate.slice(0, 10) : new Date().toISOString().split('T')[0]);
    setCompanyName(v.companyName || parties[0]?.companyName || 'NOOR E HARAM TRAVELS & TOURS');
    setExecutive(v.executive || 'MUHAMMAD FAIZAN');
    setPhone(v.phone || 'MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683');
    setEmergencyContact(v.emergencyContact || '+966 50 627 7492');

    const loadedPax = (v.passengers && Array.isArray(v.passengers) && v.passengers.length > 0)
      ? v.passengers.map((p, idx) => {
          let resolvedName = p.name || '';
          if (!resolvedName || resolvedName.toLowerCase().includes('unnamed')) {
            resolvedName = idx === 0 ? (v.party || '') : '';
          }
          let resolvedCategory = p.category;
          if (!resolvedCategory) {
            const pref = (p.prefix || '').toUpperCase();
            if (pref.startsWith('INF')) resolvedCategory = 'Infant';
            else if (pref.startsWith('CHD') || pref === 'MSTR' || pref === 'MISS') resolvedCategory = 'Child';
            else resolvedCategory = 'Adult';
          }
          return {
            sNo: String(p.sNo || idx + 1),
            prefix: p.prefix || (resolvedCategory === 'Child' ? 'CHD_MSTR' : resolvedCategory === 'Infant' ? 'INF_MSTR' : 'MR'),
            name: resolvedName,
            passportNo: p.passportNo || '',
            group: p.group || '',
            visaNo: p.visaNo || '',
            hasBed: p.hasBed !== undefined ? p.hasBed !== false : resolvedCategory !== 'Infant',
            category: resolvedCategory,
          };
        })
      : [{ sNo: '1', prefix: 'MR', name: v.party || '', passportNo: '', group: '', visaNo: '', hasBed: true, category: 'Adult' }];

    setPassengers(loadedPax);
    setPaxCounts(v.paxCounts || computePaxSummary(loadedPax));

    setAccommodations(Array.isArray(v.accommodations) && v.accommodations.length > 0 
      ? v.accommodations.map(a => ({
          city: a.city || 'MAKKAH',
          hotelCode: a.hotelCode || '378',
          hotelName: a.hotelName || '',
          view: a.view || '',
          meal: a.meal || 'RO',
          roomType: a.roomType || 'DOUBLE',
          checkIn: a.checkIn || '',
          checkOut: a.checkOut || '',
          nights: String(a.nights || calculateNights(a.checkIn, a.checkOut, 5)),
        }))
      : []
    );

    setTransports(Array.isArray(v.transports) && v.transports.length > 0
      ? v.transports.map((t, idx) => ({
          sNo: String(t.sNo || idx + 1),
          tnNo: t.tnNo || '317',
          service: t.service || '',
          vehicle: t.vehicle || 'BUS',
          pickupDate: t.pickupDate || '',
          contactPerson: t.contactPerson || '',
          bookingRefNo: t.bookingRefNo || '',
        }))
      : []
    );

    setFlights(Array.isArray(v.flights) && v.flights.length > 0
      ? v.flights.map(f => ({
          pnr: f.pnr || '',
          date: f.date || '',
          flight: f.flight || '',
          from: f.from || 'KHI',
          to: f.to || 'JED',
          departure: f.departure || '',
          arrival: f.arrival || '',
        }))
      : []
    );

    setGroundTransport(v.groundTransport || '+92 328 8189989');
    setMakkahHelpline(v.makkahHelpline || '+966 53 649 2846');
    setMadinahHelpline(v.madinahHelpline || '+966 57 593 0550');
    setPakistanHelpline(v.pakistanHelpline || 'MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683');
    setKsaJeddahAirport(v.ksaJeddahAirport || '');
    setKsaJeddahSpecial(v.ksaJeddahSpecial || '');
    setKsaJeddahSharing(v.ksaJeddahSharing || '');
    setKsaMakkahSharing(v.ksaMakkahSharing || '');
    setKsaMakkahSpecial(v.ksaMakkahSpecial || '');
    setKsaMadinahSharing(v.ksaMadinahSharing || '');
    setKsaMadinahSpecial(v.ksaMadinahSpecial || '');

    setModalTab('MANIFEST');
    setShowModal(true);
  };

  const handleSelectPartyHead = (p) => {
    setParty(p.partyName || '');
    setPartySearchQuery(p.partyName || '');
    setPartyDropdownOpen(false);
    if (p.voucherRefNo && !editingVoucher) {
      setUbNumber(p.voucherRefNo);
    }
    if (p.contactPhone) {
      setPhone(p.contactPhone);
    }
    if (Array.isArray(p.passengers) && p.passengers.length > 0) {
      const mapped = p.passengers.map((px, idx) => {
        let cat = px.category;
        if (!cat) {
          const pref = (px.prefix || '').toUpperCase();
          if (pref.startsWith('INF')) cat = 'Infant';
          else if (pref.startsWith('CHD') || pref === 'MSTR' || pref === 'MISS') cat = 'Child';
          else cat = 'Adult';
        }
        return {
          sNo: String(idx + 1),
          prefix: px.prefix || 'MR',
          name: px.name || (idx === 0 ? p.partyName : ''),
          passportNo: px.passportNo || '',
          group: px.group || '',
          visaNo: px.visaNo || '',
          hasBed: px.hasBed !== undefined ? px.hasBed !== false : cat !== 'Infant',
          category: cat,
        };
      });
      setPassengers(mapped);
      setPaxCounts(computePaxSummary(mapped));
    }
    if (Array.isArray(p.accommodations) && p.accommodations.length > 0 && accommodations.length === 0) {
      setAccommodations(p.accommodations);
    }
    if (Array.isArray(p.transports) && p.transports.length > 0 && transports.length === 0) {
      setTransports(p.transports);
    }
    if (Array.isArray(p.flights) && p.flights.length > 0 && flights.length === 0) {
      setFlights(p.flights);
    }
  };

  // Passenger Helper Functions & Category Stepper Handlers
  const getPaxCategory = (p) => {
    if (p.category) return p.category;
    const pref = (p.prefix || '').toUpperCase();
    if (pref.startsWith('INF')) return 'Infant';
    if (pref.startsWith('CHD') || pref === 'MSTR' || pref === 'MISS') return 'Child';
    return 'Adult';
  };

  const [paxInputValues, setPaxInputValues] = useState({});

  const adultsCount = passengers.filter(p => getPaxCategory(p).toLowerCase() === 'adult').length;
  const childrenCount = passengers.filter(p => getPaxCategory(p).toLowerCase() === 'child').length;
  const infantsCount = passengers.filter(p => getPaxCategory(p).toLowerCase() === 'infant').length;

  const setPaxCategoryCount = (cat, targetCount) => {
    const minVal = cat.toLowerCase() === 'adult' ? 1 : 0;
    const target = Math.max(minVal, Math.min(99, targetCount));
    const catLower = cat.toLowerCase();

    setPassengers(prev => {
      const currentOfCat = prev.filter(p => getPaxCategory(p).toLowerCase() === catLower);
      const diff = target - currentOfCat.length;
      if (diff === 0) return prev;

      let nextList = [];
      if (diff > 0) {
        const defaultPrefix = cat === 'Adult' ? 'MR' : cat === 'Child' ? 'CHD_MSTR' : 'INF_MSTR';
        const newItems = Array.from({ length: diff }, (_, i) => ({
          sNo: String(prev.length + i + 1),
          prefix: defaultPrefix,
          name: '',
          passportNo: '',
          group: '',
          visaNo: '',
          hasBed: cat !== 'Infant',
          category: cat,
        }));
        nextList = [...prev, ...newItems].map((p, i) => ({ ...p, sNo: String(i + 1) }));
      } else {
        let kept = 0;
        const result = [];
        for (const p of prev) {
          if (getPaxCategory(p).toLowerCase() === catLower) {
            if (kept < target) {
              result.push(p);
              kept++;
            }
          } else {
            result.push(p);
          }
        }
        if (result.length === 0) {
          result.push({
            sNo: '1',
            prefix: 'MR',
            name: '',
            passportNo: '',
            group: '',
            visaNo: '',
            hasBed: true,
            category: 'Adult',
          });
        }
        nextList = result.map((p, i) => ({ ...p, sNo: String(i + 1) }));
      }
      setPaxCounts(computePaxSummary(nextList));
      return nextList;
    });
  };

  const adjustPaxCategory = (cat, delta) => {
    const catLower = cat.toLowerCase();
    const minVal = catLower === 'adult' ? 1 : 0;
    const currentCount = passengers.filter(p => getPaxCategory(p).toLowerCase() === catLower).length;
    const target = Math.max(minVal, currentCount + delta);
    setPaxCategoryCount(cat, target);
  };

  const handleDirectPaxCountChange = (cat, valStr) => {
    setPaxInputValues(prev => ({ ...prev, [cat]: valStr }));
    if (valStr !== '') {
      const num = parseInt(valStr, 10);
      const minVal = cat.toLowerCase() === 'adult' ? 1 : 0;
      if (!isNaN(num) && num >= minVal && num <= 99) {
        setPaxCategoryCount(cat, num);
      }
    }
  };

  const handlePaxCountBlur = (cat) => {
    setPaxInputValues(prev => {
      const currentVal = prev[cat];
      const minVal = cat.toLowerCase() === 'adult' ? 1 : 0;
      if (currentVal === '' || isNaN(parseInt(currentVal, 10)) || parseInt(currentVal, 10) < minVal) {
        setPaxCategoryCount(cat, minVal);
      }
      const next = { ...prev };
      delete next[cat];
      return next;
    });
  };

  const addPassenger = (cat = 'Adult') => {
    adjustPaxCategory(cat, 1);
  };

  const removePassenger = (index) => {
    if (passengers.length <= 1) return;
    const target = passengers[index];
    if (getPaxCategory(target).toLowerCase() === 'adult') {
      const remainingAdults = passengers.filter((p, i) => i !== index && getPaxCategory(p).toLowerCase() === 'adult').length;
      if (remainingAdults === 0) {
        alert('Rule: Cannot remove the only Adult. At least 1 Adult is required.');
        return;
      }
    }
    const nextList = passengers.filter((_, i) => i !== index).map((p, i) => ({ ...p, sNo: String(i + 1) }));
    setPassengers(nextList);
    setPaxCounts(computePaxSummary(nextList));
  };

  const updatePassenger = (index, field, value) => {
    if (field === 'category' && value !== 'Adult') {
      if (index === 0) {
        alert('Rule: Lead Pilgrim / Party Head must be an Adult.');
        return;
      }
      const otherAdults = passengers.filter((p, i) => i !== index && getPaxCategory(p).toLowerCase() === 'adult').length;
      if (otherAdults === 0) {
        alert('Rule: At least 1 Adult is required in the booking.');
        return;
      }
    }
    if (field === 'prefix' && (value.startsWith('INF') || value.startsWith('CHD')) && index === 0) {
      alert('Rule: Lead Pilgrim / Party Head must be an Adult.');
      return;
    }

    const copy = [...passengers];
    copy[index] = { ...copy[index], [field]: value };
    if (field === 'category') {
      if (value === 'Infant') {
        copy[index].hasBed = false;
        copy[index].prefix = 'INF_MSTR';
      } else if (value === 'Child') {
        copy[index].hasBed = true;
        if (!copy[index].prefix || copy[index].prefix === 'MR') copy[index].prefix = 'CHD_MSTR';
      } else {
        copy[index].hasBed = true;
        if (copy[index].prefix === 'INF_MSTR' || copy[index].prefix === 'CHD_MSTR') copy[index].prefix = 'MR';
      }
    } else if (field === 'prefix') {
      const pref = (value || '').toUpperCase();
      if (pref.startsWith('INF')) {
        copy[index].category = 'Infant';
        copy[index].hasBed = false;
      } else if (pref.startsWith('CHD') || pref === 'MSTR' || pref === 'MISS') {
        copy[index].category = 'Child';
      } else {
        copy[index].category = 'Adult';
      }
    }
    // If updating first passenger name and party is empty, sync party
    if (index === 0 && field === 'name' && (!party || party.trim() === '')) {
      setParty(value);
      setPartySearchQuery(value);
    }
    setPassengers(copy);
    setPaxCounts(computePaxSummary(copy));
  };

  // Accommodations Handlers
  const addAccommodation = () => {
    setAccommodations([
      ...accommodations,
      { city: 'MAKKAH', hotelCode: '378', hotelName: '', view: '', meal: 'RO', roomType: 'DOUBLE', checkIn: '', checkOut: '', nights: '5' },
    ]);
  };

  const removeAccommodation = (index) => {
    setAccommodations(accommodations.filter((_, i) => i !== index));
  };

  const updateAccommodation = (index, field, value) => {
    const copy = [...accommodations];
    const finalVal = (field === 'meal' || field === 'hotelCode') && typeof value === 'string' ? value.toUpperCase() : value;
    copy[index] = { ...copy[index], [field]: finalVal };
    if (field === 'checkIn' || field === 'checkOut') {
      const computedNights = calculateNights(copy[index].checkIn, copy[index].checkOut, copy[index].nights);
      if (computedNights > 0) {
        copy[index].nights = String(computedNights);
      }
    }
    setAccommodations(copy);
  };

  // Transport Handlers
  const addTransport = () => {
    setTransports([
      ...transports,
      { sNo: String(transports.length + 1), tnNo: '317', service: '', vehicle: 'BUS', pickupDate: '', contactPerson: '', bookingRefNo: '' },
    ]);
  };

  const removeTransport = (index) => {
    setTransports(transports.filter((_, i) => i !== index).map((t, i) => ({ ...t, sNo: String(i + 1) })));
  };

  const updateTransport = (index, field, value) => {
    const copy = [...transports];
    copy[index] = { ...copy[index], [field]: value };
    setTransports(copy);
  };

  // Flight Handlers
  const addFlight = () => {
    setFlights([
      ...flights,
      { pnr: '', date: '', flight: '', from: 'KHI', to: 'JED', departure: '', arrival: '' },
    ]);
  };

  const removeFlight = (index) => {
    setFlights(flights.filter((_, i) => i !== index));
  };

  const updateFlight = (index, field, value) => {
    const copy = [...flights];
    copy[index] = { ...copy[index], [field]: value };
    setFlights(copy);
  };

  // Submit / Save Voucher
  const handleSaveVoucher = async (e) => {
    e.preventDefault();
    const cleanParty = (party || passengers[0]?.name || '').trim().toUpperCase();
    if (!cleanParty) {
      alert('Please enter a Party / Lead Passenger Name.');
      setModalTab('MANIFEST');
      return;
    }

    setIsSaving(true);
    try {
      const partySlug = editingVoucher?.slug || slugify(cleanParty) || ('voucher-' + Date.now());

      const formattedPassengers = passengers.map((p, idx) => {
        let fullName = (p.name || (idx === 0 ? cleanParty : '')).trim().toUpperCase();
        return {
          sNo: String(idx + 1),
          prefix: p.prefix || 'MR',
          name: fullName || (idx === 0 ? cleanParty : `PILGRIM ${idx + 1}`),
          passportNo: (p.passportNo || '').trim().toUpperCase(),
          group: p.group || '',
          visaNo: (p.visaNo || '').trim(),
          hasBed: Boolean(p.hasBed),
        };
      });

      const finalPassengers = formattedPassengers.length > 0 ? formattedPassengers : [{
        sNo: '1',
        prefix: 'MR',
        name: cleanParty,
        passportNo: '',
        group: '',
        visaNo: '',
        hasBed: true,
      }];

      const payload = {
        id: editingVoucher?.id || ('custom-' + Date.now()),
        slug: partySlug,
        sheetName: `Voucher - ${cleanParty}`,
        party: cleanParty,
        ubNumber: (ubNumber || getNextUbNumber()).trim(),
        voucherRefNo: (ubNumber || getNextUbNumber()).trim(),
        companyName,
        isSelfVisa: Boolean(isSelfVisa),
        voucherDate: voucherDate || new Date().toISOString(),
        phone: phone.trim(),
        emergencyContact: emergencyContact.trim(),
        voucherTitle: 'UMRAH PACKAGE VOUCHER',
        executive,
        paxCounts: computePaxSummary(finalPassengers),
        totalPax: finalPassengers.length,
        passengers: finalPassengers,
        accommodations: accommodations.filter(a => a.hotelName && a.hotelName.trim() !== ''),
        transports: transports.filter(t => t.service && t.service.trim() !== ''),
        flights: flights.filter(f => f.flight && f.flight.trim() !== ''),
        groundTransport: groundTransport.trim(),
        makkahHelpline: makkahHelpline.trim(),
        madinahHelpline: madinahHelpline.trim(),
        pakistanHelpline: pakistanHelpline.trim(),
        ksaJeddahAirport: ksaJeddahAirport.trim(),
        ksaJeddahSpecial: ksaJeddahSpecial.trim(),
        ksaJeddahSharing: ksaJeddahSharing.trim(),
        ksaMakkahSharing: ksaMakkahSharing.trim(),
        ksaMakkahSpecial: ksaMakkahSpecial.trim(),
        ksaMadinahSharing: ksaMadinahSharing.trim(),
        ksaMadinahSpecial: ksaMadinahSpecial.trim(),
      };

      if (editingVoucher) {
        await updateVoucher(editingVoucher.slug || editingVoucher.id, payload);
      } else {
        await saveCustomVoucher(payload);
      }

      await loadVouchers();
      setShowModal(false);
    } catch (err) {
      console.error('Error saving voucher:', err);
      alert('Failed to save voucher. Please check database connectivity.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = (v, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const url = `${origin}/voucher/${v.slug || v.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(v.id || v.slug);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingVoucher) return;
    setIsDeleting(true);
    try {
      await deleteVoucher(deletingVoucher.slug || deletingVoucher.id);
      setVouchers(prev => prev.filter(v => v.id !== deletingVoucher.id && v.slug !== deletingVoucher.slug));
      setDeletingVoucher(null);
    } catch (err) {
      alert('Failed to delete voucher. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = vouchers.length;
    const totalPax = vouchers.reduce((sum, v) => sum + (parseInt(v.totalPax) || (v.passengers?.length) || 1), 0);
    const withHotels = vouchers.filter(v => Array.isArray(v.accommodations) && v.accommodations.length > 0).length;
    const withFlights = vouchers.filter(v => Array.isArray(v.flights) && v.flights.length > 0).length;
    return { total, totalPax, withHotels, withFlights };
  }, [vouchers]);

  // Filtered & Sorted vouchers
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let res = vouchers.filter((v) => {
      const matchesSearch = !q || (
        (v.party || '').toLowerCase().includes(q) ||
        (v.sheetName || '').toLowerCase().includes(q) ||
        (v.ubNumber || '').toLowerCase().includes(q) ||
        (v.voucherRefNo || '').toLowerCase().includes(q) ||
        (v.id || '').toString().toLowerCase().includes(q) ||
        (v.passengers || []).some((p) => 
          (p.name || '').toLowerCase().includes(q) || 
          (p.passportNo || '').toLowerCase().includes(q)
        ) ||
        (v.accommodations || []).some((a) => 
          (a.hotelName || '').toLowerCase().includes(q) || 
          (a.city || '').toLowerCase().includes(q)
        ) ||
        (v.flights || []).some((f) => 
          (f.pnr || '').toLowerCase().includes(q) || 
          (f.flight || '').toLowerCase().includes(q)
        )
      );

      if (!matchesSearch) return false;

      if (filterType === 'SELF_VISA') return v.isSelfVisa === true;
      if (filterType === 'REGULAR') return v.isSelfVisa === false;
      if (filterType === 'WITH_STAYS') return Array.isArray(v.accommodations) && v.accommodations.length > 0;
      return true;
    });

    res.sort((a, b) => {
      if (sortBy === 'NEWEST') {
        const dateA = new Date(a.createdAt || a.voucherDate || 0).getTime();
        const dateB = new Date(b.createdAt || b.voucherDate || 0).getTime();
        return dateB - dateA;
      }
      if (sortBy === 'PARTY_ASC') {
        return (a.party || '').localeCompare(b.party || '');
      }
      if (sortBy === 'UB_ASC') {
        return (a.ubNumber || '').localeCompare(b.ubNumber || '');
      }
      if (sortBy === 'PAX_DESC') {
        const paxA = a.passengers?.length || parseInt(a.totalPax) || 0;
        const paxB = b.passengers?.length || parseInt(b.totalPax) || 0;
        return paxB - paxA;
      }
      return 0;
    });

    return res;
  }, [vouchers, search, filterType, sortBy]);

  return (
    <div className="space-y-6">

      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-400">
            <Bus className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Transport + Hotel Vouchers
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Live Cloud Sync
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Official Umrah package vouchers combining ground transportation itineraries, multi-stay hotel allocations, verified QR redirect links, and passenger manifests.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              loadVouchers();
            }}
            disabled={isRefreshing}
            className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Refresh from Supabase"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Create Voucher</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Total Vouchers</span>
            <Bus className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.total}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Active Umrah Groups</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Total Pilgrims</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.totalPax}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Manifest Passengers</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Hotel Stays</span>
            <Building2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.withHotels}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Groups with Accommodations</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Flight Sectors</span>
            <Plane className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.withFlights}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Groups with PNRs</p>
        </div>
      </div>

      {/* Filter, Search & View Controls Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by party head, UB #, passport no, passenger name, flight PNR..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="SELF_VISA">Self-Visa Only</option>
            <option value="REGULAR">Standard Visa Only</option>
            <option value="WITH_STAYS">With Hotel Stays</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer focus:outline-none"
          >
            <option value="NEWEST">Sort: Newest First</option>
            <option value="PARTY_ASC">Sort: Party (A-Z)</option>
            <option value="UB_ASC">Sort: UB Ref (Ascending)</option>
            <option value="PAX_DESC">Sort: Pax Count (High-Low)</option>
          </select>

          {/* Cards / Table View Toggle */}
          <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setViewMode('CARDS')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'CARDS' ? 'bg-white text-slate-950 font-bold shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'TABLE' ? 'bg-white text-slate-950 font-bold shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              <span>Table</span>
            </button>
          </div>

        </div>

      </div>

      {/* Showing Count */}
      <div className="text-xs font-medium text-slate-500 px-1 flex items-center justify-between">
        <span>Showing {filtered.length} of {vouchers.length} transport vouchers</span>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 animate-pulse">
              <div className="h-6 bg-slate-200 rounded-md w-1/3" />
              <div className="h-8 bg-slate-200 rounded-md w-2/3" />
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-10 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Transport Vouchers Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {search ? `No vouchers matched "${search}". Try searching by another keyword.` : 'You haven’t created any Umrah transport vouchers yet.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create First Voucher</span>
          </button>
        </div>
      )}

      {/* CARDS VIEW MODE */}
      {!loading && viewMode === 'CARDS' && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((v) => {
            const voucherUrl = `${origin}/voucher/${v.slug || v.id}`;
            const paxCount = v.passengers?.length || parseInt(v.totalPax) || 1;
            const stays = v.accommodations || [];
            const flights = v.flights || [];
            const transports = v.transports || [];

            return (
              <div
                key={v.id || v.slug}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
              >
                {/* Card Top: Badges & Date */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-white tracking-wider">
                        {v.ubNumber || v.voucherRefNo || 'UB-0000'}
                      </span>
                      <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                        v.isSelfVisa
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {v.isSelfVisa ? 'Self-Visa' : 'Standard Visa'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{v.voucherDate ? v.voucherDate.slice(0, 10) : (v.createdAt ? v.createdAt.slice(0, 10) : '—')}</span>
                    </div>
                  </div>

                  {/* Party Head Name & Pax */}
                  <div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors uppercase tracking-tight">
                      {v.party || 'Unnamed Group'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <strong>{paxCount} {paxCount === 1 ? 'Passenger' : 'Passengers'}</strong>
                      </span>
                      {v.phone && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-slate-400 truncate max-w-xs">{v.phone}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Snapshot of Logistics */}
                  <div className="space-y-1.5 pt-1 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    
                    {/* Transports */}
                    <div className="flex items-start gap-2">
                      <Bus className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">
                        {transports.length > 0 ? (
                          transports.map((t, idx) => (
                            <span key={idx}>
                              {idx > 0 && ' • '}
                              <strong className="text-slate-800">{t.service || 'Ground Transfer'}</strong>
                              {t.vehicle ? ` (${t.vehicle})` : ''}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">No transport legs recorded</span>
                        )}
                      </span>
                    </div>

                    {/* Stays */}
                    {stays.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Building2 className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">
                          {stays.map((s, idx) => (
                            <span key={idx}>
                              {idx > 0 && ' • '}
                              <span className="font-semibold text-slate-700">{s.city ? `${s.city.toUpperCase()}: ` : ''}</span>
                              <strong className="text-slate-800">{s.hotelName}</strong>
                              {s.nights ? ` (${s.nights}N)` : ''}
                            </span>
                          ))}
                        </span>
                      </div>
                    )}

                    {/* Flights */}
                    {flights.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Plane className="w-3.5 h-3.5 text-purple-600 mt-0.5 shrink-0" />
                        <span className="line-clamp-1 font-mono text-[11px]">
                          {flights.map((f, idx) => (
                            <span key={idx}>
                              {idx > 0 && ' • '}
                              <strong>{f.flight || 'Flight'}</strong>
                              {f.from && f.to ? ` (${f.from}-${f.to})` : ''}
                              {f.pnr ? ` PNR: ${f.pnr}` : ''}
                            </span>
                          ))}
                        </span>
                      </div>
                    )}

                  </div>
                </div>

                {/* Card Bottom: Actions */}
                <div className="pt-1 border-t border-slate-100">
                  {/* Standard Operations Actions */}
                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(v, e)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        title="Copy QR Redirect Link"
                      >
                        {copiedId === (v.id || v.slug) ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setQrModalVoucher(v)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer shadow-2xs"
                        title="Quick View & Download QR Code"
                      >
                        <QrCode className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* View Customer Voucher */}
                      <Link
                        href={`/voucher/${v.slug || v.id}`}
                        target="_blank"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all"
                        title="Open verified customer voucher page in new tab"
                      >
                        <Eye className="w-3 h-3 text-slate-500" />
                        <span>View</span>
                      </Link>

                      {/* Edit Voucher in Modal */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(v)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Edit transport voucher details"
                      >
                        <Edit3 className="w-3 h-3 text-slate-500" />
                        <span>Edit</span>
                      </button>

                      {/* Delete Voucher */}
                      <button
                        type="button"
                        onClick={() => setDeletingVoucher(v)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                        title="Delete voucher"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW MODE */}
      {!loading && viewMode === 'TABLE' && filtered.length > 0 && (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">UB Ref #</th>
                  <th className="px-4 py-3">Party Head</th>
                  <th className="px-4 py-3">PAX</th>
                  <th className="px-4 py-3">Visa Type</th>
                  <th className="px-4 py-3">Key Logistics</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((v) => {
                  const paxCount = v.passengers?.length || parseInt(v.totalPax) || 1;
                  const stays = v.accommodations || [];
                  const transports = v.transports || [];

                  return (
                    <tr key={v.id || v.slug} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {v.ubNumber || v.voucherRefNo || 'UB-0000'}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                        {v.party}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        <span className="font-semibold">{paxCount}</span> PAX
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                          v.isSelfVisa
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {v.isSelfVisa ? 'Self-Visa' : 'Standard'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                        {transports.length > 0 ? transports[0].service : (stays.length > 0 ? stays[0].hotelName : '—')}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                        {v.voucherDate ? v.voucherDate.slice(0, 10) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">

                          <button
                            type="button"
                            onClick={(e) => handleCopyLink(v, e)}
                            className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                            title="Copy link"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <Link
                            href={`/voucher/${v.slug || v.id}`}
                            target="_blank"
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                            title="View Voucher"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(v)}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingVoucher(v)}
                            className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Delete"
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

      {/* ========================================================= */}
      {/* COMPREHENSIVE CREATE / EDIT TRANSPORT VOUCHER MODAL */}
      {/* ========================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>{editingVoucher ? `Edit Transport Voucher — ${ubNumber}` : 'Create Transport + Hotel Voucher'}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {editingVoucher ? 'Edit Mode' : 'New Voucher'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Comprehensive ground itineraries, multi-stay hotel allocations, verified QR links & passenger manifests.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Sub-Tabs Navigation */}
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center gap-2 overflow-x-auto shrink-0 text-xs font-bold">
              <button
                type="button"
                onClick={() => setModalTab('MANIFEST')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  modalTab === 'MANIFEST'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Pilgrims & Party ({passengers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('STAYS')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  modalTab === 'STAYS'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Hotel Stays ({accommodations.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('TRANSPORTS')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  modalTab === 'TRANSPORTS'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bus className="w-3.5 h-3.5 text-emerald-600" />
                <span>Transport Itinerary ({transports.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('FLIGHTS')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  modalTab === 'FLIGHTS'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plane className="w-3.5 h-3.5 text-purple-600" />
                <span>Flight Sectors ({flights.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('HELPLINES')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  modalTab === 'HELPLINES'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Phone className="w-3.5 h-3.5 text-rose-600" />
                <span>Helplines & Concierge</span>
              </button>
            </div>

            {/* Modal Body / Form Container (Scrollable) */}
            <form onSubmit={handleSaveVoucher} className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* 1. MANIFEST & PARTY DETAILS TAB */}
              {modalTab === 'MANIFEST' && (
                <div className="space-y-6">
                  
                  {/* Top Key Metadata Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    
                    {/* UB Reference Number */}
                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1">
                        UB Reference # *
                      </label>
                      <input
                        type="text"
                        value={ubNumber}
                        onChange={(e) => setUbNumber(e.target.value)}
                        placeholder="e.g. UB-0016"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 bg-white outline-none focus:ring-1 focus:ring-slate-900 text-xs uppercase"
                        required
                      />
                    </div>

                    {/* Voucher Date */}
                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1">
                        Issue Date *
                      </label>
                      <input
                        type="date"
                        value={voucherDate}
                        onChange={(e) => setVoucherDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium text-slate-900 bg-white outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                        required
                      />
                    </div>

                    {/* Visa Type Toggle */}
                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1">
                        Visa Category
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsSelfVisa(!isSelfVisa)}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                          isSelfVisa
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-blue-50 text-blue-800 border-blue-300'
                        }`}
                      >
                        <span>{isSelfVisa ? 'Self-Visa (Umrah)' : 'Standard Visa'}</span>
                        <span className="text-[10px] uppercase underline">Toggle</span>
                      </button>
                    </div>

                    {/* Company Name */}
                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1">
                        Issuing Agency
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                      />
                    </div>

                  </div>

                  {/* Party Head Name & Contact Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Searchable Party Head Input */}
                    <div className="relative" ref={dropdownRef}>
                      <label className="block text-slate-800 font-bold text-xs mb-1 flex items-center justify-between">
                        <span>Party / Lead Pilgrim Head Name *</span>
                        <span className="text-[10px] text-blue-600 font-semibold">Search existing or type custom</span>
                      </label>
                      
                      <div className="relative">
                        <input
                          type="text"
                          value={partySearchQuery}
                          onChange={(e) => {
                            setPartySearchQuery(e.target.value);
                            setParty(e.target.value);
                            setPartyDropdownOpen(true);
                          }}
                          onFocus={() => setPartyDropdownOpen(true)}
                          placeholder="Type or select family head name..."
                          className="w-full px-3.5 py-2.5 pr-8 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 text-xs uppercase"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setPartyDropdownOpen(!partyDropdownOpen)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Dropdown Options */}
                      {partyDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto py-1">
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
                              No matching existing groups. You can continue typing custom party name.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Contact Phone / Executive */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold text-xs mb-1">
                          Pilgrim Phone
                        </label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. 0311-2324764"
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-mono text-slate-800 bg-white text-xs outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold text-xs mb-1">
                          Executive Handler
                        </label>
                        <input
                          type="text"
                          value={executive}
                          onChange={(e) => setExecutive(e.target.value)}
                          placeholder="e.g. MUHAMMAD FAIZAN"
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white text-xs outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                  </div>

                  {/* PASSENGER MANIFEST & DEMOGRAPHIC COUNTERS */}
                  <div className="space-y-4 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-600" />
                          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                            Passenger Manifest ({passengers.length} PAX)
                          </h4>
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {paxCounts}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Adjust counts directly by <strong className="text-slate-700">Adult, Child, Infant</strong> or edit passenger rows below.
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => addPassenger('Adult')}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Add Pax</span>
                        </button>
                      </div>
                    </div>

                    {/* EDITABLE DEMOGRAPHIC COUNTS: Adult, Child, Infant Steppers */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Adults Stepper */}
                      <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">Adults</span>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={paxInputValues['Adult'] !== undefined ? paxInputValues['Adult'] : adultsCount}
                            onChange={(e) => handleDirectPaxCountChange('Adult', e.target.value)}
                            onBlur={() => handlePaxCountBlur('Adult')}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                            onFocus={(e) => e.target.select()}
                            onClick={(e) => e.target.select()}
                            className="w-14 h-8 px-1.5 text-left text-base font-black text-slate-900 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-emerald-600 rounded-lg outline-none transition-colors cursor-text"
                            title="Click to edit Adults count directly (min: 1)"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => adjustPaxCategory('Adult', -1)}
                            disabled={adultsCount <= 1}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 font-black text-xs flex items-center justify-center transition cursor-pointer"
                            title="Decrease Adult (minimum 1)"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustPaxCategory('Adult', 1)}
                            className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center transition cursor-pointer"
                            title="Add Adult"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Children Stepper */}
                      <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 block mb-0.5">Children</span>
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={paxInputValues['Child'] !== undefined ? paxInputValues['Child'] : childrenCount}
                            onChange={(e) => handleDirectPaxCountChange('Child', e.target.value)}
                            onBlur={() => handlePaxCountBlur('Child')}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                            onFocus={(e) => e.target.select()}
                            onClick={(e) => e.target.select()}
                            className="w-14 h-8 px-1.5 text-left text-base font-black text-sky-950 bg-sky-50/50 hover:bg-sky-50 focus:bg-white border border-sky-200 hover:border-sky-300 focus:border-sky-600 rounded-lg outline-none transition-colors cursor-text"
                            title="Click to edit Children count directly"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => adjustPaxCategory('Child', -1)}
                            disabled={childrenCount <= 0}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 font-black text-xs flex items-center justify-center transition cursor-pointer"
                            title="Decrease Child"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustPaxCategory('Child', 1)}
                            className="w-7 h-7 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-black text-xs flex items-center justify-center transition cursor-pointer"
                            title="Add Child"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Infants Stepper */}
                      <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 block mb-0.5">Infants</span>
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={paxInputValues['Infant'] !== undefined ? paxInputValues['Infant'] : infantsCount}
                            onChange={(e) => handleDirectPaxCountChange('Infant', e.target.value)}
                            onBlur={() => handlePaxCountBlur('Infant')}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                            onFocus={(e) => e.target.select()}
                            onClick={(e) => e.target.select()}
                            className="w-14 h-8 px-1.5 text-left text-base font-black text-purple-950 bg-purple-50/50 hover:bg-purple-50 focus:bg-white border border-purple-200 hover:border-purple-300 focus:border-purple-600 rounded-lg outline-none transition-colors cursor-text"
                            title="Click to edit Infants count directly"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => adjustPaxCategory('Infant', -1)}
                            disabled={infantsCount <= 0}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 font-black text-xs flex items-center justify-center transition cursor-pointer"
                            title="Decrease Infant"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustPaxCategory('Infant', 1)}
                            className="w-7 h-7 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center justify-center transition cursor-pointer"
                            title="Add Infant"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Total PAX */}
                      <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white shadow-2xs flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Pax</span>
                          <span className="text-sm sm:text-base font-black text-emerald-400">{passengers.length} Guests</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => addPassenger('Adult')}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-95"
                          title="Add Passenger Row"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Pax</span>
                        </button>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3 w-12 text-center border-r border-slate-100">#</th>
                              <th className="py-2.5 px-3 w-24 border-r border-slate-100">Prefix</th>
                              <th className="py-2.5 px-3 w-28 border-r border-slate-100">Category</th>
                              <th className="py-2.5 px-3 border-r border-slate-100">Full Legal Name *</th>
                              <th className="py-2.5 px-3 border-r border-slate-100 w-32">Passport #</th>
                              <th className="py-2.5 px-3 border-r border-slate-100 w-28">Visa #</th>
                              <th className="py-2.5 px-3 text-center border-r border-slate-100 w-16">Bed</th>
                              <th className="py-2.5 px-3 text-center w-14">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {passengers.map((pax, idx) => {
                              const paxCat = getPaxCategory(pax);
                              return (
                                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-400 border-r border-slate-100">
                                    {idx + 1}
                                  </td>

                                  {/* Prefix */}
                                  <td className="py-2 px-2.5 border-r border-slate-100">
                                    <select
                                      value={pax.prefix || 'MR'}
                                      onChange={(e) => updatePassenger(idx, 'prefix', e.target.value)}
                                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white"
                                    >
                                      <option value="MR">MR</option>
                                      <option value="MRS">MRS</option>
                                      <option value="MS">MS</option>
                                      {idx !== 0 && <option value="CHD_MSTR">MSTR (Boy)</option>}
                                      {idx !== 0 && <option value="CHD_MISS">MISS (Girl)</option>}
                                      {idx !== 0 && <option value="INF_MSTR">INF (Infant)</option>}
                                    </select>
                                  </td>

                                  {/* Category Dropdown */}
                                  <td className="py-2 px-2.5 border-r border-slate-100">
                                    <select
                                      value={idx === 0 ? 'Adult' : paxCat}
                                      disabled={idx === 0}
                                      onChange={(e) => updatePassenger(idx, 'category', e.target.value)}
                                      title={idx === 0 ? 'Rule: Party Head must always be an Adult' : 'Select Category'}
                                      className={`w-full px-2 py-1.5 border rounded-lg text-xs font-bold outline-none ${
                                        idx === 0
                                          ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                                          : paxCat === 'Infant'
                                          ? 'bg-purple-50 text-purple-800 border-purple-200 cursor-pointer'
                                          : paxCat === 'Child'
                                          ? 'bg-sky-50 text-sky-800 border-sky-200 cursor-pointer'
                                          : 'bg-slate-50 text-slate-800 border-slate-200 cursor-pointer'
                                      }`}
                                    >
                                      <option value="Adult">Adult</option>
                                      {idx !== 0 && <option value="Child">Child</option>}
                                      {idx !== 0 && <option value="Infant">Infant</option>}
                                    </select>
                                  </td>

                                  {/* Name */}
                                  <td className="py-2 px-3 border-r border-slate-100">
                                    <input
                                      type="text"
                                      value={pax.name}
                                      onChange={(e) => updatePassenger(idx, 'name', e.target.value)}
                                      placeholder={idx === 0 ? "Lead Passenger Name" : "Passenger Name"}
                                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 bg-white outline-none focus:ring-1 focus:ring-slate-900 uppercase"
                                      required={idx === 0}
                                    />
                                  </td>

                                  {/* Passport # */}
                                  <td className="py-2 px-3 border-r border-slate-100">
                                    <input
                                      type="text"
                                      value={pax.passportNo}
                                      onChange={(e) => updatePassenger(idx, 'passportNo', e.target.value)}
                                      placeholder="e.g. PK1234567"
                                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 bg-white outline-none uppercase"
                                    />
                                  </td>

                                  {/* Visa # */}
                                  <td className="py-2 px-3 border-r border-slate-100">
                                    <input
                                      type="text"
                                      value={pax.visaNo}
                                      onChange={(e) => updatePassenger(idx, 'visaNo', e.target.value)}
                                      placeholder="e.g. 61789012"
                                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 bg-white outline-none"
                                    />
                                  </td>

                                  {/* Bed */}
                                  <td className="py-2 px-3 text-center border-r border-slate-100">
                                    <input
                                      type="checkbox"
                                      checked={pax.hasBed !== false}
                                      onChange={(e) => updatePassenger(idx, 'hasBed', e.target.checked)}
                                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                    />
                                  </td>

                                  {/* Action */}
                                  <td className="py-2 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => removePassenger(idx)}
                                      disabled={passengers.length <= 1}
                                      className={`p-1 rounded text-slate-400 hover:text-rose-600 transition ${
                                        passengers.length <= 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-rose-50'
                                      }`}
                                      title="Remove Passenger"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* 2. HOTEL STAYS TAB */}
              {modalTab === 'STAYS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-amber-600" />
                        <span>Multi-Stay Accommodations ({accommodations.length} Stays)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Add Makkah & Madinah hotel allocations with check-in/out and room configurations.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addAccommodation}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400" />
                      <span>Add Stay</span>
                    </button>
                  </div>

                  {accommodations.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-500 font-medium">No hotel stays added yet for this voucher.</p>
                      <button
                        type="button"
                        onClick={addAccommodation}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
                      >
                        + Add First Hotel Stay
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {accommodations.map((acc, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 relative group">
                          
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-mono">
                                {idx + 1}
                              </span>
                              <span>Stay #{idx + 1} — {acc.city}</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => removeAccommodation(idx)}
                              className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            {/* City */}
                            <div>
                              <label className="block text-slate-600 font-bold text-[11px] mb-1">City</label>
                              <select
                                value={acc.city}
                                onChange={(e) => updateAccommodation(idx, 'city', e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl font-bold text-xs bg-white text-slate-800"
                              >
                                <option value="MAKKAH">MAKKAH</option>
                                <option value="MADINAH">MADINAH</option>
                                <option value="JEDDAH">JEDDAH</option>
                                <option value="OTHER">OTHER</option>
                              </select>
                            </div>

                            {/* Hotel Name */}
                            <div className="sm:col-span-2">
                              <label className="block text-slate-600 font-bold text-[11px] mb-1">Hotel Name *</label>
                              <input
                                type="text"
                                value={acc.hotelName}
                                onChange={(e) => updateAccommodation(idx, 'hotelName', e.target.value)}
                                placeholder="e.g. DURAT AL AKHYAR / VOCO 5 STAR"
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl font-bold text-xs bg-white text-slate-900 uppercase"
                              />
                            </div>

                            {/* Hotel Code */}
                            <div>
                              <label className="block text-slate-600 font-bold text-[11px] mb-1">Hotel Code</label>
                              <input
                                type="text"
                                value={acc.hotelCode}
                                onChange={(e) => updateAccommodation(idx, 'hotelCode', e.target.value)}
                                placeholder="378"
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl font-mono text-xs bg-white text-slate-800 uppercase"
                              />
                            </div>

                            {/* Room Type */}
                            <div>
                              <label className="block text-slate-600 font-bold text-[11px] mb-1">Room Type</label>
                              <input
                                type="text"
                                value={acc.roomType}
                                onChange={(e) => updateAccommodation(idx, 'roomType', e.target.value)}
                                placeholder="DOUBLE / TRIPLE / QUAD / QUINT"
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white text-slate-800 uppercase"
                              />
                            </div>

                            {/* Meal Plan */}
                            <div>
                              <label className="block text-slate-600 font-bold text-[11px] mb-1">Meal Plan</label>
                              <select
                                value={acc.meal || 'RO'}
                                onChange={(e) => updateAccommodation(idx, 'meal', e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-800"
                              >
                                <option value="RO">RO (Room Only)</option>
                                <option value="BB">BB (Bed & Breakfast)</option>
                                <option value="HB">HB (Half Board)</option>
                                <option value="FB">FB (Full Board)</option>
                              </select>
                            </div>

                            {/* Check In */}
                            <div>
                              <label className="block text-slate-600 font-bold text-[11px] mb-1">Check In Date</label>
                              <input
                                type="text"
                                value={acc.checkIn}
                                onChange={(e) => updateAccommodation(idx, 'checkIn', e.target.value)}
                                placeholder="e.g. 2026-10-22 or 22-OCT-26"
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-mono bg-white text-slate-800"
                              />
                            </div>

                            {/* Check Out & Nights */}
                            <div>
                              <label className="block text-slate-600 font-bold text-[11px] mb-1">Check Out Date</label>
                              <input
                                type="text"
                                value={acc.checkOut}
                                onChange={(e) => updateAccommodation(idx, 'checkOut', e.target.value)}
                                placeholder="e.g. 2026-11-02 or 02-NOV-26"
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-mono bg-white text-slate-800"
                              />
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

              {/* 3. TRANSPORT ITINERARY TAB */}
              {modalTab === 'TRANSPORTS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                        <Bus className="w-4 h-4 text-emerald-600" />
                        <span>Ground Transportation Legs ({transports.length} Sectors)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Define transfer legs with vehicle types, pickup dates, and route services.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addTransport}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Add Sector</span>
                    </button>
                  </div>

                  {transports.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <Bus className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-500 font-medium">No ground transport legs recorded.</p>
                      <button
                        type="button"
                        onClick={addTransport}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
                      >
                        + Add First Transfer Sector
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transports.map((tr, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 relative group">
                          
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-mono">
                                {idx + 1}
                              </span>
                              <span>Sector #{idx + 1} — {tr.service || 'Ground Transfer'}</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => removeTransport(idx)}
                              className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            
                            {/* Service / Route */}
                            <div className="sm:col-span-2">
                              <label className="block text-slate-600 font-bold text-[11px] mb-1 flex items-center justify-between">
                                <span>Service / Sector Route *</span>
                                <span className="text-[10px] text-emerald-600 font-semibold">Preset or Custom</span>
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={tr.service}
                                  onChange={(e) => updateTransport(idx, 'service', e.target.value)}
                                  placeholder="e.g. JED AIRPORT TO MAKKAH HOTEL"
                                  className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-xl font-bold text-xs bg-white text-slate-900 uppercase"
                                />
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) updateTransport(idx, 'service', e.target.value);
                                  }}
                                  className="px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 cursor-pointer"
                                >
                                  <option value="">Presets...</option>
                                  {SERVICE_PRESETS.map((p, pIdx) => (
                                    <option key={pIdx} value={p}>{p}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Vehicle Type */}
                            <div>
                              <label className="block text-slate-600 font-bold text-[11px] mb-1">Vehicle Type</label>
                              <select
                                value={tr.vehicle || 'BUS'}
                                onChange={(e) => updateTransport(idx, 'vehicle', e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-800"
                              >
                                <option value="BUS">BUS</option>
                                <option value="GMC">GMC (SUV)</option>
                                <option value="HIACE">HIACE</option>
                                <option value="COASTER">COASTER</option>
                                <option value="SEDAN">SEDAN / CAR</option>
                                <option value="STARIA">STARIA</option>
                              </select>
                            </div>

                            {/* Pickup Date */}
                            <div>
                              <label className="block text-slate-600 font-bold text-[11px] mb-1">Pickup Date & Time</label>
                              <input
                                type="text"
                                value={tr.pickupDate}
                                onChange={(e) => updateTransport(idx, 'pickupDate', e.target.value)}
                                placeholder="e.g. 2026-10-22 14:00"
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-mono bg-white text-slate-800"
                              />
                            </div>

                            {/* Contact Person */}
                            <div>
                              <label className="block text-slate-600 font-bold text-[11px] mb-1">Contact Person / Driver</label>
                              <input
                                type="text"
                                value={tr.contactPerson}
                                onChange={(e) => updateTransport(idx, 'contactPerson', e.target.value)}
                                placeholder="e.g. FAISAL 055 1234567"
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800"
                              />
                            </div>

                            {/* Booking Ref */}
                            <div>
                              <label className="block text-slate-600 font-bold text-[11px] mb-1">Booking Ref No</label>
                              <input
                                type="text"
                                value={tr.bookingRefNo}
                                onChange={(e) => updateTransport(idx, 'bookingRefNo', e.target.value)}
                                placeholder="e.g. TR-99881"
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-mono bg-white text-slate-800"
                              />
                            </div>

                          </div>

                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

              {/* 4. FLIGHT SECTORS TAB */}
              {modalTab === 'FLIGHTS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                        <Plane className="w-4 h-4 text-purple-600" />
                        <span>Flight Sectors & PNRs ({flights.length})</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Add airline flight schedules, PNR codes, origin, and destination ports.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addFlight}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-purple-400" />
                      <span>Add Flight</span>
                    </button>
                  </div>

                  {flights.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <Plane className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-500 font-medium">No flights recorded for this voucher yet.</p>
                      <button
                        type="button"
                        onClick={addFlight}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
                      >
                        + Add First Flight Sector
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {flights.map((fl, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 relative group">
                          
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-mono">
                                {idx + 1}
                              </span>
                              <span>Flight #{idx + 1} — {fl.flight || 'Scheduled Flight'}</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => removeFlight(idx)}
                              className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            
                            {/* Flight # */}
                            <div>
                              <label className="block text-slate-600 font-bold text-[11px] mb-1">Flight Number</label>
                              <input
                                type="text"
                                value={fl.flight}
                                onChange={(e) => updateFlight(idx, 'flight', e.target.value)}
                                placeholder="e.g. SV-701 or F3-830"
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl font-bold font-mono text-xs bg-white text-slate-900 uppercase"
                              />
                            </div>

                            {/* PNR */}
                            <div>
                              <label className="block text-slate-600 font-bold text-[11px] mb-1">PNR Code</label>
                              <input
                                type="text"
                                value={fl.pnr}
                                onChange={(e) => updateFlight(idx, 'pnr', e.target.value)}
                                placeholder="e.g. 6D8KLQ"
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl font-bold font-mono text-xs bg-white text-slate-800 uppercase"
                              />
                            </div>

                            {/* Date */}
                            <div>
                              <label className="block text-slate-600 font-bold text-[11px] mb-1">Flight Date</label>
                              <input
                                type="text"
                                value={fl.date}
                                onChange={(e) => updateFlight(idx, 'date', e.target.value)}
                                placeholder="e.g. 22-OCT-26"
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-mono bg-white text-slate-800"
                              />
                            </div>

                            {/* From / To Route */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-slate-600 font-bold text-[11px] mb-1">From</label>
                                <input
                                  type="text"
                                  value={fl.from}
                                  onChange={(e) => updateFlight(idx, 'from', e.target.value)}
                                  placeholder="KHI"
                                  className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs font-mono font-bold bg-white text-slate-800 uppercase"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-600 font-bold text-[11px] mb-1">To</label>
                                <input
                                  type="text"
                                  value={fl.to}
                                  onChange={(e) => updateFlight(idx, 'to', e.target.value)}
                                  placeholder="JED"
                                  className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs font-mono font-bold bg-white text-slate-800 uppercase"
                                />
                              </div>
                            </div>

                          </div>

                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

              {/* 5. HELPLINES & CONCIERGE TAB */}
              {modalTab === 'HELPLINES' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                      <Phone className="w-4 h-4 text-rose-600" />
                      <span>Helplines &amp; Emergency Concierge Numbers</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Configure 24/7 airport reps, supervisor numbers, and Pakistan central dispatch helplines printed on the voucher.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    
                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1">
                        KSA Ground Transport Helpline
                      </label>
                      <input
                        type="text"
                        value={groundTransport}
                        onChange={(e) => setGroundTransport(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs bg-white text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1">
                        Makkah Helpline
                      </label>
                      <input
                        type="text"
                        value={makkahHelpline}
                        onChange={(e) => setMakkahHelpline(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs bg-white text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1">
                        Madinah Helpline
                      </label>
                      <input
                        type="text"
                        value={madinahHelpline}
                        onChange={(e) => setMadinahHelpline(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs bg-white text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1">
                        Pakistan Head Office Helpline
                      </label>
                      <input
                        type="text"
                        value={pakistanHelpline}
                        onChange={(e) => setPakistanHelpline(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs bg-white text-slate-800"
                      />
                    </div>

                  </div>

                </div>
              )}

            </form>

            {/* Modal Sticky Bottom Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveVoucher}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>{editingVoucher ? 'Save Voucher Changes' : 'Create & Publish Voucher'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* QR Code Quick Modal */}
      {qrModalVoucher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setQrModalVoucher(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-md bg-slate-900 text-white">
                {qrModalVoucher.ubNumber || qrModalVoucher.voucherRefNo}
              </span>
              <h3 className="text-base font-black text-slate-900 mt-2 uppercase">
                {qrModalVoucher.party}
              </h3>
              <p className="text-xs text-slate-500">Scan to open official verified voucher</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto">
              <QRCodeSVG
                value={`${origin}/voucher/${qrModalVoucher.slug || qrModalVoucher.id}`}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>

            <p className="text-[11px] text-slate-400 font-mono break-all px-2">
              {`${origin}/voucher/${qrModalVoucher.slug || qrModalVoucher.id}`}
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={(e) => handleCopyLink(qrModalVoucher, e)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>{copiedId === (qrModalVoucher.id || qrModalVoucher.slug) ? 'Copied Link!' : 'Copy Link'}</span>
              </button>

              <Link
                href={`/voucher/${qrModalVoucher.slug || qrModalVoucher.id}`}
                target="_blank"
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingVoucher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Delete Transport Voucher?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <span className="font-bold text-slate-800">{deletingVoucher.party}</span> ({deletingVoucher.ubNumber || deletingVoucher.voucherRefNo})? This action will remove it from Supabase cloud database.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingVoucher(null)}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
