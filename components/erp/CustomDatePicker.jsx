'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const MONTH_MAP = {
  jan: 'Jan', january: 'Jan',
  feb: 'Feb', february: 'Feb',
  mar: 'Mar', march: 'Mar',
  apr: 'Apr', april: 'Apr',
  may: 'May',
  jun: 'Jun', june: 'Jun',
  jul: 'Jul', july: 'Jul',
  aug: 'Aug', august: 'Aug',
  sep: 'Sep', sept: 'Sep', september: 'Sep',
  oct: 'Oct', october: 'Oct',
  nov: 'Nov', november: 'Nov',
  dec: 'Dec', december: 'Dec'
};

const MONTH_NUMBERS = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
};

// Pad 2 digits
function pad2(n) {
  return String(n).padStart(2, '0');
}

// Format Date object to YYYY-MM-DD (ISO)
function toIsoDate(year, monthIndex, day) {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

// Convert ISO (YYYY-MM-DD) to Display (DD-MM-YYYY)
function isoToDisplay(iso) {
  if (!iso || typeof iso !== 'string') return '';
  const parts = iso.trim().split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    // parts = [YYYY, MM, DD]
    return `${pad2(parts[2])}-${pad2(parts[1])}-${parts[0]}`;
  }
  return iso;
}

// Convert Display or Flexible Input to ISO (YYYY-MM-DD)
export function parseAnyToIso(str) {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  if (!trimmed) return null;

  // 1. DD-Mon-YYYY (e.g. 01-Jan-2026 or 01-January-2026)
  const dMonY = trimmed.match(/^(\d{1,2})[-/]([a-zA-Z]{3,9})[-/](\d{2,4})$/);
  if (dMonY) {
    const d = parseInt(dMonY[1], 10);
    const mStr = dMonY[2].toLowerCase().slice(0, 3);
    const mNum = MONTH_NUMBERS[mStr];
    let y = parseInt(dMonY[3], 10);
    if (y < 100) y = y < 50 ? 2000 + y : 1900 + y;
    if (mNum && d >= 1 && d <= 31 && y >= 1990 && y <= 2100) {
      const mInt = parseInt(mNum, 10);
      const dt = new Date(y, mInt - 1, d);
      if (dt.getFullYear() === y && dt.getMonth() === mInt - 1 && dt.getDate() === d) {
        return toIsoDate(y, mInt - 1, d);
      }
    }
  }

  // 2. DD-MM-YYYY or DD/MM/YYYY
  const dmy = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (dmy) {
    const d = parseInt(dmy[1], 10);
    const m = parseInt(dmy[2], 10);
    let y = parseInt(dmy[3], 10);
    if (y < 100) y = y < 50 ? 2000 + y : 1900 + y;
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1990 && y <= 2100) {
      const dt = new Date(y, m - 1, d);
      if (dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d) {
        return toIsoDate(y, m - 1, d);
      }
    }
  }

  // 3. YYYY-MM-DD or YYYY/MM/DD
  const ymd = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymd) {
    const y = parseInt(ymd[1], 10);
    const m = parseInt(ymd[2], 10);
    const d = parseInt(ymd[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1990 && y <= 2100) {
      const dt = new Date(y, m - 1, d);
      if (dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d) {
        return toIsoDate(y, m - 1, d);
      }
    }
  }

  return null;
}

// Live auto-hyphenation and formatting while typing
function formatLiveTyping(raw, isDeleting) {
  if (!raw) return '';
  if (isDeleting) return raw;

  // Replace slashes or dots with hyphens
  let val = raw.replace(/[/.]/g, '-');

  // Strip anything that is not alphanumeric or hyphen
  val = val.replace(/[^0-9a-zA-Z-]/g, '');

  const parts = val.split('-');

  // 1. Single Part: typing Day
  if (parts.length === 1) {
    let dayStr = parts[0];
    // If 2 digits typed for Day, auto-append '-'
    if (/^\d{2}$/.test(dayStr)) {
      let dNum = parseInt(dayStr, 10);
      if (dNum > 31) dayStr = '31';
      if (dNum === 0) dayStr = '01';
      return `${dayStr}-`;
    }
    // If single digit followed by dash was handled by separator replacement
    return dayStr;
  }

  // 2. Two Parts: Day-Month
  if (parts.length === 2) {
    let dayStr = parts[0];
    let monthStr = parts[1];

    // Pad day if user typed single digit and hit hyphen
    if (/^\d{1}$/.test(dayStr)) {
      dayStr = pad2(dayStr);
    }

    // Case A: Month is 2 digits -> auto-append '-'
    if (/^\d{2}$/.test(monthStr)) {
      let mNum = parseInt(monthStr, 10);
      if (mNum > 12) monthStr = '12';
      if (mNum === 0) monthStr = '01';
      return `${dayStr}-${monthStr}-`;
    }

    // Case B: Month is letters (e.g. 'jan', 'feb', 'mar')
    const lower = monthStr.toLowerCase();
    if (lower.length === 3 && MONTH_MAP[lower]) {
      return `${dayStr}-${MONTH_MAP[lower]}-`;
    }

    // Capitalize first letter of partial month (e.g. 'j' -> 'J', 'ja' -> 'Ja')
    if (/^[a-zA-Z]{1,2}$/.test(monthStr)) {
      const formattedM = monthStr.charAt(0).toUpperCase() + monthStr.slice(1).toLowerCase();
      return `${dayStr}-${formattedM}`;
    }

    return `${dayStr}-${monthStr}`;
  }

  // 3. Three Parts: Day-Month-Year
  if (parts.length >= 3) {
    let dayStr = parts[0];
    let monthStr = parts[1];
    let yearStr = parts[2];

    // Pad single-digit day
    if (/^\d{1}$/.test(dayStr)) {
      dayStr = pad2(dayStr);
    }

    // Format month if 3-letter name
    const lower = monthStr.toLowerCase();
    if (MONTH_MAP[lower]) {
      monthStr = MONTH_MAP[lower];
    } else if (/^\d{1}$/.test(monthStr)) {
      monthStr = pad2(monthStr);
    }

    // Limit year to 4 digits
    if (yearStr.length > 4) {
      yearStr = yearStr.slice(0, 4);
    }

    return `${dayStr}-${monthStr}-${yearStr}`;
  }

  return val;
}

export default function CustomDatePicker({
  value = '',
  onChange,
  placeholder = '01-01-2026 or 01-Jan-2026',
  minDate,
  maxDate,
  className = '',
  disabled = false,
  id
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState(() => isoToDisplay(value));
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const isDeletingRef = useRef(false);

  // Sync internal text with incoming value prop (always converted to DD-MM-YYYY display)
  useEffect(() => {
    setInputText(isoToDisplay(value));
  }, [value]);

  // Determine view month & year for calendar popup
  const initialDate = useMemo(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
    if (minDate) {
      const parts = minDate.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
    return new Date();
  }, [value, minDate]);

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  // Adjust view when value changes
  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        setViewYear(parseInt(parts[0], 10));
        setViewMonth(parseInt(parts[1], 10) - 1);
      }
    }
  }, [value]);

  // Close calendar on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Track Backspace/Delete to avoid trapping user with auto-hyphenation
  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      isDeletingRef.current = true;
    } else {
      isDeletingRef.current = false;
    }

    if (e.key === 'Enter') {
      setIsOpen(false);
    }
  };

  // Handle typing inside text input with auto-hyphenation
  const handleInputChange = (e) => {
    const raw = e.target.value;
    const isDeleting = isDeletingRef.current;
    
    // Format live input
    const formatted = formatLiveTyping(raw, isDeleting);
    setInputText(formatted);

    if (!formatted.trim()) {
      if (onChange) onChange('');
      return;
    }

    // Try parsing complete date to ISO (YYYY-MM-DD)
    const parsedIso = parseAnyToIso(formatted);
    if (parsedIso) {
      if (onChange) onChange(parsedIso);
      const parts = parsedIso.split('-');
      setViewYear(parseInt(parts[0], 10));
      setViewMonth(parseInt(parts[1], 10) - 1);
    }
  };

  // On blur, clean up formatting
  const handleInputBlur = () => {
    if (!inputText.trim()) {
      if (onChange) onChange('');
      return;
    }
    const parsedIso = parseAnyToIso(inputText);
    if (parsedIso) {
      // Keep user's month name style if typed, or standard DD-MM-YYYY
      if (/[a-zA-Z]/.test(inputText)) {
        // e.g. 01-Jan-2026
        const parts = parsedIso.split('-');
        const y = parts[0];
        const m = MONTH_SHORT[parseInt(parts[1], 10) - 1];
        const d = parts[2];
        setInputText(`${d}-${m}-${y}`);
      } else {
        setInputText(isoToDisplay(parsedIso));
      }
      if (onChange && parsedIso !== value) onChange(parsedIso);
    }
  };

  // Calendar Navigation
  const handlePrevMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  // Day Selection from Calendar Popover
  const handleSelectDay = (dayIso) => {
    setInputText(isoToDisplay(dayIso));
    if (onChange) onChange(dayIso);
    setIsOpen(false);
    if (inputRef.current) inputRef.current.focus();
  };

  // Quick Action: Today
  const handleSelectToday = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const now = new Date();
    const todayIso = toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    handleSelectDay(todayIso);
  };

  // Quick Action: Clear
  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setInputText('');
    if (onChange) onChange('');
    setIsOpen(false);
    if (inputRef.current) inputRef.current.focus();
  };

  // Generate 42 days grid for current viewMonth & viewYear
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days = [];

    // Previous month filler days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      days.push({
        dayNumber: d,
        iso: toIsoDate(prevY, prevM, d),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      days.push({
        dayNumber: d,
        iso: toIsoDate(viewYear, viewMonth, d),
        isCurrentMonth: true,
      });
    }

    // Next month filler days up to 42 cells (6 weeks)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      days.push({
        dayNumber: d,
        iso: toIsoDate(nextY, nextM, d),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const todayIso = useMemo(() => {
    const n = new Date();
    return toIsoDate(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  // Quick year options (+- 5 years)
  const yearOptions = useMemo(() => {
    const currentY = new Date().getFullYear();
    const years = [];
    for (let y = currentY - 2; y <= currentY + 6; y++) {
      years.push(y);
    }
    return years;
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input row with icon */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputText}
          onKeyDown={handleKeyDown}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pr-16 pl-3 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-semibold text-slate-800 tracking-tight outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-mono ${className}`}
        />

        <div className="absolute right-1.5 flex items-center gap-0.5">
          {inputText && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear date"
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => !disabled && setIsOpen(prev => !prev)}
            title="Open calendar"
            disabled={disabled}
            className={`p-1.5 rounded-md transition-colors ${
              isOpen 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Popover Custom Calendar */}
      {isOpen && (
        <div 
          className="absolute z-50 top-full mt-1.5 left-0 w-[300px] bg-white rounded-xl shadow-2xl border border-slate-200 p-3.5 select-none animate-in fade-in zoom-in-95 duration-100"
          style={{ maxWidth: 'calc(100vw - 32px)' }}
        >
          {/* Header: Month, Year Jump, Navigation */}
          <div className="flex items-center justify-between gap-1 pb-3 mb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Month Dropdown */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md py-1 px-1.5 outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx} value={idx}>{name}</option>
                ))}
              </select>

              {/* Year Dropdown */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md py-1 px-1.5 outline-none cursor-pointer"
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAY_NAMES.map((d, idx) => (
              <div 
                key={idx} 
                className={`text-[10px] font-bold py-0.5 ${idx === 0 || idx === 6 ? 'text-rose-500' : 'text-slate-500'}`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((item, idx) => {
              const isSelected = item.iso === value;
              const isToday = item.iso === todayIso;
              const isPastMin = minDate && item.iso < minDate;
              const isFutureMax = maxDate && item.iso > maxDate;
              const isDisabled = isPastMin || isFutureMax;

              let btnStyle = 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700';

              if (!item.isCurrentMonth) {
                btnStyle = 'text-slate-300 hover:bg-slate-50 hover:text-slate-500';
              }

              if (isSelected) {
                btnStyle = 'bg-indigo-600 text-white font-black shadow-sm hover:bg-indigo-700';
              } else if (isToday) {
                btnStyle = `${btnStyle} font-bold ring-1 ring-indigo-500 text-indigo-700`;
              }

              if (isDisabled) {
                btnStyle = 'text-slate-200 cursor-not-allowed line-through hover:bg-transparent';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && handleSelectDay(item.iso)}
                  className={`h-8 w-full rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${btnStyle}`}
                >
                  {item.dayNumber}
                </button>
              );
            })}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 text-[11px] font-semibold">
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-500 hover:text-rose-600 px-2 py-1 rounded hover:bg-slate-50 transition-colors"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={handleSelectToday}
              className="text-indigo-600 hover:text-indigo-800 px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 transition-colors font-bold"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
