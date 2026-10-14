'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveCustomVoucher, slugify, getAllVouchers, fetchSupabaseVouchers } from '../../lib/vouchersData';
import { calculateNights, computePaxSummary } from '../../lib/dateUtils';
import { useAuth } from '../../lib/AuthContext';
import AdminLoginForm from '../../components/AdminLoginForm';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  Building2, 
  Bus, 
  Plane, 
  Users, 
  ShieldCheck, 
  FileText 
} from 'lucide-react';

export default function CreateVoucherPage() {
  const router = useRouter();
  const { isAdmin, isLoaded } = useAuth();

  const [companyName, setCompanyName] = useState('CHEEPA FJ TRAVELS');
  const [phone, setPhone] = useState('MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683');
  const [emergencyContact, setEmergencyContact] = useState('+966 50 627 7492');
  const [party, setParty] = useState('');
  const [ubNumber, setUbNumber] = useState('UB-0013');
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
  const [executive, setExecutive] = useState('MUHAMMAD FAIZAN');
  const [isSelfVisa, setIsSelfVisa] = useState(true);
  const [passengers, setPassengers] = useState([
    { sNo: '1', prefix: 'MR', name: '', passportNo: '', group: '', visaNo: '', hasBed: true },
  ]);
  const [paxCounts, setPaxCounts] = useState('GENT(S): 1  LAD(IES): 0  CHILD(REN): 0  INFANT(S): 0');

  const [accommodations, setAccommodations] = useState([
    { city: 'MAKKAH', hotelCode: '378', hotelName: '', roomType: 'DOUBLE', checkIn: '', checkOut: '', nights: '5' },
    { city: 'MADINAH', hotelCode: '378', hotelName: '', roomType: 'DOUBLE', checkIn: '', checkOut: '', nights: '5' },
  ]);
  const [transports, setTransports] = useState([
    { sNo: '1', tnNo: '317', service: 'JED AIRPORT TO MAKKAH HOTEL', vehicle: 'BUS', pickupDate: '', contactPerson: '', bookingRefNo: '' },
  ]);
  const [flights, setFlights] = useState([
    { pnr: '', date: '', flight: '', from: 'KHI', to: 'JED', departure: '', arrival: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSupabaseVouchers().then(list => {
      const all = list && list.length > 0 ? list : getAllVouchers();
      let maxNum = 0;
      all.forEach(v => {
        const ref = v.ubNumber || v.voucherRefNo || '';
        const match = ref.match(/UB-(\d+)/i);
        if (match) {
          const n = parseInt(match[1]);
          if (!isNaN(n) && n > maxNum && n < 9000) maxNum = n;
        } else if (v.id && !isNaN(parseInt(v.id))) {
          const n = parseInt(v.id);
          if (n > maxNum) maxNum = n;
        }
      });
      const nextNum = (maxNum || all.length || 0) + 1;
      setUbNumber(`UB-${String(nextNum).padStart(4, '0')}`);
    });
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminLoginForm />;
  }

  // Add passenger row
  const addPassenger = () => {
    const nextList = [
      ...passengers,
      { sNo: (passengers.length + 1).toString(), prefix: 'MR', name: '', passportNo: '', group: '', visaNo: '', hasBed: true },
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
    
    // Auto-calculate nights if checkIn or checkOut changes
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
    copy[index] = { ...copy[index], [field]: value };
    setTransports(copy);
  };

  // Add Flight
  const addFlight = () => {
    setFlights([
      ...flights,
      { pnr: '', date: '', flight: '', from: '', to: '', departure: '', arrival: '' },
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
      alert('Please enter a Party / Lead Passenger Name');
      return;
    }

    setIsSubmitting(true);
    const cleanParty = party.trim().replace(/(\s*\/\s*(MR|MRS|MS|MISS|CHD|INF|MSTR|MASTER|CHILD|INFANT|LADY|GENT))+\s*$/gi, '').trim().replace(/\s*\/+\s*$/g, '').trim().toUpperCase();
    const partySlug = slugify(cleanParty) || 'voucher-' + Date.now();

    const formattedPassengers = passengers
      .filter((p) => p.name.trim() !== '')
      .map((p, idx) => {
        let fullName = p.name.trim();
        fullName = fullName.replace(/(\s*\/\s*(MR|MRS|MS|MISS|CHD|INF|MSTR|MASTER|CHILD|INFANT|LADY|GENT))+\s*$/gi, '').trim();
        fullName = fullName.replace(/\s*\/+\s*$/g, '').trim().toUpperCase();
        return {
          ...p,
          sNo: (idx + 1).toString(),
          name: fullName,
          passportNo: (p.passportNo || '').trim().toUpperCase(),
        };
      });

    const newVoucher = {
      id: 'custom-' + Date.now(),
      sheetName: `Voucher - ${cleanParty}`,
      companyName,
      emergencyContact,
      phone,
      voucherTitle: 'UMRAH PACKAGE VOUCHER',
      voucherDate: new Date().toISOString(),
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
      slug: partySlug,
      executive,
      paxCounts,
      totalPax: formattedPassengers.length || 1,
      passengers: formattedPassengers,
      accommodations: accommodations.filter((a) => a.hotelName.trim() !== ''),
      transports: transports.filter((t) => t.service.trim() !== ''),
      flights: flights.filter((f) => f.flight.trim() !== ''),
    };

    await saveCustomVoucher(newVoucher);

    setTimeout(() => {
      router.push(`/voucher/${partySlug}`);
    }, 400);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Back Link */}
        <div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Vouchers</span>
          </Link>
        </div>

        {/* Header */}
        <div className="bg-emerald-950 text-white p-6 sm:p-8 rounded-2xl shadow-lg border border-emerald-800 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create New Umrah Voucher</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading">
            Voucher Generator &amp; QR Code Maker
          </h1>
          <p className="text-emerald-200/80 text-xs sm:text-sm">
            Fill in the details below. Once generated, a custom URL slug (e.g. <code>/voucher/party-name</code>) and live QR code will be instantly created.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          
          {/* Section 1: Agency & Party Info */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>1. Party &amp; Agency Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PARTY / LEAD PASSENGER NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MUHAMMAD TARIQ / MR"
                  value={party}
                  onChange={(e) => setParty(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white uppercase font-bold"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  URL: <span className="font-mono text-emerald-700 font-semibold">/voucher/{slugify(party) || 'party-name'}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  UB / VOUCHER NO (AUTO-GENERATED)
                </label>
                <input
                  type="text"
                  readOnly
                  value={ubNumber}
                  className="w-full px-3.5 py-2 text-sm bg-slate-100/90 border border-slate-300 rounded-xl font-mono font-bold uppercase text-emerald-950 cursor-not-allowed select-none focus:outline-none"
                  title="UB Number is automatically assigned sequence-wise and cannot be edited"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  EXECUTIVE IN CHARGE
                </label>
                <input
                  type="text"
                  value={executive}
                  onChange={(e) => setExecutive(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
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
                    Self Visa (Islamabad)
                  </span>
                </label>
              </div>
            </div>

            {/* Helplines Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Ground Transport Helpline</label>
                <input
                  type="text"
                  value={groundTransport}
                  onChange={(e) => setGroundTransport(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Makkah Helpline</label>
                <input
                  type="text"
                  value={makkahHelpline}
                  onChange={(e) => setMakkahHelpline(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Madinah Helpline</label>
                <input
                  type="text"
                  value={madinahHelpline}
                  onChange={(e) => setMadinahHelpline(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Pakistan 24/7 Helpline</label>
                <input
                  type="text"
                  value={pakistanHelpline}
                  onChange={(e) => setPakistanHelpline(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-emerald-800"
                />
              </div>
            </div>

            {/* KSA Operational Helplines (24/7 Ground Support) Inputs */}
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-2">
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
                    className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-slate-800"
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
                      className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Sharing:</label>
                    <input
                      type="text"
                      value={ksaJeddahSharing}
                      onChange={(e) => setKsaJeddahSharing(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-slate-800"
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
                      className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Special:</label>
                    <input
                      type="text"
                      value={ksaMakkahSpecial}
                      onChange={(e) => setKsaMakkahSpecial(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-slate-800"
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
                      className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Special:</label>
                    <input
                      type="text"
                      value={ksaMadinahSpecial}
                      onChange={(e) => setKsaMadinahSpecial(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency & Pax Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  EMERGENCY CONTACT (KSA)
                </label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>PAX SUMMARY / BREAKDOWN</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Auto-Calculated</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={paxCounts}
                  className="w-full px-3.5 py-2 text-sm bg-slate-100 border border-slate-300 rounded-xl font-bold text-slate-800 cursor-not-allowed select-none focus:outline-none"
                  title="PAX Summary is automatically calculated based on passengers and prefix selections"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Passengers */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" />
                <span>2. Passengers (PAX) List ({passengers.length})</span>
              </h2>
              <button
                type="button"
                onClick={addPassenger}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Passenger</span>
              </button>
            </div>

            <div className="space-y-3">
              {passengers.map((pax, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200">
                  <span className="w-6 text-center font-bold text-xs text-slate-400 pt-2">
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
                    placeholder="Passenger Full Name"
                    value={pax.name}
                    onChange={(e) => updatePassenger(idx, 'name', e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 uppercase font-semibold"
                  />
                  <input
                    type="text"
                    placeholder="Passport #"
                    value={pax.passportNo}
                    onChange={(e) => updatePassenger(idx, 'passportNo', e.target.value)}
                    className="w-28 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono uppercase focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Visa #"
                    value={pax.visaNo}
                    onChange={(e) => updatePassenger(idx, 'visaNo', e.target.value)}
                    className="w-24 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                  {passengers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePassenger(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors pt-2"
                      title="Remove Passenger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Accommodation */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span>3. Accommodation Details</span>
              </h2>
              <button
                type="button"
                onClick={addAccommodation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Hotel</span>
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
                        <option value="MAKKAH">MAKKAH</option>
                        <option value="MADINAH">MADINAH</option>
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
                        placeholder="Room Type (e.g. DOUBLE)"
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

          {/* Section 4: Transport Services */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                <Bus className="w-4 h-4 text-emerald-700" />
                <span>4. Transport Services ({transports.length})</span>
              </h2>
              <button
                type="button"
                onClick={addTransport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Sector</span>
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

          {/* Section 5: Flight Schedule */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                <Plane className="w-4 h-4 text-emerald-700" />
                <span>5. Flight Schedule ({flights.length})</span>
              </h2>
              <button
                type="button"
                onClick={addFlight}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Flight</span>
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

          {/* Submit Button */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-900 to-teal-800 hover:from-emerald-800 hover:to-teal-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Generating...' : 'Create Voucher & Generate QR Code'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
