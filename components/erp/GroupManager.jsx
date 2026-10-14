'use client';

import { useState, useMemo } from 'react';
import { 
  Users, 
  PlusCircle, 
  Search, 
  Edit3, 
  Trash2, 
  Phone, 
  ExternalLink, 
  CheckCircle2, 
  Filter, 
  X, 
  Save, 
  Eye, 
  UserCheck, 
  Hash, 
  Printer, 
  UserPlus, 
  Check, 
  ChevronDown,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { saveGroup, deleteGroup, getNextGidNumber } from '../../lib/erpData';

export default function GroupManager({ 
  groups = [], 
  parties = [], 
  onGroupsUpdated,
  onNavigateToPassengers 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupForView, setSelectedGroupForView] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(null);

  // Form State
  const [formGidNumber, setFormGidNumber] = useState('');
  const [formGroupName, setFormGroupName] = useState('');
  const [formFamilies, setFormFamilies] = useState([]);
  const [formError, setFormError] = useState('');

  // Statistics
  const totalGroups = groups.length;
  const totalPilgrims = useMemo(() => {
    return groups.reduce((acc, g) => acc + (parseInt(g.totalPax, 10) || 0), 0);
  }, [groups]);

  const averageGroupSize = useMemo(() => {
    if (totalGroups === 0) return 0;
    return (totalPilgrims / totalGroups).toFixed(1);
  }, [totalGroups, totalPilgrims]);

  // Live Dynamic Passenger Count in Modal
  const calculatedTotalPax = useMemo(() => {
    return formFamilies.reduce((acc, fam) => {
      if (Array.isArray(fam.selectedPassengerIds) && fam.selectedPassengerIds.length > 0) {
        return acc + fam.selectedPassengerIds.length;
      }
      return acc + (parseInt(fam.pax, 10) || 0);
    }, 0);
  }, [formFamilies]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingGroup(null);
    setFormGidNumber(getNextGidNumber());
    setFormGroupName('');
    setFormError('');
    // Start with 1 empty family row
    setFormFamilies([
      {
        id: `fam_${Date.now()}_1`,
        partyHeadUid: '',
        familyName: '',
        pax: 1,
        selectedPassengerIds: [],
        selectAll: true,
        isCustom: false,
      }
    ]);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (group) => {
    setEditingGroup(group);
    const match = (group.gid || '').replace(/^GID-?/i, '');
    setFormGidNumber(match || group.gid || '');
    setFormGroupName(group.groupName || '');
    setFormError('');
    
    // Pre-populate families
    if (Array.isArray(group.families) && group.families.length > 0) {
      setFormFamilies(group.families.map((f, idx) => ({
        id: f.id || `fam_${Date.now()}_${idx}`,
        partyHeadUid: f.partyHeadUid || '',
        familyName: f.familyName || '',
        pax: f.pax || 1,
        selectedPassengerIds: f.selectedPassengerIds || [],
        selectAll: f.selectAll !== false,
        isCustom: f.isCustom || false,
      })));
    } else {
      setFormFamilies([
        {
          id: `fam_${Date.now()}_1`,
          partyHeadUid: '',
          familyName: group.groupName || 'Family 1',
          pax: group.totalPax || 1,
          selectedPassengerIds: [],
          selectAll: true,
          isCustom: true,
        }
      ]);
    }
    setShowModal(true);
  };

  // Add another family row
  const handleAddFamilyRow = () => {
    setFormFamilies(prev => [
      ...prev,
      {
        id: `fam_${Date.now()}_${prev.length + 1}`,
        partyHeadUid: '',
        familyName: '',
        pax: 1,
        selectedPassengerIds: [],
        selectAll: true,
        isCustom: false,
      }
    ]);
  };

  // Remove a family row
  const handleRemoveFamilyRow = (famId) => {
    if (formFamilies.length <= 1) {
      // Keep at least one row, just reset it
      setFormFamilies([
        {
          id: `fam_${Date.now()}_1`,
          partyHeadUid: '',
          familyName: '',
          pax: 1,
          selectedPassengerIds: [],
          selectAll: true,
          isCustom: false,
        }
      ]);
      return;
    }
    setFormFamilies(prev => prev.filter(f => f.id !== famId));
  };

  // Change family selection
  const handleFamilyPartyChange = (famId, partyHeadUid) => {
    setFormFamilies(prev => prev.map(fam => {
      if (fam.id !== famId) return fam;

      if (!partyHeadUid || partyHeadUid === '__CUSTOM__') {
        return {
          ...fam,
          partyHeadUid: partyHeadUid === '__CUSTOM__' ? '__CUSTOM__' : '',
          familyName: fam.familyName || '',
          pax: fam.pax || 1,
          selectedPassengerIds: [],
          selectAll: true,
          isCustom: partyHeadUid === '__CUSTOM__',
        };
      }

      const party = parties.find(p => p.partyHeadUid === partyHeadUid);
      if (!party) return fam;

      const pCount = (party.passengers && party.passengers.length > 0)
        ? party.passengers.length
        : (parseInt(party.totalPax, 10) || 1);

      const allPaxIds = (party.passengers || []).map(p => p.id);

      return {
        ...fam,
        partyHeadUid,
        familyName: party.partyName || party.partyHeadUid,
        pax: pCount,
        selectedPassengerIds: allPaxIds,
        selectAll: true,
        isCustom: false,
      };
    }));
  };

  // Toggle member checkbox in a family
  const handleToggleMember = (famId, memberId, totalPartyMembers) => {
    setFormFamilies(prev => prev.map(fam => {
      if (fam.id !== famId) return fam;

      let currentIds = Array.isArray(fam.selectedPassengerIds) ? [...fam.selectedPassengerIds] : [];
      if (currentIds.includes(memberId)) {
        currentIds = currentIds.filter(id => id !== memberId);
      } else {
        currentIds.push(memberId);
      }

      return {
        ...fam,
        selectedPassengerIds: currentIds,
        pax: currentIds.length,
        selectAll: currentIds.length === totalPartyMembers,
      };
    }));
  };

  // Toggle select all members of a family
  const handleToggleSelectAll = (famId, party) => {
    setFormFamilies(prev => prev.map(fam => {
      if (fam.id !== famId) return fam;

      const allIds = (party.passengers || []).map(p => p.id);
      const isCurrentlyAll = fam.selectedPassengerIds.length === allIds.length;

      return {
        ...fam,
        selectedPassengerIds: isCurrentlyAll ? [] : allIds,
        pax: isCurrentlyAll ? 0 : allIds.length,
        selectAll: !isCurrentlyAll,
      };
    }));
  };

  // Update custom family values
  const handleUpdateFamilyField = (famId, field, value) => {
    setFormFamilies(prev => prev.map(fam => {
      if (fam.id !== famId) return fam;
      return {
        ...fam,
        [field]: value
      };
    }));
  };

  // Save Group
  const handleSaveGroup = (e) => {
    e.preventDefault();
    setFormError('');

    const cleanNum = formGidNumber.trim();
    if (!cleanNum) {
      setFormError('Please enter a GID number (e.g. 001).');
      return;
    }

    const fullGid = cleanNum.toUpperCase().startsWith('GID-') ? cleanNum.toUpperCase() : `GID-${cleanNum}`;

    // Check duplicate GID if creating
    if (!editingGroup) {
      const exists = groups.some(g => (g.gid || '').toUpperCase() === fullGid);
      if (exists) {
        setFormError(`Group ID ${fullGid} already exists. Please choose another number.`);
        return;
      }
    }

    if (calculatedTotalPax <= 0) {
      setFormError('Total passenger count must be at least 1. Please add or select family passengers.');
      return;
    }

    // Assemble resolved families details
    const resolvedFamilies = formFamilies.map(fam => {
      const party = parties.find(p => p.partyHeadUid === fam.partyHeadUid);
      return {
        id: fam.id,
        partyHeadUid: fam.partyHeadUid,
        familyName: fam.familyName || (party ? party.partyName : 'Unnamed Family'),
        pax: Array.isArray(fam.selectedPassengerIds) && fam.selectedPassengerIds.length > 0 
          ? fam.selectedPassengerIds.length 
          : (parseInt(fam.pax, 10) || 1),
        selectedPassengerIds: fam.selectedPassengerIds || [],
        isCustom: fam.isCustom,
        contactPhone: party?.phone || party?.contactPhone || '',
        voucherRefNo: party?.voucherRefNo || '',
      };
    });

    const groupRecord = {
      id: editingGroup?.id || `group_${Date.now()}`,
      gid: fullGid,
      groupName: formGroupName.trim(), // Optional
      totalPax: calculatedTotalPax,
      families: resolvedFamilies,
      createdAt: editingGroup?.createdAt || new Date().toISOString(),
    };

    const updated = saveGroup(groupRecord);
    if (onGroupsUpdated) {
      onGroupsUpdated(updated);
    }
    setShowModal(false);
  };

  // Delete Group
  const handleConfirmDelete = () => {
    if (!deletingGroup) return;
    const updated = deleteGroup(deletingGroup.id);
    if (onGroupsUpdated) {
      onGroupsUpdated(updated);
    }
    setDeletingGroup(null);
  };

  // Filter groups
  const filteredGroups = useMemo(() => {
    return groups.filter(g => {
      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;
      const gid = (g.gid || '').toLowerCase();
      const name = (g.groupName || '').toLowerCase();
      const famMatch = (g.families || []).some(f => (f.familyName || '').toLowerCase().includes(q));
      return gid.includes(q) || name.includes(q) || famMatch;
    });
  }, [groups, searchTerm]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white">
              MODULE A1
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Group Management (GID)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Group family manifests and lead pilgrims into master GID codes for transport, flights, and hotel allotments.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-emerald-400" />
          <span>+ Create Group</span>
        </button>
      </div>

      {/* KPI Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Groups</span>
            <Hash className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalGroups}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Master travel groups formed</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Group Passengers</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">{totalPilgrims} PAX</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Pilgrims assigned to groups</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Average Group Size</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{averageGroupSize} <span className="text-xs text-slate-500 font-normal">Pax/Group</span></div>
          <p className="text-[11px] text-slate-400 mt-0.5">Pax distribution per GID</p>
        </div>

      </div>

      {/* Search Bar (Only when groups exist) */}
      {groups.length > 0 && (
        <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by GID, Lead Pilgrim Name, or Family..."
              className="w-full pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
            />
          </div>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-700 px-2"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Main Groups List / Empty State */}
      {groups.length === 0 ? (
        // Clean Empty State when no groups have been created yet
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center mx-auto shadow-2xs">
            <Users className="w-8 h-8 text-slate-700" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-slate-900">No Groups Created Yet</h3>
            <p className="text-xs text-slate-500">
              Create your first travel group by assigning a GID (e.g. GID-001), optional lead pilgrim name, and grouping multiple families together.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>+ Create First Group</span>
          </button>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
          No groups matching "{searchTerm}".
        </div>
      ) : (
        // Master Groups Table
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">GID (Group ID)</th>
                  <th className="py-3.5 px-4">Group / Lead Pilgrim</th>
                  <th className="py-3.5 px-4">Total Passengers</th>
                  <th className="py-3.5 px-4">Families Included</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGroups.map(group => {
                  return (
                    <tr key={group.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* GID */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-slate-900 text-white tracking-wide">
                          {group.gid}
                        </span>
                      </td>

                      {/* Group / Lead Pilgrim Name */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {group.groupName ? (
                          <span>{group.groupName}</span>
                        ) : (
                          <span className="text-slate-400 italic font-normal">(Optional / Unnamed)</span>
                        )}
                      </td>

                      {/* Total Passengers */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 font-mono">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{group.totalPax} PAX</span>
                        </span>
                      </td>

                      {/* Families Included */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-700">
                            {(group.families || []).length} {(group.families || []).length === 1 ? 'Family' : 'Families'}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {(group.families || []).slice(0, 3).map((f, i) => (
                              <span 
                                key={i} 
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 truncate max-w-[130px]"
                              >
                                {f.familyName} ({f.pax}p)
                              </span>
                            ))}
                            {(group.families || []).length > 3 && (
                              <span className="text-[9.5px] font-bold text-slate-400 self-center">
                                +{(group.families || []).length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {group.createdAt ? new Date(group.createdAt).toLocaleDateString() : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedGroupForView(group)}
                            title="View Manifest"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(group)}
                            title="Edit Group"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeletingGroup(group)}
                            title="Delete Group"
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* CREATE / EDIT GROUP MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  {editingGroup ? `Edit Group: ${editingGroup.gid}` : 'Create New Group'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assign GID, optional lead pilgrim, and combine family manifests with auto pax counting.
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveGroup} className="p-6 space-y-5 max-h-[calc(85vh-8rem)] overflow-y-auto">
              
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Row 1: GID & Optional Lead Pilgrim Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* GID- input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>GID (Group ID) <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400">e.g. 001</span>
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-300 focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-slate-900 shadow-2xs">
                    <span className="bg-slate-100 text-slate-700 font-mono font-bold text-xs px-3.5 py-2.5 flex items-center border-r border-slate-300 select-none">
                      GID-
                    </span>
                    <input 
                      type="text"
                      value={formGidNumber}
                      onChange={(e) => setFormGidNumber(e.target.value.replace(/[^0-9a-zA-Z_-]/g, ''))}
                      placeholder="001"
                      className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Full ID: GID-{formGidNumber || '001'}</p>
                </div>

                {/* Group / Lead Pilgrim Name (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Group / Lead Pilgrim Name</span>
                    <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input 
                    type="text"
                    value={formGroupName}
                    onChange={(e) => setFormGroupName(e.target.value)}
                    placeholder="e.g. Haji Abdul Karim or VIP Group"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-2xs"
                  />
                  <p className="text-[10px] text-slate-400">Optional reference name</p>
                </div>

              </div>

              {/* LIVE TOTAL PASSENGERS COUNTER BANNER */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200/90 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                      Total Passengers (PAX)
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-extrabold text-emerald-950 font-mono">
                        {calculatedTotalPax} PAX
                      </span>
                      <span className="text-xs text-emerald-700 font-medium">
                        across {formFamilies.length} {formFamilies.length === 1 ? 'family' : 'families'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    Auto-Counted
                  </span>
                </div>
              </div>

              {/* DYNAMIC PASSENGERS BY FAMILY SECTION */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Passengers by Family
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Add families to this group. Choose registered manifests or enter custom family blocks.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    {formFamilies.length} {formFamilies.length === 1 ? 'Family' : 'Families'}
                  </span>
                </div>

                {/* Family Row Cards */}
                <div className="space-y-3">
                  {formFamilies.map((fam, index) => {
                    const selectedParty = parties.find(p => p.partyHeadUid === fam.partyHeadUid);
                    const partyPassengers = selectedParty?.passengers || [];

                    return (
                      <div 
                        key={fam.id} 
                        className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3 relative transition-all"
                      >
                        {/* Family Card Header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              {fam.familyName || `Family #${index + 1}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-mono">
                              {fam.pax || 0} PAX
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFamilyRow(fam.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Remove Family"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Family Selector Dropdown */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-500">
                              Select Family / Party Head
                            </label>
                            <select
                              value={fam.isCustom ? '__CUSTOM__' : fam.partyHeadUid}
                              onChange={(e) => handleFamilyPartyChange(fam.id, e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer shadow-2xs"
                            >
                              <option value="">-- Choose Registered Family --</option>
                              {parties.map(p => {
                                const paxCount = (p.passengers?.length || p.totalPax || 1);
                                return (
                                  <option key={p.partyHeadUid} value={p.partyHeadUid}>
                                    {p.partyHeadUid} - {p.partyName} ({paxCount} PAX)
                                  </option>
                                );
                              })}
                              <option value="__CUSTOM__">+ Custom Family / Manual PAX</option>
                            </select>
                          </div>

                          {/* Family Pax Input (Editable if custom or manual override) */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-500">
                              PAX Count
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="999"
                              value={fam.pax}
                              onChange={(e) => handleUpdateFamilyField(fam.id, 'pax', parseInt(e.target.value, 10) || 1)}
                              disabled={!fam.isCustom && partyPassengers.length > 0}
                              className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 ${
                                !fam.isCustom && partyPassengers.length > 0 ? 'bg-slate-100/70 text-slate-500 cursor-not-allowed' : ''
                              }`}
                            />
                          </div>
                        </div>

                        {/* If Custom Family: allow entering name */}
                        {fam.isCustom && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-500">
                              Custom Family / Lead Name
                            </label>
                            <input
                              type="text"
                              value={fam.familyName}
                              onChange={(e) => handleUpdateFamilyField(fam.id, 'familyName', e.target.value)}
                              placeholder="e.g. Farhan & Family"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                            />
                          </div>
                        )}

                        {/* If Registered Family with passenger list: Show member checklist */}
                        {selectedParty && partyPassengers.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/70 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase text-slate-500">
                                Select Pilgrims from this Family:
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleSelectAll(fam.id, selectedParty)}
                                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800"
                              >
                                {fam.selectedPassengerIds?.length === partyPassengers.length ? 'Deselect All' : 'Select All Members'}
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                              {partyPassengers.map(pax => {
                                const isChecked = (fam.selectedPassengerIds || []).includes(pax.id);
                                return (
                                  <label 
                                    key={pax.id}
                                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                      isChecked 
                                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleMember(fam.id, pax.id, partyPassengers.length)}
                                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                                    />
                                    <span className="truncate">{pax.name}</span>
                                    {pax.category && (
                                      <span className="text-[9px] font-normal text-slate-400 shrink-0">
                                        ({pax.category})
                                      </span>
                                    )}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

                {/* + Add Another Family Button */}
                <button
                  type="button"
                  onClick={handleAddFamilyRow}
                  className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-slate-800 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-slate-500" />
                  <span>+ Add Another Family</span>
                </button>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>{editingGroup ? 'Update Group' : 'Save & Create Group'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* VIEW MANIFEST MODAL */}
      {selectedGroupForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-3xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-extrabold px-3 py-1 rounded-xl bg-slate-900 text-white">
                  {selectedGroupForView.gid}
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedGroupForView.groupName || 'Umrah Group Manifest'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Total {selectedGroupForView.totalPax} Pilgrims • {(selectedGroupForView.families || []).length} Families
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl text-slate-600 hover:bg-slate-200/60 border border-slate-200 text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print</span>
                </button>
                <button 
                  onClick={() => setSelectedGroupForView(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Manifest Body */}
            <div className="p-6 space-y-6 max-h-[calc(85vh-8rem)] overflow-y-auto">
              
              {(selectedGroupForView.families || []).map((fam, idx) => {
                const party = parties.find(p => p.partyHeadUid === fam.partyHeadUid);
                const passengers = party?.passengers || [];
                const displayedPassengers = fam.selectedPassengerIds?.length > 0
                  ? passengers.filter(p => fam.selectedPassengerIds.includes(p.id))
                  : passengers;

                return (
                  <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400">Family #{idx + 1}</span>
                        <h4 className="text-xs font-bold text-slate-900">{fam.familyName}</h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {fam.pax} PAX
                      </span>
                    </div>

                    {displayedPassengers.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                              <th className="py-2 px-2">#</th>
                              <th className="py-2 px-2">Pilgrim Name</th>
                              <th className="py-2 px-2">Passport #</th>
                              <th className="py-2 px-2">Category</th>
                              <th className="py-2 px-2">Gender</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {displayedPassengers.map((p, pIdx) => (
                              <tr key={p.id || pIdx} className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-2 text-slate-400">{pIdx + 1}</td>
                                <td className="py-1.5 px-2 font-semibold text-slate-800">{p.name}</td>
                                <td className="py-1.5 px-2 font-mono text-slate-500">{p.passportNo || '—'}</td>
                                <td className="py-1.5 px-2 text-slate-500">{p.category || 'Adult'}</td>
                                <td className="py-1.5 px-2 text-slate-500">{p.gender || 'M'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Manual Family Allocation ({fam.pax} PAX). Individual passports logged under Party {fam.partyHeadUid || 'Custom'}.
                      </p>
                    )}
                  </div>
                );
              })}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedGroupForView(null);
                  if (onNavigateToPassengers) onNavigateToPassengers();
                }}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5"
              >
                <span>Go to Passengers Manifest</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => setSelectedGroupForView(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Delete Group {deletingGroup.gid}?</h4>
              <p className="text-xs text-slate-500 mt-1">
                This will remove the group code. The underlying family vouchers and individual passengers will remain safe.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingGroup(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
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
