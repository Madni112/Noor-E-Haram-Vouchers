'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { 
  getAllTransportOnlyVouchers, 
  saveTransportOnlyVoucher, 
  deleteTransportOnlyVoucher,
  getNextTransportVoucherNo,
  saveParty,
  getAllParties
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
  Hash,
  Crown
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

export function formatTimeWithoutSeconds(timeVal) {
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

export default function TransportOnlyManager({ parties = [], onVouchersUpdated, onPartiesUpdated }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
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
  const [selectedPartyHeadUid, setSelectedPartyHeadUid] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [totalPax, setTotalPax] = useState(1);
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [companyName, setCompanyName] = useState('NOOR E HARAM TRAVELS & TOURS');

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

  // Modal Tab Navigation State ('TRANSFERS' | 'PASSENGERS' | 'FLIGHTS' | 'HELPLINES')
  const [activeModalTab, setActiveModalTab] = useState('TRANSFERS');

  // Passenger Manifest State
  const [paxList, setPaxList] = useState([]);
  const [paxInputValues, setPaxInputValues] = useState({});

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

  // Demographic count summaries
  const adultsCount = paxList.filter(p => (p.category || 'Adult').toLowerCase() === 'adult').length;
  const childrenCount = paxList.filter(p => (p.category || '').toLowerCase() === 'child').length;
  const infantsCount = paxList.filter(p => (p.category || '').toLowerCase() === 'infant').length;

  // Pure slice updater for category counts ensuring min 1 adult and lead adult preservation
  const setCategoryCount = (cat, targetCount) => {
    const minVal = cat.toLowerCase() === 'adult' ? 1 : 0;
    const target = Math.max(minVal, Math.min(99, targetCount));
    const catLower = cat.toLowerCase();

    setPaxList(prev => {
      const currentOfCat = prev.filter(p => (p.category || 'Adult').toLowerCase() === catLower);
      const diff = target - currentOfCat.length;
      if (diff === 0) return prev;

      if (diff > 0) {
        const newItems = Array.from({ length: diff }, (_, i) => ({
          id: `pax-trans-${Date.now()}-${prev.length + i + 1}`,
          sNo: String(prev.length + i + 1),
          prefix: cat === 'Adult' ? 'MR' : cat === 'Child' ? 'CHD_MSTR' : 'INF',
          name: `${cat.toUpperCase()} ${currentOfCat.length + i + 1}`,
          passportNo: '',
          category: cat,
        }));
        const updated = [...prev, ...newItems];
        setTotalPax(updated.length);
        return updated;
      } else {
        let kept = 0;
        const result = [];
        for (const p of prev) {
          if ((p.category || 'Adult').toLowerCase() === catLower) {
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
            id: `pax-trans-${Date.now()}-1`,
            sNo: '1',
            prefix: 'MR',
            name: customerName || 'LEAD PILGRIM',
            passportNo: '',
            category: 'Adult',
          });
        }
        const reindexed = result.map((p, idx) => ({ ...p, sNo: String(idx + 1) }));
        setTotalPax(reindexed.length);
        return reindexed;
      }
    });
  };

  const adjustCategoryCount = (cat, delta) => {
    const catLower = cat.toLowerCase();
    const minVal = catLower === 'adult' ? 1 : 0;
    const currentCount = paxList.filter(p => (p.category || 'Adult').toLowerCase() === catLower).length;
    const target = Math.max(minVal, currentCount + delta);
    setCategoryCount(cat, target);
  };

  const handleDirectCountChange = (cat, valStr) => {
    setPaxInputValues(prev => ({ ...prev, [cat]: valStr }));
    if (valStr !== '') {
      const num = parseInt(valStr, 10);
      const minVal = cat.toLowerCase() === 'adult' ? 1 : 0;
      if (!isNaN(num) && num >= minVal && num <= 99) {
        setCategoryCount(cat, num);
      }
    }
  };

  const handleCountBlur = (cat) => {
    setPaxInputValues(prev => {
      const currentVal = prev[cat];
      const minVal = cat.toLowerCase() === 'adult' ? 1 : 0;
      if (currentVal === '' || isNaN(parseInt(currentVal, 10)) || parseInt(currentVal, 10) < minVal) {
        setCategoryCount(cat, minVal);
      }
      const next = { ...prev };
      delete next[cat];
      return next;
    });
  };

  const handleUpdatePassenger = (index, field, value) => {
    const isLead = index === 0;
    if (field === 'category' && value !== 'Adult') {
      if (isLead) {
        alert('Rule: Lead Pilgrim / Party Head must be an Adult.');
        return;
      }
      const otherAdults = paxList.filter((p, i) => i !== index && (p.category || 'Adult').toLowerCase() === 'adult').length;
      if (otherAdults === 0) {
        alert('Rule: At least 1 Adult is required in the booking.');
        return;
      }
    }
    if (field === 'prefix' && (value === 'INF' || value.startsWith('CHD'))) {
      if (isLead) {
        alert('Rule: Lead Pilgrim / Party Head must be an Adult.');
        return;
      }
    }

    setPaxList(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === 'category') {
        if (value === 'Infant') {
          copy[index].prefix = 'INF';
        } else if (value === 'Child') {
          if (!copy[index].prefix || copy[index].prefix === 'MR') copy[index].prefix = 'CHD_MSTR';
        } else {
          if (copy[index].prefix === 'INF' || copy[index].prefix === 'CHD_MSTR') copy[index].prefix = 'MR';
        }
      }
      return copy;
    });
  };

  const handleAddPassenger = () => {
    adjustCategoryCount('Adult', 1);
  };

  const handleRemovePassenger = (index) => {
    if (paxList.length <= 1) {
      alert('At least 1 passenger is required.');
      return;
    }
    const target = paxList[index];
    if ((target?.category || 'Adult').toLowerCase() === 'adult') {
      const remainingAdults = paxList.filter((p, i) => i !== index && (p.category || 'Adult').toLowerCase() === 'adult').length;
      if (remainingAdults === 0) {
        alert('Rule: At least 1 Adult is required in the booking.');
        return;
      }
    }

    setPaxList(prev => {
      const updated = prev.filter((_, i) => i !== index).map((p, idx) => ({ ...p, sNo: String(idx + 1) }));
      setTotalPax(updated.length);
      return updated;
    });
  };

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
    const nextNo = getNextTransportVoucherNo('CTV-');
    setVoucherNo(nextNo);
    setIssueDate(new Date().toISOString().split('T')[0]);
    setCompanyName('NOOR E HARAM TRAVELS & TOURS');

    setSelectedPartyHeadUid(null);
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

    // Initial 1 passenger manifest
    const initialPax = [
      { id: `pax-${Date.now()}-1`, sNo: '1', prefix: 'MR', name: '', passportNo: '', category: 'Adult' }
    ];
    setPaxList(initialPax);

    // At least 1 connecting flight pre-added
    setFlights([
      {
        id: `f-${Date.now()}-1`,
        flightNo: 'SV-701',
        date: new Date().toISOString().split('T')[0],
        departure: 'KHI',
        departureTime: '13:15',
        arrival: 'JED',
        arrivalTime: '15:30'
      }
    ]);

    setKsaHelpline('+966 53 649 2846 / +966 57 593 0550');
    setHeadOfficeHelpline('MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683');
    setTerms(DEFAULT_TERMS);
    setActiveModalTab('TRANSFERS');
    setShowModal(true);
  };

  const handleOpenEdit = (v) => {
    setEditingId(v.id || v.voucherNo);
    setVoucherNo(v.voucherNo || v.id);
    
    const cleanCustName = v.customerName || v.partyName || '';
    const matched = (parties || []).find(p => 
      (v.partyHeadUid && p.partyHeadUid === v.partyHeadUid) || 
      (p.partyName && p.partyName.toLowerCase() === cleanCustName.toLowerCase())
    );

    setSelectedPartyHeadUid(matched?.partyHeadUid || v.partyHeadUid || null);
    setCustomerName(cleanCustName);
    setPartySearchQuery(cleanCustName);
    setCustomerPhone(v.customerPhone || v.contactPhone || matched?.contactPhone || '');
    setIssueDate(v.issueDate || new Date().toISOString().split('T')[0]);
    setCompanyName(v.companyName || 'NOOR E HARAM TRAVELS & TOURS');

    // Load passenger manifest
    let loadedPax = [];
    if (Array.isArray(v.passengers) && v.passengers.length > 0) {
      loadedPax = v.passengers.map((p, idx) => ({
        id: p.id || `pax-${idx + 1}`,
        sNo: String(idx + 1),
        prefix: p.prefix || 'MR',
        name: p.name || (idx === 0 ? cleanCustName : `PASSENGER ${idx + 1}`),
        passportNo: p.passportNo || '',
        category: idx === 0 ? 'Adult' : (p.category || 'Adult')
      }));
    } else if (matched?.passengers && matched.passengers.length > 0) {
      loadedPax = matched.passengers.map((p, idx) => ({
        id: p.id || `pax-${idx + 1}`,
        sNo: String(idx + 1),
        prefix: p.prefix || 'MR',
        name: p.name || (idx === 0 ? cleanCustName : `PASSENGER ${idx + 1}`),
        passportNo: p.passportNo || '',
        category: idx === 0 ? 'Adult' : (p.category || 'Adult')
      }));
    } else {
      const count = Math.max(1, parseInt(v.totalPax, 10) || 1);
      loadedPax = [{
        id: `pax-${Date.now()}-1`,
        sNo: '1',
        prefix: 'MR',
        name: cleanCustName,
        passportNo: '',
        category: 'Adult'
      }];
      for (let i = 2; i <= count; i++) {
        loadedPax.push({
          id: `pax-${Date.now()}-${i}`,
          sNo: String(i),
          prefix: 'MR',
          name: `PASSENGER ${i}`,
          passportNo: '',
          category: 'Adult'
        });
      }
    }
    setPaxList(loadedPax);
    setTotalPax(loadedPax.length);

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

    setFlights((Array.isArray(v.flights) && v.flights.length > 0) ? v.flights.map((f, i) => ({
      id: f.id || `f-${Date.now()}-${i + 1}`,
      flightNo: f.flightNo || '',
      date: f.date || v.issueDate || new Date().toISOString().split('T')[0],
      departure: f.departure || '',
      departureTime: formatTimeWithoutSeconds(f.departureTime || f.depTime || ''),
      arrival: f.arrival || '',
      arrivalTime: formatTimeWithoutSeconds(f.arrivalTime || f.arrTime || '')
    })) : [
      {
        id: `f-${Date.now()}-1`,
        flightNo: 'SV-701',
        date: v.issueDate || new Date().toISOString().split('T')[0],
        departure: 'KHI',
        departureTime: '13:15',
        arrival: 'JED',
        arrivalTime: '15:30'
      }
    ]);
    setKsaHelpline(v.helplines?.ksaGround || '+966 53 649 2846 / +966 57 593 0550');
    setHeadOfficeHelpline(v.helplines?.headOffice || 'MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683');
    setTerms(v.termsAndConditions || DEFAULT_TERMS);
    setActiveModalTab('TRANSFERS');
    setShowModal(true);
  };

  // Select Party Head from searchable dropdown
  const handleSelectPartyHead = (p) => {
    setSelectedPartyHeadUid(p.partyHeadUid);
    setCustomerName(p.partyName || '');
    setPartySearchQuery(p.partyName || '');
    if (p.contactPhone) setCustomerPhone(p.contactPhone);

    if (Array.isArray(p.passengers) && p.passengers.length > 0) {
      const mapped = p.passengers.map((pax, idx) => ({
        id: pax.id || `pax-${idx + 1}`,
        sNo: String(idx + 1),
        prefix: pax.prefix || 'MR',
        name: pax.name || (idx === 0 ? p.partyName : `PASSENGER ${idx + 1}`),
        passportNo: pax.passportNo || '',
        category: idx === 0 ? 'Adult' : (pax.category || 'Adult')
      }));
      setPaxList(mapped);
      setTotalPax(mapped.length);
    } else {
      const count = Math.max(1, p.declaredPax || p.totalPax || 1);
      const genPax = [{
        id: `pax-${Date.now()}-1`,
        sNo: '1',
        prefix: 'MR',
        name: p.partyName || '',
        passportNo: '',
        category: 'Adult'
      }];
      for (let i = 2; i <= count; i++) {
        genPax.push({
          id: `pax-${Date.now()}-${i}`,
          sNo: String(i),
          prefix: 'MR',
          name: `PASSENGER ${i}`,
          passportNo: '',
          category: 'Adult'
        });
      }
      setPaxList(genPax);
      setTotalPax(count);
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
    const cleanedVal = field === 'time' ? formatTimeWithoutSeconds(val) : val;
    updated[idx] = { ...updated[idx], [field]: cleanedVal };
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
        departureTime: '13:15',
        arrival: 'JED',
        arrivalTime: '15:30'
      }
    ]);
  };

  const handleRemoveFlight = (idx) => {
    setFlights(flights.filter((_, i) => i !== idx));
  };

  const handleUpdateFlight = (idx, field, val) => {
    const updated = [...flights];
    const cleanedVal = (field === 'departureTime' || field === 'arrivalTime')
      ? formatTimeWithoutSeconds(val)
      : val;
    updated[idx] = { ...updated[idx], [field]: cleanedVal };
    setFlights(updated);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Please enter or select a Customer Name (Lead Pilgrim Head).');
      return;
    }

    const assignedNo = voucherNo.trim() || editingId || getNextTransportVoucherNo('CTV-');
    const cleanCustomerName = customerName.trim().toUpperCase();

    // Prepare final passenger manifest
    const finalPaxList = paxList.length > 0 ? paxList.map((p, idx) => ({
      ...p,
      sNo: String(idx + 1),
      name: idx === 0 ? (cleanCustomerName || p.name) : (p.name || `PASSENGER ${idx + 1}`),
      category: idx === 0 ? 'Adult' : (p.category || 'Adult')
    })) : [{
      id: `pax-${Date.now()}-1`,
      sNo: '1',
      prefix: 'MR',
      name: cleanCustomerName,
      passportNo: '',
      contactPhone: customerPhone.trim(),
      category: 'Adult'
    }];

    const numericTotalPax = Math.max(finalPaxList.length, parseInt(totalPax, 10) || 1);

    // Find or create matching party so /passengers immediately shows the total pax count and manifest
    const matchedParty = (parties || []).find(p => 
      (selectedPartyHeadUid && p.partyHeadUid === selectedPartyHeadUid) ||
      (p.partyName && p.partyName.trim().toUpperCase() === cleanCustomerName)
    );

    let partyUid = matchedParty?.partyHeadUid;

    if (matchedParty) {
      const updatedParty = {
        ...matchedParty,
        partyName: cleanCustomerName,
        contactPhone: customerPhone.trim() || matchedParty.contactPhone || '',
        totalPax: numericTotalPax,
        declaredPax: numericTotalPax,
        voucherRefNo: matchedParty.voucherRefNo || assignedNo,
        updatedAt: new Date().toISOString(),
        passengers: finalPaxList
      };
      saveParty(updatedParty);
    } else {
      const newPartyUid = `PID-${Date.now().toString().slice(-4)}`;
      partyUid = newPartyUid;
      const newParty = {
        partyHeadUid: newPartyUid,
        partyName: cleanCustomerName,
        contactPhone: customerPhone.trim(),
        voucherRefNo: assignedNo,
        totalPax: numericTotalPax,
        declaredPax: numericTotalPax,
        isSelfVisa: true,
        packageTitle: 'Umrah Package',
        status: 'Active Operations',
        passengers: finalPaxList,
        accommodations: [],
        transports: bookings.map(b => ({
          date: b.pickupDate || issueDate,
          service: `${b.pickupLocation || ''} to ${b.dropoffLocation || ''}`.trim(),
          transporter: 'Ground Fleet',
          vehicleType: b.vehicle || 'Bus'
        })),
        flights: flights.map(f => ({
          type: 'Flight',
          date: f.date || issueDate,
          flight: f.flightNo || '',
          sector: `${f.departure || ''}-${f.arrival || ''}`.trim(),
          departureTime: formatTimeWithoutSeconds(f.departureTime),
          arrivalTime: formatTimeWithoutSeconds(f.arrivalTime),
        })),
      };
      saveParty(newParty);
    }

    const record = {
      id: assignedNo,
      voucherNo: assignedNo,
      partyHeadUid: partyUid,
      customerName: cleanCustomerName,
      partyName: cleanCustomerName,
      customerPhone: customerPhone.trim(),
      totalPax: numericTotalPax,
      passengers: finalPaxList,
      issueDate: issueDate || new Date().toISOString().split('T')[0],
      companyName,
      bookings: bookings.map((b, i) => ({
        id: b.id || `b-${i + 1}`,
        pickupDate: b.pickupDate || issueDate,
        pickupLocation: b.pickupLocation || 'Pickup Point',
        time: formatTimeWithoutSeconds(b.time) || '12:00',
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
        departureTime: formatTimeWithoutSeconds(f.departureTime),
        arrival: f.arrival || '—',
        arrivalTime: formatTimeWithoutSeconds(f.arrivalTime)
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
    if (onPartiesUpdated) onPartiesUpdated(getAllParties());
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
              placeholder="Search by voucher # (CTV-001), customer name, phone, res no, location..."
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
                      Flights: {v.flights.map(f => {
                        const depTime = formatTimeWithoutSeconds(f.departureTime);
                        const arrTime = formatTimeWithoutSeconds(f.arrivalTime);
                        const dep = `${f.departure || ''}${depTime ? ` @ ${depTime}` : ''}`.trim();
                        const arr = `${f.arrival || ''}${arrTime ? ` @ ${arrTime}` : ''}`.trim();
                        return `${f.flightNo || ''} (${dep || '—'} → ${arr || '—'})`;
                      }).join(' • ')}
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
      {showModal && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full flex flex-col max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0a192f] text-[#dfba73] flex items-center justify-center font-bold shadow-sm shrink-0">
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
                type="button"
                onClick={() => setShowModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              
                {/* Top Sticky/Fixed Summary: Voucher No, Issue Date, Total Pax, Customer Name & Phone */}
                <div className="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-3">
                  {/* Row 1: Voucher No & Issue Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Voucher No. *</label>
                      <div className="relative">
                        <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={voucherNo}
                          onChange={(e) => setVoucherNo(e.target.value)}
                          placeholder="e.g. CTV-001"
                          className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 bg-white outline-none focus:ring-2 focus:ring-[#0a192f]/20 focus:border-[#0a192f]"
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
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium text-slate-800 bg-white outline-none focus:ring-2 focus:ring-[#0a192f]/20 focus:border-[#0a192f]"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 2: Customer Name (Searchable dropdown with ONLY party head names) & Customer Phone */}
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
                            const val = e.target.value;
                            setPartySearchQuery(val);
                            setCustomerName(val);
                            setPartyDropdownOpen(true);
                            setPaxList(prev => {
                              if (prev.length > 0) {
                                const copy = [...prev];
                                copy[0] = { ...copy[0], name: val };
                                return copy;
                              }
                              return prev;
                            });
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
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 transition flex items-center justify-between text-xs cursor-pointer"
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
                </div>

                {/* MODAL TABS NAVIGATION BAR */}
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('TRANSFERS')}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeModalTab === 'TRANSFERS'
                        ? 'bg-[#0a192f] text-[#dfba73] shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <Bus className="w-3.5 h-3.5" />
                    <span>Transfers ({bookings.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModalTab('PASSENGERS')}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeModalTab === 'PASSENGERS'
                        ? 'bg-[#0a192f] text-[#dfba73] shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Passengers ({paxList.length})</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                      activeModalTab === 'PASSENGERS' ? 'bg-[#dfba73]/20 text-[#dfba73]' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {adultsCount}A {childrenCount > 0 ? `• ${childrenCount}C` : ''} {infantsCount > 0 ? `• ${infantsCount}I` : ''}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModalTab('FLIGHTS')}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeModalTab === 'FLIGHTS'
                        ? 'bg-[#0a192f] text-[#dfba73] shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <Plane className="w-3.5 h-3.5" />
                    <span>Flight Details ({flights.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModalTab('HELPLINES')}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeModalTab === 'HELPLINES'
                        ? 'bg-[#0a192f] text-[#dfba73] shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Helplines</span>
                  </button>
                </div>

                {/* TAB 1: TRANSFERS & BOOKING SCHEDULE */}
                {activeModalTab === 'TRANSFERS' && (
                  <div className="space-y-3 animate-in fade-in duration-150">
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

                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
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
                                step="60"
                                value={formatTimeWithoutSeconds(b.time)}
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
                )}

                {/* TAB 2: PASSENGERS & DEMOGRAPHIC COUNTS */}
                {activeModalTab === 'PASSENGERS' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    {/* Passenger Tab Top Summary */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#0a192f]" />
                          <span>Pilgrim Manifest ({paxList.length} Guests)</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Adjust counts directly by <strong className="text-slate-700">Adult (min 1), Child, Infant</strong> or edit passenger rows below.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs text-[11px] font-bold text-slate-700">
                          Total Pax: <span className="font-black text-slate-900">{paxList.length}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddPassenger}
                          className="px-3 py-1.5 rounded-xl bg-[#0a192f] hover:bg-slate-800 text-[#dfba73] text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Pax</span>
                        </button>
                      </div>
                    </div>

                    {/* DEMOGRAPHIC COUNTS: Adult, Child, Infant Wise & Total Pax with direct editable numbers & steppers */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Adults Stepper */}
                      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">Adults</span>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={paxInputValues['Adult'] !== undefined ? paxInputValues['Adult'] : adultsCount}
                            onChange={(e) => handleDirectCountChange('Adult', e.target.value)}
                            onBlur={() => handleCountBlur('Adult')}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                            onFocus={(e) => e.target.select()}
                            onClick={(e) => e.target.select()}
                            className="w-14 h-8 px-1.5 text-left text-base font-black text-slate-900 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-[#0a192f] rounded-lg outline-none transition-colors cursor-text"
                            title="Click to edit Adults count directly (min: 1)"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => adjustCategoryCount('Adult', -1)}
                            disabled={adultsCount <= 1}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 font-black text-xs flex items-center justify-center transition cursor-pointer"
                            title="Decrease Adult (minimum 1)"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustCategoryCount('Adult', 1)}
                            className="w-7 h-7 rounded-lg bg-[#0a192f] hover:bg-slate-800 text-[#dfba73] font-black text-xs flex items-center justify-center transition cursor-pointer"
                            title="Add Adult"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Children Stepper */}
                      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 block mb-0.5">Children</span>
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={paxInputValues['Child'] !== undefined ? paxInputValues['Child'] : childrenCount}
                            onChange={(e) => handleDirectCountChange('Child', e.target.value)}
                            onBlur={() => handleCountBlur('Child')}
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
                            onClick={() => adjustCategoryCount('Child', -1)}
                            disabled={childrenCount <= 0}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 font-black text-xs flex items-center justify-center transition cursor-pointer"
                            title="Decrease Child"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustCategoryCount('Child', 1)}
                            className="w-7 h-7 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-black text-xs flex items-center justify-center transition cursor-pointer"
                            title="Add Child"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Infants Stepper */}
                      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 block mb-0.5">Infants</span>
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={paxInputValues['Infant'] !== undefined ? paxInputValues['Infant'] : infantsCount}
                            onChange={(e) => handleDirectCountChange('Infant', e.target.value)}
                            onBlur={() => handleCountBlur('Infant')}
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
                            onClick={() => adjustCategoryCount('Infant', -1)}
                            disabled={infantsCount <= 0}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 font-black text-xs flex items-center justify-center transition cursor-pointer"
                            title="Decrease Infant"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustCategoryCount('Infant', 1)}
                            className="w-7 h-7 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center justify-center transition cursor-pointer"
                            title="Add Infant"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Total Pax Stepper */}
                      <div className="p-3 bg-[#0a192f] text-white rounded-2xl border border-slate-800 shadow-2xs flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#dfba73] block mb-0.5">Total Pax</span>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={totalPax}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                setTotalPax('');
                              } else {
                                const target = Math.max(1, parseInt(val, 10) || 1);
                                setTotalPax(target);
                                const diff = target - paxList.length;
                                if (diff !== 0) adjustCategoryCount('Adult', diff);
                              }
                            }}
                            onBlur={() => {
                              if (!totalPax || parseInt(totalPax, 10) < 1) {
                                setTotalPax(paxList.length || 1);
                              }
                            }}
                            onFocus={(e) => e.target.select()}
                            onClick={(e) => e.target.select()}
                            className="w-14 h-8 px-1.5 text-left text-base font-black text-white bg-slate-800 hover:bg-slate-700 focus:bg-slate-900 border border-slate-700 focus:border-[#dfba73] rounded-lg outline-none transition-colors cursor-text"
                            title="Click to edit Total Pax directly"
                            required
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => adjustCategoryCount('Adult', -1)}
                            disabled={adultsCount <= 1 && childrenCount === 0 && infantsCount === 0}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 font-black text-xs flex items-center justify-center transition cursor-pointer"
                            title="Decrease Pax"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustCategoryCount('Adult', 1)}
                            className="w-7 h-7 rounded-lg bg-[#dfba73] hover:bg-amber-400 text-[#0a192f] font-black text-xs flex items-center justify-center transition cursor-pointer"
                            title="Add Pax"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Passenger Manifest Table */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200/90 shadow-2xs bg-white">
                      <div className="overflow-x-auto max-h-[300px]">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="sticky top-0 z-10">
                            <tr className="bg-slate-100/90 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                              <th className="py-2.5 px-3 text-center w-12 border-r border-slate-200/60">#</th>
                              <th className="py-2.5 px-2.5 w-24 border-r border-slate-200/60">Prefix</th>
                              <th className="py-2.5 px-3.5 border-r border-slate-200/60">Passenger Legal Name *</th>
                              <th className="py-2.5 px-2.5 border-r border-slate-200/60 w-32">Passport #</th>
                              <th className="py-2.5 px-2.5 border-r border-slate-200/60 w-28">Category</th>
                              <th className="py-2.5 px-2 text-center w-16">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {paxList.map((pax, idx) => {
                              const isHead = idx === 0;

                              return (
                                <tr key={pax.id || idx} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400 text-xs border-r border-slate-100">
                                    {idx + 1}
                                  </td>

                                  {/* Prefix */}
                                  <td className="py-2.5 px-2 border-r border-slate-100">
                                    <select
                                      value={pax.prefix || 'MR'}
                                      onChange={(e) => handleUpdatePassenger(idx, 'prefix', e.target.value)}
                                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white"
                                    >
                                      <option value="MR">MR</option>
                                      <option value="MRS">MRS</option>
                                      <option value="MS">MS</option>
                                      {!isHead && <option value="CHD_MSTR">MSTR</option>}
                                      {!isHead && <option value="CHD_MISS">MISS</option>}
                                      {!isHead && <option value="INF">INF</option>}
                                    </select>
                                  </td>

                                  {/* Passenger Name Input */}
                                  <td className="py-2.5 px-3 border-r border-slate-100">
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="text"
                                        value={pax.name || ''}
                                        onChange={(e) => {
                                          handleUpdatePassenger(idx, 'name', e.target.value);
                                          if (isHead) {
                                            setCustomerName(e.target.value);
                                            setPartySearchQuery(e.target.value);
                                          }
                                        }}
                                        placeholder="Full Legal Name"
                                        className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 uppercase focus:border-slate-800 outline-none"
                                      />
                                      {isHead && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-1 rounded text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                                          <Crown className="w-2.5 h-2.5 text-amber-700" />
                                          <span>Head</span>
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Passport # */}
                                  <td className="py-2.5 px-2 border-r border-slate-100">
                                    <input
                                      type="text"
                                      value={pax.passportNo || ''}
                                      onChange={(e) => handleUpdatePassenger(idx, 'passportNo', e.target.value)}
                                      placeholder="Passport #"
                                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg font-mono text-xs text-slate-700 uppercase outline-none focus:border-slate-800"
                                    />
                                  </td>

                                  {/* Category Dropdown (Adult, Child, Infant) */}
                                  <td className="py-2.5 px-2 border-r border-slate-100">
                                    <select
                                      value={isHead ? 'Adult' : (pax.category || 'Adult')}
                                      disabled={isHead}
                                      onChange={(e) => handleUpdatePassenger(idx, 'category', e.target.value)}
                                      title={isHead ? 'Rule: Party Head must always be an Adult' : 'Select Category'}
                                      className={`w-full px-2 py-1.5 rounded-lg text-xs font-bold border outline-none ${
                                        isHead 
                                          ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                                          : pax.category === 'Infant'
                                          ? 'bg-purple-50 border-purple-200 text-purple-900 cursor-pointer'
                                          : pax.category === 'Child'
                                          ? 'bg-sky-50 border-sky-200 text-sky-900 cursor-pointer'
                                          : 'bg-slate-50 border-slate-200 text-slate-800 cursor-pointer'
                                      }`}
                                    >
                                      <option value="Adult">Adult</option>
                                      {!isHead && <option value="Child">Child</option>}
                                      {!isHead && <option value="Infant">Infant</option>}
                                    </select>
                                  </td>

                                  {/* Action */}
                                  <td className="py-2.5 px-2 text-center">
                                    {!isHead ? (
                                      <button
                                        type="button"
                                        onClick={() => handleRemovePassenger(idx)}
                                        className="text-rose-600 hover:text-rose-800 font-bold text-xs p-1 rounded hover:bg-rose-50 cursor-pointer transition-colors"
                                        title="Remove passenger row"
                                      >
                                        Remove
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 font-mono italic">Primary</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: FLIGHT DETAILS */}
                {activeModalTab === 'FLIGHTS' && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4 text-[#0a192f]" />
                        <span className="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                          Flight Details &amp; Connecting Flights ({flights.length})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddFlight}
                        className="px-2.5 py-1 bg-[#0a192f] hover:bg-slate-800 text-[#dfba73] rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Flight</span>
                      </button>
                    </div>

                    {flights.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                          <Plane className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-700">No Connecting Flights Added</p>
                        <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                          Connecting flights are optional. Click below to add flight arrival or departure schedules for your fleet dispatchers.
                        </p>
                        <button
                          type="button"
                          onClick={handleAddFlight}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0a192f] text-[#dfba73] hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer transition shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add First Flight</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                        {flights.map((f, idx) => (
                          <div key={f.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 pb-1 border-b border-slate-200">
                              <span>Flight #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFlight(idx)}
                                className="text-rose-600 hover:text-rose-700 text-xs font-bold cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Flight No.</label>
                                <input
                                  type="text"
                                  value={f.flightNo}
                                  onChange={(e) => handleUpdateFlight(idx, 'flightNo', e.target.value)}
                                  placeholder="e.g. SV-701"
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-mono font-bold uppercase"
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
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Departure Sector</label>
                                <input
                                  type="text"
                                  value={f.departure}
                                  onChange={(e) => handleUpdateFlight(idx, 'departure', e.target.value)}
                                  placeholder="e.g. KHI"
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-bold uppercase"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Dep. Time</label>
                                <input
                                  type="time"
                                  step="60"
                                  value={formatTimeWithoutSeconds(f.departureTime)}
                                  onChange={(e) => handleUpdateFlight(idx, 'departureTime', e.target.value)}
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-mono font-bold"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Arrival Sector</label>
                                <input
                                  type="text"
                                  value={f.arrival}
                                  onChange={(e) => handleUpdateFlight(idx, 'arrival', e.target.value)}
                                  placeholder="e.g. JED"
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-bold uppercase"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Arr. Time</label>
                                <input
                                  type="time"
                                  step="60"
                                  value={formatTimeWithoutSeconds(f.arrivalTime)}
                                  onChange={(e) => handleUpdateFlight(idx, 'arrivalTime', e.target.value)}
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-mono font-bold"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: HELPLINES & TERMS */}
                {activeModalTab === 'HELPLINES' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                        <label className="block text-slate-800 font-bold text-xs flex items-center gap-1.5">
                          <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                          <span>KSA Ground Dispatch Helpline</span>
                        </label>
                        <input
                          type="text"
                          value={ksaHelpline}
                          onChange={(e) => setKsaHelpline(e.target.value)}
                          placeholder="+966 53 649 2846 / +966 57 593 0550"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs bg-white text-slate-900"
                        />
                        <p className="text-[10px] text-slate-400">Available 24/7 for Saudi airport &amp; inter-city fleet coordination.</p>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                        <label className="block text-slate-800 font-bold text-xs flex items-center gap-1.5">
                          <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Pakistan Head Office Helpline</span>
                        </label>
                        <input
                          type="text"
                          value={headOfficeHelpline}
                          onChange={(e) => setHeadOfficeHelpline(e.target.value)}
                          placeholder="MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs bg-white text-slate-900"
                        />
                        <p className="text-[10px] text-slate-400">Customer care and emergency contact in Pakistan.</p>
                      </div>
                    </div>

                    {/* Terms & Conditions preview */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-800 text-xs block">
                        Included Terms &amp; Policies ({terms.length} Clauses):
                      </span>
                      <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside bg-white p-3 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                        {terms.map((t, idx) => (
                          <li key={idx} className="leading-relaxed">{t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Buttons (Sticky Footer) */}
              <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-white cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0a192f] hover:bg-slate-800 text-[#dfba73] rounded-xl font-black shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Save Transport Voucher
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deletingVoucher && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
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
        </div>,
        document.body
      )}
    </div>
  );
}
