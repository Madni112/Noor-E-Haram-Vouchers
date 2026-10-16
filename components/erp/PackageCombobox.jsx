'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check, Trash2, Layers, Plus } from 'lucide-react';

export default function PackageCombobox({
  value = '',
  onChange,
  onSelectPackage,
  packages = [],
  onDeletePackage,
  placeholder = 'e.g. 15 Days Executive Umrah Package',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState(value || '');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setInputVal(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchClean = (inputVal || '').trim().toLowerCase();
  const filteredPackages = packages.filter(p => 
    (p.package_name || '').toLowerCase().includes(searchClean)
  );

  const handleSelect = (pkg) => {
    setInputVal(pkg.package_name);
    if (onChange) onChange(pkg.package_name);
    if (onSelectPackage) onSelectPackage(pkg);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => {
            const val = e.target.value;
            setInputVal(val);
            if (onChange) onChange(val);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-3 py-1.5 pr-14 border border-slate-300 rounded-lg bg-white text-slate-900 text-xs font-bold focus:outline-none focus:border-indigo-600 transition-colors shadow-2xs"
          required
        />

        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {inputVal && (
            <button
              type="button"
              onClick={() => {
                setInputVal('');
                if (onChange) onChange('');
                setIsOpen(true);
                if (inputRef.current) inputRef.current.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              title="Clear"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            title="Toggle packages"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180 text-slate-700' : ''}`} />
          </button>
        </div>
      </div>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[999] overflow-hidden animate-in fade-in zoom-in-95 duration-100 min-w-[300px] max-h-60 flex flex-col">
          {/* Header */}
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Cloud Packages ({packages.length})</span>
            <span className="text-slate-400 font-normal">Click to auto-fill dates</span>
          </div>

          {/* List items */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {filteredPackages.length > 0 ? (
              filteredPackages.map((pkg) => {
                const isSelected = (value || '').trim().toLowerCase() === (pkg.package_name || '').trim().toLowerCase();
                return (
                  <div
                    key={pkg.id}
                    onClick={() => handleSelect(pkg)}
                    className={`px-3 py-2 text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/80 font-bold text-indigo-950' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      ) : (
                        <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{pkg.package_name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {pkg.departure_date && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-mono">
                          {pkg.departure_date} &rarr; {pkg.arrival_date || '...'}
                        </span>
                      )}
                      {onDeletePackage && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePackage(pkg.id);
                          }}
                          className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors"
                          title="Delete package from Supabase"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">
                <p>No matching packages found</p>
                {searchClean && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onChange) onChange(inputVal);
                      setIsOpen(false);
                    }}
                    className="mt-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold border border-indigo-200 inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Use &quot;{inputVal}&quot;</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
