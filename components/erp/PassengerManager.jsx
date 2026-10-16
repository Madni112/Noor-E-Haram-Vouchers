'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
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
  Sparkles,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldAlert,
  AlertTriangle,
  Building2,
  Bus,
  FileText,
  Layers
} from 'lucide-react';
import { saveParty, deleteParty, getAllParties, updatePassenger, checkPassengerDependencies, getNextFidNumber, isAgencyPhone } from '../../lib/erpData';

// Searchable SKU-style Family Group Dropdown Combobox
function SearchablePartySelect({ 
  parties = [], 
  value, 
  onChange, 
  allowAll = false,
  allLabel = 'All Family Groups',
  placeholder = 'Select Family Group' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const isAllSelected = allowAll && (value === 'ALL' || !value);
  const selectedParty = parties.find(p => p.partyHeadUid === value);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredParties = parties.filter(p => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.partyName || '').toLowerCase().includes(q) ||
      (p.partyHeadUid || '').toLowerCase().includes(q) ||
      (p.voucherRefNo || '').toLowerCase().includes(q) ||
      (p.passengers || []).some(m => (m.name || '').toLowerCase().includes(q))
    );
  });

  const showAllOption = allowAll && (!query || 'all family groups'.includes(query.toLowerCase().trim()));

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all text-left shadow-2xs"
      >
        <div className="flex items-center gap-2 min-w-0">
          {isAllSelected ? (
            <>
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white shrink-0">
                ALL
              </span>
              <span className="font-bold text-slate-900 text-xs truncate">
                {allLabel}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                ({parties.length} Families)
              </span>
            </>
          ) : selectedParty ? (
            <>
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 shrink-0 border border-emerald-200">
                {selectedParty.fid || selectedParty.voucherRefNo || selectedParty.partyHeadUid}
              </span>
              <span className="font-bold text-slate-900 text-xs truncate">
                {selectedParty.partyName}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                ({selectedParty.passengers?.length || selectedParty.totalPax || 0} PAX)
              </span>
            </>
          ) : (
            <span className="text-slate-400 text-xs font-medium truncate">
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-2 transition-transform duration-150 ${isOpen ? 'rotate-180 text-slate-700' : ''}`} />
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 min-w-[280px]">
          {/* Search Box Header */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by family, UID, or pilgrim..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-400 text-slate-800 placeholder:text-slate-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
            {/* "All Family Groups" Option if allowAll is true */}
            {showAllOption && (
              <button
                type="button"
                onClick={() => {
                  onChange('ALL');
                  setIsOpen(false);
                  setQuery('');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                  isAllSelected 
                    ? 'bg-emerald-50/80 text-emerald-950 font-semibold' 
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                    isAllSelected 
                      ? 'bg-emerald-600 text-white border-emerald-600' 
                      : 'bg-slate-900 text-white border-slate-900'
                  }`}>
                    ALL
                  </span>
                  <span className="font-bold text-slate-900 truncate">
                    {allLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {parties.length} Families
                  </span>
                  {isAllSelected && (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </div>
              </button>
            )}

            {filteredParties.length === 0 && !showAllOption ? (
              <div className="p-4 text-center text-xs text-slate-400 italic">
                No matching family groups found
              </div>
            ) : (
              filteredParties.map(p => {
                const isSelected = p.partyHeadUid === value;
                return (
                  <button
                    key={p.partyHeadUid}
                    type="button"
                    onClick={() => {
                      onChange(p.partyHeadUid);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-xs transition-colors ${
                      isSelected 
                        ? 'bg-emerald-50/80 text-emerald-950 font-semibold' 
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                        isSelected 
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-800' 
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}>
                        {p.fid || p.voucherRefNo || p.partyHeadUid}
                      </span>
                      <div className="truncate">
                        <span className="font-bold text-slate-900 block truncate">
                          {p.partyName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {p.passengers?.length || p.totalPax || 0} PAX
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer count indicator */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Showing {filteredParties.length} of {parties.length} groups</span>
            <span className="font-medium text-slate-500">Esc to close</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Searchable Combobox for selecting Family Head / Lead Pilgrim from family members
function SearchablePartyHeadSelect({ 
  passengers = [], 
  value, 
  onChange,
  placeholder = 'Select Family Head...' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedPax = passengers.find(p => p.id === value) || passengers[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredPax = passengers.filter(p => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.passportNo || '').toLowerCase().includes(q) ||
      (p.prefix || '').toLowerCase().includes(q) ||
      (p.visaNo || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all text-left shadow-2xs cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedPax ? (
            <>
              <Crown className="w-4 h-4 text-amber-500 fill-amber-100 shrink-0" />
              <span className="font-bold text-slate-900 text-xs truncate">
                {selectedPax.prefix ? `${selectedPax.prefix} ` : ''}{selectedPax.name}
              </span>
              {selectedPax.passportNo && (
                <span className="font-mono text-[10.5px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                  Passport: {selectedPax.passportNo}
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-400 text-xs font-medium truncate">
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-2 transition-transform duration-150 ${isOpen ? 'rotate-180 text-slate-700' : ''}`} />
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Box Header */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/90">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search name or passport #..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-400 text-slate-800 placeholder:text-slate-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Member List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100/60 p-1">
            {filteredPax.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 italic font-medium">
                No member found matching &quot;{query}&quot;
              </div>
            ) : (
              filteredPax.map((pax, idx) => {
                const isSelected = selectedPax?.id === pax.id;
                return (
                  <button
                    key={pax.id || idx}
                    type="button"
                    onClick={() => {
                      onChange(pax.id);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors cursor-pointer ${
                      isSelected ? 'bg-amber-50 text-amber-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          {isSelected ? (
                            <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-100 shrink-0" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className="text-xs truncate">
                            {pax.prefix ? `${pax.prefix} ` : ''}{pax.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                          {pax.passportNo ? (
                            <span className="font-semibold text-slate-700 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">Passport: {pax.passportNo}</span>
                          ) : (
                            <span className="text-slate-400">No passport</span>
                          )}
                          {pax.category && (
                            <span className="text-slate-400">• {pax.category}</span>
                          )}
                          {idx === 0 && (
                            <span className="text-amber-600 font-sans font-bold text-[9px] bg-amber-100/70 px-1 rounded">👑 Head</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-amber-600 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PassengerManager({ parties = [], onPartiesUpdated }) {
  const [viewMode, setViewMode] = useState('HIERARCHY'); // 'HIERARCHY' | 'FLAT'
  const [selectedPartyUid, setSelectedPartyUid] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFamilies, setExpandedFamilies] = useState(() => new Set(parties.map(p => p.partyHeadUid)));

  useEffect(() => {
    setExpandedFamilies(new Set(parties.map(p => p.partyHeadUid)));
  }, [parties.length]);

  useEffect(() => {
    if (searchTerm.trim()) {
      setExpandedFamilies(new Set(parties.map(p => p.partyHeadUid)));
    }
  }, [searchTerm]);

  const toggleFamilyExpand = (partyUid) => {
    setExpandedFamilies(prev => {
      const next = new Set(prev);
      if (next.has(partyUid)) next.delete(partyUid);
      else next.add(partyUid);
      return next;
    });
  };

  const toggleExpandAll = (expand) => {
    if (expand) {
      setExpandedFamilies(new Set(parties.map(p => p.partyHeadUid)));
    } else {
      setExpandedFamilies(new Set());
    }
  };

  const filteredPartiesForHierarchy = useMemo(() => {
    return parties.filter(party => {
      if (selectedPartyUid !== 'ALL' && party.partyHeadUid !== selectedPartyUid) return false;
      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;

      const famMatch = 
        (party.partyName || '').toLowerCase().includes(q) ||
        (party.fid || '').toLowerCase().includes(q) ||
        (party.voucherRefNo || '').toLowerCase().includes(q) ||
        (!isAgencyPhone(party.contactPhone) && (party.contactPhone || '').toLowerCase().includes(q)) ||
        (party.packageTitle || '').toLowerCase().includes(q);

      const paxMatch = (party.passengers || []).some(p => 
        (p.name || '').toLowerCase().includes(q) ||
        (p.passportNo || '').toLowerCase().includes(q) ||
        (p.visaNo || '').toLowerCase().includes(q)
      );

      return famMatch || paxMatch;
    });
  }, [parties, selectedPartyUid, searchTerm]);
  
  // Pagination State (entries per page, current page)
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  
  // Unified Family & Passenger Builder Modal State
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [modalMode, setModalMode] = useState('NEW_FAMILY'); // 'NEW_FAMILY' | 'ADD_TO_EXISTING'
  const [targetPartyUid, setTargetPartyUid] = useState(parties[0]?.partyHeadUid || '');
  const [fillDeclaredSlot, setFillDeclaredSlot] = useState(true);

  // In-List Passenger Deletion Mode State
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedPaxIdsToDelete, setSelectedPaxIdsToDelete] = useState([]);
  const deleteContainerRef = useRef(null);

  // Dependency Protection Alert Modal State
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [dependencyBlockInfo, setDependencyBlockInfo] = useState([]);

  const cancelDelete = () => {
    setIsDeleteMode(false);
    setSelectedPaxIdsToDelete([]);
  };

  // Auto-cancel delete mode on click outside or Escape key
  useEffect(() => {
    if (!isDeleteMode) return;

    const handleClickOutside = (e) => {
      if (deleteContainerRef.current && !deleteContainerRef.current.contains(e.target)) {
        cancelDelete();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        cancelDelete();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDeleteMode]);

  // Edit Single Passenger Modal State
  const [showEditPaxModal, setShowEditPaxModal] = useState(false);
  const [editingPax, setEditingPax] = useState(null);

  const openEditPassengerModal = (pax) => {
    cancelDelete();
    setEditingPax({
      ...pax,
      prefix: pax.prefix || 'MR',
      name: pax.name || '',
      passportNo: pax.passportNo || '',
      dob: pax.dob || '',
      gender: pax.gender || (pax.prefix === 'MRS' || pax.prefix === 'MS' ? 'F' : 'M'),
      category: pax.category || 'Adult',
      hasBed: pax.hasBed !== false,
      visaNo: pax.visaNo || '',
      relationship: pax.relationship || (pax.isPartyHead ? 'Family Head / Lead Pilgrim' : 'Family Member'),
      isDeclaredSlot: pax.isDeclaredSlot !== false,
    });
    setShowEditPaxModal(true);
  };

  const handleSaveEditedPassenger = (e) => {
    if (e) e.preventDefault();
    if (!editingPax || !editingPax.name.trim()) {
      alert('Passenger full legal name is required');
      return;
    }

    const updatedList = updatePassenger(editingPax.parentPartyUid, editingPax.id, editingPax);
    const parentParty = updatedList.find(p => p.partyHeadUid === editingPax.parentPartyUid);
    if (parentParty) {
      const declaredCount = Math.max(parseInt(parentParty.declaredPax, 10) || 0, 1);
      const extraCount = (parentParty.passengers || []).slice(1).filter(p => p.isDeclaredSlot === false).length;
      parentParty.totalPax = Math.max(declaredCount + extraCount, (parentParty.passengers || []).length);
      saveParty(parentParty);
    }

    if (onPartiesUpdated) {
      onPartiesUpdated(updatedList);
    }
    setShowEditPaxModal(false);
    setEditingPax(null);
  };

  // 5. Edit Family Group (Party Head, Package Title, Mobile Phone) Modal State
  const [showEditFamilyModal, setShowEditFamilyModal] = useState(false);
  const [editingFamily, setEditingFamily] = useState(null);
  const [editFamilyHeadPaxId, setEditFamilyHeadPaxId] = useState('');
  const [editFamilyPackageTitle, setEditFamilyPackageTitle] = useState('');
  const [editFamilyPhone, setEditFamilyPhone] = useState('');

  const openEditFamilyModal = (party) => {
    cancelDelete();
    setEditingFamily(party);
    const paxList = party.passengers || [];
    const headPax = paxList.find(p => p.relationship === 'Family Head' || p.relationship === 'Family Head / Lead Pilgrim') || paxList[0];
    setEditFamilyHeadPaxId(headPax?.id || (paxList[0]?.id || ''));
    setEditFamilyPackageTitle(party.packageTitle || '');
    setEditFamilyPhone(isAgencyPhone(party.contactPhone) ? '' : (party.contactPhone || ''));
    setShowEditFamilyModal(true);
  };

  const handleSaveEditedFamily = (e) => {
    if (e) e.preventDefault();
    if (!editingFamily) return;

    const currentPassengers = [...(editingFamily.passengers || [])];
    let updatedPartyName = editingFamily.partyName;

    if (editFamilyHeadPaxId && currentPassengers.length > 0) {
      const selectedHeadIdx = currentPassengers.findIndex(p => p.id === editFamilyHeadPaxId);
      if (selectedHeadIdx !== -1) {
        const selectedHead = currentPassengers[selectedHeadIdx];
        updatedPartyName = selectedHead.name;

        // Reorder passengers so the designated Family Head is placed at index 0
        const reordered = [
          selectedHead,
          ...currentPassengers.filter((_, idx) => idx !== selectedHeadIdx)
        ];

        // Update sequence numbers and relationships
        reordered.forEach((p, idx) => {
          p.sNo = String(idx + 1);
          if (idx === 0) {
            p.relationship = 'Family Head';
            if (editFamilyPhone.trim()) {
              p.contactPhone = editFamilyPhone.trim();
            }
          } else if (p.relationship === 'Family Head' || p.relationship === 'Family Head / Lead Pilgrim') {
            p.relationship = 'Family Member';
          }
        });

        currentPassengers.length = 0;
        currentPassengers.push(...reordered);
      }
    }

    const cleanPhone = isAgencyPhone(editFamilyPhone.trim()) ? '' : editFamilyPhone.trim();

    const updatedParty = {
      ...editingFamily,
      partyName: updatedPartyName,
      packageTitle: editFamilyPackageTitle.trim(),
      contactPhone: cleanPhone,
      passengers: currentPassengers,
      updatedAt: new Date().toISOString(),
    };

    saveParty(updatedParty);

    const refreshedList = getAllParties();
    if (onPartiesUpdated) {
      onPartiesUpdated(refreshedList);
    }

    setShowEditFamilyModal(false);
    setEditingFamily(null);
  };

  // Family Group Information
  const [familyFidNumber, setFamilyFidNumber] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [familyPhone, setFamilyPhone] = useState('');
  const [packageTitle, setPackageTitle] = useState('');

  // Dynamic Multi-Passenger Family Members Array
  const createDefaultHeadMember = () => ({
    id: `pax-head-${Date.now()}`,
    isHead: true,
    relationship: 'Family Head / Lead Pilgrim',
    prefix: 'MR',
    name: '',
    passportNo: '',
    dob: '',
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
    dob: '',
    gender: gen,
    category: 'Adult',
    hasBed: true,
    visaNo: '',
  });

  const [familyMembers, setFamilyMembers] = useState([createDefaultHeadMember()]);

  // Open modal in New Family mode
  const openNewFamilyModal = () => {
    cancelDelete();
    setModalMode('NEW_FAMILY');
    setFamilyFidNumber(getNextFidNumber());
    setFamilyName('');
    setFamilyPhone('');
    setPackageTitle('');
    setFamilyMembers([createDefaultHeadMember()]);
    setShowFamilyModal(true);
  };

  // Open modal in Add to Existing Family mode
  const openAddToExistingModal = (partyUid) => {
    cancelDelete();
    const activeUid = partyUid || (selectedPartyUid !== 'ALL' ? selectedPartyUid : parties[0]?.partyHeadUid);
    setTargetPartyUid(activeUid);
    setModalMode('ADD_TO_EXISTING');
    setFamilyMembers([createDefaultAdditionalMember('Family Member', 'MRS', 'F')]);

    const targetParty = parties.find(p => p.partyHeadUid === activeUid);
    const declaredCount = Math.max(parseInt(targetParty?.declaredPax, 10) || 0, parseInt(targetParty?.totalPax, 10) || 0, 1);
    const claimedSlots = (targetParty?.passengers || []).slice(1).filter(p => p.isDeclaredSlot !== false).length;
    const remaining = Math.max(0, (declaredCount - 1) - claimedSlots);
    setFillDeclaredSlot(remaining > 0);

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
      const resolvedFamilyName = headName || 'UNNAMED GROUP';

      const newUid = `PHU-${String(parties.length + 1).padStart(4, '0')}`;
      const now = new Date().toISOString();

      const synthesizedPax = familyMembers.map((m, idx) => ({
        id: `pax-${newUid}-${idx + 1}`,
        sNo: String(idx + 1),
        name: m.name.trim().toUpperCase(),
        prefix: m.prefix,
        passportNo: m.passportNo.trim().toUpperCase() || '',
        dob: m.dob || '',
        gender: m.gender || (m.prefix === 'MRS' || m.prefix === 'MS' ? 'F' : 'M'),
        category: m.category || 'Adult',
        hasBed: Boolean(m.hasBed),
        visaNo: m.visaNo.trim() || '',
        relationship: m.relationship || (idx === 0 ? 'Family Head' : 'Family Member'),
        contactPhone: familyPhone.trim(),
      }));

      const rawFid = familyFidNumber.trim();
      const resolvedFid = rawFid ? (rawFid.toUpperCase().startsWith('FID-') ? rawFid.toUpperCase() : `FID-${rawFid}`) : `FID-${getNextFidNumber()}`;

      const newParty = {
        partyHeadUid: newUid,
        fid: resolvedFid,
        voucherRefNo: resolvedFid,
        partyName: resolvedFamilyName,
        companyName: 'NOOR E HARAM TRAVELS & TOURS',
        contactPhone: familyPhone.trim(),
        backupPhone: '',
        totalPax: synthesizedPax.length,
        isSelfVisa: true,
        packageTitle: packageTitle.trim() || '',
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

      const declaredCount = Math.max(parseInt(party.declaredPax, 10) || 0, parseInt(party.totalPax, 10) || 0, 1);
      const totalSlotsAvailable = Math.max(0, declaredCount - 1);
      let claimedSlots = (party.passengers || []).slice(1).filter(p => p.isDeclaredSlot !== false).length;

      familyMembers.forEach((m, idx) => {
        const canClaimSlot = fillDeclaredSlot && (claimedSlots < totalSlotsAvailable);
        if (canClaimSlot) {
          claimedSlots++;
        }
        const newPax = {
          id: `pax-${party.partyHeadUid}-${currentCount + idx + 1}`,
          sNo: String(currentCount + idx + 1),
          name: m.name.trim().toUpperCase(),
          prefix: m.prefix,
          passportNo: m.passportNo.trim().toUpperCase() || '',
          dob: m.dob || '',
          gender: m.gender || (m.prefix === 'MRS' || m.prefix === 'MS' ? 'F' : 'M'),
          category: m.category || 'Adult',
          hasBed: Boolean(m.hasBed),
          visaNo: m.visaNo.trim() || '',
          relationship: m.relationship || 'Family Member',
          contactPhone: party.contactPhone || '',
          isDeclaredSlot: canClaimSlot,
        };
        party.passengers.push(newPax);
      });

      const extraCount = party.passengers.slice(1).filter(p => p.isDeclaredSlot === false).length;
      party.declaredPax = declaredCount;
      party.totalPax = Math.max(declaredCount + extraCount, party.passengers.length);
      saveParty(party);
      if (onPartiesUpdated) onPartiesUpdated([...parties]);
      setSelectedPartyUid(party.partyHeadUid);
    }

    setShowFamilyModal(false);
  };

  // Toggle selection for a single passenger in delete mode
  const handleTogglePaxToDelete = (paxId) => {
    setSelectedPaxIdsToDelete(prev => 
      prev.includes(paxId) ? prev.filter(id => id !== paxId) : [...prev, paxId]
    );
  };

  // Toggle select-all for visible passengers in the current page/view
  const handleToggleSelectAll = () => {
    const pagePaxIds = paginatedPassengers.map(p => p.id);
    const allOnPageSelected = pagePaxIds.length > 0 && pagePaxIds.every(id => selectedPaxIdsToDelete.includes(id));
    if (allOnPageSelected) {
      setSelectedPaxIdsToDelete(prev => prev.filter(id => !pagePaxIds.includes(id)));
    } else {
      setSelectedPaxIdsToDelete(prev => Array.from(new Set([...prev, ...pagePaxIds])));
    }
  };

  // Core passenger deletion logic
  const executeDeletePassengers = (paxIds) => {
    if (!paxIds || paxIds.length === 0) return;

    let allParties = getAllParties();
    const idsSet = new Set(paxIds.map(String));
    const completelyRemovedUids = [];

    allParties = allParties.map(party => {
      const hasDeletions = (party.passengers || []).some((p, idx) => 
        idsSet.has(String(p.id)) || idsSet.has(`pax-${party.partyHeadUid}-${idx + 1}`)
      );
      if (!hasDeletions) return party;

      let remainingPax = (party.passengers || []).filter((p, idx) => 
        !idsSet.has(String(p.id)) && !idsSet.has(`pax-${party.partyHeadUid}-${idx + 1}`)
      );

      if (remainingPax.length === 0) {
        completelyRemovedUids.push(party.partyHeadUid);
        return null;
      }

      // Re-index serial numbers cleanly
      remainingPax = remainingPax.map((p, idx) => ({
        ...p,
        id: p.id || `pax-${party.partyHeadUid}-${idx + 1}`,
        sNo: String(idx + 1),
        relationship: idx === 0 ? 'Head of Family' : (p.relationship === 'Head of Family' || p.relationship === 'Family Head / Lead Pilgrim' ? 'Family Member' : p.relationship),
      }));

      return {
        ...party,
        passengers: remainingPax,
        totalPax: remainingPax.length,
        partyName: remainingPax[0].name || party.partyName,
      };
    }).filter(Boolean);

    // 1. Clean up completely removed parties from Supabase & storage
    completelyRemovedUids.forEach(uid => {
      deleteParty(uid);
    });

    // 2. Direct atomic save to local storage
    writeStorage(ERP_STORAGE_KEYS.PARTIES, allParties);

    // 3. Save partially updated parties to Supabase
    allParties.forEach(party => {
      saveParty(party);
    });

    if (selectedPartyUid !== 'ALL' && completelyRemovedUids.includes(selectedPartyUid)) {
      setSelectedPartyUid('ALL');
    }

    if (onPartiesUpdated) {
      onPartiesUpdated(allParties);
    }

    setIsDeleteMode(false);
    setSelectedPaxIdsToDelete([]);
    setShowDependencyModal(false);
    setDependencyBlockInfo([]);
  };

  // Save changes: delete selected passengers, persist to storage & cloud, exit mode
  const handleSaveDelete = () => {
    if (selectedPaxIdsToDelete.length === 0) return;

    // Safety Dependency Protection: Check if any selected passenger is used in Hotel Vouchers, Bills, or Transport Vouchers
    const blocked = checkPassengerDependencies(selectedPaxIdsToDelete);
    if (blocked && blocked.length > 0) {
      setDependencyBlockInfo(blocked);
      setShowDependencyModal(true);
      return;
    }

    executeDeletePassengers(selectedPaxIdsToDelete);
  };

  // Direct single passenger delete
  const handleDeleteSinglePassenger = (pax, party) => {
    if (!window.confirm(`Are you sure you want to delete passenger "${pax.name}" from ${party.partyName}?`)) {
      return;
    }
    const targetPaxId = pax.id || (party.passengers ? `pax-${party.partyHeadUid}-${party.passengers.findIndex(p => p.name === pax.name) + 1}` : null);
    if (!targetPaxId) return;
    const blocked = checkPassengerDependencies([targetPaxId]);
    if (blocked && blocked.length > 0) {
      setSelectedPaxIdsToDelete([targetPaxId]);
      setDependencyBlockInfo(blocked);
      setShowDependencyModal(true);
      return;
    }
    executeDeletePassengers([targetPaxId]);
  };

  // Direct family group delete
  const handleDeleteFamily = (party) => {
    if (!window.confirm(`Are you sure you want to delete the entire family group "${party.partyName}" (${party.fid})?`)) {
      return;
    }
    const paxIds = (party.passengers || []).map((p, idx) => p.id || `pax-${party.partyHeadUid}-${idx + 1}`);
    const blocked = checkPassengerDependencies(paxIds);
    if (blocked && blocked.length > 0) {
      setSelectedPaxIdsToDelete(paxIds);
      setDependencyBlockInfo(blocked);
      setShowDependencyModal(true);
      return;
    }
    deleteParty(party.partyHeadUid);
    const updated = getAllParties().filter(p => p.partyHeadUid !== party.partyHeadUid && p.fid !== party.fid);
    if (onPartiesUpdated) onPartiesUpdated(updated);
    if (selectedPartyUid === party.partyHeadUid) setSelectedPartyUid('ALL');
  };

  // Filtered passengers
  const displayPassengers = parties.flatMap((party, pIdx) => {
    if (selectedPartyUid !== 'ALL' && party.partyHeadUid !== selectedPartyUid) return [];
    const seqFid = party.fid || `FID-${String(pIdx + 1).padStart(3, '0')}`;
    return (party.passengers || []).map((pax, idx) => ({
      ...pax,
      isPartyHead: idx === 0,
      parentPartyUid: party.partyHeadUid,
      fid: seqFid,
      voucherRefNo: party.voucherRefNo || party.partyHeadUid,
      parentPartyName: party.partyName,
      parentPhone: isAgencyPhone(party.contactPhone) ? '' : party.contactPhone,
      packageTitle: party.packageTitle,
    }));
  }).filter(pax => {
    const q = searchTerm.toLowerCase();
    return (
      (pax.name || '').toLowerCase().includes(q) ||
      (pax.passportNo || '').toLowerCase().includes(q) ||
      (pax.visaNo || '').toLowerCase().includes(q) ||
      (pax.fid || '').toLowerCase().includes(q) ||
      (pax.parentPartyName || '').toLowerCase().includes(q) ||
      (pax.voucherRefNo || '').toLowerCase().includes(q) ||
      (pax.parentPartyUid || '').toLowerCase().includes(q)
    );
  });

  // Pagination Calculations
  const totalItems = displayPassengers.length;
  const totalPages = entriesPerPage === -1 ? 1 : Math.max(1, Math.ceil(totalItems / entriesPerPage));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = entriesPerPage === -1 ? 0 : (safeCurrentPage - 1) * entriesPerPage;
  const endIndex = entriesPerPage === -1 ? totalItems : Math.min(startIndex + entriesPerPage, totalItems);
  const paginatedPassengers = entriesPerPage === -1 ? displayPassengers : displayPassengers.slice(startIndex, endIndex);

  // Helper for generating pagination page numbers array with ellipses
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (safeCurrentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages];
  }, [totalPages, safeCurrentPage]);

  // Auto-mirror Party Head name as Family/Group Name (read-only)
  const effectiveFamilyName = (familyMembers[0]?.name || '').trim().toUpperCase();

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

          {/* Primary Action: Add Family / Group */}
          <button
            onClick={openNewFamilyModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95"
          >
            <Users className="w-3.5 h-3.5 text-slate-300" />
            <span>Add Family / Group</span>
          </button>
        </div>
      </div>

      {/* Container with Auto-Cancel Ref for Delete Mode */}
      <div ref={deleteContainerRef} className="space-y-4">
        {/* Filter and Selector Controls */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Parent Party Dropdown */}
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <label className="text-xs font-semibold text-slate-500 shrink-0">Family Group Filter:</label>
            <div className="w-72 sm:w-80 max-w-full">
              <SearchablePartySelect
                parties={parties}
                value={selectedPartyUid}
                onChange={(uid) => {
                  cancelDelete();
                  setSelectedPartyUid(uid);
                  setCurrentPage(1);
                }}
                allowAll={true}
                allLabel="All Family Groups"
              />
            </div>

          {selectedPartyUid !== 'ALL' && (
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {parties.find(p => p.partyHeadUid === selectedPartyUid)?.passengers?.length || 0} Family Members
            </span>
          )}

          {/* ONLY ONE DELETE BUTTON & CANCEL / SAVE CHANGES NEXT TO FILTER */}
          {!isDeleteMode ? (
            <button
              type="button"
              onClick={() => {
                setIsDeleteMode(true);
                setSelectedPaxIdsToDelete([]);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-all shadow-2xs cursor-pointer"
              title="Select passengers to delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Passengers</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={cancelDelete}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveDelete}
                disabled={selectedPaxIdsToDelete.length === 0}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 ${
                  selectedPaxIdsToDelete.length > 0
                    ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer active:scale-95'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>
                  Save Changes {selectedPaxIdsToDelete.length > 0 ? `(${selectedPaxIdsToDelete.length})` : ''}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/90 shadow-2xs shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('HIERARCHY')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'HIERARCHY'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className={`w-3.5 h-3.5 ${viewMode === 'HIERARCHY' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>Hierarchy</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('FLAT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'FLAT'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className={`w-3.5 h-3.5 ${viewMode === 'FLAT' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>Flat List</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search by name, passport #, visa #..."
            value={searchTerm}
            onChange={(e) => {
              if (isDeleteMode) cancelDelete();
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-slate-50/50"
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* HIERARCHICAL FAMILY TREE ACCORDION VIEW */}
      {/* ============================================================== */}
      {viewMode === 'HIERARCHY' && (
        <div className="space-y-3">
          {/* Controls Bar for Hierarchy: Counts & Expand/Collapse All */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200/90 rounded-2xl shadow-xs text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Family Hierarchy</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-medium">
                Showing <strong className="text-slate-900 font-bold">{filteredPartiesForHierarchy.length}</strong> {filteredPartiesForHierarchy.length === 1 ? 'Family' : 'Families'}
                {' '}(<strong className="text-slate-900 font-bold">{filteredPartiesForHierarchy.reduce((acc, p) => acc + (p.passengers?.length || 0), 0)}</strong> Pilgrims)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleExpandAll(true)}
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={() => toggleExpandAll(false)}
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Families List */}
          {filteredPartiesForHierarchy.length === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center text-slate-400 font-medium italic shadow-xs">
              No family records found. Click &quot;Add Family / Group&quot; above to create one.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPartiesForHierarchy.map((party, partyIdx) => {
                const isExpanded = expandedFamilies.has(party.partyHeadUid);
                const paxList = party.passengers || [];
                const fid = party.fid || `FID-${String(partyIdx + 1).padStart(3, '0')}`;

                return (
                  <div
                    key={party.partyHeadUid}
                    className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all duration-150"
                  >
                    {/* Family Header Strip */}
                    <div
                      onClick={() => toggleFamilyExpand(party.partyHeadUid)}
                      className="px-4 py-3 sm:px-5 bg-gradient-to-r from-slate-50 via-white to-slate-50/50 hover:bg-slate-50/90 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none transition-colors"
                    >
                      {/* Left: Expand Chevron, FID Badge, Family Name, Lead Pilgrim, Phone */}
                      <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                        <button
                          type="button"
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all shrink-0 cursor-pointer"
                          aria-label={isExpanded ? 'Collapse Family' : 'Expand Family'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-700 stroke-[2.5]" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-500 stroke-[2.5]" />
                          )}
                        </button>

                        {/* FID Badge */}
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-xs shrink-0 tracking-wide">
                          {fid}
                        </span>

                        {/* Crown & Family Name */}
                        <div className="flex items-center gap-1.5 truncate">
                          <Crown className="w-4 h-4 text-amber-500 fill-amber-100 shrink-0" />
                          <span className="font-bold text-slate-900 text-sm truncate">
                            {party.partyName}
                          </span>
                        </div>

                        {/* Package Title Badge if present */}
                        {party.packageTitle && (
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                            {party.packageTitle}
                          </span>
                        )}

                        {/* Contact Phone if present */}
                        {party.contactPhone && !isAgencyPhone(party.contactPhone) && (
                          <span className="text-xs text-slate-500 shrink-0">
                            📞 {party.contactPhone}
                          </span>
                        )}
                      </div>

                      {/* Right: PAX Count Badge, Edit Family Button & + Member Quick Button */}
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {(() => {
                          const displayPax = Math.max(parseInt(party.totalPax, 10) || 0, parseInt(party.declaredPax, 10) || 0, paxList.length || 1);
                          const hasUnnamedSlots = displayPax > paxList.length;
                          return (
                            <span 
                              className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                                hasUnnamedSlots 
                                  ? 'bg-amber-50 text-amber-900 border-amber-200' 
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                              title={hasUnnamedSlots ? `${paxList.length} Named Pilgrim(s), ${displayPax - paxList.length} Unnamed Slot(s)` : `${displayPax} Passengers`}
                            >
                              <span>{displayPax} PAX</span>
                              {hasUnnamedSlots && (
                                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/70 px-1 rounded">
                                  {paxList.length}/{displayPax} Named
                                </span>
                              )}
                            </span>
                          );
                        })()}

                        <button
                          type="button"
                          onClick={() => openEditFamilyModal(party)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 hover:border-slate-400 transition-all shadow-2xs cursor-pointer"
                          title="Edit Family Head, Package Title & Phone"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openAddToExistingModal(party.partyHeadUid)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-all shadow-2xs cursor-pointer"
                          title="Add Member to this Family"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>+ Member</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteFamily(party)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 rounded-lg border border-rose-200 transition-all shadow-2xs cursor-pointer"
                          title={`Delete entire family group ${party.partyName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Members Table */}
                    {isExpanded && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50/80 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200/80">
                              <th className="py-2.5 px-3.5 border-r border-slate-100 w-12 text-center">#</th>
                              <th className="py-2.5 px-3.5 border-r border-slate-100">Full Legal Name</th>
                              <th className="py-2.5 px-3.5 border-r border-slate-100">Passport #</th>
                              <th className="py-2.5 px-3.5 border-r border-slate-100 text-center">Date of Birth</th>
                              <th className="py-2.5 px-3.5 border-r border-slate-100 text-center">Demographics</th>
                              <th className="py-2.5 px-3.5 border-r border-slate-100">Visa #</th>
                              <th className="py-2.5 px-3.5 text-right w-20">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-sans">
                            {paxList.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-6 text-center text-slate-400 font-medium italic">
                                  No members registered under this family.
                                </td>
                              </tr>
                            ) : (
                              paxList.map((pax, pIdx) => {
                                const isChecked = isDeleteMode && selectedPaxIdsToDelete.includes(pax.id);
                                const isHead = pIdx === 0 || pax.relationship === 'Family Head' || pax.relationship === 'Family Head / Lead Pilgrim';
                                const isLastChild = pIdx === paxList.length - 1;

                                return (
                                  <tr
                                    key={pax.id || pIdx}
                                    onClick={() => {
                                      if (isDeleteMode) handleTogglePaxToDelete(pax.id);
                                    }}
                                    className={`transition-colors ${
                                      isChecked
                                        ? 'bg-rose-50/80 hover:bg-rose-100/70 cursor-pointer'
                                        : isDeleteMode
                                        ? 'hover:bg-slate-50 cursor-pointer'
                                        : 'hover:bg-slate-50/70'
                                    }`}
                                  >
                                    {/* Number / Connector */}
                                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-center">
                                      {isDeleteMode ? (
                                        <div className="flex items-center justify-center">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              handleTogglePaxToDelete(pax.id);
                                            }}
                                            className="w-4 h-4 rounded text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer accent-rose-600"
                                          />
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-center gap-1 font-mono text-[11px] text-slate-400">
                                          <span className="text-slate-300 text-xs">{isLastChild ? '└──' : '├──'}</span>
                                          <span className="font-semibold">{pIdx + 1}</span>
                                        </div>
                                      )}
                                    </td>

                                    {/* Full Name */}
                                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-bold text-slate-900">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {isHead && (
                                          <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-100 shrink-0" title="Family Head" />
                                        )}
                                        {pax.prefix && <span className="text-slate-400 text-[10px] font-medium">{pax.prefix}</span>}
                                        <span>{pax.name ? (pax.prefix && pax.name.toUpperCase().startsWith(`${pax.prefix.toUpperCase()} `) ? pax.name.slice(pax.prefix.length).trim() : pax.name) : 'Unnamed Pilgrim'}</span>
                                        {isChecked && (
                                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                            To Delete
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    {/* Passport # */}
                                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono font-semibold text-slate-700">
                                      {pax.passportNo || '—'}
                                    </td>

                                    {/* DOB */}
                                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-center font-mono text-slate-500">
                                      {pax.dob || '—'}
                                    </td>

                                    {/* Demographics / Category */}
                                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-center">
                                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                                        pax.category === 'Child'
                                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                          : pax.category === 'Infant'
                                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                                      }`}>
                                        {pax.category || 'Adult'} {pax.gender ? `• ${pax.gender === 'F' ? 'Female' : 'Male'}` : ''}
                                      </span>
                                    </td>

                                    {/* Visa # */}
                                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono text-slate-600">
                                      {pax.visaNo || '—'}
                                    </td>

                                    {/* Actions */}
                                    <td className="py-2.5 px-3.5 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openEditPassengerModal({
                                              ...pax,
                                              parentPartyUid: party.partyHeadUid,
                                              fid: party.fid,
                                              parentPartyName: party.partyName,
                                              isPartyHead: isHead,
                                            });
                                          }}
                                          title={`Edit details for ${pax.name}`}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all cursor-pointer shadow-2xs group"
                                        >
                                          <Edit3 className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                                        </button>

                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteSinglePassenger(pax, party);
                                          }}
                                          title={`Delete passenger ${pax.name}`}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer shadow-2xs group"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modern Light Passenger Matrix Table (Flat List View) */}
      {viewMode === 'FLAT' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-3 px-3.5 border-r border-slate-100 w-12 text-center">
                  {isDeleteMode ? (
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={paginatedPassengers.length > 0 && paginatedPassengers.every(p => selectedPaxIdsToDelete.includes(p.id))}
                        ref={el => {
                          if (el) {
                            const someSelected = paginatedPassengers.some(p => selectedPaxIdsToDelete.includes(p.id));
                            const allSelected = paginatedPassengers.length > 0 && paginatedPassengers.every(p => selectedPaxIdsToDelete.includes(p.id));
                            el.indeterminate = someSelected && !allSelected;
                          }
                        }}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 rounded text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer accent-rose-600"
                        title={paginatedPassengers.length > 0 && paginatedPassengers.every(p => selectedPaxIdsToDelete.includes(p.id)) ? "Deselect page" : "Select page"}
                      />
                    </div>
                  ) : (
                    '#'
                  )}
                </th>
                <th className="py-3 px-3.5 border-r border-slate-100">Parent Family Group</th>
                <th className="py-3 px-3.5 border-r border-slate-100">Full Legal Name</th>
                <th className="py-3 px-3.5 border-r border-slate-100">Passport #</th>
                <th className="py-3 px-3.5 border-r border-slate-100 text-center">Date of Birth</th>
                <th className="py-3 px-3.5 border-r border-slate-100 text-center">Demographics</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {displayPassengers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 font-medium italic">
                    No passenger records found. Click "Add Family / Group" above to create one.
                  </td>
                </tr>
              ) : (
                paginatedPassengers.map((pax, idx) => {
                  const globalIdx = startIndex + idx;
                  const isChecked = isDeleteMode && selectedPaxIdsToDelete.includes(pax.id);
                  return (
                    <tr 
                      key={pax.id || idx} 
                      onClick={() => {
                        if (isDeleteMode) handleTogglePaxToDelete(pax.id);
                      }}
                      className={`transition-colors ${
                        isChecked
                          ? 'bg-rose-50/80 hover:bg-rose-100/70 cursor-pointer'
                          : isDeleteMode
                          ? 'hover:bg-slate-50 cursor-pointer'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-2.5 px-3.5 border-r border-slate-100 text-center">
                        {isDeleteMode ? (
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleTogglePaxToDelete(pax.id);
                              }}
                              className="w-4 h-4 rounded text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer accent-rose-600"
                            />
                          </div>
                        ) : (
                          <span className="font-mono font-semibold text-slate-400">
                            {globalIdx + 1}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 border-r border-slate-100">
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block text-[10.5px] mb-0.5 tracking-wide">
                          {pax.fid}
                        </span>
                        <span className="font-semibold text-slate-700 text-xs block">
                          {pax.parentPartyName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 border-r border-slate-100 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {pax.isPartyHead && (
                            <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-100 shrink-0" title="Family Head" />
                          )}
                          {pax.prefix && <span className="text-slate-400 text-[10px] mr-1">{pax.prefix}</span>}
                          <span>{pax.name ? (pax.prefix && pax.name.toUpperCase().startsWith(`${pax.prefix.toUpperCase()} `) ? pax.name.slice(pax.prefix.length).trim() : pax.name) : 'Unnamed Pilgrim'}</span>
                          {isChecked && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                              To Delete
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono font-semibold text-slate-700">
                        {pax.passportNo || '—'}
                      </td>
                      <td className="py-2.5 px-3.5 border-r border-slate-100 text-center font-mono text-slate-500">
                        {pax.dob || '—'}
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
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditPassengerModal(pax);
                            }}
                            title={`Edit details for ${pax.name}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all cursor-pointer shadow-2xs group"
                          >
                            <Edit3 className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const parentParty = parties.find(p => p.partyHeadUid === pax.parentPartyUid) || { partyName: pax.parentPartyName };
                              handleDeleteSinglePassenger(pax, parentParty);
                            }}
                            title={`Delete passenger ${pax.name}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer shadow-2xs group"
                          >
                            <Trash2 className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modern Pagination Controls Bar */}
        <div className="border-t border-slate-200/90 bg-slate-50/70 px-4 py-3 sm:px-5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Entries per page & Range Summary */}
          <div className="flex flex-wrap items-center gap-3 text-slate-600">
            <div className="flex items-center gap-1.5">
              <span>Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 text-slate-800 font-semibold rounded-lg px-2.5 py-1 text-xs outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 cursor-pointer shadow-2xs"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={-1}>All</option>
              </select>
              <span>entries per page</span>
            </div>

            <span className="text-slate-300 hidden sm:inline">|</span>

            <div className="text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{totalItems === 0 ? 0 : startIndex + 1}</span> to{' '}
              <span className="font-bold text-slate-900">{endIndex}</span> of{' '}
              <span className="font-bold text-slate-900">{totalItems}</span> passengers
            </div>
          </div>

          {/* Navigation Controls: << First, < Previous, Page Numbers, Next >, Last >> */}
          <div className="flex items-center gap-1 self-center md:self-auto">
            {/* First Page << */}
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage <= 1 || totalPages <= 1}
              title="First Page (<<)"
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all ${
                safeCurrentPage <= 1 || totalPages <= 1
                  ? 'border-slate-200 text-slate-300 bg-slate-50/50 cursor-not-allowed'
                  : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 cursor-pointer shadow-2xs'
              }`}
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Previous Page < */}
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={safeCurrentPage <= 1 || totalPages <= 1}
              title="Previous Page"
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                safeCurrentPage <= 1 || totalPages <= 1
                  ? 'border-slate-200 text-slate-300 bg-slate-50/50 cursor-not-allowed'
                  : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 cursor-pointer shadow-2xs'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Page Number Pills */}
            <div className="flex items-center gap-1 px-1">
              {pageNumbers.map((page, pIdx) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${pIdx}`} className="px-1 text-slate-400 font-bold select-none">
                      …
                    </span>
                  );
                }
                const isActive = page === safeCurrentPage;
                return (
                  <button
                    key={`page-${page}`}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Next Page > */}
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={safeCurrentPage >= totalPages || totalPages <= 1}
              title="Next Page"
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                safeCurrentPage >= totalPages || totalPages <= 1
                  ? 'border-slate-200 text-slate-300 bg-slate-50/50 cursor-not-allowed'
                  : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 cursor-pointer shadow-2xs'
              }`}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Last Page >> */}
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage >= totalPages || totalPages <= 1}
              title="Last Page (>>)"
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all ${
                safeCurrentPage >= totalPages || totalPages <= 1
                  ? 'border-slate-200 text-slate-300 bg-slate-50/50 cursor-not-allowed'
                  : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 cursor-pointer shadow-2xs'
              }`}
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      )}
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
                    Family &amp; Group Builder
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-600">
                    {modalMode === 'NEW_FAMILY' ? 'Create Single Head or Family Group' : 'Add Members to Existing Family'}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  {modalMode === 'NEW_FAMILY' ? 'Add New Family / Group' : 'Add Family Members to Group'}
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
                1. New Family / Group
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
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {/* FID (Family ID) */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                      <span>FID (Family ID) <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-slate-400">e.g. 001</span>
                    </label>
                    <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:ring-1 focus-within:ring-slate-900 bg-white shadow-2xs">
                      <span className="bg-slate-100 text-slate-700 font-mono font-bold text-xs px-2.5 py-1.5 flex items-center border-r border-slate-200 select-none">
                        FID-
                      </span>
                      <input 
                        type="text"
                        value={familyFidNumber}
                        onChange={(e) => setFamilyFidNumber(e.target.value.replace(/[^0-9a-zA-Z_-]/g, ''))}
                        placeholder="001"
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 outline-none"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Full ID: FID-{familyFidNumber || '001'}</p>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                      <span>Family / Group Name *</span>
                      <span className="text-[10px] font-normal text-slate-400">Party Head (Auto)</span>
                    </label>
                    <input 
                      type="text" 
                      readOnly
                      placeholder="Displaying Party Head Name..."
                      value={effectiveFamilyName}
                      className="w-full px-3 py-1.5 bg-slate-100/90 border border-slate-200 rounded-xl uppercase text-slate-800 font-bold outline-none cursor-not-allowed select-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Mirrored from Lead Pilgrim (non-editable)</p>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Contact Phone <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. 03XX-XXXXXXX"
                      value={familyPhone}
                      onChange={(e) => setFamilyPhone(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Lead traveler WhatsApp / Phone</p>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Package Title <span className="text-slate-400 font-normal">(Optional)</span>
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
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <label className="block text-slate-700 font-semibold mb-1">
                        Select Target Family Group *
                      </label>
                      <SearchablePartySelect
                        parties={parties}
                        value={targetPartyUid}
                        onChange={(uid) => {
                          setTargetPartyUid(uid);
                          const sel = parties.find(p => p.partyHeadUid === uid);
                          const dec = Math.max(parseInt(sel?.declaredPax, 10) || 0, parseInt(sel?.totalPax, 10) || 0, 1);
                          const clm = (sel?.passengers || []).slice(1).filter(p => p.isDeclaredSlot !== false).length;
                          const rem = Math.max(0, (dec - 1) - clm);
                          setFillDeclaredSlot(rem > 0);
                        }}
                      />
                    </div>
                    <div className="text-xs text-slate-500 sm:text-right sm:max-w-xs">
                      <span>New members will be added directly into this selected family group.</span>
                    </div>
                  </div>

                  {/* Slot availability Banner & Checkbox */}
                  {(() => {
                    const targetParty = parties.find(p => p.partyHeadUid === targetPartyUid);
                    const declaredCount = Math.max(parseInt(targetParty?.declaredPax, 10) || 0, parseInt(targetParty?.totalPax, 10) || 0, 1);
                    const totalSlotsAvailable = Math.max(0, declaredCount - 1);
                    if (totalSlotsAvailable <= 0) return null;

                    const claimedSlots = (targetParty?.passengers || []).slice(1).filter(p => p.isDeclaredSlot !== false).length;
                    const remaining = Math.max(0, totalSlotsAvailable - claimedSlots);

                    if (remaining > 0) {
                      return (
                        <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-start gap-3 transition-all">
                          <input
                            type="checkbox"
                            id="fillDeclaredSlotCheckbox"
                            checked={fillDeclaredSlot}
                            onChange={(e) => setFillDeclaredSlot(e.target.checked)}
                            className="w-4 h-4 mt-0.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                          />
                          <label htmlFor="fillDeclaredSlotCheckbox" className="text-xs text-slate-800 cursor-pointer select-none flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-extrabold text-emerald-950">
                                Fill an unnamed slot from declared {declaredCount} PAX ({remaining} slot{remaining === 1 ? '' : 's'} remaining)
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                                Slot Available
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-600 block mt-0.5">
                              {fillDeclaredSlot 
                                ? `Checking this keeps the family group at ${declaredCount} PAX (fills 1 of the ${remaining} unnamed slots).` 
                                : `Unchecked: Adds this member as an extra passenger (Increases total to ${Math.max(declaredCount, (targetParty.passengers?.length || 1)) + familyMembers.length} PAX).`}
                            </span>
                          </label>
                        </div>
                      );
                    }

                    return (
                      <div className="p-3.5 bg-slate-100/90 border border-slate-200 rounded-2xl flex items-center justify-between text-xs text-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">All {declaredCount} declared slots filled ({totalSlotsAvailable}/{totalSlotsAvailable})</span>
                          <span className="text-[11px] text-slate-500">• Adding this member will increase total to {Math.max(declaredCount, (targetParty.passengers?.length || 1)) + familyMembers.length} PAX</span>
                        </div>
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                          0 Slots Left (Disabled)
                        </span>
                      </div>
                    );
                  })()}
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

                          {/* Demographics Category (Moved after Prefix) */}
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

                          {/* Full Name */}
                          <div className="col-span-1 sm:col-span-2 md:col-span-2">
                            <label className="block text-slate-500 text-[10px] font-semibold mb-1">
                              Full Legal Name *
                            </label>
                            <input 
                              type="text"
                              required
                              placeholder={isHeadRow ? "e.g. ABDUL KARIM" : "e.g. HAJRA KARIM"}
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

                          {/* Date of Birth */}
                          <div className="col-span-1 sm:col-span-1 md:col-span-1">
                            <label className="block text-slate-500 text-[10px] font-semibold mb-1">Date of Birth</label>
                            <input 
                              type="date"
                              value={member.dob}
                              onChange={(e) => handleUpdateMember(index, 'dob', e.target.value)}
                              className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white font-mono text-slate-800 text-[11px] outline-none focus:ring-1 focus:ring-slate-900"
                            />
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
                            ? 'Save Single Passenger (1 PAX)' 
                            : `Save Family / Group (${familyMembers.length} PAX)`)
                        : `Add ${familyMembers.length} Member(s) to Family`}
                    </span>
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 4. EDIT PASSENGER DETAILS MODAL */}
      {showEditPaxModal && editingPax && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                  <Edit3 className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Passenger Details
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {editingPax.voucherRefNo || editingPax.parentPartyUid}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 truncate max-w-[200px] sm:max-w-xs">
                      {editingPax.parentPartyName}
                    </span>
                    {editingPax.isPartyHead ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <Crown className="w-2.5 h-2.5 text-amber-600" />
                        Family Head
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        <Users className="w-2.5 h-2.5 text-slate-400" />
                        Family Member
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowEditPaxModal(false);
                  setEditingPax(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveEditedPassenger} className="p-6 space-y-4 overflow-y-auto">
              
              {editingPax.isPartyHead && (
                <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                  <Crown className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Lead Pilgrim &amp; Family Head:</span>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Updating this passenger's legal name will automatically update the Family Group name and the main Transport &amp; Hotel Voucher header across the entire system.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Prefix */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Honorific / Prefix
                  </label>
                  <select
                    value={editingPax.prefix || 'MR'}
                    onChange={(e) => {
                      const val = e.target.value;
                      let newGender = editingPax.gender || 'M';
                      if (val === 'MRS' || val === 'MS') newGender = 'F';
                      else if (val === 'MR' || val === 'MSTR') newGender = 'M';
                      setEditingPax({ ...editingPax, prefix: val, gender: newGender });
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                  >
                    <option value="MR">MR</option>
                    <option value="MRS">MRS</option>
                    <option value="MS">MS</option>
                    <option value="MSTR">MSTR</option>
                    <option value="CHD">CHD</option>
                    <option value="INF">INF</option>
                  </select>
                </div>

                {/* Demographics Category */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Demographics Category
                  </label>
                  <select
                    value={editingPax.category || 'Adult'}
                    onChange={(e) => {
                      const val = e.target.value;
                      let hasBed = editingPax.hasBed !== false;
                      if (val === 'Infant') hasBed = false;
                      setEditingPax({ ...editingPax, category: val, hasBed });
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                  >
                    <option value="Adult">Adult</option>
                    <option value="Child">Child</option>
                    <option value="Infant">Infant</option>
                  </select>
                </div>

                {/* Full Legal Name (Col-Span 2) */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SAFWAN KHAN BURFAT"
                    value={editingPax.name || ''}
                    onChange={(e) => setEditingPax({ ...editingPax, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl uppercase font-bold text-slate-900 outline-none focus:ring-1 focus:ring-slate-900 shadow-2xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Matches passport exactly. Changes sync directly to vouchers, tickets &amp; hotel manifests.
                  </p>
                </div>

                {/* Passport Number */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Passport Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AB3989501"
                    value={editingPax.passportNo || ''}
                    onChange={(e) => setEditingPax({ ...editingPax, passportNo: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl uppercase font-mono font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editingPax.dob || ''}
                    onChange={(e) => setEditingPax({ ...editingPax, dob: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-800 text-xs outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                {/* Declared Slot Toggle in Edit Single Passenger */}
                {!editingPax.isPartyHead && editingPax.relationship !== 'Family Head' && (() => {
                  const parentParty = parties.find(p => p.partyHeadUid === editingPax.parentPartyUid);
                  const declaredCount = Math.max(parseInt(parentParty?.declaredPax, 10) || 0, parseInt(parentParty?.totalPax, 10) || 0, 1);
                  if (declaredCount <= 1) return null;

                  const isChecked = editingPax.isDeclaredSlot !== false;
                  return (
                    <div className="sm:col-span-2 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="editDeclaredSlotCheckbox"
                        checked={isChecked}
                        onChange={(e) => setEditingPax({ ...editingPax, isDeclaredSlot: e.target.checked })}
                        className="w-4 h-4 mt-0.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                      />
                      <label htmlFor="editDeclaredSlotCheckbox" className="text-xs text-slate-800 cursor-pointer select-none flex-1">
                        <span className="font-bold text-slate-900 block">
                          Count as one of the declared {declaredCount} PAX slots
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {isChecked
                            ? `Currently occupying a declared slot (Keeps family total at ${declaredCount} PAX).`
                            : `Unchecked: Treated as an extra passenger (Frees up 1 unnamed slot for new members and enables slot checkbox).`}
                        </span>
                      </label>
                    </div>
                  );
                })()}

              </div>

              {/* Action Buttons Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditPaxModal(false);
                    setEditingPax(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Save Passenger Changes</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 5. EDIT FAMILY GROUP & PARTY HEAD MODAL */}
      {showEditFamilyModal && editingFamily && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => {
            setShowEditFamilyModal(false);
            setEditingFamily(null);
          }}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full border border-slate-200/90 shadow-2xl flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100/80 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                  <Crown className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Edit Family Group</span>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {editingFamily.fid}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Modify Family Head, package title, and contact details
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowEditFamilyModal(false);
                  setEditingFamily(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveEditedFamily} className="p-6 space-y-4 overflow-visible rounded-b-3xl">
              
              {/* Party Head Searchable Combobox */}
              <div>
                <label className="block text-slate-800 font-bold mb-1 text-xs flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>Family Head / Lead Pilgrim (Party Head) *</span>
                </label>
                {(editingFamily.passengers || []).length > 0 ? (
                  <SearchablePartyHeadSelect
                    passengers={editingFamily.passengers || []}
                    value={editFamilyHeadPaxId}
                    onChange={(selectedId) => setEditFamilyHeadPaxId(selectedId)}
                  />
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 italic">
                    No family members currently registered.
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  Search by pilgrim name or passport # to select the new Family Head.
                </p>
              </div>

              {/* Package Title Input */}
              <div>
                <label className="block text-slate-800 font-bold mb-1 text-xs">
                  Package Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. 18 Standard Umrah, 21 Days Premium Umrah..."
                  value={editFamilyPackageTitle}
                  onChange={(e) => setEditFamilyPackageTitle(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-900 text-xs shadow-2xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Optional badge displayed next to family name (leave blank if none).
                </p>
              </div>

              {/* Contact Phone Input */}
              <div>
                <label className="block text-slate-800 font-bold mb-1 text-xs">
                  Mobile / Contact Phone
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0300-1234567 or +92-300-1234567"
                  value={editFamilyPhone}
                  onChange={(e) => setEditFamilyPhone(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-900 text-xs shadow-2xs font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Personal phone number for this pilgrim family (leave blank if none).
                </p>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditFamilyModal(false);
                    setEditingFamily(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Save Family Changes</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
      {/* Dependency Protection Alert Popup Modal */}
      {showDependencyModal && dependencyBlockInfo.length > 0 && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => {
            setShowDependencyModal(false);
            setDependencyBlockInfo([]);
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-rose-50 via-rose-50/50 to-white border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-300 flex items-center justify-center text-rose-600 shadow-sm shrink-0">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Passenger Deletion Blocked</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                      Protection Active
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    ERP Integrity Engine detected active linked vouchers or bills
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDependencyModal(false);
                  setDependencyBlockInfo([]);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              {dependencyBlockInfo.map((item, idx) => (
                <div 
                  key={item.paxId || idx}
                  className="rounded-2xl border border-rose-200/90 bg-rose-50/50 p-4 sm:p-5 space-y-3.5 shadow-sm"
                >
                  {/* Passenger identification badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200/60 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                          <span>{item.paxName}</span>
                          {item.passportNo && (
                            <span className="font-mono text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              {item.passportNo}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Family Group: <span className="font-medium text-slate-700">{item.parentPartyName}</span> (#{item.voucherRefNo})
                        </div>
                      </div>
                    </div>
                    {item.isHead && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                        <Crown className="w-3 h-3 text-amber-600" />
                        Family Head
                      </span>
                    )}
                  </div>

                  {/* Required Exact Error Message */}
                  <div className="p-3.5 bg-white rounded-xl border border-rose-200 shadow-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                      the passenger name can&apos;t be deleted as it is currently using in{' '}
                      <span className="font-bold text-rose-700 underline decoration-rose-300 underline-offset-2">
                        {item.dependencies.map(d => d.label).join(', ')}
                      </span>
                      , first remove the name from there.
                    </div>
                  </div>

                  {/* Document Breakdown List */}
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Active Linked Documents ({item.dependencies.length})
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {item.dependencies.map((dep, dIdx) => {
                        let IconComp = FileText;
                        let iconBg = 'bg-slate-100 text-slate-700 border-slate-200';
                        if (dep.type === 'Hotel Voucher') {
                          IconComp = Building2;
                          iconBg = 'bg-amber-50 text-amber-700 border-amber-200';
                        } else if (dep.type === 'Transport Voucher') {
                          IconComp = Bus;
                          iconBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        } else if (dep.type === 'Bill / Invoice') {
                          IconComp = CreditCard;
                          iconBg = 'bg-blue-50 text-blue-700 border-blue-200';
                        }

                        return (
                          <div 
                            key={dIdx}
                            className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs hover:border-slate-300 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${iconBg}`}>
                                <IconComp className="w-3.5 h-3.5" />
                              </div>
                              <div className="truncate">
                                <div className="font-bold text-slate-800 truncate">
                                  {dep.label}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {dep.detail}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md shrink-0 ml-2">
                              {dep.type}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Informative Guidance note */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  This safety restriction protects your operations from orphaned transport manifests, invalid hotel check-ins, or broken accounting balances.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const idsToDelete = dependencyBlockInfo.map(b => b.paxId).filter(Boolean);
                  const targetIds = idsToDelete.length > 0 ? idsToDelete : selectedPaxIdsToDelete;
                  executeDeletePassengers(targetIds);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Force Delete Anyway</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowDependencyModal(false);
                  setDependencyBlockInfo([]);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4 text-slate-500" />
                <span>Cancel / Keep Safe</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
