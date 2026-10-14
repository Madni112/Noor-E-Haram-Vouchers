'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getVoucherBySlug, updateVoucher, slugify, fetchSupabaseVoucherBySlug } from '../../../lib/vouchersData';
import { calculateNights, computePaxSummary } from '../../../lib/dateUtils';
import { useAuth } from '../../../lib/AuthContext';
import AdminLoginForm from '../../../components/AdminLoginForm';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Check, 
  Building2, 
  Bus, 
  Plane, 
  Users, 
  ShieldCheck, 
  FileText,
  Save
} from 'lucide-react';

export default function EditVoucherPage() {
  const router = useRouter();
  const params = useParams();
  const { isAdmin, isLoaded } = useAuth();
  const slug = params?.slug;

  const [loading, setLoading] = useState(true);
  const [voucher, setVoucher] = useState(null);

  const [party, setParty] = useState('');
  const [ubNumber, setUbNumber] = useState('');
  const [groundTransport, setGroundTransport] = useState('+92 328 8189989');
  const [makkahHelpline, setMakkahHelpline] = useState('+966 53 649 2846');
  const [madinahHelpline, setMadinahHelpline] = useState('+966 57 593 0550');
  const [pakistanHelpline, setPakistanHelpline] = useState('MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683');
  const [ksaJeddahAirport, setKsaJeddahAirport] = useState('');
  const [ksaJeddahSpecial, setKsaJeddahSpecial] = useState('');
  const [ksaJeddahSharing, setKsaJeddahSharing] = useState('');
  const [ksaMakkahSharing, setKsaMakkahSharing] = useState('');
  const [ksaMakkahSpecial, setKsaMakkahSpecial] = useState('');
  const [ksaMadinahSharing, setKsaMadinahSharing] = useState('');
  const [ksaMadinahSpecial, setKsaMadinahSpecial] = useState('');
  const [companyName, setCompanyName] = useState('CHEEPA FJ TRAVELS');
  const [executive, setExecutive] = useState('MUHAMMAD FAIZAN');
  const [isSelfVisa, setIsSelfVisa] = useState(true);
  const [paxCounts, setPaxCounts] = useState('GENT(S): 1  LAD(IES): 0  CHILD(REN): 0  INFANT(S): 0');
  const [passengers, setPassengers] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [transports, setTransports] = useState([]);
  const [flights, setFlights] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (slug) {
      const applyData = (found) => {
        if (!found) return;
        const idNum = parseInt(found.id || 1) || 1;
        const defaultUb = `UB-${String(idNum).padStart(4, '0')}`;
        setVoucher(found);
        setParty(found.party || '');
        setUbNumber(found.ubNumber || found.voucherRefNo || defaultUb);
        setGroundTransport(found.groundTransport || found.ksaGroundTransport || '+92 328 8189989');
        setMakkahHelpline(found.makkahHelpline || found.ksaMakkah || '+966 53 649 2846');
        setMadinahHelpline(found.madinahHelpline || found.ksaMadinah || '+966 57 593 0550');
        setPakistanHelpline(found.pakistanHelpline || 'MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683');
        setKsaJeddahAirport(found.ksaJeddahAirport ?? found.ksa_jeddah_airport ?? (found.passengers && found.passengers[0]?.ksaJeddahAirport) ?? '');
        setKsaJeddahSpecial(found.ksaJeddahSpecial ?? found.ksa_jeddah_special ?? (found.passengers && found.passengers[0]?.ksaJeddahSpecial) ?? '');
        setKsaJeddahSharing(found.ksaJeddahSharing ?? found.ksa_jeddah_sharing ?? (found.passengers && found.passengers[0]?.ksaJeddahSharing) ?? '');
        setKsaMakkahSharing(found.ksaMakkahSharing ?? found.ksa_makkah_sharing ?? (found.passengers && found.passengers[0]?.ksaMakkahSharing) ?? '');
        setKsaMakkahSpecial(found.ksaMakkahSpecial ?? found.ksa_makkah_special ?? (found.passengers && found.passengers[0]?.ksaMakkahSpecial) ?? '');
        setKsaMadinahSharing(found.ksaMadinahSharing ?? found.ksa_madinah_sharing ?? (found.passengers && found.passengers[0]?.ksaMadinahSharing) ?? '');
        setKsaMadinahSpecial(found.ksaMadinahSpecial ?? found.ksa_madinah_special ?? (found.passengers && found.passengers[0]?.ksaMadinahSpecial) ?? '');
        setCompanyName(found.companyName || 'CHEEPA FJ TRAVELS');
        setExecutive(found.executive || 'MUHAMMAD FAIZAN');
        setIsSelfVisa(found.isSelfVisa !== false);

        const loadedPassengers = (found.passengers && found.passengers.length > 0 ? found.passengers : [
          { sNo: '1', prefix: 'MR', name: '', passportNo: '', group: '', visaNo: '', hasBed: true }
        ]).map((p, idx) => {
          let pfx = p.prefix || 'MR';
          let cleanName = p.name || '';
          if (!p.prefix && cleanName) {
            const upper = cleanName.toUpperCase();
            if (upper.includes('/MRS') || upper.includes('/LADY') || upper.includes('MRS.') || upper.includes('BEGUM') || upper.includes('PARVEEN') || upper.includes('BIBI') || upper.includes('KHATOON') || upper.includes('FATIMA')) {
              pfx = 'MRS';
            } else if (upper.includes('/MS')) {
              pfx = 'MS';
            } else if (upper.includes('/MISS') || upper.includes('MISS.')) {
              pfx = 'CHD_MISS';
            } else if (upper.includes('/CHD') || upper.includes('/CHILD') || upper.includes('MSTR')) {
              pfx = 'CHD_MSTR';
            } else if (upper.includes('/INF') || upper.includes('/INFANT')) {
              pfx = 'INF_MSTR';
            } else if (upper.includes('/MR') || upper.includes('MR.')) {
              pfx = 'MR';
            }
          }
          return {
            sNo: (idx + 1).toString(),
            prefix: pfx,
            name: cleanName,
            passportNo: p.passportNo || '',
            group: p.group || '',
            visaNo: p.visaNo || '',
            hasBed: p.hasBed !== undefined ? Boolean(p.hasBed) : (pfx.startsWith('CHD') || pfx.startsWith('INF') ? false : true)
          };
        });

        setPassengers(loadedPassengers);
        setPaxCounts(computePaxSummary(loadedPassengers));

        const loadedAccommodations = (found.accommodations && found.accommodations.length > 0 ? found.accommodations : [
          { city: 'MAKKAH', hotelCode: '378', hotelName: '', roomType: 'DOUBLE', checkIn: '', checkOut: '', nights: '5' }
        ]).map(acc => ({
          ...acc,
          city: acc.city || 'MAKKAH',
          hotelName: acc.hotelName || acc.hotel_name || '',
          ubNo: acc.ubNo !== undefined ? acc.ubNo : (acc.ub_no || acc.ubNumber || ''),
          hcn: acc.hcn !== undefined ? acc.hcn : (acc.hotelCode || acc.hcn_no || '378'),
          roomType: acc.roomType !== undefined ? acc.roomType : (acc.room_type || acc.rpp || acc.type || 'DOUBLE'),
          checkIn: acc.checkIn || acc.check_in || '',
          checkOut: acc.checkOut || acc.check_out || '',
          nights: acc.nights ? String(acc.nights) : '1',
        }));
        setAccommodations(loadedAccommodations);
        setTransports(found.transports && found.transports.length > 0 ? found.transports : [
          { sNo: '1', tnNo: '317', service: 'JED AIRPORT TO MAKKAH HOTEL', vehicle: 'BUS', pickupDate: '', contactPerson: '', bookingRefNo: '' }
        ]);
        setFlights(found.flights && found.flights.length > 0 ? found.flights : [
          { pnr: 'GDKHVK', date: '2026-10-01', flight: 'F3-830', from: 'KHI', to: 'JED', departure: '08:00', arrival: '10:05' },
          { pnr: 'GDKHVK', date: '2026-10-19', flight: 'F3-829', from: 'JED', to: 'KHI', departure: '12:45', arrival: '07:00' }
        ]);
      };

      const localFound = getVoucherBySlug(slug);
      if (localFound) applyData(localFound);

      fetchSupabaseVoucherBySlug(slug).then((liveFound) => {
        if (liveFound) applyData(liveFound);
      });

      setLoading(false);
    }
  }, [slug]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminLoginForm />;
  }

  if (!voucher) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Voucher Not Found</h2>
        <p className="text-slate-500 mt-2">The requested voucher could not be loaded for editing.</p>
        <Link href="/" className="inline-block mt-4 px-4 py-2 bg-emerald-700 text-white rounded-lg font-bold">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Add passenger row
  const addPassenger = () => {
    const nextList = [
      ...passengers,
      { sNo: (passengers.length + 1).toString(), prefix: 'MR', name: '', passportNo: '', group: '', visaNo: '' },
    ];
    setPassengers(nextList);
    setPaxCounts(computePaxSummary(nextList));
  };

  const removePassenger = (index) => {
    const nextList = passengers.filter((_, i) => i !== index);
    setPassengers(nextList);
    setPaxCounts(computePaxSummary(nextList));
  };

  const updatePassenger = (index, field, value) => {
    const copy = [...passengers];
    copy[index] = { ...copy[index], [field]: value };
    setPassengers(copy);
    setPaxCounts(computePaxSummary(copy));
  };

  // Add Accommodation
  const addAccommodation = () => {
    setAccommodations([
      ...accommodations,
      { city: 'MAKKAH', hotelCode: '378', hotelName: '', roomType: 'DOUBLE', checkIn: '', checkOut: '', nights: '1' },
    ]);
  };

  const removeAccommodation = (index) => {
    setAccommodations(accommodations.filter((_, i) => i !== index));
  };

  const updateAccommodation = (index, field, value) => {
    const copy = [...accommodations];
    const finalVal = (field === 'ubNo' || field === 'hcn' || field === 'hotelCode') && typeof value === 'string' 
      ? value.toUpperCase() 
      : value;
    copy[index] = { ...copy[index], [field]: finalVal };
    
    // Automatically recalculate nights when dates are updated
    if (field === 'checkIn' || field === 'checkOut') {
      const computedNights = calculateNights(copy[index].checkIn, copy[index].checkOut, copy[index].nights);
      if (computedNights > 0) {
        copy[index].nights = String(computedNights);
      }
    }
    setAccommodations(copy);
  };

  // Add Transport
  const addTransport = () => {
    setTransports([
      ...transports,
      { sNo: (transports.length + 1).toString(), tnNo: '317', service: '', vehicle: 'BUS', pickupDate: '', contactPerson: '', bookingRefNo: '' },
    ]);
  };

  const removeTransport = (index) => {
    setTransports(transports.filter((_, i) => i !== index));
  };

  const updateTransport = (index, field, value) => {
    const copy = [...transports];
    copy[index][field] = value;
    setTransports(copy);
  };

  // Add Flight
  const addFlight = () => {
    setFlights([
      ...flights,
      { pnr: '', date: '', flight: '', from: 'KHI', to: 'JED', departure: '', arrival: '' },
    ]);
  };

  const removeFlight = (index) => {
    setFlights(flights.filter((_, i) => i !== index));
  };

  const updateFlight = (index, field, value) => {
    const copy = [...flights];
    copy[index][field] = value;
    setFlights(copy);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!party.trim()) {
      alert('Please provide a Party Name / Family Head');
      return;
    }

    setIsSubmitting(true);

    const cleanParty = party.trim().replace(/(\s*\/\s*(MR|MRS|MS|MISS|CHD|INF|MSTR|MASTER|CHILD|INFANT|LADY|GENT))+\s*$/gi, '').trim().replace(/\s*\/+\s*$/g, '').trim().toUpperCase();

    const processedPassengers = passengers.map((p, idx) => {
      let name = (p.name || '').trim();
      name = name.replace(/(\s*\/\s*(MR|MRS|MS|MISS|CHD|INF|MSTR|MASTER|CHILD|INFANT|LADY|GENT))+\s*$/gi, '').trim();
      name = name.replace(/\s*\/+\s*$/g, '').trim().toUpperCase();
      return {
        ...p,
        sNo: (idx + 1).toString(),
        name,
        passportNo: (p.passportNo || '').trim().toUpperCase(),
      };
    });

    const updatedData = {
      ...voucher,
      companyName,
      party: cleanParty,
      ubNumber: ubNumber.trim(),
      voucherRefNo: ubNumber.trim(),
      isSelfVisa: isSelfVisa,
      groundTransport: groundTransport.trim(),
      makkahHelpline: makkahHelpline.trim(),
      madinahHelpline: madinahHelpline.trim(),
      pakistanHelpline: pakistanHelpline.trim(),
      ksaJeddahAirport: ksaJeddahAirport.trim(),
      ksaJeddahSpecial: ksaJeddahSpecial.trim(),
      ksaJeddahSharing: ksaJeddahSharing.trim(),
      ksaMakkahSharing: ksaMakkahSharing.trim(),
      ksaMakkahSpecial: ksaMakkahSpecial.trim(),
      ksaMadinahSharing: ksaMadinahSharing.trim(),
      ksaMadinahSpecial: ksaMadinahSpecial.trim(),
      slug: voucher.slug || slugify(cleanParty),
      executive,
      paxCounts,
      totalPax: processedPassengers.length,
      passengers: processedPassengers,
      accommodations: accommodations.map(a => ({
        ...a,
        roomType: a.roomType !== undefined ? a.roomType : (a.room_type || a.rpp || a.type || 'DOUBLE'),
      })),
      transports,
      flights,
    };

    await updateVoucher(voucher.slug || voucher.id || slug, updatedData);

    setIsSubmitting(false);
    router.push(`/voucher/${updatedData.slug || slug}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <Link 
          href={`/voucher/${slug}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Voucher</span>
        </Link>
        <span className="text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
          Editing Voucher: {voucher.party}
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-400/30 text-amber-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading">
                Edit Umrah Voucher
              </h1>
              <p className="text-emerald-300 text-xs sm:text-sm mt-0.5">
                Update passenger, hotel, flight, or transport information for this package voucher.
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          
          {/* General Information */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
              <Users className="w-4 h-4 text-emerald-700" />
              General Voucher Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Family Head / Party Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={party}
                  onChange={(e) => setParty(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  UB / Voucher Number <span className="text-slate-500 font-semibold">(System Assigned)</span>
                </label>
                <input 
                  type="text"
                  readOnly
                  value={ubNumber}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-800 font-mono font-bold uppercase cursor-not-allowed select-none focus:outline-none"
                  title="UB Number is system assigned and cannot be edited"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Executive / Agent
                </label>
                <input 
                  type="text"
                  value={executive}
                  onChange={(e) => setExecutive(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-bold text-slate-700 mb-1">
                  SELF VISA HEADER
                </label>
                <label className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={isSelfVisa}
                    onChange={(e) => setIsSelfVisa(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700 select-none">
                    Show "Self Visa (Islamabad)" on top right of voucher
                  </span>
                </label>
              </div>

              <div className="sm:col-span-3">
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>PAX SUMMARY / BREAKDOWN</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Auto-Calculated</span>
                </label>
                <input 
                  type="text"
                  readOnly
                  value={paxCounts}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-800 bg-slate-100 cursor-not-allowed select-none focus:outline-none"
                  title="PAX Summary is automatically calculated based on passengers and prefix selections"
                />
              </div>
            </div>
          </div>

          {/* Operational & Helpline Numbers */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Operational &amp; Helpline Numbers
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ground Transport Helpline
                </label>
                <input 
                  type="text"
                  value={groundTransport}
                  onChange={(e) => setGroundTransport(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  placeholder="+92 328 8189989"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Makkah Helpline
                </label>
                <input 
                  type="text"
                  value={makkahHelpline}
                  onChange={(e) => setMakkahHelpline(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  placeholder="+966 53 649 2846"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Madinah Helpline
                </label>
                <input 
                  type="text"
                  value={madinahHelpline}
                  onChange={(e) => setMadinahHelpline(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  placeholder="+966 57 593 0550"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pakistan 24/7 Helpline
                </label>
                <input 
                  type="text"
                  value={pakistanHelpline}
                  onChange={(e) => setPakistanHelpline(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-bold text-emerald-800"
                  placeholder="+92 311 2264567"
                />
              </div>
            </div>

            {/* KSA Operational Helplines (24/7 Ground Support) Inputs */}
            <div className="pt-4 border-t border-slate-200 mt-4">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#c29648]" />
                <h3 className="text-xs font-bold text-[#0a192f] uppercase tracking-wider">
                  KSA Operational Helplines (24/7 Ground Support Footer)
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="block text-[11px] font-black text-[#805a1b] uppercase mb-1">Jeddah Airport</span>
                  <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Airport (24/7):</label>
                  <input
                    type="text"
                    value={ksaJeddahAirport}
                    onChange={(e) => setKsaJeddahAirport(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="block text-[11px] font-black text-[#805a1b] uppercase mb-1">Jeddah Head Office</span>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Special:</label>
                    <input
                      type="text"
                      value={ksaJeddahSpecial}
                      onChange={(e) => setKsaJeddahSpecial(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Sharing:</label>
                    <input
                      type="text"
                      value={ksaJeddahSharing}
                      onChange={(e) => setKsaJeddahSharing(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="block text-[11px] font-black text-[#805a1b] uppercase mb-1">Makkah Ground</span>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Sharing:</label>
                    <input
                      type="text"
                      value={ksaMakkahSharing}
                      onChange={(e) => setKsaMakkahSharing(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Special:</label>
                    <input
                      type="text"
                      value={ksaMakkahSpecial}
                      onChange={(e) => setKsaMakkahSpecial(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="block text-[11px] font-black text-[#805a1b] uppercase mb-1">Madinah Ground</span>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Sharing:</label>
                    <input
                      type="text"
                      value={ksaMadinahSharing}
                      onChange={(e) => setKsaMadinahSharing(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Special:</label>
                    <input
                      type="text"
                      value={ksaMadinahSpecial}
                      onChange={(e) => setKsaMadinahSpecial(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Passengers / Mutamers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" />
                Mutamers &amp; Pilgrims List ({passengers.length})
              </h2>
              <button
                type="button"
                onClick={addPassenger}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg font-bold text-xs hover:bg-emerald-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Mutamer
              </button>
            </div>

            <div className="space-y-2">
              {passengers.map((pax, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                  <span className="w-6 text-center font-bold text-slate-400 pt-2">
                    #{idx + 1}
                  </span>
                  <div className="flex flex-col gap-1 shrink-0">
                    <select
                      value={pax.prefix || 'MR'}
                      onChange={(e) => {
                        const val = e.target.value;
                        const isChildOrInfant = val.startsWith('CHD') || val.startsWith('INF');
                        const copy = [...passengers];
                        copy[idx] = {
                          ...copy[idx],
                          prefix: val,
                          hasBed: isChildOrInfant ? (copy[idx].hasBed || false) : true
                        };
                        setPassengers(copy);
                        setPaxCounts(computePaxSummary(copy));
                      }}
                      className="w-36 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 shadow-xs"
                      title="Select Prefix / Title"
                    >
                      <option value="MR">Adult (Mr)</option>
                      <option value="MRS">Adult (Mrs)</option>
                      <option value="MS">Adult (Ms)</option>
                      <option value="CHD_MSTR">Child (Mstr)</option>
                      <option value="CHD_MISS">Child (Miss)</option>
                      <option value="INF_MSTR">Infant (Master)</option>
                      <option value="INF_MISS">Infant (Miss)</option>
                    </select>

                    {(pax.prefix?.startsWith('CHD') || pax.prefix?.startsWith('INF')) && (
                      <label className="flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-900 bg-emerald-100/70 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(pax.hasBed)}
                          onChange={(e) => updatePassenger(idx, 'hasBed', e.target.checked)}
                          className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300 cursor-pointer"
                        />
                        <span>Add Bed</span>
                      </label>
                    )}
                  </div>
                  <input 
                    type="text"
                    placeholder="Mutamer Full Name"
                    value={pax.name}
                    onChange={(e) => updatePassenger(idx, 'name', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold text-slate-900 uppercase focus:ring-2 focus:ring-emerald-500"
                  />
                  <input 
                    type="text"
                    placeholder="Passport #"
                    value={pax.passportNo}
                    onChange={(e) => updatePassenger(idx, 'passportNo', e.target.value)}
                    className="w-28 px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono uppercase focus:ring-2 focus:ring-emerald-500"
                  />
                  <input 
                    type="text"
                    placeholder="Visa #"
                    value={pax.visaNo || ''}
                    onChange={(e) => updatePassenger(idx, 'visaNo', e.target.value)}
                    className="w-24 px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                  {passengers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePassenger(idx)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Remove Passenger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Accommodations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                Accommodations / Hotels ({accommodations.length})
              </h2>
              <button
                type="button"
                onClick={addAccommodation}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg font-bold text-xs hover:bg-emerald-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Hotel
              </button>
            </div>

            <div className="space-y-2">
              {accommodations.map((acc, idx) => {
                const computedNights = calculateNights(acc.checkIn, acc.checkOut, acc.nights);
                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 items-center text-xs">
                    <div className="col-span-2">
                      <select
                        value={acc.city}
                        onChange={(e) => updateAccommodation(idx, 'city', e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white font-bold text-slate-800"
                      >
                        <option value="MAKKAH">Makkah</option>
                        <option value="MADINAH">Madinah</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input 
                        type="text"
                        placeholder="Hotel Name"
                        value={acc.hotelName}
                        onChange={(e) => updateAccommodation(idx, 'hotelName', e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white font-semibold text-slate-900"
                      />
                    </div>
                    <div className="col-span-1">
                      <input 
                        type="text"
                        placeholder="UB #"
                        value={acc.ubNo !== undefined ? acc.ubNo : ''}
                        onChange={(e) => updateAccommodation(idx, 'ubNo', e.target.value.toUpperCase())}
                        className="w-full px-1.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-center text-[11px] font-bold uppercase text-[#0a192f]"
                        title="Hotel UB Number"
                      />
                    </div>
                    <div className="col-span-1">
                      <input 
                        type="text"
                        placeholder="HCN#"
                        value={acc.hcn !== undefined ? acc.hcn : (acc.hotelCode || '')}
                        onChange={(e) => updateAccommodation(idx, 'hcn', e.target.value.toUpperCase())}
                        className="w-full px-1.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-center text-[11px] uppercase font-bold"
                        title="Hotel Confirmation / Contract Number (HCN#)"
                      />
                    </div>
                    <div className="col-span-2">
                      <input 
                        type="text"
                        placeholder="Room Type"
                        value={acc.roomType !== undefined ? acc.roomType : (acc.room_type || acc.rpp || acc.type || '')}
                        onChange={(e) => updateAccommodation(idx, 'roomType', e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white font-medium text-slate-900"
                      />
                    </div>
                    <div className="col-span-1.5">
                      <input 
                        type="text"
                        placeholder="Check-in"
                        value={acc.checkIn}
                        onChange={(e) => updateAccommodation(idx, 'checkIn', e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-[11px]"
                      />
                    </div>
                    <div className="col-span-1.5">
                      <input 
                        type="text"
                        placeholder="Check-out"
                        value={acc.checkOut}
                        onChange={(e) => updateAccommodation(idx, 'checkOut', e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-[11px]"
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      <span className="px-1.5 py-1 bg-amber-100 text-amber-900 font-bold rounded text-[11px] whitespace-nowrap" title="Calculated Nights">
                        {computedNights}N
                      </span>
                      {accommodations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAccommodation(idx)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Remove Hotel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transport Services */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bus className="w-4 h-4 text-emerald-700" />
                Transport Services ({transports.length})
              </h2>
              <button
                type="button"
                onClick={addTransport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg font-bold text-xs hover:bg-emerald-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Sector
              </button>
            </div>

            <div className="space-y-2">
              {transports.map((t, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 items-center text-xs">
                  <div className="col-span-2">
                    <input 
                      type="text"
                      placeholder="Date (01-Oct-2026)"
                      value={t.pickupDate || ''}
                      onChange={(e) => updateTransport(idx, 'pickupDate', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-[11px] font-mono"
                    />
                  </div>
                  <div className="col-span-4">
                    <input 
                      type="text"
                      placeholder="Description (e.g. JED AIRPORT TO MAKKAH HOTEL)"
                      value={t.service || ''}
                      onChange={(e) => updateTransport(idx, 'service', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-medium text-slate-800"
                    />
                  </div>
                  <div className="col-span-3">
                    <input 
                      type="text"
                      placeholder="Transporter (e.g. Company Transport)"
                      value={t.transporter !== undefined ? t.transporter : (idx === 0 || t.vehicle?.toUpperCase() === 'BUS' ? 'Company Transport' : 'Private Transport')}
                      onChange={(e) => updateTransport(idx, 'transporter', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-semibold text-slate-900"
                    />
                  </div>
                  <div className="col-span-2">
                    <input 
                      type="text"
                      placeholder="Type (e.g. BUS, GMC)"
                      value={t.vehicle || ''}
                      onChange={(e) => updateTransport(idx, 'vehicle', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white uppercase font-mono"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    {transports.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTransport(idx)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Remove Sector"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flights */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plane className="w-4 h-4 text-emerald-700" />
                Flight Schedule ({flights.length})
              </h2>
              <button
                type="button"
                onClick={addFlight}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg font-bold text-xs hover:bg-emerald-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Flight
              </button>
            </div>

            <div className="space-y-2">
              {flights.map((f, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 items-center text-xs">
                  <div className="col-span-2">
                    <input 
                      type="text"
                      placeholder="PNR (GDKHVK)"
                      value={f.pnr || ''}
                      onChange={(e) => updateFlight(idx, 'pnr', e.target.value.toUpperCase())}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white font-mono font-bold uppercase text-emerald-950"
                      title="PNR Number"
                    />
                  </div>
                  <div className="col-span-2">
                    <input 
                      type="text"
                      placeholder="Flight (F3-830)"
                      value={f.flight}
                      onChange={(e) => updateFlight(idx, 'flight', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white font-mono font-bold"
                    />
                  </div>
                  <div className="col-span-2">
                    <input 
                      type="text"
                      placeholder="Date (01-Oct-2026)"
                      value={f.date}
                      onChange={(e) => updateFlight(idx, 'date', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-[11px]"
                    />
                  </div>
                  <div className="col-span-1">
                    <input 
                      type="text"
                      placeholder="From"
                      value={f.from}
                      onChange={(e) => updateFlight(idx, 'from', e.target.value)}
                      className="w-full px-1.5 py-1.5 border border-slate-300 rounded bg-white font-mono uppercase text-center"
                    />
                  </div>
                  <div className="col-span-1">
                    <input 
                      type="text"
                      placeholder="To"
                      value={f.to}
                      onChange={(e) => updateFlight(idx, 'to', e.target.value)}
                      className="w-full px-1.5 py-1.5 border border-slate-300 rounded bg-white font-mono uppercase text-center"
                    />
                  </div>
                  <div className="col-span-3 flex items-center gap-1">
                    <input 
                      type="text"
                      placeholder="Dep (08:00)"
                      value={f.departure}
                      onChange={(e) => updateFlight(idx, 'departure', e.target.value)}
                      className="w-1/2 px-2 py-1.5 border border-slate-300 rounded bg-white font-mono text-[11px]"
                    />
                    <input 
                      type="text"
                      placeholder="Arr (10:05)"
                      value={f.arrival}
                      onChange={(e) => updateFlight(idx, 'arrival', e.target.value)}
                      className="w-1/2 px-2 py-1.5 border border-slate-300 rounded bg-white font-mono text-[11px]"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    {flights.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFlight(idx)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Remove Flight"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link 
              href={`/voucher/${slug}`}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>{isSubmitting ? 'Saving Changes...' : 'Save & Update Voucher'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
