'use client';

import { useState } from 'react';
import { 
  Users, 
  PlusCircle, 
  Search, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  UserCheck, 
  Calendar, 
  MapPin, 
  Hash, 
  CreditCard, 
  Check, 
  Filter,
  UserPlus,
  Crown,
  Heart,
  Baby,
  User,
  X,
  Sparkles
} from 'lucide-react';
import { saveParty, deleteParty, deletePassenger } from '../../lib/erpData';

export default function PassengerManager({ parties = [], onPartiesUpdated }) {
  const [selectedPartyUid, setSelectedPartyUid] = useState(parties[0]?.partyHeadUid || 'ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Unified Family & Passenger Builder Modal State
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [modalMode, setModalMode] = useState('NEW_FAMILY'); // 'NEW_FAMILY' | 'ADD_TO_EXISTING'
  const [targetPartyUid, setTargetPartyUid] = useState(parties[0]?.partyHeadUid || '');

  // Family Group Information
  const [familyName, setFamilyName] = useState('');
  const [familyPhone, setFamilyPhone] = useState('0311-2324764');
  const [packageTitle, setPackageTitle] = useState('18 Days Standard Umrah');

  // Dynamic Multi-Passenger Family Members Array
  const createDefaultHeadMember = () => ({
    id: `pax-head-${Date.now()}`,
    isHead: true,
    relationship: 'Family Head / Lead Pilgrim',
    prefix: 'MR',
    name: '',
    passportNo: '',
    dob: '1985-06-15',
    gender: 'M',
    category: 'Adult', // Adult | Child | Infant
    hasBed: true,
    visaNo: '',
  });

  const createDefaultAdditionalMember = (rel = 'Family Member', pref = 'MRS', gen = 'F') => ({
    id: `pax-member-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
    isHead: false,
    relationship: rel,
    prefix: pref,
    name: '',
    passportNo: '',
    dob: '1990-01-01',
    gender: gen,
    category: 'Adult',
    hasBed: true,
    visaNo: '',
  });

  const [familyMembers, setFamilyMembers] = useState([createDefaultHeadMember()]);

  // Open modal in New Family mode
  const openNewFamilyModal = () => {
    setModalMode('NEW_FAMILY');
    setFamilyName('');
    setFamilyPhone('0311-2324764');
    setPackageTitle('18 Days Standard Umrah');
    setFamilyMembers([createDefaultHeadMember()]);
    setShowFamilyModal(true);
  };

  // Open modal in Add to Existing Family mode
  const openAddToExistingModal = (partyUid) => {
    const activeUid = partyUid || (selectedPartyUid !== 'ALL' ? selectedPartyUid : parties[0]?.partyHeadUid);
    setTargetPartyUid(activeUid);
    setModalMode('ADD_TO_EXISTING');
    setFamilyMembers([createDefaultAdditionalMember('Family Member', 'MRS', 'F')]);
    setShowFamilyModal(true);
  };

  // Add another family member row
  const handleAddMember = () => {
    setFamilyMembers([
      ...familyMembers,
      createDefaultAdditionalMember('Family Member', 'MRS', 'F')
    ]);
  };

  // Remove member row
  const handleRemoveMemberRow = (index) => {
    if (modalMode === 'NEW_FAMILY' && index === 0) {
      alert('The Family Head row cannot be removed. You can modify their name and details instead.');
      return;
    }
    if (familyMembers.length <= 1) {
      alert('At least one passenger must be specified.');
      return;
    }
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  // Update member field
  const handleUpdateMember = (index, field, value) => {
    const updated = [...familyMembers];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-align gender with prefix
    if (field === 'prefix') {
      if (value === 'MRS' || value === 'MS') {
        updated[index].gender = 'F';
      } else if (value === 'MR' || value === 'MSTR') {
        updated[index].gender = 'M';
      }
    }

    // Auto-align bed default with category
    if (field === 'category') {
      if (value === 'Infant') {
        updated[index].hasBed = false;
        if (!updated[index].prefix || updated[index].prefix === 'MR') updated[index].prefix = 'INF';
      } else if (value === 'Child') {
        updated[index].hasBed = true;
        if (updated[index].prefix === 'MR') updated[index].prefix = 'MSTR';
      }
    }

    // If updating row 0 name in NEW_FAMILY, mirror to familyName if familyName is empty
    if (index === 0 && field === 'name' && modalMode === 'NEW_FAMILY') {
      if (!familyName || familyName.startsWith('FAM -') || familyName === updated[0].name.slice(0, -1)) {
        setFamilyName(value);
      }
    }

    setFamilyMembers(updated);
  };

  // Submit Family Manifest
  const handleSaveFamilyManifest = (e) => {
    e.preventDefault();

    // Validate that all passengers have names
    for (let i = 0; i < familyMembers.length; i++) {
      if (!familyMembers[i].name.trim()) {
        alert(`Please enter full legal name for Passenger #${i + 1}`);
        return;
      }
    }

    if (modalMode === 'NEW_FAMILY') {
      const headName = familyMembers[0].name.trim().toUpperCase();
      const resolvedFamilyName = (familyName.trim() || headName).toUpperCase();

      const newUid = `PHU-${String(parties.length + 1).padStart(4, '0')}`;
      const now = new Date().toISOString();

      const synthesizedPax = familyMembers.map((m, idx) => ({
        id: `pax-${newUid}-${idx + 1}`,
        sNo: String(idx + 1),
        name: m.name.trim().toUpperCase(),
        prefix: m.prefix,
        passportNo: m.passportNo.trim().toUpperCase() || `PK${Math.floor(1000000 + Math.random() * 9000000)}`,
        dob: m.dob || '1990-01-01',
        gender: m.gender || 'M',
        category: m.category || 'Adult',
        hasBed: Boolean(m.hasBed),
        visaNo: m.visaNo.trim() || `617${Math.floor(1000000 + Math.random() * 9000000)}`,
        relationship: m.relationship || (idx === 0 ? 'Family Head' : 'Family Member'),
        contactPhone: familyPhone.trim(),
      }));

      const newParty = {
        partyHeadUid: newUid,
        voucherRefNo: `UB-${String(parties.length + 1).padStart(4, '0')}`,
        partyName: resolvedFamilyName,
        companyName: 'CHEEPA FJ TRAVELS',
        contactPhone: familyPhone.trim() || '0311-2324764',
        backupPhone: '0312-3608683',
        totalPax: synthesizedPax.length,
        isSelfVisa: true,
        packageTitle: packageTitle.trim() || '18 Days Standard Umrah',
        status: 'Active Operations',
        createdAt: now,
        updatedAt: now,
        passengers: synthesizedPax,
        accommodations: [
          {
            id: `hotel-${newUid}-1`,
            city: 'Makkah',
            hotelName: 'VOCO 5 STAR',
            checkIn: '2026-10-10',
            checkOut: '2026-10-18',
            nights: 8,
            roomType: synthesizedPax.length >= 4 ? 'QUAD' : synthesizedPax.length === 3 ? 'TRIPLE' : 'DOUBLE',
            roomsCount: 1,
            mealPlan: 'RO',
            hcn: `HCN-${Math.floor(100000 + Math.random() * 900000)}`,
            bookingRef: `BK-MAK-${newUid}`,
            hotelPhone: '+966 53 649 2846'
          },
          {
            id: `hotel-${newUid}-2`,
            city: 'Medinah',
            hotelName: 'GULNAR HV',
            checkIn: '2026-10-18',
            checkOut: '2026-10-27',
            nights: 9,
            roomType: synthesizedPax.length >= 4 ? 'QUAD' : synthesizedPax.length === 3 ? 'TRIPLE' : 'DOUBLE',
            roomsCount: 1,
            mealPlan: 'RO',
            hcn: `HCN-${Math.floor(100000 + Math.random() * 900000)}`,
            bookingRef: `BK-MED-${newUid}`,
            hotelPhone: '+966 57 593 0550'
          }
        ],
        transports: [
          { date: '2026-10-10', service: 'JED AIRPORT TO MAKKAH HOTEL', transporter: 'Private Transport', vehicleType: 'STARIA' },
          { date: '2026-10-18', service: 'MAKKAH HOTEL TO MADINAH HOTEL', transporter: 'Private Transport', vehicleType: 'STARIA' },
          { date: '2026-10-27', service: 'MADINAH HOTEL TO MADINAH AIRPORT', transporter: 'Private Transport', vehicleType: 'STARIA' }
        ],
        flights: [
          { type: 'Departure', date: '2026-10-10', flight: 'FZ-831', sector: 'DXB-JED', departure: '04:50', arrival: '06:50', pnr: '—' },
          { type: 'Return', date: '2026-10-27', flight: 'FZ-898', sector: 'MED-DXB', departure: '04:00', arrival: '07:30', pnr: '—' }
        ],
        transportHelpline: 'MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683',
      };

      saveParty(newParty);
      const updatedParties = [newParty, ...parties];
      if (onPartiesUpdated) onPartiesUpdated(updatedParties);
      setSelectedPartyUid(newUid);

    } else {
      // ADD_TO_EXISTING Mode
      const party = parties.find(p => p.partyHeadUid === targetPartyUid);
      if (!party) {
        alert('Selected family group not found');
        return;
      }

      party.passengers = party.passengers || [];
      const currentCount = party.passengers.length;

      familyMembers.forEach((m, idx) => {
        const newPax = {
          id: `pax-${party.partyHeadUid}-${currentCount + idx + 1}`,
          sNo: String(currentCount + idx + 1),
          name: m.name.trim().toUpperCase(),
          prefix: m.prefix,
          passportNo: m.passportNo.trim().toUpperCase() || `PK${Math.floor(1000000 + Math.random() * 9000000)}`,
          dob: m.dob || '1990-01-01',
          gender: m.gender || 'M',
          category: m.category || 'Adult',
          hasBed: Boolean(m.hasBed),
          visaNo: m.visaNo.trim() || `617${Math.floor(1000000 + Math.random() * 9000000)}`,
          relationship: m.relationship || 'Family Member',
          contactPhone: party.contactPhone || '0311-2324764',
        };
        party.passengers.push(newPax);
      });

      party.totalPax = party.passengers.length;
      saveParty(party);
      if (onPartiesUpdated) onPartiesUpdated([...parties]);
      setSelectedPartyUid(party.partyHeadUid);
    }

    setShowFamilyModal(false);
  };

  // Delete Individual Passenger
  const handleDeletePassenger = (partyHeadUid, paxId, paxName) => {
    if (!window.confirm(`Are you sure you want to remove ${paxName} from this manifest?`)) return;
    const updated = deletePassenger(partyHeadUid, paxId);
    if (onPartiesUpdated) onPartiesUpdated(updated);
  };

  // Filtered passengers
  const displayPassengers = parties.flatMap(party => {
    if (selectedPartyUid !== 'ALL' && party.partyHeadUid !== selectedPartyUid) return [];
    return (party.passengers || []).map((pax, idx) => ({
      ...pax,
      isPartyHead: idx === 0,
      parentPartyUid: party.partyHeadUid,
      parentPartyName: party.partyName,
      parentPhone: party.contactPhone,
      packageTitle: party.packageTitle,
    }));
  }).filter(pax => {
    const q = searchTerm.toLowerCase();
    return (
      (pax.name || '').toLowerCase().includes(q) ||
      (pax.passportNo || '').toLowerCase().includes(q) ||
      (pax.visaNo || '').toLowerCase().includes(q) ||
      (pax.parentPartyName || '').toLowerCase().includes(q) ||
      (pax.parentPartyUid || '').toLowerCase().includes(q)
    );
  });

  // Dynamic Demographics Count inside Modal
  const modalSummary = familyMembers.reduce((acc, curr) => {
    acc.total++;
    if (curr.category === 'Child') acc.children++;
    else if (curr.category === 'Infant') acc.infants++;
    else acc.adults++;
    return acc;
  }, { total: 0, adults: 0, children: 0, infants: 0 });

  return (
    <div className="space-y-4">
      
      {/* Module Title & Family Action Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
              Module A
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Unified Passenger &amp; Group Profile Manager
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage single pilgrims or multi-dependent family groups anchored to a <strong className="text-slate-700">Party Head UID</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Add More to Selected Family (if a family is active) */}
          {selectedPartyUid !== 'ALL' && (
            <button
              onClick={() => openAddToExistingModal(selectedPartyUid)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200/90 transition-all shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
              <span>+ Add to this Family</span>
            </button>
          )}

          {/* Primary Action: Add Family / Manifest */}
          <button
            onClick={openNewFamilyModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95"
          >
            <Users className="w-3.5 h-3.5 text-slate-300" />
            <span>Add Family / Passenger Manifest</span>
          </button>
        </div>
      </div>

      {/* Filter and Selector Controls */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Parent Party Dropdown */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-semibold text-slate-500 shrink-0">Family Group Filter:</label>
          <select 
            value={selectedPartyUid}
            onChange={(e) => setSelectedPartyUid(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50/70 text-slate-800 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          >
            <option value="ALL">All Family Groups ({parties.length} Manifests)</option>
            {parties.map(p => (
              <option key={p.partyHeadUid} value={p.partyHeadUid}>
                {p.partyHeadUid}: {p.partyName} ({p.passengers?.length || p.totalPax} PAX)
              </option>
            ))}
          </select>

          {selectedPartyUid !== 'ALL' && (
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {parties.find(p => p.partyHeadUid === selectedPartyUid)?.passengers?.length || 0} Family Members
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search by name, passport #, visa #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Modern Light Passenger Matrix Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-3 px-3.5 border-r border-slate-100 w-12 text-center">#</th>
                <th className="py-3 px-3.5 border-r border-slate-100">Parent Family Group</th>
                <th className="py-3 px-3.5 border-r border-slate-100">Role / Status</th>
                <th className="py-3 px-3.5 border-r border-slate-100">Full Legal Name</th>
                <th className="py-3 px-3.5 border-r border-slate-100">Passport #</th>
                <th className="py-3 px-3.5 border-r border-slate-100 text-center">DOB &amp; Gender</th>
                <th className="py-3 px-3.5 border-r border-slate-100 text-center">Demographics</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {displayPassengers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 font-medium italic">
                    No passenger records found. Click "Add Family / Passenger Manifest" above to create one.
                  </td>
                </tr>
              ) : (
                displayPassengers.map((pax, idx) => (
                  <tr key={pax.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-center font-mono font-semibold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100">
                      <span className="font-mono font-bold text-slate-900 block text-[10px]">
                        {pax.parentPartyUid}
                      </span>
                      <span className="font-semibold text-slate-700 text-xs">
                        {pax.parentPartyName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100">
                      {pax.isPartyHead ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <Crown className="w-2.5 h-2.5 text-amber-600" />
                          Family Head
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          <Users className="w-2.5 h-2.5 text-slate-400" />
                          {pax.relationship || 'Dependent'}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-bold text-slate-900">
                      {pax.prefix && <span className="text-slate-400 text-[10px] mr-1">{pax.prefix}</span>}
                      {pax.name}
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono font-semibold text-slate-700">
                      {pax.passportNo || '—'}
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-center font-mono text-slate-500">
                      {pax.dob || '—'} ({pax.gender || 'M'})
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                        pax.category === 'Child'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : pax.category === 'Infant'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {pax.category || 'Adult'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openAddToExistingModal(pax.parentPartyUid)}
                          title="Add family member to this group"
                          className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePassenger(pax.parentPartyUid, pax.id, pax.name)}
                          title="Remove passenger from manifest"
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* UNIFIED FAMILY & PASSENGER MANIFEST BUILDER MODAL */}
      {/* ============================================================== */}
      {showFamilyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full p-5 sm:p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-6">
            
            {/* Modal Header & Mode Switcher */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                    Family Manifest Builder
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-600">
                    {modalMode === 'NEW_FAMILY' ? 'Create Single Head or Family Group' : 'Add Members to Existing Family'}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  {modalMode === 'NEW_FAMILY' ? 'Add Family / Group Manifest' : 'Add Family Members to Group'}
                </h3>
              </div>

              <button 
                onClick={() => setShowFamilyModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() => {
                  setModalMode('NEW_FAMILY');
                  if (familyMembers.length === 0) setFamilyMembers([createDefaultHeadMember()]);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  modalMode === 'NEW_FAMILY'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                1. New Family / Group Manifest
              </button>
              
              {parties.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setModalMode('ADD_TO_EXISTING');
                    setTargetPartyUid(selectedPartyUid !== 'ALL' ? selectedPartyUid : parties[0]?.partyHeadUid);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    modalMode === 'ADD_TO_EXISTING'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  2. Add to Existing Family ({parties.length} available)
                </button>
              )}
            </div>

            <form onSubmit={handleSaveFamilyManifest} className="space-y-5">
              
              {/* GROUP LEVEL SETTINGS */}
              {modalMode === 'NEW_FAMILY' ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Family / Group Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. ABDUL KARIM & FAMILY"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl uppercase text-slate-900 font-semibold focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Will be saved as Party Head UID name</p>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Contact Phone *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="03XX-XXXXXXX"
                      value={familyPhone}
                      onChange={(e) => setFamilyPhone(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Lead traveler WhatsApp / Phone</p>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Package Title
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. 18 Days Standard Umrah"
                      value={packageTitle}
                      onChange={(e) => setPackageTitle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Standard or Executive package</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex-1">
                    <label className="block text-slate-700 font-semibold mb-1">
                      Select Target Family Group *
                    </label>
                    <select
                      value={targetPartyUid}
                      onChange={(e) => setTargetPartyUid(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    >
                      {parties.map(p => (
                        <option key={p.partyHeadUid} value={p.partyHeadUid}>
                          {p.partyHeadUid}: {p.partyName} ({p.passengers?.length || p.totalPax} existing members)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-xs text-slate-500 sm:text-right">
                    <span>New members will be added directly into this family manifest.</span>
                  </div>
                </div>
              )}

              {/* FAMILY MEMBERS / PASSENGERS BUILDER (DYNAMIC MULTI-ROW) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">
                      Family Members &amp; Pilgrims ({familyMembers.length} PAX)
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Fill Head only for single passenger, or add family members below
                    </span>
                  </div>

                  {/* Add Member Quick Button */}
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all active:scale-95"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-slate-300" />
                    <span>+ Add Family Member</span>
                  </button>
                </div>

                {/* List of Member Cards */}
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {familyMembers.map((member, index) => {
                    const isHeadRow = modalMode === 'NEW_FAMILY' && index === 0;

                    return (
                      <div 
                        key={member.id || index}
                        className={`p-4 rounded-2xl border transition-all ${
                          isHeadRow 
                            ? 'bg-emerald-50/40 border-emerald-200/90 shadow-2xs' 
                            : 'bg-white border-slate-200 shadow-2xs'
                        }`}
                      >
                        {/* Member Header */}
                        <div className="flex items-center justify-between mb-2.5 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                              {index + 1}
                            </span>
                            {isHeadRow ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                                <Crown className="w-3 h-3 text-emerald-600" />
                                Family Head / Lead Pilgrim (Single or Group)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                <Users className="w-3 h-3 text-slate-500" />
                                Family Member / Dependent #{index + 1}
                              </span>
                            )}
                          </div>

                          {!isHeadRow && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMemberRow(index)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                              title="Remove passenger"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Fields Grid (Clean 6-Field Layout: No Bed, No Visa #) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs">
                          {/* Prefix */}
                          <div className="col-span-1">
                            <label className="block text-slate-500 text-[10px] font-semibold mb-1">Prefix</label>
                            <select
                              value={member.prefix}
                              onChange={(e) => handleUpdateMember(index, 'prefix', e.target.value)}
                              className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-slate-900"
                            >
                              <option value="MR">MR</option>
                              <option value="MRS">MRS</option>
                              <option value="MS">MS</option>
                              <option value="MSTR">MSTR</option>
                              <option value="CHD">CHD</option>
                              <option value="INF">INF</option>
                            </select>
                          </div>

                          {/* Full Name */}
                          <div className="col-span-1 sm:col-span-2 md:col-span-2">
                            <label className="block text-slate-500 text-[10px] font-semibold mb-1">
                              Full Legal Name *
                            </label>
                            <input 
                              type="text"
                              required
                              placeholder="e.g. ABDUL KARIM"
                              value={member.name}
                              onChange={(e) => handleUpdateMember(index, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white uppercase font-bold text-slate-900 outline-none focus:ring-1 focus:ring-slate-900"
                            />
                          </div>

                          {/* Passport Number */}
                          <div className="col-span-1 sm:col-span-1 md:col-span-1">
                            <label className="block text-slate-500 text-[10px] font-semibold mb-1">Passport #</label>
                            <input 
                              type="text"
                              placeholder="e.g. PK9928172"
                              value={member.passportNo}
                              onChange={(e) => handleUpdateMember(index, 'passportNo', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white uppercase font-mono text-slate-800 outline-none focus:ring-1 focus:ring-slate-900"
                            />
                          </div>

                          {/* Demographics Category */}
                          <div className="col-span-1 sm:col-span-1 md:col-span-1">
                            <label className="block text-slate-500 text-[10px] font-semibold mb-1">Demographics</label>
                            <select
                              value={member.category}
                              onChange={(e) => handleUpdateMember(index, 'category', e.target.value)}
                              className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-slate-900"
                            >
                              <option value="Adult">Adult</option>
                              <option value="Child">Child</option>
                              <option value="Infant">Infant</option>
                            </select>
                          </div>

                          {/* Date of Birth & Gender */}
                          <div className="col-span-1 sm:col-span-1 md:col-span-1">
                            <label className="block text-slate-500 text-[10px] font-semibold mb-1">DOB &amp; Gender</label>
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="date"
                                value={member.dob}
                                onChange={(e) => handleUpdateMember(index, 'dob', e.target.value)}
                                className="w-full px-2 py-2 border border-slate-200 rounded-xl bg-white font-mono text-slate-800 text-[11px] outline-none"
                              />
                              <select
                                value={member.gender}
                                onChange={(e) => handleUpdateMember(index, 'gender', e.target.value)}
                                className="px-2 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800 outline-none"
                              >
                                <option value="M">M</option>
                                <option value="F">F</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add More Button Row */}
                <div className="flex items-center justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-dashed border-slate-300 transition-all shadow-2xs hover:border-slate-400"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                    <span>+ Add Another Family Member</span>
                  </button>
                </div>
              </div>

              {/* LIVE DEMOGRAPHIC SUMMARY & ACTION FOOTER */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold text-slate-900">
                    Manifest Summary:
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 font-semibold text-slate-800">
                    Total: <strong>{modalSummary.total} PAX</strong>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                    Adults: <strong>{modalSummary.adults}</strong>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-amber-700">
                    Children: <strong>{modalSummary.children}</strong>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-blue-700">
                    Infants: <strong>{modalSummary.infants}</strong>
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowFamilyModal(false)}
                    className="px-3.5 py-2 text-slate-600 hover:text-slate-800 font-semibold text-xs"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {modalMode === 'NEW_FAMILY'
                        ? (familyMembers.length === 1 
                            ? 'Save Single Passenger Manifest (1 PAX)' 
                            : `Save Family Manifest (${familyMembers.length} PAX)`)
                        : `Add ${familyMembers.length} Member(s) to Family`}
                    </span>
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
