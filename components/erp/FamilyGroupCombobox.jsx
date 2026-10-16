'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  ChevronDown, 
  X, 
  Check, 
  Plus, 
  Users, 
  Crown 
} from 'lucide-react';

export default function FamilyGroupCombobox({
  parties = [],
  value = '',
  onChange,
  onAddNewParty,
  placeholder = 'Select or type family group name...',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const selectedParty = parties.find(p => 
    p.partyHeadUid === value || 
    (value && p.partyName?.trim().toLowerCase() === value.trim().toLowerCase()) ||
    (value && p.voucherRefNo === value) ||
    (value && p.fid === value)
  );

  // Sync display query when value or parties change
  useEffect(() => {
    if (selectedParty) {
      setQuery(selectedParty.partyName || '');
    } else if (value) {
      const byName = parties.find(p => p.partyName?.trim().toLowerCase() === value.trim().toLowerCase());
      setQuery(byName ? byName.partyName : value);
    } else {
      setQuery('');
    }
  }, [value, selectedParty, parties]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        // If query was modified without selecting, reset query to selected party name
        if (selectedParty) {
          setQuery(selectedParty.partyName || '');
        } else if (value) {
          const byName = parties.find(p => p.partyName?.trim().toLowerCase() === value.trim().toLowerCase());
          setQuery(byName ? byName.partyName : value);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedParty, value, parties]);

  const cleanQuery = (query || '').trim().toLowerCase();

  const filteredParties = parties.filter(p => {
    if (!cleanQuery) return true;
    const name = (p.partyName || '').toLowerCase();
    const fid = (p.fid || '').toLowerCase();
    const ref = (p.voucherRefNo || '').toLowerCase();
    const uid = (p.partyHeadUid || '').toLowerCase();
    return name.includes(cleanQuery) || fid.includes(cleanQuery) || ref.includes(cleanQuery) || uid.includes(cleanQuery);
  });

  const isExactMatch = parties.some(p => 
    (p.partyName || '').trim().toLowerCase() === cleanQuery
  );

  const handleSelectParty = (p) => {
    setQuery(p.partyName || '');
    onChange(p.partyHeadUid);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    const raw = query.trim().toUpperCase();
    if (!raw) return;
    if (onAddNewParty) {
      const createdUid = onAddNewParty(raw);
      if (createdUid) {
        onChange(createdUid);
      }
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!isExactMatch && query.trim()) {
        handleCreateNew();
      } else if (filteredParties.length > 0) {
        handleSelectParty(filteredParties[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      if (selectedParty) setQuery(selectedParty.partyName || '');
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Input container */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-14 py-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-900 text-xs shadow-2xs outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 uppercase"
        />

        {/* Search Icon */}
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />

        {/* Action icons right */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                if (inputRef.current) inputRef.current.focus();
                setIsOpen(true);
              }}
              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            title="Toggle List"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-64 flex flex-col">
          
          {/* Header note / quick create banner */}
          {query.trim() && !isExactMatch && (
            <button
              type="button"
              onClick={handleCreateNew}
              className="w-full text-left p-2.5 bg-emerald-50 hover:bg-emerald-100/80 border-b border-emerald-100 text-emerald-900 transition flex items-center justify-between text-xs font-bold cursor-pointer shrink-0"
            >
              <div className="flex items-center gap-2 truncate">
                <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">
                  Add New Family Group: <strong className="text-emerald-950 uppercase">&quot;{query.trim()}&quot;</strong>
                </span>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded shrink-0">
                Enter ↵
              </span>
            </button>
          )}

          {/* Parties List */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {filteredParties.length === 0 && isExactMatch ? (
              <div className="p-3 text-center text-xs text-slate-400 italic">
                Group selected: {query}
              </div>
            ) : filteredParties.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 italic">
                No matching existing family group found. Click above to add &quot;{query}&quot;.
              </div>
            ) : (
              filteredParties.map((p) => {
                const isSelected = p.partyHeadUid === value;
                const paxTotal = p.totalPax || (p.passengers?.length || 1);
                const fidOrRef = p.voucherRefNo || p.fid || p.partyHeadUid;

                return (
                  <button
                    key={p.partyHeadUid}
                    type="button"
                    onClick={() => handleSelectParty(p)}
                    className={`w-full text-left px-3.5 py-2.5 transition flex items-center justify-between text-xs cursor-pointer ${
                      isSelected ? 'bg-slate-900 text-white font-bold' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <Crown className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-amber-500'}`} />
                        <span className="font-extrabold uppercase truncate tracking-tight">
                          {p.partyName}
                        </span>
                      </div>
                      <div className={`text-[10.5px] mt-0.5 flex items-center gap-2 truncate font-mono ${
                        isSelected ? 'text-slate-300' : 'text-slate-400'
                      }`}>
                        <span>{fidOrRef}</span>
                        <span>•</span>
                        <span>{paxTotal} {paxTotal === 1 ? 'PAX' : 'PAX'}</span>
                        {p.packageTitle && (
                          <>
                            <span>•</span>
                            <span className="truncate">{p.packageTitle}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
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
