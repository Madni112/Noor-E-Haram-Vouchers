'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  X, 
  Check, 
  Edit3, 
  Trash2, 
  Plus 
} from 'lucide-react';
import { 
  getRegisteredHotels, 
  addRegisteredHotel, 
  updateRegisteredHotel, 
  deleteRegisteredHotel, 
  normalizeCityKey 
} from '../../lib/erpData';

export default function HotelCombobox({ 
  city, 
  value, 
  onChange, 
  onSelect,
  placeholder = 'Select or type hotel name...',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState(value || '');
  const [editingHotel, setEditingHotel] = useState(null);
  const [editInput, setEditInput] = useState('');
  const [registry, setRegistry] = useState(() => getRegisteredHotels());
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Sync internal input with prop value
  useEffect(() => {
    setInputVal(value || '');
  }, [value]);

  // Reload registry when city changes
  useEffect(() => {
    setRegistry(getRegisteredHotels());
  }, [city]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setEditingHotel(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cityKey = normalizeCityKey(city);
  const cityHotels = registry[cityKey] || [];
  const filteredHotels = cityHotels.filter(h => 
    (h || '').toLowerCase().includes((inputVal || '').toLowerCase().trim())
  );

  const isExactMatch = cityHotels.some(h => 
    h.toLowerCase().trim() === (inputVal || '').toLowerCase().trim()
  );

  const handleSelect = (hotelName) => {
    setInputVal(hotelName);
    onChange(hotelName);
    if (onSelect) onSelect(hotelName);
    setIsOpen(false);
    setEditingHotel(null);
  };

  const handleAddNew = (hotelName) => {
    const clean = (hotelName || '').trim().toUpperCase();
    if (!clean) return;
    const updated = addRegisteredHotel(city, clean);
    setRegistry(updated);
    setInputVal(clean);
    onChange(clean);
    if (onSelect) onSelect(clean);
    setIsOpen(false);
  };

  const handleSaveEdit = (e, oldName) => {
    e.preventDefault();
    e.stopPropagation();
    const cleanNew = editInput.trim().toUpperCase();
    if (!cleanNew) return;
    const updated = updateRegisteredHotel(city, oldName, cleanNew);
    setRegistry(updated);
    if (value === oldName) {
      setInputVal(cleanNew);
      onChange(cleanNew);
      if (onSelect) onSelect(cleanNew);
    }
    setEditingHotel(null);
    setEditInput('');
  };

  const handleDelete = (e, hotelToDelete) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== 'undefined' && window.confirm(`Delete "${hotelToDelete}" from ${city} registered hotels list?`)) {
      const updated = deleteRegisteredHotel(city, hotelToDelete);
      setRegistry(updated);
      if (value === hotelToDelete) {
        setInputVal('');
        onChange('');
        if (onSelect) onSelect('');
      }
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => {
            const v = e.target.value;
            setInputVal(v);
            onChange(v);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-14 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold uppercase text-xs outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all shadow-2xs"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputVal && (
            <button
              type="button"
              onClick={() => {
                setInputVal('');
                onChange('');
                if (onSelect) onSelect('');
                setIsOpen(true);
                if (inputRef.current) inputRef.current.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            title="Toggle list"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180 text-slate-700' : ''}`} />
          </button>
        </div>
      </div>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[999] overflow-hidden animate-in fade-in zoom-in-95 duration-100 min-w-[280px] max-h-64 flex flex-col">
          {/* Header */}
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span>{city} Hotels ({cityHotels.length})</span>
            <span className="text-slate-400 font-normal">Edit &amp; Delete available</span>
          </div>

          {/* List items */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {filteredHotels.length > 0 ? (
              filteredHotels.map((hItem) => {
                const isSelected = value && value.trim().toUpperCase() === hItem.trim().toUpperCase();
                const isEditingThis = editingHotel === hItem;

                if (isEditingThis) {
                  return (
                    <div
                      key={hItem}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="p-2 bg-amber-50/90 border-l-4 border-amber-500 flex items-center gap-1.5"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={editInput}
                        onChange={(e) => setEditInput(e.target.value)}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === 'Enter') handleSaveEdit(e, hItem);
                          else if (e.key === 'Escape') setEditingHotel(null);
                        }}
                        className="flex-1 min-w-0 px-2 py-1 text-xs font-bold uppercase rounded-lg border border-amber-400 bg-white text-slate-900 outline-none"
                      />
                      <button
                        type="button"
                        title="Save Changes"
                        onClick={(e) => handleSaveEdit(e, hItem)}
                        className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shrink-0 shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Cancel"
                        onClick={() => setEditingHotel(null)}
                        className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={hItem}
                    onClick={() => handleSelect(hItem)}
                    className={`p-2.5 px-3 cursor-pointer transition text-xs font-bold flex items-center justify-between group ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-950 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span className="truncate mr-2 uppercase">{hItem}</span>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {isSelected && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded mr-1">
                          Selected
                        </span>
                      )}
                      <button
                        type="button"
                        title={`Edit "${hItem}"`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingHotel(hItem);
                          setEditInput(hItem);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title={`Delete "${hItem}"`}
                        onClick={(e) => handleDelete(e, hItem)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : null}

            {/* + Add New Option if inputVal is not empty and not in the list */}
            {inputVal.trim() && !isExactMatch && (
              <div
                onClick={() => handleAddNew(inputVal)}
                className="p-3 text-center text-xs font-bold cursor-pointer border-t border-slate-100 bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-800 transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-emerald-700" />
                <span>+ Add "{inputVal.trim().toUpperCase()}" to {city} Hotels</span>
              </div>
            )}

            {filteredHotels.length === 0 && (!inputVal.trim() || isExactMatch) && (
              <div className="p-4 text-center text-xs text-slate-400 italic">
                No hotels found in {city}. Type above to add one.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
