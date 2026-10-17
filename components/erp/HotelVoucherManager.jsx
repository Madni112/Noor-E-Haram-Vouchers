'use client';

import { useState, useRef, useEffect } from 'react';
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
  FileText,
  Edit3,
  Trash2,
  Check,
  X,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Sparkles,
  Crown,
  PhoneCall,
  Star,
  Lock,
  KeyRound,
  AlertCircle,
  Save
} from 'lucide-react';
import { 
  saveHotelVoucher,
  deleteHotelVoucher,
  getAllHotelVouchers,
  getRegisteredHotels,
  addRegisteredHotel,
  updateRegisteredHotel,
  deleteRegisteredHotel,
  normalizeCityKey,
  getRegisteredHotelStars,
  saveRegisteredHotelStar,
  getRegisteredRoomTypes,
  addRegisteredRoomType,
  getHotelDistance,
  saveRegisteredHotelDistance,
  saveParty,
  getNextFidNumber,
  isAgencyPhone
} from '../../lib/erpData';
import CustomDatePicker from './CustomDatePicker';
import FamilyGroupCombobox from './FamilyGroupCombobox';

// -------------------------------------------------------------
// ROOM TYPE SELECTOR WITH PERSISTENT '+ ADD NEW' SUPPORT
// -------------------------------------------------------------
function RoomTypeSelect({ value, onChange }) {
  const [roomTypes, setRoomTypes] = useState(() => getRegisteredRoomTypes());
  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState('');

  const handleAddNew = () => {
    const clean = (newType || '').trim();
    if (!clean) return;
    const updated = addRegisteredRoomType(clean);
    setRoomTypes(updated);
    onChange(clean);
    setNewType('');
    setIsAdding(false);
  };

  if (isAdding) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="text"
          autoFocus
          placeholder="New Room Type (e.g. Hexa, Suite)..."
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddNew();
            } else if (e.key === 'Escape') {
              setIsAdding(false);
            }
          }}
          className="flex-1 min-w-0 px-2 py-1.5 border border-emerald-500 rounded-xl bg-white text-xs font-bold text-slate-900 outline-none"
        />
        <button
          type="button"
          onClick={handleAddNew}
          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs shrink-0 cursor-pointer shadow-2xs"
          title="Save Room Type"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setIsAdding(false)}
          className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs shrink-0 cursor-pointer"
          title="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <select
      value={value || 'Quad'}
      onChange={(e) => {
        if (e.target.value === '__ADD_NEW__') {
          setIsAdding(true);
        } else {
          onChange(e.target.value);
        }
      }}
      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-800 shadow-2xs outline-none cursor-pointer focus:border-slate-800"
    >
      {roomTypes.map((rt) => (
        <option key={rt} value={rt}>
          {rt}
        </option>
      ))}
      <option value="__ADD_NEW__" className="font-extrabold text-emerald-700">
        + Add New Room Type...
      </option>
    </select>
  );
}

import HotelCombobox from './HotelCombobox';

// -------------------------------------------------------------
// MAIN HOTEL VOUCHER MANAGER COMPONENT
// -------------------------------------------------------------
export default function HotelVoucherManager({
  parties = [],
  hotelVouchers = [],
  onVouchersUpdated,
  prefillData = null,
  onClearPrefill,
  onPartiesUpdated
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [targetPartyUid, setTargetPartyUid] = useState(parties[0]?.partyHeadUid || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('STAYS'); // 'STAYS' | 'PASSENGERS' | 'EMERGENCY'
  const [paxList, setPaxList] = useState([]);
  const [editingVoucherId, setEditingVoucherId] = useState(null);

  // Delete Voucher Modal State (Password Protected)
  const [deletingVoucher, setDeletingVoucher] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Emergency Concierge Numbers (Customizable by user)
  const [emergencyKsaGround, setEmergencyKsaGround] = useState('+966 53 649 2846');
  const [emergencyMadinah, setEmergencyMadinah] = useState('+966 57 593 0550');
  const [emergencyPkHeadOffice, setEmergencyPkHeadOffice] = useState('MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683');

  // Add a brand-new family group directly from the combobox
  const handleAddNewParty = (rawName) => {
    const clean = (rawName || '').trim().toUpperCase();
    if (!clean) return null;

    const nextFid = `FID-${getNextFidNumber()}`;
    const newUid = `PHU-${Date.now()}`;
    const headPax = {
      id: `pax-${newUid}-1`,
      sNo: '1',
      name: clean,
      prefix: 'MR',
      passportNo: '',
      dob: '',
      gender: 'M',
      category: 'Adult',
      hasBed: true,
      relationship: 'Family Head',
      contactPhone: '',
    };

    const newParty = {
      partyHeadUid: newUid,
      fid: nextFid,
      voucherRefNo: nextFid,
      partyName: clean,
      companyName: 'NOOR E HARAM TRAVELS & TOURS',
      contactPhone: '',
      backupPhone: '',
      totalPax: 1,
      declaredPax: 1,
      isSelfVisa: true,
      packageTitle: 'Umrah Package',
      status: 'Active Operations',
      passengers: [headPax],
      accommodations: [],
      transports: [],
      flights: [],
    };

    saveParty(newParty);
    setTargetPartyUid(newUid);
    setPaxList([{ ...headPax }]);

    if (onPartiesUpdated) {
      onPartiesUpdated([...parties, newParty]);
    }
    return newUid;
  };

  // Handle 1-Click Generate Hotel Voucher from Transport Voucher prefill
  useEffect(() => {
    if (prefillData && prefillData.partyHeadUid) {
      setEditingVoucherId(null);
      setTargetPartyUid(prefillData.partyHeadUid);
      setIssueDate(new Date().toISOString().split('T')[0]);
      if (Array.isArray(prefillData.stays) && prefillData.stays.length > 0) {
        setStays(prefillData.stays);
      }
      setShowCreateModal(true);
      if (onClearPrefill) onClearPrefill();
    }
  }, [prefillData, onClearPrefill]);

  // Sync paxList whenever target party or modal visibility changes
  useEffect(() => {
    if (editingVoucherId) return;
    const selectedParty = parties.find(p => p.partyHeadUid === targetPartyUid) || parties[0];
    if (selectedParty && Array.isArray(selectedParty.passengers)) {
      setPaxList(selectedParty.passengers.map((p) => ({
        ...p,
        hasBed: p.hasBed !== undefined ? Boolean(p.hasBed) : (p.category !== 'Infant'),
      })));
    } else {
      setPaxList([]);
    }
  }, [targetPartyUid, parties, showCreateModal, editingVoucherId]);

  const [paxInputValues, setPaxInputValues] = useState({});

  const adultsCount = paxList.filter(p => (p.category || 'Adult').toLowerCase() === 'adult').length;
  const childrenCount = paxList.filter(p => (p.category || '').toLowerCase() === 'child').length;
  const infantsCount = paxList.filter(p => (p.category || '').toLowerCase() === 'infant').length;

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
          id: `pax-hotel-${Date.now()}-${prev.length + i + 1}`,
          sNo: String(prev.length + i + 1),
          prefix: cat === 'Adult' ? 'MR' : cat === 'Child' ? 'CHD_MSTR' : 'INF',
          name: `${cat.toUpperCase()} ${currentOfCat.length + i + 1}`,
          passportNo: '',
          category: cat,
          hasBed: cat !== 'Infant',
        }));
        return [...prev, ...newItems];
      } else {
        // Decrease: keep first `target` items of this category, keep all other categories
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
            id: `pax-hotel-${Date.now()}-1`,
            sNo: '1',
            prefix: 'MR',
            name: 'LEAD PASSENGER',
            passportNo: '',
            category: 'Adult',
            hasBed: true,
          });
        }
        return result;
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
    if (field === 'category' && value !== 'Adult') {
      const isLead = index === 0 || paxList[index]?.manifestRole === 'HEAD';
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
      const isLead = index === 0 || paxList[index]?.manifestRole === 'HEAD';
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
          copy[index].hasBed = false;
          copy[index].prefix = 'INF';
        } else if (value === 'Child') {
          copy[index].hasBed = true;
          if (!copy[index].prefix || copy[index].prefix === 'MR') copy[index].prefix = 'CHD_MSTR';
        } else {
          copy[index].hasBed = true;
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
        alert('Rule: Cannot remove the only Adult. At least 1 Adult is required.');
        return;
      }
    }
    setPaxList(prev => prev.filter((_, i) => i !== index));
  };

  const handleToggleBed = (index, hasBedVal) => {
    setPaxList(prev => prev.map((p, i) => i === index ? { ...p, hasBed: hasBedVal } : p));
  };

  const handleSetAllBeds = (hasBedVal) => {
    setPaxList(prev => prev.map(p => ({ ...p, hasBed: hasBedVal })));
  };

  const handleResetDefaultBeds = () => {
    setPaxList(prev => prev.map(p => ({ ...p, hasBed: p.category !== 'Infant' })));
  };

  const totalBedsCount = paxList.filter(p => p.hasBed !== false).length;
  const noBedCount = paxList.filter(p => p.hasBed === false).length;

  // Dynamic Stays Array (default 3 stays: Makkah -> Madinah -> Makkah, fully customizable)
  const [stays, setStays] = useState([
    {
      id: 'stay-1',
      city: 'Makkah',
      hotelName: 'VOCO 5 STAR',
      distance: '850m from Haram',
      stars: 5,
      category: '5 Star Hotel',
      checkIn: '2026-10-10',
      checkOut: '2026-10-15',
      roomType: 'Quad',
      mealPlan: 'RO',
      hcn: 'HCN-108047',
      hotelPhone: '+966 53 649 2846'
    },
    {
      id: 'stay-2',
      city: 'Medinah',
      hotelName: 'GULNAR HV',
      distance: '150m from Nabawi',
      stars: 4,
      category: '4 Star Hotel',
      checkIn: '2026-10-15',
      checkOut: '2026-10-22',
      roomType: 'Quad',
      mealPlan: 'RO',
      hcn: 'HCN-108048',
      hotelPhone: '+966 57 593 0550'
    },
    {
      id: 'stay-3',
      city: 'Makkah',
      hotelName: 'SWISSOTEL MAKKAH',
      distance: '0m (Direct Haram View)',
      stars: 5,
      category: '5 Star Hotel',
      checkIn: '2026-10-22',
      checkOut: '2026-10-27',
      roomType: 'Quad',
      mealPlan: 'RO',
      hcn: 'HCN-108049',
      hotelPhone: '+966 53 649 2846'
    }
  ]);

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const diff = new Date(end) - new Date(start);
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
  };

  const totalNights = stays.reduce((acc, curr) => acc + calculateDays(curr.checkIn, curr.checkOut), 0);

  const updateStay = (index, field, value) => {
    const updated = [...stays];
    if (typeof field === 'object') {
      updated[index] = { ...updated[index], ...field };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setStays(updated);
  };

  const handleAddStay = () => {
    const lastStay = stays[stays.length - 1];
    let nextCity = 'Makkah';
    let nextCheckIn = '2026-10-27';
    let nextCheckOut = '2026-11-01';

    if (lastStay) {
      nextCity = lastStay.city === 'Makkah' ? 'Medinah' : 'Makkah';
      nextCheckIn = lastStay.checkOut || '2026-10-27';
      const d = new Date(nextCheckIn);
      d.setDate(d.getDate() + 5);
      nextCheckOut = d.toISOString().split('T')[0];
    }

    const defaultHotel = nextCity === 'Medinah' ? 'GULNAR HV' : 'VOCO 5 STAR';
    const starMap = getRegisteredHotelStars();
    const defaultStars = starMap[defaultHotel] || 5;

    setStays([
      ...stays,
      {
        id: `stay-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
        city: nextCity,
        hotelName: defaultHotel,
        distance: '',
        stars: defaultStars,
        category: `${defaultStars} Star Hotel`,
        checkIn: nextCheckIn,
        checkOut: nextCheckOut,
        roomType: 'Quad',
        mealPlan: 'RO',
        hcn: `HCN-${Math.floor(100000 + Math.random() * 900000)}`,
        hotelPhone: nextCity === 'Medinah' ? '+966 57 593 0550' : '+966 53 649 2846',
      }
    ]);
  };

  const handleRemoveStay = (index) => {
    if (stays.length <= 1) {
      alert('At least one stay is required for a hotel voucher.');
      return;
    }
    setStays(stays.filter((_, i) => i !== index));
  };

  const handleMoveStay = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= stays.length) return;
    const updated = [...stays];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setStays(updated);
  };

  const handleOpenCreate = () => {
    setEditingVoucherId(null);
    const defaultParty = parties[0]?.partyHeadUid || '';
    setTargetPartyUid(defaultParty);
    const matchedParty = parties.find(p => p.partyHeadUid === defaultParty);
    const defaultPhone = (matchedParty?.contactPhone && !isAgencyPhone(matchedParty.contactPhone)) ? matchedParty.contactPhone : '';
    setCustomerPhone(defaultPhone);
    setIssueDate(new Date().toISOString().split('T')[0]);
    setStays([
      {
        id: 'stay-1',
        city: 'Makkah',
        hotelName: 'VOCO 5 STAR',
        distance: '850m from Haram',
        stars: 5,
        category: '5 Star Hotel',
        checkIn: '2026-10-10',
        checkOut: '2026-10-15',
        roomType: 'Quad',
        mealPlan: 'RO',
        hcn: 'HCN-108047',
        hotelPhone: '+966 53 649 2846'
      },
      {
        id: 'stay-2',
        city: 'Medinah',
        hotelName: 'GULNAR HV',
        distance: '150m from Nabawi',
        stars: 4,
        category: '4 Star Hotel',
        checkIn: '2026-10-15',
        checkOut: '2026-10-22',
        roomType: 'Quad',
        mealPlan: 'RO',
        hcn: 'HCN-108048',
        hotelPhone: '+966 57 593 0550'
      },
      {
        id: 'stay-3',
        city: 'Makkah',
        hotelName: 'SWISSOTEL MAKKAH',
        distance: '0m (Direct Haram View)',
        stars: 5,
        category: '5 Star Hotel',
        checkIn: '2026-10-22',
        checkOut: '2026-10-27',
        roomType: 'Quad',
        mealPlan: 'RO',
        hcn: 'HCN-108049',
        hotelPhone: '+966 53 649 2846'
      }
    ]);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVoucherId(v.id || v.voucherNo);
    const matched = parties.find(p => 
      (v.partyHeadUid && p.partyHeadUid === v.partyHeadUid) || 
      (v.partyName && p.partyName?.trim().toLowerCase() === v.partyName?.trim().toLowerCase()) ||
      (v.voucherRefNo && p.voucherRefNo === v.voucherRefNo)
    );
    const resolvedUid = matched?.partyHeadUid || v.partyHeadUid || v.partyName || '';
    setTargetPartyUid(resolvedUid);
    setIssueDate(v.issueDate || new Date().toISOString().split('T')[0]);
    const candidatePhone = v.customerPhone || v.contactPhone || matched?.contactPhone || '';
    setCustomerPhone((candidatePhone && !isAgencyPhone(candidatePhone)) ? candidatePhone : '');
    if (Array.isArray(v.stays) && v.stays.length > 0) {
      setStays(v.stays.map((s, idx) => ({
        id: s.id || `stay-${idx + 1}`,
        city: s.city || 'Makkah',
        hotelName: s.hotelName || '',
        distance: s.distance || '',
        stars: s.stars !== undefined && s.stars !== null ? parseInt(s.stars, 10) : 5,
        category: s.stars > 0 ? (s.category || `${s.stars} Star Hotel`) : '',
        checkIn: s.checkIn || '2026-10-10',
        checkOut: s.checkOut || '2026-10-15',
        roomType: s.roomType || 'Quad',
        mealPlan: s.mealPlan || 'RO',
        hcn: s.hcn || '',
        hotelPhone: s.hotelPhone || '',
      })));
    }
    if (Array.isArray(v.passengers) && v.passengers.length > 0) {
      const party = parties.find(p => p.partyHeadUid === v.partyHeadUid) || { partyName: v.partyName };
      setPaxList(v.passengers.map((p, idx) => {
        let cleanName = (p.name || '').trim();
        if ((!cleanName || cleanName.toLowerCase().includes('unnamed')) && idx === 0) {
          cleanName = (v.partyName || party.partyName || 'LEAD GUEST').replace(/^MR\s+/i, '');
        }
        return {
          ...p,
          prefix: p.prefix || 'MR',
          name: cleanName,
          category: p.category || (p.prefix === 'CHD' || p.prefix?.startsWith('CHD') ? 'Child' : p.prefix === 'INF' || p.prefix?.startsWith('INF') ? 'Infant' : 'Adult'),
          hasBed: p.hasBed !== undefined ? Boolean(p.hasBed) : (p.category !== 'Infant'),
        };
      }));
    }
    if (v.emergencyContacts) {
      setEmergencyKsaGround(v.emergencyContacts.ksaGround || '+966 53 649 2846');
      setEmergencyMadinah(v.emergencyContacts.madinah || '+966 57 593 0550');
      setEmergencyPkHeadOffice(v.emergencyContacts.pkHeadOffice || 'MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683');
    }
    setShowCreateModal(true);
  };

  const handleConfirmDelete = (e) => {
    e.preventDefault();
    if (!deletingVoucher) return;
    const pwd = (deletePassword || '').trim();
    if (pwd !== 'Noor@.5923' && pwd !== 'Cheepa@2026') {
      setDeleteError('Incorrect admin password. Deletion cancelled.');
      return;
    }
    const updated = deleteHotelVoucher(deletingVoucher.id);
    if (onVouchersUpdated) {
      onVouchersUpdated(updated || []);
    }
    setDeletingVoucher(null);
    setDeletePassword('');
    setDeleteError('');
  };

  const handleCreateHotelVoucher = (e) => {
    e.preventDefault();
    const party = parties.find(p => 
      p.partyHeadUid === targetPartyUid || 
      (p.partyName && p.partyName.trim().toLowerCase() === targetPartyUid?.trim().toLowerCase()) ||
      (p.voucherRefNo && p.voucherRefNo === targetPartyUid)
    );
    if (!party) {
      alert('Selected family group not found');
      return;
    }

    for (let i = 0; i < stays.length; i++) {
      const s = stays[i];
      if (!s.hotelName || !s.hotelName.trim()) {
        setActiveTab('STAYS');
        alert(`Please specify the hotel name for Stay #${i + 1} (${s.city})`);
        return;
      }
    }

    const vId = editingVoucherId || `HV-${party.voucherRefNo || party.partyHeadUid}`;
    const compiledStays = stays.map((s, idx) => {
      const starNum = (s.stars !== undefined && s.stars !== null) ? (parseInt(s.stars, 10) || 0) : 5;
      if (s.hotelName) {
        saveRegisteredHotelStar(s.hotelName, starNum);
      }
      return {
        id: s.id || `stay-${Date.now()}-${idx + 1}`,
        city: s.city,
        hotelName: s.hotelName.trim().toUpperCase(),
        distance: (s.distance || '').trim(),
        stars: starNum,
        category: starNum > 0 ? (s.category || `${starNum} Star Hotel`) : '',
        checkIn: s.checkIn,
        checkOut: s.checkOut,
        nights: calculateDays(s.checkIn, s.checkOut),
        roomType: s.roomType || 'Quad',
        roomsCount: 1,
        mealPlan: s.mealPlan || 'RO',
        hcn: (s.hcn || '').trim().toUpperCase() || `HCN-${Math.floor(100000 + Math.random() * 900000)}`,
        hotelPhone: s.city === 'Medinah' ? '+966 57 593 0550' : s.city === 'Jeddah' ? '+966 12 612 0000' : '+966 53 649 2846',
      };
    });

    const targetPassengers = (paxList.length > 0 ? paxList : (party.passengers || [])).map((p, idx) => {
      if (idx === 0) {
        return { ...p, contactPhone: customerPhone.trim() };
      }
      return p;
    });
    const adultsCount = targetPassengers.filter(p => (p.category || 'Adult').toLowerCase() === 'adult').length;
    const childrenCount = targetPassengers.filter(p => (p.category || '').toLowerCase() === 'child').length;
    const infantsCount = targetPassengers.filter(p => (p.category || '').toLowerCase() === 'infant').length;
    const totalCount = targetPassengers.length;

    // Update the master party record so /passengers immediately updates badge to 10 PAX
    const updatedParty = {
      ...party,
      totalPax: Math.max(totalCount, party.totalPax || 1),
      declaredPax: Math.max(totalCount, party.declaredPax || 1),
      contactPhone: customerPhone.trim() || party.contactPhone || '',
      adultsCount,
      childrenCount,
      infantsCount,
    };

    // If party head name was edited in paxList[0], sync partyName
    if (targetPassengers[0]?.name && targetPassengers[0].name.trim()) {
      updatedParty.partyName = targetPassengers[0].name.trim().toUpperCase();
      if (updatedParty.passengers && updatedParty.passengers.length > 0) {
        updatedParty.passengers[0] = {
          ...updatedParty.passengers[0],
          ...targetPassengers[0],
          name: targetPassengers[0].name.trim().toUpperCase(),
        };
      }
    }

    saveParty(updatedParty);

    const newVoucher = {
      id: vId,
      voucherNo: vId,
      partyHeadUid: party.partyHeadUid,
      partyName: party.partyName,
      companyName: party.companyName || 'NOOR E HARAM TRAVELS & TOURS',
      customerPhone: customerPhone.trim(),
      contactPhone: customerPhone.trim(),
      totalPax: targetPassengers.length || party.totalPax || 1,
      passengers: targetPassengers,
      stays: compiledStays,
      emergencyContacts: {
        ksaGround: emergencyKsaGround || '+966 53 649 2846',
        madinah: emergencyMadinah || '+966 57 593 0550',
        pkHeadOffice: emergencyPkHeadOffice || '+92 321 8450030'
      },
      issueDate: issueDate || new Date().toISOString().split('T')[0],
      urduComplianceText: [
        'ÛÙˆÙ¹Ù„ Ø§ÙˆØ± Ù¾ÛŒÚ©ÛŒØ¬ Ø§Ø³ Ø¯Ø³ØªØ§ÙˆÛŒØ² Ù…ÛŒÚº Ù„Ú©Ú¾ Ø¯ÛŒØ§ Ú¯ÛŒØ§ ÛÛ’Û”',
        'Ø³ÙØ±ÛŒ Ø³Ø§Ù…Ø§Ù† Ø­Ø±Ù…ÛŒÙ† Ø´Ø±ÛŒÙÛŒÙ† Ú©ÛŒ Ø·Ø±Ù Ù„Û’ Ø¬Ø§Ù†Ø§ Ø³Ø¹ÙˆØ¯ÛŒ Ø§Ù†ØªØ¸Ø§Ù…ÛŒÛ Ú©ÛŒ Ø·Ø±Ù Ø³Û’ Ù…Ù…Ù†ÙˆØ¹ ÛÛ’Û” Ø®Ù„Ø§Ù ÙˆØ±Ø²ÛŒ Ù¾Ø± Ø¬Ø±Ù…Ø§Ù†Û ÛÙˆÚ¯Ø§Û”',
        'Ù†Ø´Û Ø¢ÙˆØ± Ø§Ø´ÛŒØ§Ø¡ Ú©Ø§ Ù„Ø§Ù†Ø§ Ù‚Ø§Ù†ÙˆÙ†Ø§Ù‹ Ù…Ù…Ù†ÙˆØ¹ ÛÛ’ØŒ Ø³Ø¹ÙˆØ¯ÛŒÛ Ù…ÛŒÚº Ù…Ù†Ø´ÛŒØ§Øª Ù„Û’ Ø¬Ø§Ù†Û’ Ú©ÛŒ Ø³Ø²Ø§ Ù…ÙˆØª ÛÛ’Û”',
        'Ø­Ø±Ù…ÛŒÙ† Ø´Ø±ÛŒÙÛŒÙ† Ú©Û’ Ø§Ù†Ø¯Ø± Ø²Ù…ÛŒÙ† Ù¾Ø± Ú¯Ø±ÛŒ Ù¾Ú‘ÛŒ Ú†ÛŒØ² (Ù¾Ø±Ø³ØŒ Ù…ÙˆØ¨Ø§Ø¦Ù„ ÙÙˆÙ† ÛŒØ§ Ú©ÙˆØ¦ÛŒ Ù‚ÛŒÙ…ØªÛŒ Ú†ÛŒØ²) ÛØ±Ú¯Ø² Ù†Û Ø§Ù¹Ú¾Ø§Ø¦ÛŒÚºÛ”',
        'ÛÙˆÙ¹Ù„ Ø³Û’ Ú†ÛŒÚ© Ø¢Ø¤Ù¹ Ù¹Ø§Ø¦Ù… Ø¯ÙˆÙ¾ÛØ± 2 Ø¨Ø¬Û’ ÛÛ’Û” Ø§Ø³ Ú©Û’ Ø¨Ø¹Ø¯ Ø§Ú¯Ù„ÛŒ Night Ú†Ø§Ø±Ø¬ ÛÙˆÚ¯ÛŒØŒ ÙˆØ§Ø¤Ú†Ø± Ú©ÛŒ 4 Ú©Ø§Ù¾ÛŒØ§Úº Ù¾Ø§Ø³ Ø±Ú©Ú¾ÛŒÚºÛ”'
      ],
      emergencyHelpline: 'UBAID RAZA MEMON 0311-2264567 / BACKUP: MADNI RAZA MEMON 0312-8039911',
      status: 'Confirmed & Verified',
    };

    saveHotelVoucher(newVoucher);
    const all = getAllHotelVouchers();
    if (onVouchersUpdated) onVouchersUpdated(all);

    setShowCreateModal(false);
    setEditingVoucherId(null);
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
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
              Module B
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Hotel Vouchers
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generates legal proof of accommodation with chronological Makkah &amp; Madinah blocks, dual English/Urdu compliance footer &amp; live QR verification.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5 text-slate-300" />
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
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {v.voucherNo}
                        </span>
                        <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {v.partyHeadUid}
                        </span>
                        {v.issueDate && (
                          <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5 text-slate-500" />
                            {v.issueDate}
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-sm text-slate-900 mt-1 uppercase">
                        {v.partyName}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {v.totalPax} Passengers â€¢ {totalN} Nights Total
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
                            <span className="text-[9px] text-slate-500 font-mono">{stay.checkIn} âž” {stay.checkOut}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-emerald-900 bg-emerald-100/70 px-1.5 py-0.5 rounded text-[9px] block">
                            {stay.roomType} â€¢ {stay.mealPlan}
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
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(v)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10.5px] font-bold border border-slate-300 transition-colors cursor-pointer"
                      title="Edit Hotel Voucher"
                    >
                      <Edit3 className="w-3 h-3 text-slate-600" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDeletingVoucher(v);
                        setDeletePassword('');
                        setDeleteError('');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10.5px] font-bold border border-rose-200 transition-colors cursor-pointer"
                      title="Delete Hotel Voucher (Password Required)"
                    >
                      <Trash2 className="w-3 h-3 text-rose-600" />
                      <span>Delete</span>
                    </button>

                    <Link
                      href={`/hotel-voucher/${v.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[10.5px] font-bold shadow-2xs transition-colors"
                    >
                      <span>View &amp; Print (A4)</span>
                      <ExternalLink className="w-3 h-3 text-slate-300" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================== */}
      {/* WIDESCREEN MODAL: GENERATE MULTI-STAY HOTEL VOUCHER */}
      {/* ============================================================== */}
      {showCreateModal && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl lg:max-w-5xl w-full flex flex-col max-h-[92vh] overflow-hidden my-4 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md shrink-0">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                    {editingVoucherId ? `Edit Hotel Voucher (${editingVoucherId})` : 'Generate Multi-Stay Hotel Voucher'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingVoucherId ? 'Update accommodation blocks, room types, dates, or passenger details' : 'Configure multi-city chronological accommodation blocks with live verification'}
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingVoucherId(null);
                }} 
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <form onSubmit={handleCreateHotelVoucher} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
              
              {/* Top Controls: Parent Party Select + Customer Phone + Issue Date + Quick Stats */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-6">
                    <label className="block text-slate-700 font-bold mb-1.5 text-xs flex items-center justify-between">
                      <span>Select Target Family Group *</span>
                      <span className="text-[10px] text-emerald-700 font-semibold">Search existing or type new</span>
                    </label>
                    <FamilyGroupCombobox
                      parties={parties}
                      value={targetPartyUid}
                      onChange={(newUid) => {
                        setTargetPartyUid(newUid);
                        const matched = parties.find(p => p.partyHeadUid === newUid);
                        if (matched?.contactPhone && !isAgencyPhone(matched.contactPhone)) {
                          setCustomerPhone(matched.contactPhone);
                        }
                      }}
                      onAddNewParty={handleAddNewParty}
                      placeholder="Search family group or type new..."
                    />
                  </div>

                  <div className="md:col-span-6">
                    <label className="block text-slate-700 font-bold mb-1.5 text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Customer Phone (Optional)</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">Leave blank to hide from voucher</span>
                    </label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. +92 311 2324764 / 055 819 2401"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-800 outline-none focus:border-slate-800 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-2 border-t border-slate-200/60">
                  <div className="md:col-span-6">
                    <label className="block text-slate-700 font-bold mb-1.5 text-xs flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Issue Date *</span>
                    </label>
                    <CustomDatePicker
                      value={issueDate}
                      onChange={(val) => setIssueDate(val)}
                      placeholder="YYYY-MM-DD"
                    />
                  </div>

                  <div className="md:col-span-6 p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Itinerary</span>
                      <span className="text-xs font-black text-slate-800">
                        {stays.length} Stays â€¢ <span className="text-emerald-700">{totalNights} Nights</span>
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      A4 Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Modern Tab Bar */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('STAYS')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'STAYS'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <Building2 className={`w-3.5 h-3.5 ${activeTab === 'STAYS' ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>Hotel Stays ({stays.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('PASSENGERS')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'PASSENGERS'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <Users className={`w-3.5 h-3.5 ${activeTab === 'PASSENGERS' ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>Passengers &amp; Beds ({paxList.length})</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                    activeTab === 'PASSENGERS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {totalBedsCount} Beds
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('EMERGENCY')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'EMERGENCY'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <PhoneCall className={`w-3.5 h-3.5 ${activeTab === 'EMERGENCY' ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>Emergency Concierge</span>
                </button>
              </div>

              {/* TAB 1: Dynamic Stays Section */}
              {activeTab === 'STAYS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 tracking-tight">
                        Chronological Accommodation Stays ({stays.length})
                      </h4>
                      <span className="text-[11px] text-slate-400 font-normal">
                        Reorder, change city sequence (Makkah / Madinah first), or add more stays
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddStay}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-200" />
                      <span>+ Add Stay</span>
                    </button>
                  </div>

                  {/* Stays List */}
                  <div className="space-y-3.5">
                    {stays.map((stay, idx) => {
                      const stayNights = calculateDays(stay.checkIn, stay.checkOut);
                      const isMakkah = stay.city === 'Makkah';
                      const isMadinah = stay.city === 'Medinah';
                      const isJeddah = stay.city === 'Jeddah';

                      let themeClasses = 'border-amber-200 bg-amber-50/40';
                      let badgeClasses = 'bg-amber-100 text-amber-900 border-amber-300';
                      if (isMadinah) {
                        themeClasses = 'border-emerald-200 bg-emerald-50/40';
                        badgeClasses = 'bg-emerald-100 text-emerald-900 border-emerald-300';
                      } else if (isJeddah) {
                        themeClasses = 'border-sky-200 bg-sky-50/40';
                        badgeClasses = 'bg-sky-100 text-sky-900 border-sky-300';
                      }

                      return (
                        <div 
                          key={stay.id || idx}
                          className={`rounded-2xl border p-4 sm:p-5 space-y-3.5 transition-all shadow-xs ${themeClasses}`}
                        >
                          {/* Stay Card Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                {idx + 1}
                              </span>
                              <span className="font-extrabold text-slate-800 text-xs tracking-tight uppercase">
                                Stay #{idx + 1}:
                              </span>
                              
                              {/* City Selector */}
                              <select
                                value={stay.city}
                                onChange={(e) => {
                                  const newCity = e.target.value;
                                  const defaultPhone = newCity === 'Medinah' ? '+966 57 593 0550' : newCity === 'Jeddah' ? '+966 12 612 0000' : '+966 53 649 2846';
                                  updateStay(idx, { city: newCity, hotelPhone: defaultPhone });
                                }}
                                className={`px-3 py-1 rounded-xl text-xs font-bold border outline-none cursor-pointer shadow-2xs transition-all ${badgeClasses}`}
                              >
                                <option value="Makkah">Makkah Mukarramah</option>
                                <option value="Medinah">Madinah Munawwarah</option>
                                <option value="Jeddah">Jeddah</option>
                              </select>
                            </div>

                            {/* Reordering & Remove Controls */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveStay(idx, -1)}
                                title="Move Up"
                                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === stays.length - 1}
                                onClick={() => handleMoveStay(idx, 1)}
                                title="Move Down"
                                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              {stays.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStay(idx)}
                                  title="Remove this stay"
                                  className="p-1.5 rounded-lg bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer ml-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Stay Fields Grid: Hotel Name, Distance, Star Rating, HCN */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                            {/* Hotel Name Input with Smart Combobox */}
                            <div className="sm:col-span-4">
                              <label className="block text-slate-700 font-bold mb-1 text-[11px] uppercase tracking-wider">
                                Hotel Property Name * ({stay.city})
                              </label>
                              <HotelCombobox 
                                city={stay.city}
                                value={stay.hotelName}
                                onChange={(val) => {
                                  const starMap = getRegisteredHotelStars();
                                  const clean = (val || '').trim().toUpperCase();
                                  const detectedStars = (starMap[clean] !== undefined && starMap[clean] !== null) ? starMap[clean] : (
                                    clean.includes('5 STAR') ? 5 :
                                    clean.includes('4 STAR') ? 4 :
                                    clean.includes('3 STAR') ? 3 :
                                    clean.includes('2 STAR') ? 2 :
                                    clean.includes('1 STAR') ? 1 : (stay.stars !== undefined ? stay.stars : 5)
                                  );
                                  const regDist = getHotelDistance(clean);
                                  updateStay(idx, {
                                    hotelName: val,
                                    distance: regDist || stay.distance || '',
                                    distanceModified: false,
                                    stars: detectedStars,
                                    category: detectedStars > 0 ? `${detectedStars} Star Hotel` : ''
                                  });
                                }}
                                placeholder={`Select or type ${stay.city} hotel...`}
                              />
                            </div>

                            {/* Hotel Distance Input with Save Changes */}
                            <div className="sm:col-span-3">
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                                  Distance {stay.city === 'Medinah' ? '(from Nabawi)' : '(from Haram)'}
                                </label>
                                {stay.distanceModified && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (stay.hotelName) {
                                        saveRegisteredHotelDistance(stay.hotelName, stay.distance);
                                        updateStay(idx, { distanceModified: false, distanceSaved: true });
                                        setTimeout(() => updateStay(idx, { distanceSaved: false }), 3000);
                                      }
                                    }}
                                    className="text-[9px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer shadow-2xs transition-all animate-in fade-in"
                                    title="Save Changes to Hotel Property"
                                  >
                                    <Save className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>Save Changes</span>
                                  </button>
                                )}
                              </div>
                              <div className="relative flex items-center">
                                <input 
                                  type="text" 
                                  placeholder={stay.city === 'Medinah' ? 'e.g. 150m from Nabawi' : 'e.g. 350m from Haram'}
                                  value={stay.distance || ''} 
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const regDist = getHotelDistance(stay.hotelName);
                                    const isDiff = (val || '').trim() !== (regDist || '').trim();
                                    updateStay(idx, { distance: val, distanceModified: isDiff });
                                  }} 
                                  className={`w-full px-3 py-2 border rounded-xl bg-white text-xs font-semibold text-slate-900 shadow-2xs outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 ${
                                    stay.distanceModified ? 'border-emerald-500 ring-1 ring-emerald-500/20 pr-16' : 'border-slate-300'
                                  }`} 
                                />
                                {stay.distanceModified && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (stay.hotelName) {
                                        saveRegisteredHotelDistance(stay.hotelName, stay.distance);
                                        updateStay(idx, { distanceModified: false, distanceSaved: true });
                                        setTimeout(() => updateStay(idx, { distanceSaved: false }), 3000);
                                      }
                                    }}
                                    className="absolute right-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-[9.5px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                                    title="Save changes to hotel property"
                                  >
                                    <Save className="w-3 h-3 stroke-[2.5]" />
                                    <span>Save</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Dynamic Star Rating with Auto-Save */}
                            <div className="sm:col-span-2">
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                                  Star Rating *
                                </label>
                                {stay.stars > 0 && (
                                  <span className="text-[9.5px] text-amber-600 font-extrabold flex items-center gap-0.5">
                                    <Star className="w-3 h-3 fill-amber-400 stroke-amber-500" />
                                    <span>{stay.stars}â˜…</span>
                                  </span>
                                )}
                              </div>
                              <select
                                value={stay.stars !== undefined && stay.stars !== null ? stay.stars : 5}
                                onChange={(e) => {
                                  const s = parseInt(e.target.value, 10);
                                  updateStay(idx, {
                                    stars: s,
                                    category: s > 0 ? `${s} Star Hotel` : ''
                                  });
                                  if (stay.hotelName) {
                                    saveRegisteredHotelStar(stay.hotelName, s);
                                  }
                                }}
                                className="w-full px-2.5 py-2 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-800 shadow-2xs outline-none cursor-pointer focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
                              >
                                <option value={5}>â˜…â˜…â˜…â˜…â˜… 5 Star</option>
                                <option value={4}>â˜…â˜…â˜…â˜… 4 Star</option>
                                <option value={3}>â˜…â˜…â˜… 3 Star</option>
                                <option value={2}>â˜…â˜… 2 Star</option>
                                <option value={1}>â˜… 1 Star</option>
                                <option value={0}>No Star (Blank)</option>
                              </select>
                            </div>

                            {/* HCN / Confirmation # */}
                            <div className="sm:col-span-3">
                              <label className="block text-slate-700 font-bold mb-1 text-[11px] uppercase tracking-wider">
                                Hotel HCN #
                              </label>
                              <input 
                                type="text" 
                                placeholder="e.g. HCN-108047"
                                value={stay.hcn || ''} 
                                onChange={(e) => updateStay(idx, 'hcn', e.target.value)} 
                                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white uppercase font-mono font-bold text-slate-900 text-xs shadow-2xs outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800" 
                              />
                            </div>
                          </div>

                          {/* Stay Dates, Room Type, Meal Plan */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                            <div>
                              <label className="block text-slate-600 font-bold mb-1 text-[11px]">Check-In</label>
                              <CustomDatePicker 
                                value={stay.checkIn} 
                                onChange={(val) => updateStay(idx, 'checkIn', val)} 
                                placeholder="YYYY-MM-DD"
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-slate-600 font-bold text-[11px]">Check-Out</label>
                                <span className="font-extrabold text-[10px] text-emerald-700 bg-emerald-100 px-1.5 rounded">
                                  {stayNights}N
                                </span>
                              </div>
                              <CustomDatePicker 
                                value={stay.checkOut} 
                                onChange={(val) => updateStay(idx, 'checkOut', val)} 
                                minDate={stay.checkIn || undefined}
                                placeholder="YYYY-MM-DD"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-600 font-bold mb-1 text-[11px]">Room Type :</label>
                              <RoomTypeSelect 
                                value={stay.roomType || 'Quad'} 
                                onChange={(val) => updateStay(idx, 'roomType', val)} 
                              />
                            </div>
                            <div>
                              <label className="block text-slate-600 font-bold mb-1 text-[11px]">Meal Plan</label>
                              <select 
                                value={stay.mealPlan || 'RO'} 
                                onChange={(e) => updateStay(idx, 'mealPlan', e.target.value)} 
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-800 shadow-2xs outline-none cursor-pointer" 
                              >
                                <option value="RO">RO (Room Only)</option>
                                <option value="BB">BB (Bed &amp; Breakfast)</option>
                                <option value="HB">HB (Half Board)</option>
                                <option value="FB">FB (Full Board)</option>
                              </select>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom Add Stay Strip */}
                  <button
                    type="button"
                    onClick={handleAddStay}
                    className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-99"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    <span>+ Add Another Stay Block (e.g. Makkah, Madinah, Jeddah)</span>
                  </button>
                </div>
              )}

              {/* TAB 2: Passengers & Bed Allocation Section */}
              {activeTab === 'PASSENGERS' && (
                <div className="space-y-4">
                  {/* Passenger Tab Top Summary & Quick Actions */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span>Pilgrim Manifest &amp; Bed Allocation ({paxList.length} Guests)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Adjust counts directly by <strong className="text-slate-700">Adult, Child, Infant</strong> or edit passenger rows below.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs text-[11px] font-bold">
                        <span className="text-slate-500">Total:</span>
                        <span className="text-slate-900">{paxList.length}</span>
                        <span className="text-slate-300 mx-1">|</span>
                        <span className="text-emerald-700">{totalBedsCount} Beds (Yes)</span>
                        <span className="text-slate-300 mx-1">|</span>
                        <span className="text-slate-500">{noBedCount} No Bed</span>
                      </div>

                      {/* Quick Batch Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSetAllBeds(true)}
                          className="px-2.5 py-1 text-[10.5px] font-bold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition cursor-pointer"
                          title="Set Bed = Yes for all passengers"
                        >
                          All Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetAllBeds(false)}
                          className="px-2.5 py-1 text-[10.5px] font-bold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 transition cursor-pointer"
                          title="Set Bed = No for all passengers"
                        >
                          All No
                        </button>
                        <button
                          type="button"
                          onClick={handleResetDefaultBeds}
                          className="px-2.5 py-1 text-[10.5px] font-bold rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                          title="Infants = No, Adults & Children = Yes"
                        >
                          Defaults
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* EDITABLE DEMOGRAPHIC COUNTS: Adult, Child, Infant Wise */}
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
                          onChange={(e) => handleDirectCountChange('Adult', e.target.value)}
                          onBlur={() => handleCountBlur('Adult')}
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
                    <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
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

                    {/* Total PAX & Quick Add Button */}
                    <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white shadow-2xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Pax</span>
                        <span className="text-sm sm:text-base font-black text-emerald-400">{paxList.length} Guests</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddPassenger}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-95"
                        title="Add Passenger Row"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Pax</span>
                      </button>
                    </div>
                  </div>

                  {/* Passenger Table */}
                  {paxList.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 italic text-xs">
                      No passengers found. Use the steppers above or click &quot;Add Pax&quot; to register guests.
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200/90 shadow-2xs bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                              <th className="py-2.5 px-3 text-center w-12 border-r border-slate-200/60">#</th>
                              <th className="py-2.5 px-2.5 w-24 border-r border-slate-200/60">Prefix</th>
                              <th className="py-2.5 px-3.5 border-r border-slate-200/60">Passenger Legal Name *</th>
                              <th className="py-2.5 px-2.5 border-r border-slate-200/60 w-32">Passport #</th>
                              <th className="py-2.5 px-2.5 border-r border-slate-200/60 w-28">Category</th>
                              <th className="py-2.5 px-3 w-40 border-r border-slate-200/60">Bed Allocation</th>
                              <th className="py-2.5 px-2 text-center w-12">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {paxList.map((pax, idx) => {
                              const isHead = idx === 0 || pax.manifestRole === 'HEAD' || pax.relationship?.toLowerCase() === 'head';
                              const hasBed = pax.hasBed !== false;

                              return (
                                <tr 
                                  key={pax.id || idx}
                                  className={`transition-colors hover:bg-slate-50/70 ${hasBed ? 'bg-white' : 'bg-slate-50/40'}`}
                                >
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
                                        onChange={(e) => handleUpdatePassenger(idx, 'name', e.target.value)}
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

                                  {/* Bed Allocation */}
                                  <td className="py-2.5 px-2.5 border-r border-slate-100">
                                    <select
                                      value={hasBed ? 'yes' : 'no'}
                                      onChange={(e) => handleToggleBed(idx, e.target.value === 'yes')}
                                      className={`w-full px-2 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer outline-none ${
                                        hasBed
                                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                          : 'bg-slate-100 border-slate-300 text-slate-600'
                                      }`}
                                    >
                                      <option value="yes">Yes (Bed)</option>
                                      <option value="no">No Bed</option>
                                    </select>
                                  </td>

                                  {/* Delete Row */}
                                  <td className="py-2.5 px-2 text-center">
                                    <button
                                      type="button"
                                      disabled={paxList.length <= 1}
                                      onClick={() => handleRemovePassenger(idx)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                      title="Remove passenger"
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
                  )}
                </div>
              )}

              {/* TAB 3: 24-Hour Emergency (Helpline) Section */}
              {activeTab === 'EMERGENCY' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <h4 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-emerald-600" />
                      <span>24-Hour Emergency (Helpline) Contacts</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Specify the custom emergency numbers to be printed on the official accommodation voucher under the 24-Hour Emergency (Helpline) section.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-2xs">
                      <label className="block text-slate-700 font-bold text-xs uppercase tracking-wider">
                        KSA Ground Ops
                      </label>
                      <input
                        type="text"
                        value={emergencyKsaGround}
                        onChange={(e) => setEmergencyKsaGround(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
                        placeholder="+966 53 649 2846"
                      />
                      <span className="text-[10px] text-slate-400 block">Makkah Ground Operations Helpline</span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-2xs">
                      <label className="block text-slate-700 font-bold text-xs uppercase tracking-wider">
                        Madinah Helpline
                      </label>
                      <input
                        type="text"
                        value={emergencyMadinah}
                        onChange={(e) => setEmergencyMadinah(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
                        placeholder="+966 57 593 0550"
                      />
                      <span className="text-[10px] text-slate-400 block">Madinah Munawwarah Hotel Support</span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-2xs">
                      <label className="block text-slate-700 font-bold text-xs uppercase tracking-wider">
                        Pakistan Head Office
                      </label>
                      <input
                        type="text"
                        value={emergencyPkHeadOffice}
                        onChange={(e) => setEmergencyPkHeadOffice(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
                        placeholder="MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683"
                      />
                      <span className="text-[10px] text-slate-400 block">24/7 Agency Command Center</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 shrink-0">
                <div className="text-xs text-slate-500 font-semibold space-y-0.5">
                  <div>
                    <span>Itinerary: </span>
                    <span className="font-bold text-slate-800">{stays.map(s => s.city).join(' âž” ')}</span>
                    <span className="text-slate-400 ml-1">({totalNights} Nights)</span>
                  </div>
                  <div className="text-[11px]">
                    <span>Beds: </span>
                    <span className="font-bold text-emerald-700">{totalBedsCount} allocated</span>
                    <span className="text-slate-400"> for {paxList.length} passengers</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingVoucherId(null);
                    }}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold text-xs rounded-xl hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{editingVoucherId ? 'Save Voucher Changes' : 'Confirm & Generate Hotel Voucher'}</span>
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>,
        document.body
      )}

      {/* ============================================================== */}
      {/* DELETE CONFIRMATION MODAL WITH PASSWORD PROTECTION */}
      {/* ============================================================== */}
      {deletingVoucher && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden p-6 animate-in zoom-in-95 duration-150 space-y-4">
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Delete Hotel Voucher?
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {deletingVoucher.voucherNo || deletingVoucher.id} â€¢ {deletingVoucher.partyName}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-amber-50 border border-amber-200/80 rounded-xl p-3">
              This will permanently remove this hotel voucher and itinerary records from the database. Please enter the <strong>Admin Password</strong> to authorize deletion.
            </p>

            <form onSubmit={handleConfirmDelete} className="space-y-4 pt-1">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5 text-xs flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Admin Password *</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    autoFocus
                    required
                    placeholder="Enter admin password to confirm"
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      setDeleteError('');
                    }}
                    className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-600"
                  />
                </div>
                {deleteError && (
                  <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{deleteError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setDeletingVoucher(null);
                    setDeletePassword('');
                    setDeleteError('');
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold text-xs rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Voucher</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
