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
  Filter 
} from 'lucide-react';
import { saveParty } from '../../lib/erpData';

export default function PassengerManager({ parties = [], onPartiesUpdated }) {
  const [selectedPartyUid, setSelectedPartyUid] = useState(parties[0]?.partyHeadUid || 'ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPaxModal, setShowAddPaxModal] = useState(false);
  const [showNewPartyModal, setShowNewPartyModal] = useState(false);

  // New Pax Form State
  const [targetPartyUid, setTargetPartyUid] = useState(parties[0]?.partyHeadUid || '');
  const [paxName, setPaxName] = useState('');
  const [paxPrefix, setPaxPrefix] = useState('MR');
  const [paxPassport, setPaxPassport] = useState('');
  const [paxDob, setPaxDob] = useState('1990-01-01');
  const [paxGender, setPaxGender] = useState('M');
  const [paxCategory, setPaxCategory] = useState('Adult');
  const [paxHasBed, setPaxHasBed] = useState(true);
  const [paxVisa, setPaxVisa] = useState('');
  const [paxGroup, setPaxGroup] = useState('GRP-A');

  // New Party Form State
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyPhone, setNewPartyPhone] = useState('0311-2264567');
  const [newPackageTitle, setNewPackageTitle] = useState('18 Days Standard Umrah');

  // Filtered passengers
  const activeParty = parties.find(p => p.partyHeadUid === selectedPartyUid);
  
  const displayPassengers = parties.flatMap(party => {
    if (selectedPartyUid !== 'ALL' && party.partyHeadUid !== selectedPartyUid) return [];
    return (party.passengers || []).map(pax => ({
      ...pax,
      parentPartyUid: party.partyHeadUid,
      parentPartyName: party.partyName,
      parentPhone: party.contactPhone,
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

  const handleAddPassenger = (e) => {
    e.preventDefault();
    if (!paxName.trim()) {
      alert('Please enter passenger full legal name');
      return;
    }

    const party = parties.find(p => p.partyHeadUid === targetPartyUid);
    if (!party) {
      alert('Selected party head not found');
      return;
    }

    const newPax = {
      id: `pax-${party.partyHeadUid}-${Date.now().toString().slice(-4)}`,
      sNo: String((party.passengers?.length || 0) + 1),
      name: paxName.trim().toUpperCase(),
      prefix: paxPrefix,
      passportNo: paxPassport.trim().toUpperCase() || `PK${Math.floor(1000000 + Math.random() * 9000000)}`,
      dob: paxDob,
      gender: paxGender,
      category: paxCategory,
      hasBed: Boolean(paxHasBed),
      visaNo: paxVisa.trim() || `617${Math.floor(1000000 + Math.random() * 9000000)}`,
      groupNo: paxGroup || 'GRP-A',
      contactPhone: party.contactPhone || '0311-2264567',
    };

    party.passengers = party.passengers || [];
    party.passengers.push(newPax);
    party.totalPax = party.passengers.length;

    saveParty(party);
    if (onPartiesUpdated) onPartiesUpdated([...parties]);
    
    setShowAddPaxModal(false);
    setPaxName('');
    setPaxPassport('');
    setPaxVisa('');
  };

  const handleCreateNewParty = (e) => {
    e.preventDefault();
    if (!newPartyName.trim()) {
      alert('Please enter Family Head / Group Leader Name');
      return;
    }

    const newUid = `PHU-${String(parties.length + 1).padStart(4, '0')}`;
    const cleanName = newPartyName.trim().toUpperCase();

    const newParty = {
      partyHeadUid: newUid,
      voucherRefNo: `UB-${String(parties.length + 1).padStart(4, '0')}`,
      partyName: cleanName,
      companyName: 'NOOR E HARAM TRAVELS & TOURS',
      contactPhone: newPartyPhone.trim() || '0311-2264567',
      backupPhone: '0312-8039911',
      totalPax: 1,
      isSelfVisa: true,
      packageTitle: newPackageTitle,
      status: 'Active Operations',
      passengers: [
        {
          id: `pax-${newUid}-1`,
          sNo: '1',
          name: cleanName,
          prefix: 'MR',
          passportNo: `PK${Math.floor(1000000 + Math.random() * 9000000)}`,
          dob: '1988-06-12',
          gender: 'M',
          category: 'Adult',
          hasBed: true,
          visaNo: `617${Math.floor(1000000 + Math.random() * 9000000)}`,
          groupNo: 'GRP-1',
          contactPhone: newPartyPhone.trim(),
        }
      ],
      accommodations: [
        {
          id: `hotel-${newUid}-1`,
          city: 'Makkah',
          hotelName: 'VOCO 5 STAR',
          checkIn: '2026-10-10',
          checkOut: '2026-10-18',
          nights: 8,
          roomType: 'QUAD',
          roomsCount: 1,
          mealPlan: 'RO',
          hcn: `HCN-${Math.floor(100000 + Math.random() * 900000)}`,
          bookingRef: `BK-MAK-NEW`,
          hotelPhone: '+966 53 649 2846'
        },
        {
          id: `hotel-${newUid}-2`,
          city: 'Medinah',
          hotelName: 'GULNAR HV',
          checkIn: '2026-10-18',
          checkOut: '2026-10-27',
          nights: 9,
          roomType: 'QUAD',
          roomsCount: 1,
          mealPlan: 'RO',
          hcn: `HCN-${Math.floor(100000 + Math.random() * 900000)}`,
          bookingRef: `BK-MED-NEW`,
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
      transportHelpline: 'UBAID RAZA MEMON 0311-2264567 / BACKUP: MADNI RAZA MEMON 0312-8039911',
    };

    saveParty(newParty);
    if (onPartiesUpdated) onPartiesUpdated([newParty, ...parties]);

    setSelectedPartyUid(newUid);
    setShowNewPartyModal(false);
    setNewPartyName('');
  };

  return (
    <div className="space-y-4">
      
      {/* Module Title & Quick Action Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
              Module A
            </span>
            <h2 className="text-base sm:text-lg font-black text-emerald-950 uppercase">
              Unified Passenger &amp; Group Profile Manager
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict parent-child registry mapping all downstream vouchers &amp; manifests to <strong className="text-slate-800">Party Head UID</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewPartyModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold border border-slate-300 transition-all shadow-sm"
          >
            <Users className="w-3.5 h-3.5 text-slate-600" />
            <span>New Party Group</span>
          </button>

          <button
            onClick={() => {
              setTargetPartyUid(selectedPartyUid !== 'ALL' ? selectedPartyUid : (parties[0]?.partyHeadUid || ''));
              setShowAddPaxModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Add Pilgrim (PAX)</span>
          </button>
        </div>
      </div>

      {/* Filter and Selector Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Parent Party Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600 shrink-0">Filter by Party Head:</label>
          <select 
            value={selectedPartyUid}
            onChange={(e) => setSelectedPartyUid(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <option value="ALL">Show All Parties ({parties.length} Groups)</option>
            {parties.map(p => (
              <option key={p.partyHeadUid} value={p.partyHeadUid}>
                {p.partyHeadUid}: {p.partyName} ({p.passengers?.length || p.totalPax} PAX)
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search by name, passport #, visa #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>
      </div>

      {/* Spreadsheet-Style Passenger Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-emerald-950 text-white font-extrabold text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3 border-r border-emerald-900 w-12 text-center">#</th>
                <th className="py-2.5 px-3 border-r border-emerald-900">Parent Party Head</th>
                <th className="py-2.5 px-3 border-r border-emerald-900">Full Legal Name</th>
                <th className="py-2.5 px-3 border-r border-emerald-900">Valid Passport Hash</th>
                <th className="py-2.5 px-3 border-r border-emerald-900 text-center">DOB &amp; Gender</th>
                <th className="py-2.5 px-3 border-r border-emerald-900 text-center">Age Demographics</th>
                <th className="py-2.5 px-3 border-r border-emerald-900 text-center">Bed Allotment</th>
                <th className="py-2.5 px-3">Saudi Visa #</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans">
              {displayPassengers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium italic">
                    No passengers found matching your criteria.
                  </td>
                </tr>
              ) : (
                displayPassengers.map((pax, idx) => (
                  <tr key={pax.id || idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200">
                      <span className="font-mono font-bold text-emerald-800 block text-[10px]">
                        {pax.parentPartyUid}
                      </span>
                      <span className="font-bold text-slate-800 text-[10.5px] uppercase">
                        {pax.parentPartyName}
                      </span>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-black text-slate-900 uppercase">
                      {pax.prefix && <span className="text-slate-400 text-[10px] mr-1">{pax.prefix}</span>}
                      {pax.name}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-slate-700">
                      {pax.passportNo || '—'}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-600">
                      {pax.dob || '—'} ({pax.gender || 'M'})
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                        pax.category === 'Child'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : pax.category === 'Infant'
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}>
                        {pax.category || 'Adult'}
                      </span>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center">
                      <span className={`font-mono font-bold text-[9.5px] px-1.5 py-0.5 rounded ${
                        pax.hasBed !== false ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {pax.hasBed !== false ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-emerald-900">
                      {pax.visaNo || 'VERIFIED'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Pilgrim to Party */}
      {showAddPaxModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-black text-slate-900 text-sm uppercase">Add Pilgrim (PAX) to Group Manifest</h3>
              <button onClick={() => setShowAddPaxModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleAddPassenger} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Target Party Head UID *</label>
                <select 
                  value={targetPartyUid}
                  onChange={(e) => setTargetPartyUid(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 font-bold text-slate-800"
                >
                  {parties.map(p => (
                    <option key={p.partyHeadUid} value={p.partyHeadUid}>
                      {p.partyHeadUid}: {p.partyName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Prefix</label>
                  <select 
                    value={paxPrefix}
                    onChange={(e) => setPaxPrefix(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  >
                    <option value="MR">MR</option>
                    <option value="MRS">MRS</option>
                    <option value="MISS">MISS</option>
                    <option value="CHD">CHD</option>
                    <option value="INF">INF</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-600 font-bold mb-1">Full Legal Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. UBAID RAZA MEMON"
                    value={paxName}
                    onChange={(e) => setPaxName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Valid Passport #</label>
                  <input 
                    type="text" 
                    placeholder="e.g. PK8829102"
                    value={paxPassport}
                    onChange={(e) => setPaxPassport(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Date of Birth</label>
                  <input 
                    type="date" 
                    value={paxDob}
                    onChange={(e) => setPaxDob(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Demographics</label>
                  <select 
                    value={paxCategory}
                    onChange={(e) => setPaxCategory(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  >
                    <option value="Adult">Adult</option>
                    <option value="Child">Child</option>
                    <option value="Infant">Infant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Gender</label>
                  <select 
                    value={paxGender}
                    onChange={(e) => setPaxGender(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  >
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Bed Allocated?</label>
                  <select 
                    value={paxHasBed ? 'yes' : 'no'}
                    onChange={(e) => setPaxHasBed(e.target.value === 'yes')}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  >
                    <option value="yes">Yes (Bedded)</option>
                    <option value="no">No Bed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Saudi Umrah Visa #</label>
                <input 
                  type="text" 
                  placeholder="e.g. 6178829103"
                  value={paxVisa}
                  onChange={(e) => setPaxVisa(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddPaxModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold shadow"
                >
                  Save Pilgrim Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create New Party Group */}
      {showNewPartyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-black text-slate-900 text-sm uppercase">Create New Parent Party Group</h3>
              <button onClick={() => setShowNewPartyModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateNewParty} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Party Head / Lead Passenger Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. TAHIRA BEGUM"
                  value={newPartyName}
                  onChange={(e) => setNewPartyName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Contact Phone *</label>
                <input 
                  type="text" 
                  required
                  placeholder="03XX-XXXXXXX"
                  value={newPartyPhone}
                  onChange={(e) => setNewPartyPhone(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Package Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. 18 Days Standard Umrah"
                  value={newPackageTitle}
                  onChange={(e) => setNewPackageTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewPartyModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold shadow"
                >
                  Create Sovereign Party
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
