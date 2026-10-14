'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Calculator, 
  PlusCircle, 
  Receipt, 
  Percent, 
  DollarSign, 
  Calendar, 
  Users, 
  ArrowRight, 
  ArrowLeft,
  ExternalLink, 
  Search, 
  CheckCircle2, 
  Sparkles, 
  FileText,
  Building2,
  Plane,
  Bus,
  ShieldCheck,
  RefreshCw,
  Trash2,
  ChevronDown,
  Layers,
  Check,
  Eye,
  SlidersHorizontal,
  BookmarkPlus,
  Save,
  RotateCcw,
  Pencil,
  Plus
} from 'lucide-react';
import { 
  saveEstimate, 
  deleteEstimate,
  convertEstimateToInvoice, 
  getAllEstimates,
  DEFAULT_REGISTERED_HOTELS,
  getHotelRate,
  saveRegisteredHotelRate,
  getRegisteredHotelRates,
  getHotelDistance,
  saveRegisteredHotelDistance
} from '../../lib/erpData';
import HotelCombobox from './HotelCombobox';
import CustomDatePicker from './CustomDatePicker';

export default function CostEstimator({ 
  estimates = [], 
  parties = [], 
  onEstimatesUpdated, 
  onInvoiceCreated 
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isConvertingId, setIsConvertingId] = useState(null);
  const [activeView, setActiveView] = useState('SAVED_PROPOSALS'); // 'SAVED_PROPOSALS' | 'CALCULATOR'
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);
  const [showAltSharing, setShowAltSharing] = useState(false);
  const [editingProposalId, setEditingProposalId] = useState(null); // Active PID or null for new
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // -------------------------------------------------------------
  // CALCULATOR ENGINE STATE
  // -------------------------------------------------------------
  // 1. Currency Exchange Rate
  const [sarToPkr, setSarToPkr] = useState(74.50);

  // 2. Party & Group Info
  const [selectedPartyUid, setSelectedPartyUid] = useState(parties[0]?.partyHeadUid || 'CUSTOM');
  const [partyName, setPartyName] = useState(parties[0]?.partyName || 'MOHAMMED AHMED KHAN');
  const [contactPhone, setContactPhone] = useState(parties[0]?.contactPhone || '0311-2264567');
  const [packageTitle, setPackageTitle] = useState('15 Days Executive Umrah Package');
  const [adultsCount, setAdultsCount] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [infantsCount, setInfantsCount] = useState(0);

  const getBedsForRoomType = (type) => {
    switch (type) {
      case 'Single': return 1;
      case 'Double': return 2;
      case 'Triple': return 3;
      case 'Quad': return 4;
      case 'Sharing': return 4;
      default: return 4;
    }
  };

  // 3. Holy Cities Hotel Accommodations (Dynamic Multi-Hotel Array)
  const [hotels, setHotels] = useState([
    {
      id: 'stay-1',
      city: 'Makkah',
      hotelName: 'VOCO 5 STAR',
      distance: '850m from Haram',
      nights: 8,
      ratePerNightSar: 550,
      roomType: 'Quad',
      bedsPerRoom: 4,
      ratePerPaxSar: 137.5,
      rateModified: false,
      saveStatus: '',
    },
    {
      id: 'stay-2',
      city: 'Medinah',
      hotelName: 'GULNAR HV',
      distance: '150m from Nabawi',
      nights: 7,
      ratePerNightSar: 480,
      roomType: 'Quad',
      bedsPerRoom: 4,
      ratePerPaxSar: 120,
      rateModified: false,
      saveStatus: '',
    },
  ]);

  // Update a specific hotel item by index
  const updateHotel = (index, updates) => {
    setHotels(prev => prev.map((h, idx) => idx === index ? { ...h, ...updates } : h));
  };

  // Add a new hotel stay
  const handleAddHotel = () => {
    const lastCity = hotels[hotels.length - 1]?.city || 'Makkah';
    const isLastMakkah = lastCity.toLowerCase().includes('makkah');
    const nextCity = isLastMakkah ? 'Medinah' : 'Makkah';
    const defaultHotel = nextCity === 'Makkah' ? 'VOCO 5 STAR' : 'GULNAR HV';
    const defaultRoomType = 'Quad';
    const defaultBeds = 4;
    const defaultNights = 5;
    const savedRate = getHotelRate(defaultHotel, defaultRoomType) || (nextCity === 'Makkah' ? 550 : 480);
    const perPax = parseFloat((savedRate / defaultBeds).toFixed(2));

    setHotels(prev => [
      ...prev,
      {
        id: `stay-${Date.now()}-${prev.length + 1}`,
        city: nextCity,
        hotelName: defaultHotel,
        distance: '',
        nights: defaultNights,
        ratePerNightSar: savedRate,
        roomType: defaultRoomType,
        bedsPerRoom: defaultBeds,
        ratePerPaxSar: perPax,
        rateModified: false,
        saveStatus: '',
      }
    ]);
  };

  // Remove a hotel stay
  const handleRemoveHotel = (index) => {
    if (hotels.length <= 1) {
      alert('At least one hotel accommodation is required.');
      return;
    }
    setHotels(prev => prev.filter((_, idx) => idx !== index));
  };

  // Hotel city change
  const handleHotelCityChange = (index, newCity) => {
    const current = hotels[index];
    const isMakkah = newCity.toLowerCase().includes('makkah');
    const isMedinah = newCity.toLowerCase().includes('medin') || newCity.toLowerCase().includes('madin');
    let nextHotelName = current.hotelName;

    if (isMakkah && !nextHotelName.toLowerCase().includes('makkah') && nextHotelName !== 'VOCO 5 STAR') {
      nextHotelName = 'VOCO 5 STAR';
    } else if (isMedinah && (nextHotelName === 'VOCO 5 STAR' || nextHotelName.toLowerCase().includes('makkah'))) {
      nextHotelName = 'GULNAR HV';
    } else if (newCity.toLowerCase().includes('jeddah')) {
      nextHotelName = 'CLARION HOTEL JEDDAH AIRPORT';
    }

    const rate = getHotelRate(nextHotelName, current.roomType);
    const beds = Math.max(1, parseInt(current.bedsPerRoom) || 1);
    let newRate = current.ratePerNightSar;
    let newPax = current.ratePerPaxSar;
    if (rate !== null && rate > 0) {
      newRate = rate;
      newPax = parseFloat((rate / beds).toFixed(2));
    }

    updateHotel(index, {
      city: newCity,
      hotelName: nextHotelName,
      ratePerNightSar: newRate,
      ratePerPaxSar: newPax,
      rateModified: false,
      saveStatus: '',
    });
  };

  // Hotel name change
  const handleHotelNameChange = (index, newHotel) => {
    const current = hotels[index];
    const rate = getHotelRate(newHotel, current.roomType);
    const regDist = getHotelDistance(newHotel);
    const beds = Math.max(1, parseInt(current.bedsPerRoom) || 1);
    let newRate = current.ratePerNightSar;
    let newPax = current.ratePerPaxSar;
    if (rate !== null && rate > 0) {
      newRate = rate;
      newPax = parseFloat((rate / beds).toFixed(2));
    }

    updateHotel(index, {
      hotelName: newHotel,
      distance: regDist || current.distance || '',
      distanceModified: false,
      ratePerNightSar: newRate,
      ratePerPaxSar: newPax,
      rateModified: false,
      saveStatus: '',
    });
  };

  // Hotel distance change
  const handleHotelDistanceChange = (index, val) => {
    const current = hotels[index];
    const regDist = getHotelDistance(current.hotelName);
    const isDifferent = (val || '').trim() !== (regDist || '').trim();

    updateHotel(index, {
      distance: val,
      distanceModified: isDifferent,
      rateModified: isDifferent || current.rateModified,
      saveStatus: '',
    });
  };

  // Room type change
  const handleHotelRoomTypeChange = (index, newType) => {
    const current = hotels[index];
    const defaultBeds = getBedsForRoomType(newType);
    const rate = getHotelRate(current.hotelName, newType);
    let newRate = current.ratePerNightSar;
    let newPax = current.ratePerPaxSar;

    if (rate !== null && rate > 0) {
      newRate = rate;
      newPax = parseFloat((rate / defaultBeds).toFixed(2));
    } else if (newRate && parseFloat(newRate) > 0) {
      newPax = parseFloat(((parseFloat(newRate) || 0) / defaultBeds).toFixed(2));
    }

    updateHotel(index, {
      roomType: newType,
      bedsPerRoom: defaultBeds,
      ratePerNightSar: newRate,
      ratePerPaxSar: newPax,
      rateModified: false,
      saveStatus: '',
    });
  };

  // Nights change
  const handleHotelNightsChange = (index, val) => {
    updateHotel(index, { nights: val });
  };

  // Rate per night change
  const handleHotelRatePerNightChange = (index, val) => {
    const current = hotels[index];
    const num = parseFloat(val);
    const beds = Math.max(1, parseInt(current.bedsPerRoom) || 1);
    const newPax = (!isNaN(num) && num > 0) ? parseFloat((num / beds).toFixed(2)) : '';

    updateHotel(index, {
      ratePerNightSar: val,
      ratePerPaxSar: newPax,
      rateModified: true,
      saveStatus: '',
    });
  };

  // Rate per pax change
  const handleHotelRatePerPaxChange = (index, val) => {
    const current = hotels[index];
    const num = parseFloat(val);
    const beds = Math.max(1, parseInt(current.bedsPerRoom) || 1);
    const newRate = (!isNaN(num) && num > 0) ? Math.round(num * beds * 100) / 100 : '';

    updateHotel(index, {
      ratePerPaxSar: val,
      ratePerNightSar: newRate,
      rateModified: true,
      saveStatus: '',
    });
  };

  // Beds per room change
  const handleHotelBedsChange = (index, val) => {
    const current = hotels[index];
    const beds = Math.max(1, parseInt(val) || 1);
    let newRate = current.ratePerNightSar;
    let newPax = current.ratePerPaxSar;

    if (current.ratePerPaxSar && parseFloat(current.ratePerPaxSar) > 0) {
      newRate = Math.round((parseFloat(current.ratePerPaxSar) || 0) * beds * 100) / 100;
    } else if (current.ratePerNightSar && parseFloat(current.ratePerNightSar) > 0) {
      newPax = parseFloat(((parseFloat(current.ratePerNightSar) || 0) / beds).toFixed(2));
    }

    updateHotel(index, {
      bedsPerRoom: val,
      ratePerNightSar: newRate,
      ratePerPaxSar: newPax,
      rateModified: true,
      saveStatus: '',
    });
  };

  // Save changes (rate + distance) to registry in-place
  const handleSaveHotelChanges = (index) => {
    const current = hotels[index];
    if (!current) return;
    const cleanHotel = (current.hotelName || '').trim();
    if (!cleanHotel) {
      alert('Please enter or select a hotel first.');
      return;
    }
    const numRate = parseFloat(current.ratePerNightSar) || 0;
    if (numRate > 0) {
      saveRegisteredHotelRate(cleanHotel, current.roomType, numRate);
    }
    if (current.distance !== undefined) {
      saveRegisteredHotelDistance(cleanHotel, current.distance);
    }

    updateHotel(index, {
      rateModified: false,
      distanceModified: false,
      saveStatus: 'SAVED',
    });
    setTimeout(() => {
      setHotels(prev => prev.map((item, idx) => idx === index ? { ...item, saveStatus: '' } : item));
    }, 4000);
  };

  const handleSaveHotelRate = handleSaveHotelChanges;

  // Don't save rate and distance
  const handleDontSaveHotelChanges = (index) => {
    updateHotel(index, {
      rateModified: false,
      distanceModified: false,
      saveStatus: 'NOT_SAVED',
    });
    setTimeout(() => {
      setHotels(prev => prev.map((item, idx) => idx === index ? { ...item, saveStatus: '' } : item));
    }, 4000);
  };

  const handleDontSaveHotelRate = handleDontSaveHotelChanges;

  // 5. Ground Transport & Holy Ziyarat (in SAR)
  const [transportSector, setTransportSector] = useState('Full Circuit (JED-MAK-MED-JED)');
  const [transportVehicle, setTransportVehicle] = useState('Private GMC 7-Seater');
  const [transportCostSar, setTransportCostSar] = useState(900);
  const [includeZiyarat, setIncludeZiyarat] = useState(true);
  const [ziyaratCostSar, setZiyaratCostSar] = useState(250);
  const [ziyaratPlaces, setZiyaratPlaces] = useState(['Makkah', 'Madinah']);
  const [newZiyaratInput, setNewZiyaratInput] = useState('');
  const [showAddZiyaratInput, setShowAddZiyaratInput] = useState(false);

  const handleToggleZiyaratPlace = (place) => {
    setZiyaratPlaces(prev => {
      if (prev.includes(place)) {
        return prev.filter(p => p !== place);
      } else {
        return [...prev, place];
      }
    });
  };

  const handleAddZiyaratPlace = () => {
    const clean = (newZiyaratInput || '').trim();
    if (!clean) return;
    if (!ziyaratPlaces.map(p => p.toLowerCase()).includes(clean.toLowerCase())) {
      setZiyaratPlaces(prev => [...prev, clean]);
    }
    setNewZiyaratInput('');
    setShowAddZiyaratInput(false);
  };

  const handleRemoveZiyaratPlace = (place) => {
    setZiyaratPlaces(prev => prev.filter(p => p !== place));
  };

  // 6. Visa & Health Insurance (in SAR per pax)
  const [visaFeeAdultSar, setVisaFeeAdultSar] = useState(550);
  const [visaFeeChildSar, setVisaFeeChildSar] = useState(550);
  const [visaFeeInfantSar, setVisaFeeInfantSar] = useState(250);

  // 7. Airline Flights (in PKR per pax)
  const [airlineCarrier, setAirlineCarrier] = useState('Saudia Airlines');
  const [flightType, setFlightType] = useState('Direct'); // 'Direct' | 'Connecting'
  const [flightDateFrom, setFlightDateFrom] = useState('');
  const [flightDateTo, setFlightDateTo] = useState('');
  const [flightCostAdultPkr, setFlightCostAdultPkr] = useState(135000);
  const [flightCostChildPkr, setFlightCostChildPkr] = useState(120000);
  const [flightCostInfantPkr, setFlightCostInfantPkr] = useState(35000);

  // Decide duration by flight dates if provided
  const flightDurationNights = useMemo(() => {
    if (flightDateFrom && flightDateTo) {
      const d1 = new Date(flightDateFrom);
      const d2 = new Date(flightDateTo);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d2 > d1) {
        return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      }
    }
    return null;
  }, [flightDateFrom, flightDateTo]);

  // 8. Commercial Margin / Profit Markup
  const [marginType, setMarginType] = useState('PERCENT'); // 'PERCENT' | 'FIXED_PER_PAX'
  const [marginPercent, setMarginPercent] = useState(12);
  const [marginFixedPerPax, setMarginFixedPerPax] = useState(15000);

  // -------------------------------------------------------------
  // LOGICAL CALCULATIONS
  // -------------------------------------------------------------
  const totalPax = (parseInt(adultsCount) || 0) + (parseInt(childrenCount) || 0) + (parseInt(infantsCount) || 0);
  const payingPax = Math.max(1, (parseInt(adultsCount) || 0) + (parseInt(childrenCount) || 0));
  const rateMultiplier = parseFloat(sarToPkr) || 74.5;

  // Sharing divisors for room calculation
  const getSharingDivisor = (type) => {
    switch (type) {
      case 'Single': return 1;
      case 'Double': return 2;
      case 'Triple': return 3;
      case 'Quad': return 4;
      case 'Sharing': return 4;
      default: return 4;
    }
  };

  const calculations = useMemo(() => {
    // Hotel Total Room Costs in SAR across all hotels
    let totalRoomSar = 0;
    let hotelCostPerPaxSar = 0;
    let quadHotelPaxSar = 0;
    let tripleHotelPaxSar = 0;
    let doubleHotelPaxSar = 0;
    let totalNights = 0;

    hotels.forEach(h => {
      const nights = parseInt(h.nights) || 0;
      totalNights += nights;
      const ratePerNight = parseFloat(h.ratePerNightSar) || 0;
      const roomCost = ratePerNight * nights;
      totalRoomSar += roomCost;

      const divisor = Math.max(1, parseInt(h.bedsPerRoom) || getSharingDivisor(h.roomType));
      hotelCostPerPaxSar += roomCost / divisor;

      // Alternative hypothetical rates if agent compares tiers
      const qRate = (h.roomType === 'Quad') ? ratePerNight : (getHotelRate(h.hotelName, 'Quad') || (ratePerNight * (4 / divisor)));
      quadHotelPaxSar += (qRate * nights) / 4;

      const tRate = (h.roomType === 'Triple') ? ratePerNight : (getHotelRate(h.hotelName, 'Triple') || (ratePerNight * (3 / divisor)));
      tripleHotelPaxSar += (tRate * nights) / 3;

      const dRate = (h.roomType === 'Double') ? ratePerNight : (getHotelRate(h.hotelName, 'Double') || (ratePerNight * (2 / divisor)));
      doubleHotelPaxSar += (dRate * nights) / 2;
    });

    // Total group hotel in SAR & PKR
    const totalGroupHotelSar = hotelCostPerPaxSar * payingPax;
    const totalGroupHotelPkr = Math.round(totalGroupHotelSar * rateMultiplier);

    // Dynamic Visa Cost for Adults, Children, and Infants
    const adultVisaSar = (parseInt(adultsCount) || 0) * (parseFloat(visaFeeAdultSar) || 0);
    const childVisaSar = (parseInt(childrenCount) || 0) * (parseFloat(visaFeeChildSar) || 0);
    const infantVisaSar = (parseInt(infantsCount) || 0) * (parseFloat(visaFeeInfantSar) || 0);
    const totalVisaSar = adultVisaSar + childVisaSar + infantVisaSar;
    const totalVisaPkr = Math.round(totalVisaSar * rateMultiplier);
    const visaPerPaxPkr = Math.round(totalVisaPkr / Math.max(1, totalPax));

    // Ground Transport & Ziyarat
    const transportTotalSar = (parseFloat(transportCostSar) || 0);
    const transportOnlyPkr = Math.round(transportTotalSar * rateMultiplier);
    const ziyaratTotalSar = includeZiyarat ? (parseFloat(ziyaratCostSar) || 0) : 0;
    const ziyaratOnlyPkr = Math.round(ziyaratTotalSar * rateMultiplier);
    const logisticsSar = transportTotalSar + ziyaratTotalSar;
    const logisticsPkr = transportOnlyPkr + ziyaratOnlyPkr;

    // Flight Costs in PKR
    const adultFlightsPkr = (parseInt(adultsCount) || 0) * (parseFloat(flightCostAdultPkr) || 0);
    const childFlightsPkr = (parseInt(childrenCount) || 0) * (parseFloat(flightCostChildPkr) || 0);
    const infantFlightsPkr = (parseInt(infantsCount) || 0) * (parseFloat(flightCostInfantPkr) || 0);
    const totalFlightsPkr = adultFlightsPkr + childFlightsPkr + infantFlightsPkr;

    // Total Net Base Cost in PKR
    const netSubtotalPkr = totalGroupHotelPkr + totalVisaPkr + logisticsPkr + totalFlightsPkr;

    // Margin Calculation
    let marginAmountPkr = 0;
    if (marginType === 'PERCENT') {
      marginAmountPkr = Math.round(netSubtotalPkr * ((parseFloat(marginPercent) || 0) / 100));
    } else {
      marginAmountPkr = Math.round((parseFloat(marginFixedPerPax) || 0) * payingPax);
    }

    // Grand Total Quote
    const grandTotalPkr = netSubtotalPkr + marginAmountPkr;
    const effectiveTotalPax = Math.max(1, totalPax);
    const averagePerPaxQuote = Math.round(grandTotalPkr / effectiveTotalPax);

    // Sharing Matrix Per Person (Fixed non-hotel costs + sharing hotel cost + per-pax margin)
    // Non-hotel per-person net cost:
    const nonHotelPerPersonPkr = Math.round((totalVisaPkr + logisticsPkr + totalFlightsPkr) / payingPax);
    const marginPerPaxPkr = Math.round(marginAmountPkr / payingPax);

    // Quad (4 sharing)
    const quadPaxPkr = Math.round(quadHotelPaxSar * rateMultiplier) + nonHotelPerPersonPkr + marginPerPaxPkr;

    // Triple (3 sharing)
    const triplePaxPkr = Math.round(tripleHotelPaxSar * rateMultiplier) + nonHotelPerPersonPkr + marginPerPaxPkr;

    // Double (2 sharing)
    const doublePaxPkr = Math.round(doubleHotelPaxSar * rateMultiplier) + nonHotelPerPersonPkr + marginPerPaxPkr;

    return {
      totalNights,
      effectiveDurationNights: flightDurationNights !== null ? flightDurationNights : totalNights,
      flightDurationNights,
      totalRoomSar,
      totalGroupHotelSar,
      totalGroupHotelPkr,
      totalVisaSar,
      totalVisaPkr,
      visaPerPaxPkr,
      transportTotalSar,
      transportOnlyPkr,
      ziyaratTotalSar,
      ziyaratOnlyPkr,
      logisticsPkr,
      totalFlightsPkr,
      netSubtotalPkr,
      marginAmountPkr,
      grandTotalPkr,
      averagePerPaxQuote,
      quadPaxPkr,
      triplePaxPkr,
      doublePaxPkr,
    };
  }, [
    hotels,
    payingPax,
    totalPax,
    rateMultiplier,
    flightDurationNights,
    visaFeeAdultSar,
    visaFeeChildSar,
    visaFeeInfantSar,
    infantsCount,
    adultsCount,
    childrenCount,
    flightCostAdultPkr,
    flightCostChildPkr,
    flightCostInfantPkr,
    transportCostSar,
    includeZiyarat,
    ziyaratCostSar,
    marginType,
    marginPercent,
    marginFixedPerPax
  ]);

  // Dynamic room basis logic for summary & proposal notes
  const uniqueRoomTypes = Array.from(new Set(hotels.map(h => (h.roomType || 'Double'))));
  const allSameRoomType = uniqueRoomTypes.length === 1;
  const primaryRoomType = allSameRoomType ? uniqueRoomTypes[0] : 'Mixed';

  const getRoomTypeConfig = (type) => {
    switch (type) {
      case 'Double':
        return {
          title: 'Double Room Basis',
          badgeText: 'DOUBLE (2)',
          badgeClass: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
          cardBorderClass: 'border-amber-500/40 bg-amber-950/20',
          priceColorClass: 'text-amber-300',
          subtitle: 'Executive Tier • 2 Beds per Room',
        };
      case 'Triple':
        return {
          title: 'Triple Room Basis',
          badgeText: 'TRIPLE (3)',
          badgeClass: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
          cardBorderClass: 'border-emerald-500/40 bg-emerald-950/20',
          priceColorClass: 'text-emerald-300',
          subtitle: 'Standard Tier • 3 Beds per Room',
        };
      case 'Quad':
        return {
          title: 'Quad Room Basis',
          badgeText: 'QUAD (4)',
          badgeClass: 'bg-sky-400/20 text-sky-300 border-sky-400/30',
          cardBorderClass: 'border-sky-500/40 bg-sky-950/20',
          priceColorClass: 'text-sky-300',
          subtitle: 'Economy Tier • 4 Beds per Room',
        };
      case 'Sharing':
        return {
          title: 'Sharing Room Basis',
          badgeText: 'SHARING',
          badgeClass: 'bg-teal-400/20 text-teal-300 border-teal-400/30',
          cardBorderClass: 'border-teal-500/40 bg-teal-950/20',
          priceColorClass: 'text-teal-300',
          subtitle: 'Budget Sharing Tier • Multi-Bed Room',
        };
      case 'Single':
        return {
          title: 'Single Room Basis',
          badgeText: 'SINGLE (1)',
          badgeClass: 'bg-purple-400/20 text-purple-300 border-purple-400/30',
          cardBorderClass: 'border-purple-500/40 bg-purple-950/20',
          priceColorClass: 'text-purple-300',
          subtitle: 'VIP Private Tier • 1 Bed per Room',
        };
      default:
        return {
          title: 'Custom Multi-Room Basis',
          badgeText: 'MIXED BASES',
          badgeClass: 'bg-indigo-400/20 text-indigo-300 border-indigo-400/30',
          cardBorderClass: 'border-indigo-500/40 bg-indigo-950/20',
          priceColorClass: 'text-indigo-300',
          subtitle: 'Custom Room Types Across Hotels',
        };
    }
  };

  const activeBasis = getRoomTypeConfig(primaryRoomType);

  // Handle Party Selection Auto-populate
  const handlePartySelect = (uid) => {
    setSelectedPartyUid(uid);
    if (uid !== 'CUSTOM') {
      const p = parties.find(party => party.partyHeadUid === uid);
      if (p) {
        setPartyName(p.partyName || '');
        setContactPhone(p.contactPhone || '');
        const pCount = p.passengers?.length || p.totalPax || 2;
        setAdultsCount(pCount);
        setChildrenCount(0);
        setInfantsCount(0);
        if (p.packageTitle) setPackageTitle(p.packageTitle);
      }
    }
  };

  // Quick Preset Packages
  const applyPreset = (presetName) => {
    if (presetName === '14_DAYS_STANDARD') {
      setPackageTitle('14 Days Standard Umrah Package (VOCO + Gulnar)');
      setHotels([
        {
          id: 'stay-1',
          city: 'Makkah',
          hotelName: 'VOCO 5 STAR',
          nights: 7,
          ratePerNightSar: 550,
          roomType: 'Quad',
          bedsPerRoom: 4,
          ratePerPaxSar: 137.5,
          rateModified: false,
          saveStatus: '',
        },
        {
          id: 'stay-2',
          city: 'Medinah',
          hotelName: 'GULNAR HV',
          nights: 7,
          ratePerNightSar: 450,
          roomType: 'Quad',
          bedsPerRoom: 4,
          ratePerPaxSar: 112.5,
          rateModified: false,
          saveStatus: '',
        }
      ]);
      setTransportCostSar(900);
      setMarginPercent(12);
    } else if (presetName === '15_DAYS_EXECUTIVE') {
      setPackageTitle('15 Days Executive Deluxe (Swissotel + Movenpick)');
      setHotels([
        {
          id: 'stay-1',
          city: 'Makkah',
          hotelName: 'SWISSOTEL MAKKAH',
          nights: 8,
          ratePerNightSar: 950,
          roomType: 'Triple',
          bedsPerRoom: 3,
          ratePerPaxSar: 316.67,
          rateModified: false,
          saveStatus: '',
        },
        {
          id: 'stay-2',
          city: 'Medinah',
          hotelName: 'ANWAR AL MADINAH MOVENPICK',
          nights: 7,
          ratePerNightSar: 850,
          roomType: 'Triple',
          bedsPerRoom: 3,
          ratePerPaxSar: 283.33,
          rateModified: false,
          saveStatus: '',
        }
      ]);
      setTransportCostSar(1200);
      setMarginPercent(15);
    } else if (presetName === '21_DAYS_RAMADAN') {
      setPackageTitle('21 Days Ramadan Spiritual Retreat (Pullman + Dar Al Taqwa)');
      setHotels([
        {
          id: 'stay-1',
          city: 'Makkah',
          hotelName: 'PULLMAN ZAMZAM',
          nights: 12,
          ratePerNightSar: 1400,
          roomType: 'Double',
          bedsPerRoom: 2,
          ratePerPaxSar: 700,
          rateModified: false,
          saveStatus: '',
        },
        {
          id: 'stay-2',
          city: 'Medinah',
          hotelName: 'DAR AL TAQWA',
          nights: 9,
          ratePerNightSar: 1100,
          roomType: 'Double',
          bedsPerRoom: 2,
          ratePerPaxSar: 550,
          rateModified: false,
          saveStatus: '',
        }
      ]);
      setTransportCostSar(1500);
      setMarginPercent(15);
    }
  };

  // Next sequential PID calculation based on highest existing number
  const getNextProposalId = () => {
    const nums = (estimates || []).map(e => {
      const match = (e.id || e.estimateNo || '').match(/EST-\d+-(\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    }).filter(n => !isNaN(n));
    const nextNum = (nums.length > 0 ? Math.max(...nums) : (estimates || []).length) + 1;
    return `EST-2026-${String(nextNum).padStart(3, '0')}`;
  };

  // Start a fresh proposal draft (clears active PID and resets all defaults)
  const handleStartNewProposal = () => {
    setEditingProposalId(null);
    setSelectedPartyUid('CUSTOM');
    setPartyName('');
    setContactPhone('');
    setPackageTitle('15 Days Executive Umrah Package');
    setAdultsCount(2);
    setChildrenCount(0);
    setInfantsCount(0);
    setFlightCostAdultPkr(135000);
    setFlightCostChildPkr(120000);
    setFlightCostInfantPkr(35000);
    setFlightType('Direct');
    setFlightDateFrom('');
    setFlightDateTo('');
    setTransportCostSar(900);
    setZiyaratCostSar(250);
    setIncludeZiyarat(true);
    setZiyaratPlaces(['Makkah', 'Madinah']);
    setNewZiyaratInput('');
    setShowAddZiyaratInput(false);
    setVisaFeeAdultSar(550);
    setVisaFeeChildSar(550);
    setVisaFeeInfantSar(250);
    setMarginType('PERCENT');
    setMarginPercent(12);
    setMarginFixedPerPax(15000);
    setHotels([
      {
        id: 'stay-1',
        city: 'Makkah',
        hotelName: 'VOCO 5 STAR',
        distance: '850m from Haram',
        nights: 8,
        ratePerNightSar: 550,
        roomType: 'Double',
        bedsPerRoom: 2,
        ratePerPaxSar: 275,
        rateModified: false,
        saveStatus: '',
      },
      {
        id: 'stay-2',
        city: 'Medinah',
        hotelName: 'GULNAR HV',
        distance: '150m from Nabawi',
        nights: 7,
        ratePerNightSar: 480,
        roomType: 'Double',
        bedsPerRoom: 2,
        ratePerPaxSar: 240,
        rateModified: false,
        saveStatus: '',
      },
    ]);
    setSaveSuccessMsg({
      id: 'NEW',
      title: 'New Proposal Draft',
      detail: `Started fresh proposal draft. Will save as ${getNextProposalId()}.`,
    });
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Load an existing proposal into the calculator for editing
  const handleEditEstimate = (est) => {
    if (!est) return;

    const pid = est.id || est.estimateNo;
    setEditingProposalId(pid);
    setSelectedPartyUid(est.partyHeadUid || 'CUSTOM');
    setPartyName(est.partyName || '');
    setContactPhone(est.contactPhone || '');
    if (est.packageDuration) setPackageTitle(est.packageDuration);

    const b = est.breakdownDetails || {};
    const items = est.items || {};

    // 1. Currency Exchange Rate
    const exRate = parseFloat(est.exchangeRateSarPkr || b.exchangeRateSarPkr) || 74.5;
    setSarToPkr(exRate);

    // 2. Pax counts
    const adCount = b.adults !== undefined ? b.adults : (est.paxCount || 2);
    setAdultsCount(adCount);
    setChildrenCount(b.children || 0);
    setInfantsCount(b.infants || 0);

    // 3. Hotels
    if (b.hotels && Array.isArray(b.hotels) && b.hotels.length > 0) {
      setHotels(b.hotels.map((h, i) => {
        const beds = parseInt(h.bedsPerRoom) || getBedsForRoomType(h.roomType || 'Double');
        const rateNight = parseFloat(h.ratePerNightSar) || 550;
        const ratePax = h.ratePerPaxSar ? parseFloat(h.ratePerPaxSar) : parseFloat((rateNight / beds).toFixed(2));
        return {
          id: `stay-${i + 1}`,
          city: h.city || (i === 0 ? 'Makkah' : 'Medinah'),
          hotelName: h.hotelName || 'VOCO 5 STAR',
          distance: h.distance || (i === 0 ? b.makkahDistance : b.madinahDistance) || '',
          nights: parseInt(h.nights) || 7,
          ratePerNightSar: rateNight,
          roomType: h.roomType || 'Double',
          bedsPerRoom: beds,
          ratePerPaxSar: ratePax,
          rateModified: false,
          saveStatus: '',
        };
      }));
    } else {
      setHotels([
        {
          id: 'stay-1',
          city: 'Makkah',
          hotelName: b.makkahHotel || 'VOCO 5 STAR',
          distance: b.makkahDistance || '',
          nights: parseInt(b.makkahNights) || 8,
          ratePerNightSar: parseFloat(b.makkahRatePerNightSar) || 550,
          roomType: b.makkahRoomType || 'Double',
          bedsPerRoom: getBedsForRoomType(b.makkahRoomType || 'Double'),
          ratePerPaxSar: parseFloat(((parseFloat(b.makkahRatePerNightSar) || 550) / getBedsForRoomType(b.makkahRoomType || 'Double')).toFixed(2)),
          rateModified: false,
          saveStatus: '',
        },
        {
          id: 'stay-2',
          city: 'Medinah',
          hotelName: b.madinahHotel || 'GULNAR HV',
          distance: b.madinahDistance || '',
          nights: parseInt(b.madinahNights) || 7,
          ratePerNightSar: parseFloat(b.madinahRatePerNightSar) || 480,
          roomType: b.madinahRoomType || 'Double',
          bedsPerRoom: getBedsForRoomType(b.madinahRoomType || 'Double'),
          ratePerPaxSar: parseFloat(((parseFloat(b.madinahRatePerNightSar) || 480) / getBedsForRoomType(b.madinahRoomType || 'Double')).toFixed(2)),
          rateModified: false,
          saveStatus: '',
        }
      ]);
    }

    // 4. Ground Transport & Ziyarat
    if (b.transportSector) setTransportSector(b.transportSector);
    if (b.transportVehicle) setTransportVehicle(b.transportVehicle);

    if (b.includeZiyarat !== undefined) {
      setIncludeZiyarat(b.includeZiyarat);
    } else if (items.ziyaratAndLogistics !== undefined) {
      setIncludeZiyarat(Number(items.ziyaratAndLogistics) > 0);
    }

    if (b.ziyaratCostSar !== undefined && b.ziyaratCostSar !== '') {
      setZiyaratCostSar(b.ziyaratCostSar);
    } else if (items.ziyaratAndLogistics !== undefined && items.ziyaratAndLogistics !== null) {
      setZiyaratCostSar(Math.round(Number(items.ziyaratAndLogistics) / exRate));
    }

    if (b.ziyaratPlaces && Array.isArray(b.ziyaratPlaces) && b.ziyaratPlaces.length > 0) {
      setZiyaratPlaces(b.ziyaratPlaces);
    } else {
      setZiyaratPlaces(['Makkah', 'Madinah']);
    }

    if (b.transportCostSar !== undefined && b.transportCostSar !== '') {
      setTransportCostSar(b.transportCostSar);
    } else if (items.transportSegmentCost !== undefined && items.transportSegmentCost !== null) {
      // In legacy records, items.transportSegmentCost stored total logisticsPkr (transport + ziyarat)
      const rawTransport = Number(items.transportSegmentCost);
      const rawZiyarat = Number(items.ziyaratAndLogistics || 0);
      const netTransportPkr = rawTransport > rawZiyarat && b.transportCostSar === undefined
        ? (rawTransport - rawZiyarat)
        : rawTransport;
      setTransportCostSar(Math.max(0, Math.round(netTransportPkr / exRate)));
    }

    // 5. Visa Fees (SAR)
    if (b.visaFeeAdultSar !== undefined && b.visaFeeAdultSar !== '') {
      setVisaFeeAdultSar(b.visaFeeAdultSar);
    } else if (items.visaCostPerPax !== undefined) {
      setVisaFeeAdultSar(Math.round(Number(items.visaCostPerPax) / exRate));
    }

    if (b.visaFeeChildSar !== undefined && b.visaFeeChildSar !== '') {
      setVisaFeeChildSar(b.visaFeeChildSar);
    } else if (items.visaCostPerPax !== undefined) {
      setVisaFeeChildSar(Math.round(Number(items.visaCostPerPax) / exRate));
    }

    if (b.visaFeeInfantSar !== undefined && b.visaFeeInfantSar !== '') {
      setVisaFeeInfantSar(b.visaFeeInfantSar);
    }

    // 6. Airline Flight Ticketing (PKR)
    if (b.airlineCarrier) setAirlineCarrier(b.airlineCarrier);
    if (b.flightType) setFlightType(b.flightType);
    if (b.flightDateFrom) setFlightDateFrom(b.flightDateFrom);
    if (b.flightDateTo) setFlightDateTo(b.flightDateTo);

    if (b.flightCostAdultPkr !== undefined && b.flightCostAdultPkr !== '') {
      setFlightCostAdultPkr(b.flightCostAdultPkr);
    } else if (items.flightCostPerPax !== undefined) {
      setFlightCostAdultPkr(Number(items.flightCostPerPax));
    }

    if (b.flightCostChildPkr !== undefined && b.flightCostChildPkr !== '') {
      setFlightCostChildPkr(b.flightCostChildPkr);
    } else if (items.flightCostPerPax !== undefined) {
      setFlightCostChildPkr(Number(items.flightCostPerPax));
    }

    if (b.flightCostInfantPkr !== undefined && b.flightCostInfantPkr !== '') {
      setFlightCostInfantPkr(b.flightCostInfantPkr);
    }

    // 7. Margin / Markup
    if (b.marginType) {
      setMarginType(b.marginType);
    } else if (items.marginAmount !== undefined && items.subtotal) {
      const sub = Number(items.subtotal) || 1;
      const amt = Number(items.marginAmount) || 0;
      const pct = (amt / sub) * 100;
      if (Math.abs(pct - Math.round(pct)) < 0.05) {
        setMarginType('PERCENT');
      } else {
        setMarginType('FIXED_PER_PAX');
      }
    }

    if (b.marginPercent !== undefined && b.marginPercent !== '') {
      setMarginPercent(b.marginPercent);
    } else if (items.marginPercent !== undefined) {
      setMarginPercent(items.marginPercent);
    } else if (items.marginAmount !== undefined && items.subtotal) {
      setMarginPercent(Math.round((Number(items.marginAmount) / Number(items.subtotal)) * 100));
    }

    if (b.marginFixedPerPax !== undefined && b.marginFixedPerPax !== '') {
      setMarginFixedPerPax(b.marginFixedPerPax);
    } else if (items.marginAmount !== undefined) {
      const pCount = Math.max(1, (parseInt(b.adults || est.paxCount || 1) + parseInt(b.children || 0)));
      setMarginFixedPerPax(Math.round(Number(items.marginAmount) / pCount));
    }

    setActiveView('CALCULATOR');
    setSaveSuccessMsg({
      id: pid,
      title: `Loaded Proposal for Editing`,
      detail: `PID: ${pid} (${est.partyName}) loaded into Calculator. Make changes and click "Update Proposal".`,
    });
    setTimeout(() => setSaveSuccessMsg(null), 5000);
  };

  // Save or Update Proposal (Targeting specific PID)
  const handleSaveProposal = (e) => {
    e?.preventDefault();
    if (!partyName.trim()) {
      alert('Please enter party / customer name.');
      return;
    }

    const firstMakkah = hotels.find(h => (h.city || '').toLowerCase().includes('makkah')) || hotels[0] || {};
    const firstMadinah = hotels.find(h => (h.city || '').toLowerCase().includes('medin') || (h.city || '').toLowerCase().includes('madin')) || hotels[1] || {};

    const isUpdate = !!editingProposalId;
    const estId = editingProposalId || getNextProposalId();
    const existing = (estimates || []).find(x => x.id === estId || x.estimateNo === estId);

    const newEstimate = {
      id: estId,
      estimateNo: estId,
      partyHeadUid: selectedPartyUid,
      partyName: partyName,
      companyName: 'NOOR E HARAM TRAVELS & TOURS',
      contactPhone: contactPhone,
      paxCount: totalPax || 1,
      packageDuration: `${calculations.effectiveDurationNights} Nights`,
      currency: 'PKR',
      exchangeRateSarPkr: rateMultiplier,
      breakdownDetails: {
        adults: adultsCount,
        children: childrenCount,
        infants: infantsCount,
        visaFeeAdultSar,
        visaFeeChildSar,
        visaFeeInfantSar,
        hotels: hotels.map(h => ({
          city: h.city,
          hotelName: h.hotelName,
          distance: h.distance || '',
          roomType: h.roomType,
          nights: h.nights,
          ratePerNightSar: h.ratePerNightSar,
          bedsPerRoom: h.bedsPerRoom,
          ratePerPaxSar: h.ratePerPaxSar,
        })),
        makkahHotel: firstMakkah.hotelName || '',
        makkahDistance: firstMakkah.distance || '',
        makkahNights: firstMakkah.nights || 0,
        makkahRatePerNightSar: firstMakkah.ratePerNightSar || 0,
        makkahRoomType: firstMakkah.roomType || 'Quad',
        madinahHotel: firstMadinah.hotelName || '',
        madinahDistance: firstMadinah.distance || '',
        madinahNights: firstMadinah.nights || 0,
        madinahRatePerNightSar: firstMadinah.ratePerNightSar || 0,
        madinahRoomType: firstMadinah.roomType || 'Quad',
        transportSector,
        transportVehicle,
        transportCostSar,
        includeZiyarat,
        ziyaratCostSar,
        ziyaratPlaces,
        airlineCarrier,
        flightType,
        flightDateFrom,
        flightDateTo,
        flightDurationNights: calculations.flightDurationNights,
        flightCostAdultPkr,
        flightCostChildPkr,
        flightCostInfantPkr,
        marginType,
        marginPercent,
        marginFixedPerPax,
        exchangeRateSarPkr: rateMultiplier,
        sharingMatrix: {
          quadPerPaxPkr: calculations.quadPaxPkr,
          triplePerPaxPkr: calculations.triplePaxPkr,
          doublePerPaxPkr: calculations.doublePaxPkr,
        }
      },
      items: {
        visaCostPerPax: calculations.visaPerPaxPkr,
        visaTotal: calculations.totalVisaPkr,
        flightCostPerPax: Math.round(calculations.totalFlightsPkr / Math.max(1, totalPax)),
        flightTotal: calculations.totalFlightsPkr,
        transportSegmentCost: calculations.transportOnlyPkr,
        hotelBlocksCost: calculations.totalGroupHotelPkr,
        ziyaratAndLogistics: calculations.ziyaratOnlyPkr,
        logisticsTotalCost: calculations.logisticsPkr,
        subtotal: calculations.netSubtotalPkr,
        marginPercent: marginType === 'PERCENT' ? marginPercent : Math.round((calculations.marginAmountPkr / calculations.netSubtotalPkr) * 100),
        marginAmount: calculations.marginAmountPkr,
        grandTotal: calculations.grandTotalPkr,
        perPaxQuote: calculations.averagePerPaxQuote,
      },
      validityDays: 14,
      status: existing?.status || 'Draft Proposal',
      isDraftLayout: true,
      notes: `Customized package proposal (${activeBasis.title}). Per Pilgrim: PKR ${calculations.averagePerPaxQuote.toLocaleString()} | Grand Total: PKR ${calculations.grandTotalPkr.toLocaleString()}`,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveEstimate(newEstimate);
    const updatedList = getAllEstimates();
    if (onEstimatesUpdated) onEstimatesUpdated(updatedList);

    // Keep active PID so subsequent clicks update this exact record
    setEditingProposalId(estId);

    // Show visual confirmation on button and floating toast
    setIsSavedRecently(true);
    setSaveSuccessMsg({
      id: estId,
      title: isUpdate ? `Proposal Updated!` : `Proposal Saved!`,
      detail: `${estId} (${partyName}) • Grand Total: PKR ${calculations.grandTotalPkr.toLocaleString()}`,
    });

    setTimeout(() => {
      setIsSavedRecently(false);
    }, 3500);

    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 5000);
  };

  const handleConvert = (estId) => {
    try {
      setIsConvertingId(estId);
      const invoice = convertEstimateToInvoice(estId);
      if (onInvoiceCreated) onInvoiceCreated(invoice);
      router.push(`/invoice/${invoice.id}`);
    } catch (e) {
      alert(`Error converting to invoice: ${e.message}`);
      setIsConvertingId(null);
    }
  };

  const handleDeleteEstimate = (id, estimateNo) => {
    if (confirm(`Are you sure you want to delete proposal ${estimateNo}?`)) {
      const updated = deleteEstimate(id);
      if (onEstimatesUpdated) onEstimatesUpdated(updated);
      if (editingProposalId === id) {
        setEditingProposalId(null);
      }
      setSaveSuccessMsg({
        id: estimateNo,
        title: 'Proposal Deleted',
        detail: `Successfully removed ${estimateNo} from pipeline.`,
      });
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  const filteredEstimates = estimates.filter(e => {
    const q = searchTerm.toLowerCase();
    return (
      (e.estimateNo || '').toLowerCase().includes(q) ||
      (e.partyName || '').toLowerCase().includes(q) ||
      (e.partyHeadUid || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      
      {/* Module Navigation & Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
              Module C
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Umrah Package Costing &amp; Quotation Calculator
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic B2B multi-hotel accommodation, SAR-to-PKR conversion engine &amp; per-person sharing matrix.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {activeView === 'CALCULATOR' ? (
            <>
              {editingProposalId && (
                <button
                  onClick={handleStartNewProposal}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs transition-all active:scale-95"
                  title="Clear active proposal and start new draft"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>+ New Proposal</span>
                </button>
              )}

              <button
                onClick={() => setActiveView('SAVED_PROPOSALS')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Saved Proposals ({estimates.length})</span>
              </button>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white shadow-xs">
              <FileText className="w-3.5 h-3.5" />
              <span>Saved Proposals ({estimates.length})</span>
            </span>
          )}
        </div>
      </div>

      {/* Floating Toast Notification for Save / Update Confirmation */}
      {saveSuccessMsg && (
        <div className="fixed top-5 right-5 z-50 max-w-sm bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-start gap-3 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs uppercase text-emerald-300">
                {saveSuccessMsg.title}
              </span>
              {saveSuccessMsg.id && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 border border-slate-700">
                  PID: {saveSuccessMsg.id}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 truncate">
              {saveSuccessMsg.detail}
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setSaveSuccessMsg(null)}
            className="text-slate-400 hover:text-white text-xs font-bold p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Inline Status Banner */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>{saveSuccessMsg.title}:</strong> {saveSuccessMsg.detail}
            </span>
          </div>
          <button onClick={() => setActiveView('SAVED_PROPOSALS')} className="underline text-emerald-900 font-bold ml-2">
            View in Registry ➔
          </button>
        </div>
      )}

      {/* VIEW 1: INTERACTIVE CALCULATOR STUDIO */}
      {activeView === 'CALCULATOR' && (
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
          
          {/* LEFT COLUMN: INPUT CONFIGURATIONS (60-65% width) */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            
            {/* Quick Presets & Exchange Rate Banner */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Package Templates
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => applyPreset('14_DAYS_STANDARD')}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors"
                  >
                    14D Standard
                  </button>
                  <button
                    onClick={() => applyPreset('15_DAYS_EXECUTIVE')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-semibold text-emerald-800 transition-colors"
                  >
                    15D Executive
                  </button>
                  <button
                    onClick={() => applyPreset('21_DAYS_RAMADAN')}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[11px] font-semibold text-amber-900 transition-colors"
                  >
                    21D Ramadan VIP
                  </button>
                </div>
              </div>

              {/* Currency Rate Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/70">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    SAR
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Currency Conversion Engine</span>
                    <span className="text-xs font-bold text-slate-800">1 Saudi Riyal (SAR) = PKR {sarToPkr}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500">Rate:</span>
                  <input
                    type="number"
                    step="0.1"
                    value={sarToPkr}
                    onChange={(e) => setSarToPkr(e.target.value)}
                    className="w-20 px-2 py-1 text-xs font-mono font-bold border border-slate-300 rounded-lg bg-white text-slate-900 outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <div className="flex gap-1">
                    {[74.0, 74.5, 75.0].map(r => (
                      <button
                        key={r}
                        onClick={() => setSarToPkr(r)}
                        className={`px-1.5 py-1 text-[10px] font-mono rounded border ${
                          parseFloat(sarToPkr) === r ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 1. Trip & Customer Profile */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wide">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>1. Customer &amp; Traveler Composition</span>
                </div>

                <div className="flex items-center gap-2">
                  {editingProposalId ? (
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-amber-500/15 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <span>PID: {editingProposalId}</span>
                        <span className="text-[10px] text-amber-700 font-sans font-medium">(Active Edit)</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleStartNewProposal}
                        className="px-2 py-0.5 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors flex items-center gap-1"
                        title="Start a new proposal with new PID"
                      >
                        <Plus className="w-3 h-3" />
                        <span>New</span>
                      </button>
                    </div>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-500/10 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>PID: {getNextProposalId()} (New Draft)</span>
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="e.g. MOHAMMED AHMED KHAN"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-1 focus:ring-slate-900 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Adults (Full)</label>
                  <input
                    type="number"
                    min="1"
                    value={adultsCount}
                    onChange={(e) => setAdultsCount(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-center outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Children (CHD)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={childrenCount}
                    onChange={(e) => setChildrenCount(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-center outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Infants (INF)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={infantsCount}
                    onChange={(e) => setInfantsCount(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-center outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* 2. Holy Cities Hotel Accommodations (SAR) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wide">
                  <Building2 className="w-4 h-4 text-emerald-800" />
                  <span>2. Holy Cities Hotel Accommodations (SAR)</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    ({hotels.length} {hotels.length === 1 ? 'Hotel' : 'Hotels'} • {calculations.totalNights} Nights)
                  </span>
                </div>
              </div>

              {/* Dynamic Hotel Cards */}
              <div className="space-y-3">
                {hotels.map((hotel, index) => {
                  const isMakkah = (hotel.city || '').toLowerCase().includes('makkah');
                  const isMedinah = (hotel.city || '').toLowerCase().includes('medin') || (hotel.city || '').toLowerCase().includes('madin');
                  const roomTotalSar = (parseFloat(hotel.ratePerNightSar) || 0) * (parseInt(hotel.nights) || 0);
                  
                  const savedRate = getHotelRate(hotel.hotelName, hotel.roomType);
                  const isAlreadySaved = savedRate !== null && savedRate > 0;

                  const cardBg = isMakkah 
                    ? 'bg-amber-50/50 border-amber-200/80' 
                    : isMedinah 
                    ? 'bg-emerald-50/50 border-emerald-200/80' 
                    : 'bg-blue-50/50 border-blue-200/80';
                  
                  const dotColor = isMakkah ? 'bg-amber-600' : isMedinah ? 'bg-emerald-600' : 'bg-blue-600';
                  const titleColor = isMakkah ? 'text-amber-950' : isMedinah ? 'text-emerald-950' : 'text-blue-950';
                  const totalBadge = isMakkah 
                    ? 'bg-amber-100/70 border-amber-200/60 text-amber-900' 
                    : isMedinah 
                    ? 'bg-emerald-100/70 border-emerald-200/60 text-emerald-900' 
                    : 'bg-blue-100/70 border-blue-200/60 text-blue-900';

                  const formulaColor = isMakkah
                    ? 'text-amber-900 bg-amber-50 border-amber-200/70'
                    : isMedinah
                    ? 'text-emerald-900 bg-emerald-50 border-emerald-200/70'
                    : 'text-blue-900 bg-blue-50 border-blue-200/70';

                  return (
                    <div 
                      key={hotel.id || index}
                      className={`p-3.5 rounded-2xl border ${cardBg} space-y-3 transition-all`}
                    >
                      {/* Card Header: 1. City, Room Total & Remove Button */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1 border-b border-black/5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold text-xs ${titleColor} flex items-center gap-1.5`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`}></span>
                            <span>{index + 1}.</span>
                          </span>

                          <select
                            value={hotel.city}
                            onChange={(e) => handleHotelCityChange(index, e.target.value)}
                            className="px-2 py-0.5 rounded-md text-[11px] font-bold border border-slate-300 bg-white text-slate-800 outline-none cursor-pointer focus:ring-1 focus:ring-slate-900 shadow-2xs"
                          >
                            <option value="Makkah">Makkah</option>
                            <option value="Medinah">Medinah</option>
                            <option value="Jeddah">Jeddah</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg border ${totalBadge}`}>
                            Room Total: {roomTotalSar.toLocaleString()} SAR (PKR {Math.round(roomTotalSar * rateMultiplier).toLocaleString()})
                          </span>

                          {hotels.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveHotel(index)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100/60 border border-transparent hover:border-rose-200 transition-colors"
                              title={`Remove ${index + 1}. ${hotel.city}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Row 1: Hotel Name, Distance, Room Type, Nights */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start text-xs">
                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                            Hotel Name (Search &amp; Manage)
                          </label>
                          <HotelCombobox
                            city={hotel.city === 'Madinah' || hotel.city === 'Medinah' ? 'Medinah' : hotel.city}
                            value={hotel.hotelName}
                            onChange={(val) => handleHotelNameChange(index, val)}
                            placeholder={`Search or add ${hotel.city} hotel...`}
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[10px] font-bold text-slate-700 uppercase">
                              Distance {hotel.city.toLowerCase().includes('medin') || hotel.city.toLowerCase().includes('madin') ? '(from Nabawi)' : '(from Haram)'}
                            </label>
                            {hotel.distanceModified && (
                              <button
                                type="button"
                                onClick={() => handleSaveHotelChanges(index)}
                                className="text-[9px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer shadow-2xs transition-all animate-in fade-in"
                                title={`Save "${hotel.distance}" under ${hotel.hotelName} in master registry`}
                              >
                                <Save className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Save Changes</span>
                              </button>
                            )}
                          </div>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={hotel.distance || ''}
                              onChange={(e) => handleHotelDistanceChange(index, e.target.value)}
                              placeholder={hotel.city.toLowerCase().includes('medin') || hotel.city.toLowerCase().includes('madin') ? 'e.g. 150m from Nabawi' : 'e.g. 350m from Haram'}
                              className={`w-full px-2.5 py-2 border rounded-xl bg-white font-medium text-slate-900 text-xs outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all shadow-2xs ${
                                hotel.distanceModified ? 'border-emerald-500 ring-1 ring-emerald-500/20 pr-16' : 'border-slate-300'
                              }`}
                            />
                            {hotel.distanceModified && (
                              <button
                                type="button"
                                onClick={() => handleSaveHotelChanges(index)}
                                className="absolute right-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                                title="Save changes to master hotel registry"
                              >
                                <Save className="w-3 h-3 stroke-[2.5]" />
                                <span>Save</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                            Room Type
                          </label>
                          <select
                            value={hotel.roomType}
                            onChange={(e) => handleHotelRoomTypeChange(index, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all shadow-2xs"
                          >
                            <option value="Sharing">Sharing</option>
                            <option value="Quad">Quad</option>
                            <option value="Triple">Triple</option>
                            <option value="Double">Double</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1 text-center">
                            Nights
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={hotel.nights}
                            onChange={(e) => handleHotelNightsChange(index, e.target.value)}
                            className="w-full px-2 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold text-center text-xs outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Row 2: Rate Conversion Calculator (Rate Per Pax ⟷ Rate / Night) */}
                      <div className="p-3 bg-white/95 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-800 pb-1.5 border-b border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                            <span>Rate Calculation &amp; Conversion</span>
                            <span className="text-[9px] font-normal text-slate-400 lowercase">(rate per pax ⟷ rate per night)</span>
                          </div>
                          {hotel.ratePerPaxSar && hotel.bedsPerRoom ? (
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${formulaColor}`}>
                              {hotel.ratePerPaxSar} SAR/pax × {hotel.bedsPerRoom} beds = {hotel.ratePerNightSar} SAR/night
                            </span>
                          ) : null}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end text-xs">
                          {/* Rate Per Pax (SAR) */}
                          <div className="sm:col-span-4">
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[10px] font-bold text-slate-700 uppercase">
                                Rate Per Pax (SAR)
                              </label>
                              <span className="text-[9px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80">
                                Not Saved
                              </span>
                            </div>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={hotel.ratePerPaxSar}
                              onChange={(e) => handleHotelRatePerPaxChange(index, e.target.value)}
                              placeholder="e.g. 112.5"
                              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50/50 font-mono font-bold text-right text-xs outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all shadow-2xs"
                            />
                          </div>

                          {/* Beds Per Room */}
                          <div className="sm:col-span-3">
                            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1 text-center">
                              Beds Per Room
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={hotel.bedsPerRoom}
                              onChange={(e) => handleHotelBedsChange(index, e.target.value)}
                              className="w-full px-2.5 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold text-center text-xs outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all shadow-2xs"
                            />
                          </div>

                          {/* Rate/Night (SAR) */}
                          <div className="sm:col-span-5">
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[10px] font-bold text-slate-800 uppercase">
                                Rate/Night (SAR)
                              </label>
                              <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                                Entire Room
                              </span>
                            </div>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={hotel.ratePerNightSar}
                              onChange={(e) => handleHotelRatePerNightChange(index, e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold text-right text-xs outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all shadow-2xs"
                            />
                          </div>
                        </div>

                        {/* Rate Persistence Action Bar */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 flex-wrap gap-2">
                          <span className="text-[10px] text-slate-500 italic">
                            💡 Tip: Entering Rate Per Pax automatically calculates Rate/Night using Beds Per Room.
                          </span>

                          <div className="flex items-center gap-1.5">
                            {(hotel.rateModified || hotel.distanceModified) ? (
                              <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                                <button
                                  type="button"
                                  onClick={() => handleSaveHotelChanges(index)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition-all shadow-2xs cursor-pointer"
                                  title={`Save changes under ${hotel.hotelName} in master registry`}
                                >
                                  <Save className="w-3 h-3" />
                                  <span>Save Changes</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDontSaveHotelChanges(index)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-white hover:bg-slate-100 border border-slate-200 active:scale-95 text-slate-600 transition-all cursor-pointer"
                                  title="Keep as one-time quote without saving"
                                >
                                  <span>Don't Save</span>
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                {hotel.saveStatus === 'SAVED' && (
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-md flex items-center gap-1 animate-in fade-in">
                                    <Check className="w-3 h-3 text-emerald-700" /> Changes Saved to Registry!
                                  </span>
                                )}
                                {hotel.saveStatus === 'NOT_SAVED' && (
                                  <span className="text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md animate-in fade-in">
                                    One-Time Quote (Not Saved)
                                  </span>
                                )}
                                {!hotel.saveStatus && isAlreadySaved && (
                                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <Check className="w-3 h-3 text-emerald-600" /> Saved Rate Active
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Add Hotel button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleAddHotel}
                  className="w-full py-2.5 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/70 text-emerald-800 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-700" />
                  <span>+ Add Another Hotel</span>
                </button>
              </div>
            </div>

            {/* 3. Transport, Ziyarat & Umrah Visas */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wide border-b border-slate-100 pb-2">
                <Bus className="w-4 h-4 text-blue-600" />
                <span>3. Ground Transport, Ziyarat &amp; Umrah Visas</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Transport Sector</label>
                  <select
                    value={transportSector}
                    onChange={(e) => setTransportSector(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white font-medium outline-none"
                  >
                    <option value="Full Circuit (JED-MAK-MED-JED)">Full Circuit (JED-MAK-MED-JED)</option>
                    <option value="Full Circuit (JED-MAK-MED-MED)">Full Circuit (JED-MAK-MED-MED)</option>
                    <option value="Makkah to Madinah Train + Transfers">Makkah to Madinah Train + Transfers</option>
                    <option value="Airport Pickup & Drop Only">Airport Pickup &amp; Drop Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Vehicle Fleet Type</label>
                  <select
                    value={transportVehicle}
                    onChange={(e) => setTransportVehicle(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white font-medium outline-none"
                  >
                    <option value="Private GMC 7-Seater">Private GMC 7-Seater</option>
                    <option value="Private HiAce 12-Seater">Private HiAce 12-Seater</option>
                    <option value="Dedicated Coaster 30-Seater">Dedicated Coaster 30-Seater</option>
                    <option value="VIP Sedan (Camry / Sonata)">VIP Sedan (Camry / Sonata)</option>
                    <option value="Group Bus Sharing Seats">Group Bus Sharing Seats</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Transport Cost (SAR)</label>
                  <input
                    type="number"
                    value={transportCostSar}
                    onChange={(e) => setTransportCostSar(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-right outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                {/* Ziyarat */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="ziyaratToggle"
                        checked={includeZiyarat}
                        onChange={(e) => setIncludeZiyarat(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600"
                      />
                      <label htmlFor="ziyaratToggle" className="font-bold text-slate-800 text-xs cursor-pointer">
                        Ziyarat
                      </label>
                    </div>

                    {includeZiyarat && (
                      <div className="flex items-center gap-1 font-mono text-xs">
                        <label className="text-[10px] text-slate-500 font-bold uppercase mr-0.5">Cost:</label>
                        <input
                          type="number"
                          min="0"
                          value={ziyaratCostSar}
                          onChange={(e) => setZiyaratCostSar(e.target.value)}
                          className="w-16 px-1.5 py-0.5 border border-slate-300 rounded text-right text-xs font-bold font-mono outline-none focus:ring-1 focus:ring-slate-900"
                        />
                        <span className="text-[10px] text-slate-500 font-mono">SAR</span>
                      </div>
                    )}
                  </div>

                  {includeZiyarat && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {/* Standard Makkah Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleZiyaratPlace('Makkah')}
                        className={`px-2 py-0.5 rounded text-xs font-bold transition-all border ${
                          ziyaratPlaces.includes('Makkah')
                            ? 'bg-emerald-900 text-white border-emerald-900 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {ziyaratPlaces.includes('Makkah') ? '✓ Makkah' : '+ Makkah'}
                      </button>

                      {/* Standard Madinah Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleZiyaratPlace('Madinah')}
                        className={`px-2 py-0.5 rounded text-xs font-bold transition-all border ${
                          ziyaratPlaces.includes('Madinah')
                            ? 'bg-teal-900 text-white border-teal-900 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {ziyaratPlaces.includes('Madinah') ? '✓ Madinah' : '+ Madinah'}
                      </button>

                      {/* Custom Added Places */}
                      {ziyaratPlaces.filter(p => p !== 'Makkah' && p !== 'Madinah').map((place) => (
                        <span 
                          key={place}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs animate-in fade-in"
                        >
                          <span>✓ {place}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveZiyaratPlace(place)}
                            className="hover:text-red-700 ml-0.5 text-xs font-bold"
                            title="Remove"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      {/* + Add Button & Inline Input */}
                      {showAddZiyaratInput ? (
                        <div className="flex items-center gap-1 animate-in fade-in">
                          <input
                            type="text"
                            placeholder="e.g. Taif / Badr"
                            value={newZiyaratInput}
                            onChange={(e) => setNewZiyaratInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddZiyaratPlace();
                              } else if (e.key === 'Escape') {
                                setShowAddZiyaratInput(false);
                              }
                            }}
                            autoFocus
                            className="px-2 py-0.5 text-xs border border-amber-400 rounded-lg outline-none w-28 bg-white font-medium"
                          />
                          <button
                            type="button"
                            onClick={handleAddZiyaratPlace}
                            className="px-2 py-0.5 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddZiyaratInput(false)}
                            className="px-1 py-0.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowAddZiyaratInput(true)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-white text-slate-700 border border-dashed border-slate-300 hover:border-slate-500 hover:bg-slate-50 transition-colors"
                        >
                          <Plus className="w-3 h-3 text-emerald-700" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Visa */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">Visa</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Total Visa: {calculations.totalVisaSar.toLocaleString()} SAR (PKR {calculations.totalVisaPkr.toLocaleString()})
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    {/* Adult Visa */}
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                      <label className="text-[10px] font-bold text-slate-700 uppercase">Adult:</label>
                      <input
                        type="number"
                        min="0"
                        value={visaFeeAdultSar}
                        onChange={(e) => setVisaFeeAdultSar(e.target.value)}
                        className="w-16 px-1.5 py-0.5 border border-slate-300 rounded text-right text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-slate-900"
                      />
                      <span className="text-[10px] text-slate-500 font-mono">SAR</span>
                    </div>

                    {/* Child Visa (shown if childrenCount >= 1) */}
                    {parseInt(childrenCount) >= 1 && (
                      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-emerald-300 shadow-2xs animate-in fade-in">
                        <label className="text-[10px] font-bold text-emerald-800 uppercase">Child:</label>
                        <input
                          type="number"
                          min="0"
                          value={visaFeeChildSar}
                          onChange={(e) => setVisaFeeChildSar(e.target.value)}
                          className="w-16 px-1.5 py-0.5 border border-emerald-300 rounded text-right text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-emerald-700"
                        />
                        <span className="text-[10px] text-slate-500 font-mono">SAR</span>
                      </div>
                    )}

                    {/* Infant Visa (shown if infantsCount >= 1) */}
                    {parseInt(infantsCount) >= 1 && (
                      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-amber-300 shadow-2xs animate-in fade-in">
                        <label className="text-[10px] font-bold text-amber-800 uppercase">Infant:</label>
                        <input
                          type="number"
                          min="0"
                          value={visaFeeInfantSar}
                          onChange={(e) => setVisaFeeInfantSar(e.target.value)}
                          className="w-16 px-1.5 py-0.5 border border-amber-300 rounded text-right text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-amber-700"
                        />
                        <span className="text-[10px] text-slate-500 font-mono">SAR</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Flights & Airline Tickets */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wide">
                  <Plane className="w-4 h-4 text-indigo-600" />
                  <span>4. International Airline Flight Ticketing (PKR)</span>
                </div>
                {flightDurationNights !== null && (
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                    <span>Flight Duration:</span>
                    <strong>{flightDurationNights} Nights ({flightDurationNights + 1} Days)</strong>
                  </span>
                )}
              </div>

              {/* Flight Type & Flight Dates (Decides package duration) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 items-end">
                {/* Flight Type (Direct vs Connecting) */}
                <div className="sm:col-span-4 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase">Flight Routing</label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setFlightType('Direct')}
                      className={`py-1.5 px-2 rounded-md text-xs font-bold transition-all text-center ${
                        flightType === 'Direct'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Direct Flight
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlightType('Connecting')}
                      className={`py-1.5 px-2 rounded-md text-xs font-bold transition-all text-center ${
                        flightType === 'Connecting'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Connecting
                    </button>
                  </div>
                </div>

                {/* Flight Date From */}
                <div className="sm:col-span-4 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase">
                    Flight Date: From (Departure)
                  </label>
                  <CustomDatePicker
                    value={flightDateFrom}
                    onChange={(val) => setFlightDateFrom(val)}
                    placeholder="DD-MM-YYYY or DD-Mon-YYYY"
                  />
                </div>

                {/* Flight Date To */}
                <div className="sm:col-span-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase">
                      Flight Date: To (Return)
                    </label>
                    {flightDurationNights !== null && (
                      <span className="text-[9.5px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded font-mono">
                        {flightDurationNights}N
                      </span>
                    )}
                  </div>
                  <CustomDatePicker
                    value={flightDateTo}
                    onChange={(val) => setFlightDateTo(val)}
                    minDate={flightDateFrom || undefined}
                    placeholder="DD-MM-YYYY or DD-Mon-YYYY"
                  />
                </div>

                {/* Flight Duration explanation banner if dates picked */}
                {flightDurationNights !== null && (
                  <div className="sm:col-span-12 flex items-center justify-between bg-indigo-50/90 border border-indigo-200 rounded-lg px-3 py-2 text-xs">
                    <div className="flex items-center gap-1.5 text-indigo-900 font-semibold">
                      <Plane className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>
                        Decided Package Duration: <strong>{flightDurationNights} Nights ({flightDurationNights + 1} Days)</strong> calculated from flight dates.
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-indigo-200">
                      Duration Auto-Decided
                    </span>
                  </div>
                )}
              </div>

              {/* Airline name and Pax ticket pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs items-end">
                <div className={
                  parseInt(childrenCount) >= 1 && parseInt(infantsCount) >= 1
                    ? "sm:col-span-3"
                    : (parseInt(childrenCount) >= 1 || parseInt(infantsCount) >= 1)
                    ? "sm:col-span-4"
                    : "sm:col-span-6"
                }>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Airline &amp; Carrier Name</label>
                  <input
                    type="text"
                    value={airlineCarrier}
                    onChange={(e) => setAirlineCarrier(e.target.value)}
                    placeholder="e.g. Saudia / PIA / Airblue"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className={
                  parseInt(childrenCount) >= 1 && parseInt(infantsCount) >= 1
                    ? "sm:col-span-3"
                    : (parseInt(childrenCount) >= 1 || parseInt(infantsCount) >= 1)
                    ? "sm:col-span-4"
                    : "sm:col-span-6"
                }>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase">Adult Ticket (PKR)</label>
                    <span className="text-[9px] text-slate-500 font-mono">({adultsCount} Pax)</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={flightCostAdultPkr}
                    onChange={(e) => setFlightCostAdultPkr(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-right outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                {parseInt(childrenCount) >= 1 && (
                  <div className={parseInt(infantsCount) >= 1 ? "sm:col-span-3" : "sm:col-span-4"}>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[10px] font-bold text-emerald-800 uppercase">Child Ticket (PKR)</label>
                      <span className="text-[9px] text-emerald-700 font-mono font-semibold">({childrenCount} Pax)</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={flightCostChildPkr}
                      onChange={(e) => setFlightCostChildPkr(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-emerald-300 bg-emerald-50/40 rounded-lg font-mono font-bold text-right outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>
                )}

                {parseInt(infantsCount) >= 1 && (
                  <div className={parseInt(childrenCount) >= 1 ? "sm:col-span-3" : "sm:col-span-4"}>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[10px] font-bold text-amber-800 uppercase">Infant Ticket (PKR)</label>
                      <span className="text-[9px] text-amber-700 font-mono font-semibold">({infantsCount} Pax)</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={flightCostInfantPkr}
                      onChange={(e) => setFlightCostInfantPkr(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-amber-300 bg-amber-50/40 rounded-lg font-mono font-bold text-right outline-none focus:ring-1 focus:ring-amber-700"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 5. Agency Margin & Markup */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wide border-b border-slate-100 pb-2">
                <Percent className="w-4 h-4 text-emerald-700" />
                <span>5. Agency Commercial Profit Margin</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Markup Mode</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMarginType('PERCENT')}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-bold border transition-colors ${
                        marginType === 'PERCENT'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Percentage (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMarginType('FIXED_PER_PAX')}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-bold border transition-colors ${
                        marginType === 'FIXED_PER_PAX'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Fixed PKR / PAX
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    {marginType === 'PERCENT' ? 'Margin Percentage Override (%)' : 'Fixed Amount (PKR / Person)'}
                  </label>
                  {marginType === 'PERCENT' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={marginPercent}
                        onChange={(e) => setMarginPercent(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg bg-amber-50 font-mono font-bold text-slate-900 outline-none"
                      />
                      <span className="font-bold text-slate-500">%</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={marginFixedPerPax}
                        onChange={(e) => setMarginFixedPerPax(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg bg-amber-50 font-mono font-bold text-slate-900 outline-none"
                      />
                      <span className="font-bold text-slate-500 text-[10px]">PKR/PAX</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: STICKY LIVE PROPOSAL CARD & SHARING MATRIX */}
          <div className="w-full lg:w-[420px] shrink-0 lg:sticky lg:top-20 space-y-4">
            
            {/* Live Pricing Summary Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-slate-800 space-y-4">
              
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Live Quotation Engine
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                      editingProposalId
                        ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      PID: {editingProposalId || getNextProposalId()} {editingProposalId ? '• EDIT' : '• NEW'}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white mt-1 uppercase tracking-tight">
                    {partyName || 'Lead Customer'}
                  </h3>
                  <p className="text-[10.5px] text-slate-400">
                    {totalPax} Pilgrims Total • {calculations.effectiveDurationNights} Nights{calculations.flightDurationNights !== null ? ' (From Flights)' : ''}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Grand Total Quote</span>
                  <span className="font-mono font-extrabold text-xl text-amber-400 block">
                    PKR {calculations.grandTotalPkr.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Dynamic Room Basis Summary (Per Pilgrim) */}
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      Quotation Basis (Per Pilgrim)
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${activeBasis.badgeClass}`}>
                      {activeBasis.badgeText}
                    </span>
                  </div>
                  <span className="text-[9px] text-emerald-400 font-semibold font-mono">Net + Profit</span>
                </div>

                {/* Highlighted Selected Room Rate Card */}
                <div className={`p-3 rounded-lg border ${activeBasis.cardBorderClass} space-y-1.5`}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-white uppercase tracking-tight block">
                        {activeBasis.title}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {allSameRoomType
                          ? `${activeBasis.subtitle} • All ${hotels.length} ${hotels.length === 1 ? 'Hotel' : 'Hotels'}`
                          : `Configured across ${hotels.length} hotels`}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 uppercase font-mono block">Per Pilgrim Quote</span>
                      <span className={`font-mono font-extrabold text-base ${activeBasis.priceColorClass} block`}>
                        PKR {calculations.averagePerPaxQuote.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Multi-Hotel Breakdown if mixed room types */}
                  {!allSameRoomType && (
                    <div className="pt-2 border-t border-slate-700/60 flex flex-wrap gap-1.5">
                      {hotels.map((h, i) => (
                        <span key={h.id || i} className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-slate-300">
                          <strong className="text-slate-100">{i + 1}. {h.city}:</strong> <span className="text-amber-300 font-bold">{h.roomType}</span> ({h.nights}N)
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Optional Accordion to Compare Other Sharing Tiers */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowAltSharing(prev => !prev)}
                    className="w-full text-center text-[9.5px] text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1 py-0.5"
                  >
                    <span>{showAltSharing ? '▲ Hide Other Sharing Tiers' : '▼ Compare Other Sharing Tiers (Optional)'}</span>
                  </button>

                  {showAltSharing && (
                    <div className="grid grid-cols-3 gap-1.5 text-center pt-2 mt-1 border-t border-slate-700/60">
                      <div className={`p-1.5 rounded-lg border ${allSameRoomType && primaryRoomType === 'Quad' ? 'bg-slate-900/95 border-sky-500/60 ring-1 ring-sky-500/30' : 'bg-slate-900/50 border-slate-700/60'}`}>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">
                          Quad (4) {allSameRoomType && primaryRoomType === 'Quad' && '✓'}
                        </span>
                        <span className="font-mono font-bold text-[11px] text-white block mt-0.5">
                          PKR {calculations.quadPaxPkr.toLocaleString()}
                        </span>
                        <span className="text-[8px] text-slate-500">Economy</span>
                      </div>

                      <div className={`p-1.5 rounded-lg border ${allSameRoomType && primaryRoomType === 'Triple' ? 'bg-slate-900/95 border-emerald-500/60 ring-1 ring-emerald-500/30' : 'bg-slate-900/50 border-slate-700/60'}`}>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">
                          Triple (3) {allSameRoomType && primaryRoomType === 'Triple' && '✓'}
                        </span>
                        <span className="font-mono font-bold text-[11px] text-emerald-300 block mt-0.5">
                          PKR {calculations.triplePaxPkr.toLocaleString()}
                        </span>
                        <span className="text-[8px] text-slate-500">Standard</span>
                      </div>

                      <div className={`p-1.5 rounded-lg border ${allSameRoomType && primaryRoomType === 'Double' ? 'bg-slate-900/95 border-amber-500/60 ring-1 ring-amber-500/30' : 'bg-slate-900/50 border-slate-700/60'}`}>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">
                          Double (2) {allSameRoomType && primaryRoomType === 'Double' && '✓'}
                        </span>
                        <span className="font-mono font-bold text-[11px] text-amber-300 block mt-0.5">
                          PKR {calculations.doublePaxPkr.toLocaleString()}
                        </span>
                        <span className="text-[8px] text-slate-500">Executive</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Itemized Cost Composition */}
              <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Hotels ({hotels.length} {hotels.length === 1 ? 'Hotel' : 'Hotels'} • {calculations.totalNights}N):</span>
                  <span className="font-mono">PKR {calculations.totalGroupHotelPkr.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Umrah Electronic Visas:</span>
                  <span className="font-mono">PKR {calculations.totalVisaPkr.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ground Transport &amp; Ziyarat:</span>
                  <span className="font-mono">PKR {calculations.logisticsPkr.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Airline Flight Tickets:</span>
                  <span className="font-mono">PKR {calculations.totalFlightsPkr.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1 text-slate-400">
                  <span>Net Cost Subtotal:</span>
                  <span className="font-mono font-semibold text-slate-200">PKR {calculations.netSubtotalPkr.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Agency Profit Margin:</span>
                  <span className="font-mono">+PKR {calculations.marginAmountPkr.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleSaveProposal}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 ${
                    isSavedRecently
                      ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300'
                      : editingProposalId
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isSavedRecently ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                      <span>✓ Successfully {editingProposalId ? 'Updated' : 'Saved'} ({editingProposalId || getNextProposalId()})!</span>
                    </>
                  ) : editingProposalId ? (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Update Proposal ({editingProposalId})</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-4 h-4" />
                      <span>Save Proposal ({getNextProposalId()})</span>
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveView('SAVED_PROPOSALS')}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-semibold border border-slate-700 transition-colors"
                  >
                    View All ({estimates.length})
                  </button>

                  <button
                    type="button"
                    onClick={handleStartNewProposal}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 rounded-xl text-[11px] font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                    title="Start a new proposal draft"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Proposal</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="w-full py-1.5 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[10.5px] font-medium border border-slate-700/60 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                  <span>Print Quotation Sheet</span>
                </button>
              </div>

            </div>

            {/* Quick Hotel Distance Reference */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">
                  Selected Hotels Specs ({hotels.length})
                </span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold">
                  {calculations.totalNights} Total Nights
                </span>
              </div>
              {hotels.map((h, idx) => (
                <div key={h.id || idx} className="flex items-center justify-between text-slate-600 text-[11px]">
                  <span className="truncate pr-2 font-medium">
                    {idx + 1}. {h.city} ({h.nights}N • {h.roomType}):
                  </span>
                  <span className="font-bold text-slate-900 truncate max-w-[170px] text-right">
                    {h.hotelName}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between text-slate-600 text-[11px] border-t border-slate-100 pt-1.5">
                <span>Vehicle:</span>
                <span className="font-bold text-slate-900">{transportVehicle}</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* VIEW 2: SAVED PROPOSALS REGISTRY */}
      {activeView === 'SAVED_PROPOSALS' && (
        <div className="space-y-4">
          
          {/* Search Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search proposals by estimate #, customer or UID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <button
              onClick={() => {
                handleStartNewProposal();
                setActiveView('CALCULATOR');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs active:scale-95 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Calculate New Package</span>
            </button>
          </div>

          {/* Proposals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEstimates.length === 0 ? (
              <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                <Calculator className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="italic">No proposals found. Click "Calculate New Package" to draft a quotation.</p>
              </div>
            ) : (
              filteredEstimates.map((est) => (
                <div 
                  key={est.id} 
                  className="bg-white border border-slate-200 hover:border-slate-400 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                      <div>
                        <span className="font-mono font-bold text-xs text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {est.estimateNo}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 mt-1 uppercase">
                          {est.partyName}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {est.partyHeadUid} • {est.paxCount} Pilgrims
                        </p>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        est.status === 'Converted to Invoice'
                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                          : est.status === 'Approved by Client'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {est.status}
                      </span>
                    </div>

                    {/* Financial Totals */}
                    <div className="space-y-1.5 pt-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Base Net Cost:</span>
                        <span className="font-mono font-bold">
                          {est.currency} {(est.items?.subtotal || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-800">
                        <span>Internal Margin:</span>
                        <span className="font-mono font-bold">
                          +{est.items?.marginPercent}% (+{(est.items?.marginAmount || 0).toLocaleString()})
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-extrabold text-sm border-t border-slate-100 pt-1">
                        <span>Total Client Quote:</span>
                        <span className="font-mono text-emerald-800">
                          {est.currency} {(est.items?.grandTotal || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 text-right">
                        Per PAX Average: <strong className="text-slate-800 font-mono">{est.currency} {(est.items?.perPaxQuote || 0).toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditEstimate(est)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10.5px] font-bold shadow-xs transition-all active:scale-95"
                        title={`Edit ${est.estimateNo} in Calculator`}
                      >
                        <Pencil className="w-3 h-3 text-amber-400" />
                        <span>Edit Quote</span>
                      </button>

                      <Link
                        href={`/estimate/${est.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-900 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <span>A4</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {est.status !== 'Converted to Invoice' && (
                        <button
                          onClick={() => handleConvert(est.id)}
                          disabled={isConvertingId === est.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[10.5px] font-bold shadow-xs transition-all active:scale-95"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>{isConvertingId === est.id ? 'Converting...' : '1-Click Invoice'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteEstimate(est.id, est.estimateNo)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete Proposal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

    </div>
  );
}
