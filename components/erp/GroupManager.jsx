'use client';

import { useState, useMemo } from 'react';
import { 
  Users, 
  PlusCircle, 
  Search, 
  Edit3, 
  Trash2, 
  Phone, 
  Calendar, 
  MapPin, 
  Building2, 
  ExternalLink, 
  Crown, 
  CheckCircle2, 
  Clock, 
  Filter, 
  X, 
  Save, 
  Eye, 
  UserCheck, 
  AlertCircle,
  Hash,
  ShieldCheck,
  Plane,
  ArrowRight
} from 'lucide-react';
import { saveParty, deleteParty } from '../../lib/erpData';

export default function GroupManager({ 
  parties = [], 
  onPartiesUpdated,
  onNavigateToPassengers 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedGroupForView, setSelectedGroupForView] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Form state for Create / Edit Group
  const [formGroupName, setFormGroupName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formBackupPhone, setFormBackupPhone] = useState('');
  const [formPackageTitle, setFormPackageTitle] = useState('18 Days Standard Umrah');
  const [formVoucherRef, setFormVoucherRef] = useState('');
  const [formTotalPax, setFormTotalPax] = useState('1');
  const [formSelfVisa, setFormSelfVisa] = useState(true);

  // Statistics
  const totalGroups = parties.length;
  const totalPilgrims = useMemo(() => {
    return parties.reduce((acc, p) => acc + (p.passengers?.length || parseInt(p.totalPax) || 1), 0);
  }, [parties]);

  const averageGroupSize = useMemo(() => {
    if (!totalGroups) return 0;
    return (totalPilgrims / totalGroups).toFixed(1);
  }, [totalGroups, totalPilgrims]);

  // Filtered groups
  const filteredGroups = useMemo(() => {
    return parties.filter(p => {
      const q = searchTerm.toLowerCase().trim();
      const matchQuery = !q || 
        (p.partyName || '').toLowerCase().includes(q) ||
        (p.partyHeadUid || '').toLowerCase().includes(q) ||
        (p.voucherRefNo || '').toLowerCase().includes(q) ||
        (p.contactPhone || '').toLowerCase().includes(q) ||
        (p.packageTitle || '').toLowerCase().includes(q) ||
        (p.passengers || []).some(m => (m.name || '').toLowerCase().includes(q) || (m.passportNo || '').toLowerCase().includes(q));

      const matchStatus = statusFilter === 'ALL' || 
        (statusFilter === 'ACTIVE' && (p.status || '').toLowerCase().includes('active')) ||
        (statusFilter === 'COMPLETED' && (p.status || '').toLowerCase().includes('complet'));

      return matchQuery && matchStatus;
    });
  }, [parties, searchTerm, statusFilter]);

  // Open Create Modal
  const handleOpenCreate = () => {
    const nextNum = parties.length + 1;
    setEditingGroup(null);
    setFormGroupName('');
    setFormPhone('');
    setFormBackupPhone('');
    setFormPackageTitle('18 Days Standard Umrah');
    setFormVoucherRef(`UB-${String(nextNum).padStart(4, '0')}`);
    setFormTotalPax('2');
    setFormSelfVisa(true);
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (group) => {
    setEditingGroup(group);
    setFormGroupName(group.partyName || '');
    setFormPhone(group.contactPhone || '');
    setFormBackupPhone(group.backupPhone || '');
    setFormPackageTitle(group.packageTitle || '18 Days Standard Umrah');
    setFormVoucherRef(group.voucherRefNo || `UB-${String(parties.length + 1).padStart(4, '0')}`);
    setFormTotalPax(String(group.passengers?.length || group.totalPax || 1));
    setFormSelfVisa(group.isSelfVisa !== false);
    setShowCreateModal(true);
  };

  // Save (Create or Update) Group
  const handleSaveGroup = (e) => {
    e.preventDefault();
    const cleanName = formGroupName.trim().toUpperCase();
    if (!cleanName) {
      alert('Please enter a Group / Lead Pilgrim Name.');
      return;
    }

    const paxCount = parseInt(formTotalPax) || 1;

    if (editingGroup) {
      // Update existing group
      const updated = {
        ...editingGroup,
        partyName: cleanName,
        contactPhone: formPhone.trim(),
        backupPhone: formBackupPhone.trim(),
        packageTitle: formPackageTitle.trim(),
        voucherRefNo: formVoucherRef.trim(),
        isSelfVisa: formSelfVisa,
        totalPax: Math.max(paxCount, editingGroup.passengers?.length || 1),
        updatedAt: new Date().toISOString(),
      };

      // Also ensure lead passenger name matches if exists
      if (Array.isArray(updated.passengers) && updated.passengers.length > 0) {
        updated.passengers[0].name = cleanName;
      }

      saveParty(updated);
      if (onPartiesUpdated) {
        const nextParties = parties.map(p => p.partyHeadUid === updated.partyHeadUid ? updated : p);
        onPartiesUpdated(nextParties);
      }
    } else {
      // Create brand new group
      const newUid = `PHU-${String(Date.now()).slice(-4)}`;
      const now = new Date().toISOString();

      const synthesizedPax = [
        {
          id: `pax-${newUid}-1`,
          sNo: '1',
          name: cleanName,
          prefix: 'MR',
          passportNo: '',
          dob: '',
          gender: 'M',
          category: 'Adult',
          hasBed: true,
          visaNo: '',
          relationship: 'Head of Family',
          contactPhone: formPhone.trim(),
        }
      ];

      for (let i = 2; i <= paxCount; i++) {
        synthesizedPax.push({
          id: `pax-${newUid}-${i}`,
          sNo: String(i),
          name: `FAMILY MEMBER #${i}`,
          prefix: 'MR',
          passportNo: '',
          dob: '',
          gender: 'M',
          category: 'Adult',
          hasBed: true,
          visaNo: '',
          relationship: 'Family Member',
          contactPhone: formPhone.trim(),
        });
      }

      const newParty = {
        partyHeadUid: newUid,
        voucherRefNo: formVoucherRef.trim() || `UB-${String(parties.length + 1).padStart(4, '0')}`,
        partyName: cleanName,
        companyName: 'NOOR E HARAM TRAVELS & TOURS',
        contactPhone: formPhone.trim(),
        backupPhone: formBackupPhone.trim(),
        totalPax: paxCount,
        isSelfVisa: formSelfVisa,
        packageTitle: formPackageTitle.trim(),
        status: 'Active Operations',
        createdAt: now,
        updatedAt: now,
        passengers: synthesizedPax,
        accommodations: [],
        transports: [],
        flights: [],
      };

      saveParty(newParty);
      if (onPartiesUpdated) {
        onPartiesUpdated([newParty, ...parties]);
      }
    }

    setShowCreateModal(false);
  };

  // Confirm Delete Group
  const handleConfirmDelete = (e) => {
    e.preventDefault();
    if (!deletingGroup) return;

    const pwd = (deletePassword || '').trim();
    if (pwd !== 'Noor@.5923' && pwd !== 'Cheepa@2026') {
      setDeleteError('Incorrect admin password. Deletion cancelled.');
      return;
    }

    deleteParty(deletingGroup.partyHeadUid);
    const updated = parties.filter(p => p.partyHeadUid !== deletingGroup.partyHeadUid);
    if (onPartiesUpdated) {
      onPartiesUpdated(updated);
    }

    setDeletingGroup(null);
    setDeletePassword('');
    setDeleteError('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
              Module A1
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Family &amp; Group Manifests
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize pilgrim family groups, party head UIDs, travel packages, and voucher references.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Create Group</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Groups</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalGroups}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Sovereign family units</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Pilgrims</span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {totalPilgrims} PAX
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Registered under all active groups</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Group Size</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {averageGroupSize} Pax / Group
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Travel density distribution</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search group name, UID, UB#, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'All Groups' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Group Ref &amp; UID</th>
                <th className="py-3 px-4">Group / Lead Pilgrim</th>
                <th className="py-3 px-4">Members</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Package Title</th>
                <th className="py-3 px-4">Accommodations</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGroups.map(group => {
                const paxList = group.passengers || [];
                const paxCount = paxList.length || parseInt(group.totalPax) || 1;
                const hotels = group.accommodations || [];

                return (
                  <tr key={group.partyHeadUid} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-slate-900">
                        {group.voucherRefNo || group.partyHeadUid}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {group.partyHeadUid}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 uppercase flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{group.partyName}</span>
                      </div>
                      {group.isSelfVisa && (
                        <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                          Self-Visa Client
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => setSelectedGroupForView(group)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
                        title="Click to view all passengers in this group"
                      >
                        <Users className="w-3 h-3 text-emerald-600" />
                        <span>{paxCount} PAX</span>
                        <Eye className="w-3 h-3 text-slate-400" />
                      </button>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      <div>{group.contactPhone || 'â€”'}</div>
                      {group.backupPhone && (
                        <div className="text-[10px] text-slate-400">{group.backupPhone}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-800 font-medium">
                      {group.packageTitle || 'Standard Umrah Package'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                      {hotels.length > 0 ? (
                        <div className="flex items-center gap-1 truncate max-w-[180px]" title={hotels.map(h => h.hotelName).join(' â€¢ ')}>
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{hotels.map(h => h.hotelName).filter(Boolean).join(' â€¢ ')}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No hotels linked</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {group.status || 'Active Operations'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(group)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                          title="Edit Group Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeletingGroup(group)}
                          className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                          title="Delete Group"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredGroups.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="font-semibold text-slate-600 text-sm">No family groups found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {searchTerm ? 'No results matched your search query.' : 'Create your first group using the button above.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: CREATE / EDIT GROUP                              */}
      {/* ========================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-900" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingGroup ? 'Edit Family Group' : 'Create New Family Group'}
                </h3>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Group / Lead Pilgrim Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABDUL KARIM"
                  value={formGroupName}
                  onChange={(e) => setFormGroupName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Voucher Ref # (UB)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UB-0001"
                    value={formVoucherRef}
                    onChange={(e) => setFormVoucherRef(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Total Passengers (PAX) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formTotalPax}
                    onChange={(e) => setFormTotalPax(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Primary Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0311-2264567"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Backup Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0312-8039911"
                    value={formBackupPhone}
                    onChange={(e) => setFormBackupPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Package Title / Duration
                </label>
                <input
                  type="text"
                  placeholder="e.g. 18 Days Standard Umrah"
                  value={formPackageTitle}
                  onChange={(e) => setFormPackageTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formSelfVisa"
                  checked={formSelfVisa}
                  onChange={(e) => setFormSelfVisa(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="formSelfVisa" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Self-Visa Package (Pilgrim processes their own electronic visa)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {editingGroup ? 'Save Group Changes' : 'Confirm & Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: VIEW GROUP PASSENGERS MANIFEST                   */}
      {/* ========================================================= */}
      {selectedGroupForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedGroupForView.voucherRefNo || selectedGroupForView.partyHeadUid}
                </span>
                <h3 className="font-black text-lg text-slate-900 uppercase mt-1">
                  {selectedGroupForView.partyName}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedGroupForView.packageTitle} â€¢ Phone: {selectedGroupForView.contactPhone || 'N/A'}
                </p>
              </div>

              <button 
                onClick={() => setSelectedGroupForView(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Passengers Manifest List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Pilgrims in Group ({(selectedGroupForView.passengers || []).length} PAX)</span>
                {onNavigateToPassengers && (
                  <button
                    onClick={() => {
                      const uid = selectedGroupForView.partyHeadUid;
                      setSelectedGroupForView(null);
                      onNavigateToPassengers(uid);
                    }}
                    className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Manage in Passengers Module</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                {(selectedGroupForView.passengers || []).map((pax, idx) => (
                  <div key={pax.id || idx} className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px]">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 uppercase flex items-center gap-1.5">
                          {idx === 0 && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                          <span>{pax.prefix ? `${pax.prefix}. ` : ''}{pax.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Passport: <span className="font-bold text-slate-700">{pax.passportNo || 'Pending'}</span> â€¢ Category: {pax.category || 'Adult'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {pax.relationship || (idx === 0 ? 'Head of Family' : 'Member')}
                      </span>
                      {pax.hasBed !== false && (
                        <div className="text-[9.5px] text-emerald-700 font-semibold mt-0.5">
                          Bed Assigned
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedGroupForView(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
              >
                Close Manifest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: DELETE CONFIRMATION                              */}
      {/* ========================================================= */}
      {deletingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-slate-900">Delete Family Group</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete group <strong className="text-slate-900">{deletingGroup.partyName}</strong> ({deletingGroup.partyHeadUid}) and all associated pilgrims? This action cannot be undone.
            </p>

            <form onSubmit={handleConfirmDelete} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Enter Admin Password to Confirm
                </label>
                <input
                  type="password"
                  autoFocus
                  placeholder="Admin password..."
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
                {deleteError && (
                  <p className="text-[11px] font-bold text-red-600 mt-1">{deleteError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeletingGroup(null);
                    setDeletePassword('');
                    setDeleteError('');
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Delete Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
