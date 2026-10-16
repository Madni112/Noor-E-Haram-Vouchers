'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  Receipt, 
  PlusCircle, 
  Search, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  Printer, 
  CreditCard, 
  FileText,
  Trash2,
  X,
  Plus,
  Building,
  User,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Filter,
  RotateCcw,
  Edit3,
  Users,
  Check,
  Minus,
  Tag
} from 'lucide-react';
import { 
  addLedgerTransaction, 
  getAllInvoices, 
  saveInvoice, 
  deleteInvoice,
  getCloudPackages,
  saveCloudPackage,
  deleteCloudPackage,
  getCloudInvoices,
  saveCloudInvoice,
  deleteCloudInvoice,
  getCloudItemPresets,
  saveCloudItemPreset,
  deleteCloudItemPreset
} from '../../lib/erpData';
import CustomDatePicker from './CustomDatePicker';
import ItemCombobox from './ItemCombobox';
import PackageCombobox from './PackageCombobox';

export default function InvoiceLedger({ 
  invoices = [], 
  parties = [], 
  initialView = 'INVOICES', 
  onViewChange,
  onInvoicesUpdated 
}) {
  const [viewMode, setViewMode] = useState(initialView || 'INVOICES'); // 'INVOICES' | 'LEDGER'
  const [invoiceList, setInvoiceList] = useState(invoices || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeInvoiceForPay, setActiveInvoiceForPay] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (invoices && invoices.length > 0) {
      setInvoiceList(invoices);
    }
  }, [invoices]);

  // Load Invoices and Item Presets directly from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    getCloudInvoices().then(cloudInvs => {
      if (isMounted && Array.isArray(cloudInvs) && cloudInvs.length > 0) {
        setInvoiceList(cloudInvs);
      }
    });
    getCloudItemPresets().then(cloudPresets => {
      if (isMounted && Array.isArray(cloudPresets) && cloudPresets.length > 0) {
        setItemPresets(cloudPresets);
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Sync internal viewMode with initialView prop when it changes
  useEffect(() => {
    if (initialView) {
      setViewMode(initialView);
    }
  }, [initialView]);

  const handleSwitchView = (newView) => {
    setViewMode(newView);
    if (onViewChange) {
      onViewChange(newView);
    }
  };

  // -------------------------------------------------------------
  // PAYMENT RECORDING MODAL STATE
  // -------------------------------------------------------------
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState('Online Bank Transfer');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // -------------------------------------------------------------
  // PRESET ITEMS & DEMOGRAPHIC PAX STATE
  // -------------------------------------------------------------
  const DEFAULT_ITEM_PRESETS = [
    { id: 'p1', name: 'Saudi Umrah Electronic Visas & Medical Insurance', defaultRate: 45000 },
    { id: 'p2', name: 'Direct International Flight Tickets', defaultRate: 135000 },
    { id: 'p3', name: 'Makkah Hotel Accommodation Blocks', defaultRate: 180000 },
    { id: 'p4', name: 'Madinah Hotel Accommodation Blocks', defaultRate: 120000 },
    { id: 'p5', name: 'Makkah & Madinah Hotel Accommodation Blocks', defaultRate: 180000 },
    { id: 'p6', name: 'Dedicated Ground Transport & Holy Ziyarat', defaultRate: 65000 },
    { id: 'p7', name: 'Private GMC / Luxury VIP Vehicle Transfer', defaultRate: 45000 },
    { id: 'p8', name: 'Jeddah Airport Arrival Transfer (50-Seater Bus)', defaultRate: 85000 },
    { id: 'p9', name: 'Haramain High-Speed Train Tickets', defaultRate: 18500 },
    { id: 'p10', name: 'Holy Ziyarat Guidance & Field Operations Liaison', defaultRate: 25000 },
    { id: 'p11', name: 'Full Umrah Laundry & Hospitality Service', defaultRate: 15000 }
  ];
  const PRESETS_STORAGE_KEY = 'erp_invoice_item_presets_v1';

  const [itemPresets, setItemPresets] = useState(DEFAULT_ITEM_PRESETS);
  const [savedNoticeMap, setSavedNoticeMap] = useState({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setItemPresets(parsed);
            return;
          }
        }
        localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(DEFAULT_ITEM_PRESETS));
      } catch (e) {
        console.warn('Failed reading item presets from storage', e);
      }
    }
  }, []);

  // -------------------------------------------------------------
  // SUPABASE CLOUD PACKAGES STATE & HANDLERS
  // -------------------------------------------------------------
  const [cloudPackages, setCloudPackages] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [packageSaveNotice, setPackageSaveNotice] = useState(false);

  // Fetch Supabase Cloud Packages on Mount
  useEffect(() => {
    let isMounted = true;
    getCloudPackages().then(pkgs => {
      if (isMounted && Array.isArray(pkgs)) {
        setCloudPackages(pkgs);
      }
    });
    return () => { isMounted = false; };
  }, []);

  const handleSelectCloudPackage = (pkgId) => {
    setSelectedPackageId(pkgId);
    if (!pkgId || pkgId === 'CUSTOM') return;
    const found = cloudPackages.find(p => p.id === pkgId);
    if (found) {
      setPackageTitle(found.package_name);
      if (found.departure_date) setIssueDate(found.departure_date);
      if (found.arrival_date) setDueDate(found.arrival_date);
    }
  };

  const handleSavePackageToCloud = async () => {
    if (!packageTitle.trim()) {
      alert('Please enter a Package Name before saving.');
      return;
    }
    try {
      const saved = await saveCloudPackage({
        packageName: packageTitle.trim(),
        departureDate: issueDate,
        arrivalDate: dueDate,
        companyName: customCompany || 'NOOR E HARAM TRAVELS & TOURS'
      });
      setPackageSaveNotice(true);
      setTimeout(() => setPackageSaveNotice(false), 2500);
      const updated = await getCloudPackages();
      setCloudPackages(updated);
      setSelectedPackageId(saved.id);
    } catch (err) {
      alert('Error saving package to Supabase: ' + err.message);
    }
  };

  const handleDeleteCloudPackage = async (pkgId) => {
    const pkg = cloudPackages.find(p => p.id === pkgId);
    if (!pkg) return;
    if (confirm(`Are you sure you want to delete package "${pkg.package_name}" from Supabase?`)) {
      try {
        await deleteCloudPackage(pkgId);
        const updated = await getCloudPackages();
        setCloudPackages(updated);
        setSelectedPackageId('');
      } catch (err) {
        alert('Error deleting package from Supabase: ' + err.message);
      }
    }
  };

  // -------------------------------------------------------------
  // CREATE / EDIT INVOICE MODAL STATE
  // -------------------------------------------------------------
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const nextInvoiceNum = `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`;
  const [selectedPartyUid, setSelectedPartyUid] = useState(parties[0]?.partyHeadUid || 'CUSTOM');
  const [customPartyName, setCustomPartyName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [customCompany, setCustomCompany] = useState('NOOR E HARAM TRAVELS & TOURS');
  const [invoiceNo, setInvoiceNo] = useState(nextInvoiceNum);
  const [packageTitle, setPackageTitle] = useState('15 Days Executive Umrah Package');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]); // Departure Date
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]); // Arrival Date
  const [paymentTerms, setPaymentTerms] = useState('Full Payment Required Prior to Visa Stamp & Flight Issuance.');

  // Demographic PAX Counts
  const [adultsCount, setAdultsCount] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [infantsCount, setInfantsCount] = useState(0);
  const [totalPax, setTotalPax] = useState(2);

  const [lineItems, setLineItems] = useState([
    { id: '1', description: 'Saudi Umrah Electronic Visas & Medical Insurance', quantity: 2, rate: 45000, amount: 90000, selectedPreset: 'Saudi Umrah Electronic Visas & Medical Insurance', originalPresetRate: 45000 },
    { id: '2', description: 'Makkah & Madinah Hotel Accommodation Blocks', quantity: 1, rate: 180000, amount: 180000, selectedPreset: 'Makkah & Madinah Hotel Accommodation Blocks', originalPresetRate: 180000 },
    { id: '3', description: 'Dedicated Ground Transport & Holy Ziyarat', quantity: 1, rate: 65000, amount: 65000, selectedPreset: 'Dedicated Ground Transport & Holy Ziyarat', originalPresetRate: 65000 },
    { id: '4', description: 'Direct International Flight Tickets', quantity: 2, rate: 135000, amount: 270000, selectedPreset: 'Direct International Flight Tickets', originalPresetRate: 135000 }
  ]);
  const [hasInitialPayment, setHasInitialPayment] = useState(false);
  const [initialPaymentAmount, setInitialPaymentAmount] = useState('');
  const [initialPaymentMethod, setInitialPaymentMethod] = useState('Online Bank Transfer');
  const [initialPaymentRef, setInitialPaymentRef] = useState('');

  // Currency Conversion Engine (SAR <-> PKR)
  const [sarEngineActive, setSarEngineActive] = useState(false);
  const [exchangeRateSarPkr, setExchangeRateSarPkr] = useState(74.5);
  const [priceInputCurrency, setPriceInputCurrency] = useState('PKR'); // 'PKR' | 'SAR'

  // -------------------------------------------------------------
  // PARTY LEDGER STATEMENT FILTER STATE
  // -------------------------------------------------------------
  const [selectedLedgerParty, setSelectedLedgerParty] = useState('ALL');
  const [ledgerDateFrom, setLedgerDateFrom] = useState('');
  const [ledgerDateTo, setLedgerDateTo] = useState('');

  // Calculation Engine: handles single rate and demographic rates (Adult, Child, Infant) + SAR conversion
  const calcLineItemTotal = (item, aCount = adultsCount, cCount = childrenCount, infCount = infantsCount, isSar = sarEngineActive, exRate = exchangeRateSarPkr, inCurr = priceInputCurrency) => {
    const hasDemographics = (Number(cCount) > 0 || Number(infCount) > 0);
    const multiplier = (isSar && inCurr === 'SAR') ? (parseFloat(exRate) || 74.5) : 1;

    if (!hasDemographics) {
      const q = parseFloat(item.quantity) || 1;
      const r = (parseFloat(item.rate) || 0) * multiplier;
      return Math.round(q * r);
    }

    const adultR = ((item.adultRate !== undefined && item.adultRate !== '') ? parseFloat(item.adultRate) : (parseFloat(item.rate) || 0)) * multiplier;
    const childR = ((item.childRate !== undefined && item.childRate !== '') ? parseFloat(item.childRate) : 0) * multiplier;
    const infantR = ((item.infantRate !== undefined && item.infantRate !== '') ? parseFloat(item.infantRate) : 0) * multiplier;

    const adultSub = (Number(aCount) || 1) * adultR;
    const childSub = (Number(cCount) || 0) * childR;
    const infantSub = (Number(infCount) || 0) * infantR;

    return Math.round(adultSub + childSub + infantSub);
  };

  // Synchronize demographic PAX from party selection
  const applyPaxFromParty = (p) => {
    if (!p) return;
    let a = 0, c = 0, inf = 0;
    if (Array.isArray(p.passengers) && p.passengers.length > 0) {
      p.passengers.forEach(pass => {
        const cat = (pass.category || pass.type || pass.paxType || '').toLowerCase();
        if (cat.includes('child')) c++;
        else if (cat.includes('infant')) inf++;
        else a++;
      });
    } else {
      a = Number(p.totalPax) || 1;
    }
    const tot = a + c + inf;
    const finalA = a > 0 ? a : 1;
    setAdultsCount(finalA);
    setChildrenCount(c);
    setInfantsCount(inf);
    setTotalPax(tot > 0 ? tot : 1);
    setLineItems(prev => prev.map(item => ({
      ...item,
      amount: calcLineItemTotal(item, finalA, c, inf)
    })));
  };

  const handlePaxStep = (type, delta) => {
    let nextA = adultsCount;
    let nextC = childrenCount;
    let nextInf = infantsCount;

    if (type === 'adults') nextA = Math.max(1, adultsCount + delta);
    else if (type === 'children') nextC = Math.max(0, childrenCount + delta);
    else if (type === 'infants') nextInf = Math.max(0, infantsCount + delta);

    setAdultsCount(nextA);
    setChildrenCount(nextC);
    setInfantsCount(nextInf);
    setTotalPax(nextA + nextC + nextInf);

    setLineItems(prev => prev.map(item => ({
      ...item,
      amount: calcLineItemTotal(item, nextA, nextC, nextInf)
    })));
  };

  const handlePaxInput = (type, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    let nextA = adultsCount;
    let nextC = childrenCount;
    let nextInf = infantsCount;

    if (type === 'adults') nextA = Math.max(1, num);
    else if (type === 'children') nextC = num;
    else if (type === 'infants') nextInf = num;

    setAdultsCount(nextA);
    setChildrenCount(nextC);
    setInfantsCount(nextInf);
    setTotalPax(nextA + nextC + nextInf);

    setLineItems(prev => prev.map(item => ({
      ...item,
      amount: calcLineItemTotal(item, nextA, nextC, nextInf)
    })));
  };

  // Line Items Helper
  const handleItemChange = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    if (field === 'rate' && (updated[index].adultRate === undefined || updated[index].adultRate === '')) {
      updated[index].adultRate = value;
    }
    updated[index].amount = calcLineItemTotal(updated[index]);
    setLineItems(updated);
  };

  const handleDemographicRateChange = (index, paxType, value) => {
    const updated = [...lineItems];
    updated[index][paxType] = value;
    if (paxType === 'adultRate') {
      updated[index].rate = value;
    }
    updated[index].amount = calcLineItemTotal(updated[index]);
    setLineItems(updated);
  };

  const handlePresetSelect = (index, presetName) => {
    const updated = [...lineItems];
    if (presetName === 'CUSTOM') {
      updated[index].selectedPreset = 'CUSTOM';
      setLineItems(updated);
      return;
    }
    const match = itemPresets.find(p => p.name === presetName);
    if (match) {
      updated[index].selectedPreset = match.name;
      updated[index].description = match.name;
      updated[index].rate = match.defaultRate;
      updated[index].originalPresetRate = match.defaultRate;
      const q = parseFloat(updated[index].quantity) || 1;
      updated[index].amount = Math.round(q * match.defaultRate);
    }
    setLineItems(updated);
  };

  const handleSaveRateToPreset = async (index) => {
    const item = lineItems[index];
    if (!item || !item.description) return;
    const currentRate = parseFloat(item.rate) || 0;
    const itemName = item.description.trim();

    try {
      await saveCloudItemPreset({
        name: itemName,
        defaultRate: currentRate,
        companyName: customCompany || 'NOOR E HARAM TRAVELS & TOURS'
      });
      const cloudPresets = await getCloudItemPresets();
      if (Array.isArray(cloudPresets) && cloudPresets.length > 0) {
        setItemPresets(cloudPresets);
      }
    } catch (e) {
      console.warn('Failed saving preset to Supabase', e);
    }

    const updated = [...lineItems];
    updated[index].originalPresetRate = currentRate;
    updated[index].selectedPreset = itemName;
    setLineItems(updated);

    setSavedNoticeMap(prev => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setSavedNoticeMap(prev => {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      });
    }, 2500);
  };

  const handleResetRateToPreset = (index) => {
    const item = lineItems[index];
    if (!item) return;
    const fallbackRate = item.originalPresetRate !== undefined ? item.originalPresetRate : 0;
    const updated = [...lineItems];
    updated[index].rate = fallbackRate;
    updated[index].amount = Math.round((parseFloat(item.quantity) || 0) * fallbackRate);
    setLineItems(updated);
  };

  const addLineItem = () => {
    const newItemId = String(Date.now());
    setLineItems([
      ...lineItems,
      { id: newItemId, description: '', quantity: 1, rate: 0, amount: 0, selectedPreset: '', originalPresetRate: 0 }
    ]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const calculatedTotalBilled = lineItems.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
  const initialPaidNum = hasInitialPayment ? (parseFloat(initialPaymentAmount) || 0) : 0;
  const calculatedBalanceDue = Math.max(0, calculatedTotalBilled - initialPaidNum);

  // Handle party change in create/edit modal
  const handlePartySelectChange = (uid) => {
    setSelectedPartyUid(uid);
    if (uid !== 'CUSTOM') {
      const p = parties.find(party => party.partyHeadUid === uid);
      if (p) {
        setCustomPartyName(p.partyName || '');
        setCustomPhone(p.contactPhone || '');
        setCustomCompany(p.companyName || 'NOOR E HARAM TRAVELS & TOURS');
        setPackageTitle(p.packageTitle || `${p.totalPax || 2} PAX Umrah Package`);
        applyPaxFromParty(p);
      }
    }
  };

  // Open Create Mode
  const handleOpenCreateInvoice = () => {
    setEditingInvoiceId(null);
    setInvoiceNo(`INV-2026-${String(invoices.length + 1).padStart(3, '0')}`);
    const defaultUid = parties[0]?.partyHeadUid || 'CUSTOM';
    setSelectedPartyUid(defaultUid);

    if (defaultUid !== 'CUSTOM' && parties[0]) {
      const p = parties[0];
      setCustomPartyName(p.partyName || '');
      setCustomPhone(p.contactPhone || '');
      setCustomCompany(p.companyName || 'NOOR E HARAM TRAVELS & TOURS');
      setPackageTitle(p.packageTitle || `${p.totalPax || 2} PAX Umrah Package`);
      applyPaxFromParty(p);
    } else {
      setCustomPartyName('');
      setCustomPhone('');
      setCustomCompany('NOOR E HARAM TRAVELS & TOURS');
      setPackageTitle('15 Days Executive Umrah Package');
      setAdultsCount(2);
      setChildrenCount(0);
      setInfantsCount(0);
      setTotalPax(2);
    }

    setIssueDate(new Date().toISOString().split('T')[0]);
    setDueDate(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
    setPaymentTerms('Full Payment Required Prior to Visa Stamp & Flight Issuance.');
    setSarEngineActive(false);
    setExchangeRateSarPkr(74.5);
    setPriceInputCurrency('PKR');
    setLineItems([
      { id: '1', description: 'Saudi Umrah Electronic Visas & Medical Insurance', quantity: 2, rate: 45000, adultRate: 45000, childRate: '', infantRate: '', amount: 90000, selectedPreset: 'Saudi Umrah Electronic Visas & Medical Insurance', originalPresetRate: 45000 },
      { id: '2', description: 'Makkah & Madinah Hotel Accommodation Blocks', quantity: 1, rate: 180000, adultRate: 180000, childRate: '', infantRate: '', amount: 180000, selectedPreset: 'Makkah & Madinah Hotel Accommodation Blocks', originalPresetRate: 180000 },
      { id: '3', description: 'Dedicated Ground Transport & Holy Ziyarat', quantity: 1, rate: 65000, adultRate: 65000, childRate: '', infantRate: '', amount: 65000, selectedPreset: 'Dedicated Ground Transport & Holy Ziyarat', originalPresetRate: 65000 },
      { id: '4', description: 'Direct International Flight Tickets', quantity: 2, rate: 135000, adultRate: 135000, childRate: '', infantRate: '', amount: 270000, selectedPreset: 'Direct International Flight Tickets', originalPresetRate: 135000 }
    ]);
    setHasInitialPayment(false);
    setInitialPaymentAmount('');
    setShowCreateModal(true);
  };

  // Open Edit Mode
  const handleOpenEditInvoice = (inv) => {
    setEditingInvoiceId(inv.id || inv.invoiceNo);
    setInvoiceNo(inv.invoiceNo || '');
    setSelectedPartyUid(inv.partyHeadUid || 'CUSTOM');
    setCustomPartyName(inv.partyName || '');
    setCustomPhone(inv.contactPhone || '');
    setCustomCompany(inv.companyName || 'NOOR E HARAM TRAVELS & TOURS');
    setPackageTitle(inv.packageTitle || inv.packageName || 'Umrah Services Package');
    setIssueDate(inv.departureDate || inv.issueDate || new Date().toISOString().split('T')[0]);
    setDueDate(inv.arrivalDate || inv.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
    setPaymentTerms(inv.paymentTerms || 'Full Payment Required Prior to Visa Stamp & Flight Issuance.');
    setSarEngineActive(Boolean(inv.sarEngineActive || inv.exchangeRateSarPkr));
    setExchangeRateSarPkr(parseFloat(inv.exchangeRateSarPkr) || 74.5);
    setPriceInputCurrency(inv.priceInputCurrency || 'PKR');

    const a = inv.adultsCount !== undefined ? Number(inv.adultsCount) : (Number(inv.totalPax) || 1);
    const c = inv.childrenCount !== undefined ? Number(inv.childrenCount) : 0;
    const inf = inv.infantsCount !== undefined ? Number(inv.infantsCount) : 0;
    setAdultsCount(a);
    setChildrenCount(c);
    setInfantsCount(inf);
    setTotalPax(inv.totalPax !== undefined ? Number(inv.totalPax) : (a + c + inf));

    const rawItems = inv.lineItems || inv.items || [];
    if (rawItems.length > 0) {
      setLineItems(rawItems.map((item, idx) => ({
        id: item.id || `item-${idx + 1}-${Date.now()}`,
        description: item.description || '',
        quantity: item.quantity !== undefined ? item.quantity : 1,
        rate: item.rate !== undefined ? item.rate : 0,
        adultRate: item.adultRate !== undefined ? item.adultRate : item.rate,
        childRate: item.childRate !== undefined ? item.childRate : '',
        infantRate: item.infantRate !== undefined ? item.infantRate : '',
        amount: item.amount !== undefined ? item.amount : calcLineItemTotal(item, a, c, inf, Boolean(inv.sarEngineActive || inv.exchangeRateSarPkr), parseFloat(inv.exchangeRateSarPkr) || 74.5, inv.priceInputCurrency || 'PKR'),
        selectedPreset: item.description || '',
        originalPresetRate: item.rate !== undefined ? item.rate : 0
      })));
    } else {
      setLineItems([
        { id: '1', description: 'Umrah Package Services', quantity: 1, rate: 0, adultRate: 0, childRate: '', infantRate: '', amount: 0, selectedPreset: '', originalPresetRate: 0 }
      ]);
    }

    setHasInitialPayment(false);
    setInitialPaymentAmount('');
    setShowCreateModal(true);
  };

  // Submit Create or Edit Invoice
  const handleCreateInvoiceSubmit = async (e) => {
    e.preventDefault();
    const finalPartyName = selectedPartyUid === 'CUSTOM' ? (customPartyName || 'WALK-IN CLIENT') : customPartyName;
    const finalPhone = selectedPartyUid === 'CUSTOM' ? customPhone : (parties.find(p => p.partyHeadUid === selectedPartyUid)?.contactPhone || '');
    const cleanCompany = customCompany || 'NOOR E HARAM TRAVELS & TOURS';

    let existingInv = null;
    if (editingInvoiceId) {
      existingInv = invoices.find(i => i.id === editingInvoiceId || i.invoiceNo === editingInvoiceId);
    }

    let transactions = existingInv?.ledgerTransactions ? [...existingInv.ledgerTransactions] : [];
    if (!editingInvoiceId && hasInitialPayment && initialPaidNum > 0) {
      transactions.push({
        id: `tx-init-${Date.now()}`,
        date: issueDate,
        amount: initialPaidNum,
        method: initialPaymentMethod,
        referenceNo: initialPaymentRef || `INIT-${invoiceNo}`,
        notes: 'Initial Advance Payment upon invoice creation',
        receivedBy: 'System Cashier'
      });
    }

    const currentPaid = transactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
    const balanceDue = Math.max(0, calculatedTotalBilled - currentPaid);

    const cleanItems = lineItems
      .filter(item => (item.description || '').trim() !== '')
      .map(item => ({
        id: item.id,
        description: item.description,
        quantity: parseFloat(item.quantity) || 1,
        rate: parseFloat(item.rate) || 0,
        adultRate: item.adultRate !== undefined ? item.adultRate : item.rate,
        childRate: item.childRate !== undefined ? item.childRate : '',
        infantRate: item.infantRate !== undefined ? item.infantRate : '',
        amount: calcLineItemTotal(item)
      }));

    const finalInvoiceObj = {
      id: editingInvoiceId || `inv-${Date.now()}`,
      invoiceNo,
      partyHeadUid: selectedPartyUid,
      partyName: finalPartyName,
      contactPhone: finalPhone,
      companyName: cleanCompany,
      packageTitle,
      packageName: packageTitle,
      departureDate: issueDate,
      arrivalDate: dueDate,
      issueDate,
      dueDate,
      currency: 'PKR',
      items: cleanItems,
      lineItems: cleanItems,
      adultsCount: Number(adultsCount) || 0,
      childrenCount: Number(childrenCount) || 0,
      infantsCount: Number(infantsCount) || 0,
      totalPax: Number(totalPax) || ((Number(adultsCount) || 0) + (Number(childrenCount) || 0) + (Number(infantsCount) || 0)),
      sarEngineActive: sarEngineActive,
      exchangeRateSarPkr: sarEngineActive ? exchangeRateSarPkr : null,
      priceInputCurrency: sarEngineActive ? priceInputCurrency : 'PKR',
      totalAmountSar: sarEngineActive ? Math.round((calculatedTotalBilled / exchangeRateSarPkr) * 100) / 100 : null,
      balanceDueSar: sarEngineActive ? Math.round((balanceDue / exchangeRateSarPkr) * 100) / 100 : null,
      totalAmount: calculatedTotalBilled,
      paidAmount: currentPaid,
      balanceDue,
      status: balanceDue <= 0 && calculatedTotalBilled > 0 ? 'Settled' : (currentPaid > 0 ? 'Partially Unlocked Balance' : 'Outstanding Overdue Collections'),
      paymentTerms,
      ledgerTransactions: transactions,
      createdAt: existingInv?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveCloudInvoice(finalInvoiceObj);
    const updated = await getCloudInvoices();
    setInvoiceList(updated);
    if (onInvoicesUpdated) onInvoicesUpdated(updated);
    setShowCreateModal(false);
    setEditingInvoiceId(null);
  };

  const handleDeleteInvoice = async (id, invoiceNo) => {
    if (confirm(`Are you sure you want to delete invoice ${invoiceNo}? This will delete it directly from Supabase database.`)) {
      await deleteCloudInvoice(id);
      const updated = await getCloudInvoices();
      setInvoiceList(updated);
      if (onInvoicesUpdated) onInvoicesUpdated(updated);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!activeInvoiceForPay || !payAmount || parseFloat(payAmount) <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    try {
      const updatedInv = addLedgerTransaction(activeInvoiceForPay.id, {
        date: payDate || new Date().toISOString().split('T')[0],
        amount: parseFloat(payAmount),
        method: payMethod,
        referenceNo: payRef || `PAY-${Date.now().toString().slice(-6)}`,
        notes: payNotes || 'Payment recorded',
      });
      if (updatedInv) {
        await saveCloudInvoice(updatedInv);
      }
      setActiveInvoiceForPay(null);
      setPayAmount('');
      setPayRef('');
      setPayNotes('');
      const updated = await getCloudInvoices();
      setInvoiceList(updated);
      if (onInvoicesUpdated) onInvoicesUpdated(updated);
    } catch (err) {
      alert(`Error logging payment: ${err.message}`);
    }
  };

  // Filtered invoices for Invoices view (backed by live Supabase invoiceList)
  const displayInvoices = invoiceList.length > 0 ? invoiceList : invoices;
  const filteredInvoices = displayInvoices.filter(inv => {
    const q = searchTerm.toLowerCase();
    const matchSearch = (
      (inv.invoiceNo || '').toLowerCase().includes(q) ||
      (inv.partyName || '').toLowerCase().includes(q) ||
      (inv.partyHeadUid || '').toLowerCase().includes(q)
    );
    if (!matchSearch) return false;

    if (statusFilter === 'SETTLED') return inv.status === 'Settled';
    if (statusFilter === 'PARTIAL') return inv.status === 'Partially Unlocked Balance';
    if (statusFilter === 'OVERDUE') return inv.status === 'Outstanding Overdue Collections';
    return true;
  });

  const getStatusChip = (status) => {
    switch (status) {
      case 'Settled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            <span>SETTLED</span>
          </span>
        );
      case 'Partially Unlocked Balance':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-black bg-amber-100 text-amber-950 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-700" />
            <span>PARTIAL</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-black bg-rose-100 text-rose-950 border border-rose-300">
            <AlertCircle className="w-3 h-3 text-rose-700" />
            <span>OVERDUE</span>
          </span>
        );
    }
  };

  // -------------------------------------------------------------
  // ALL LEDGER TRANSACTIONS (DEBITS & CREDITS ENGINE)
  // -------------------------------------------------------------
  const allLedgerEntries = useMemo(() => {
    const list = [];
    displayInvoices.forEach(inv => {
      // 1. Invoice Debit Entry
      list.push({
        id: `inv-${inv.id || inv.invoiceNo}`,
        date: inv.issueDate || '2026-01-01',
        type: 'INVOICE',
        refNo: inv.invoiceNo,
        partyName: inv.partyName || 'Customer',
        partyHeadUid: inv.partyHeadUid || 'CUSTOM',
        particulars: `Package Invoice: ${inv.packageTitle || 'Umrah Travel Package'}`,
        debit: parseFloat(inv.totalAmount) || 0,
        credit: 0,
        invoiceId: inv.id,
        rawTimestamp: new Date(inv.issueDate || '2026-01-01').getTime(),
      });

      // 2. Transaction Credit Entries
      (inv.ledgerTransactions || []).forEach(tx => {
        list.push({
          id: `tx-${tx.id || tx.referenceNo}`,
          date: tx.date || inv.issueDate || '2026-01-01',
          type: 'PAYMENT',
          refNo: tx.referenceNo || `PAY-${tx.id}`,
          partyName: inv.partyName || 'Customer',
          partyHeadUid: inv.partyHeadUid || 'CUSTOM',
          particulars: `Payment via ${tx.method || 'Bank Transfer'}${tx.notes ? ` (${tx.notes})` : ''}`,
          debit: 0,
          credit: parseFloat(tx.amount) || 0,
          invoiceId: inv.id,
          rawTimestamp: new Date(tx.date || inv.issueDate || '2026-01-01').getTime() + 1,
        });
      });
    });

    // Sort chronologically ascending
    list.sort((a, b) => a.rawTimestamp - b.rawTimestamp);
    return list;
  }, [invoices]);

  // Compute filtered ledger transactions with running balance
  const { filteredLedgerEntries, ledgerTotalDebit, ledgerTotalCredit, ledgerNetBalance } = useMemo(() => {
    let balance = 0;
    let tDebit = 0;
    let tCredit = 0;

    const filtered = allLedgerEntries.filter(entry => {
      if (selectedLedgerParty !== 'ALL') {
        const matchUid = entry.partyHeadUid === selectedLedgerParty;
        const matchName = entry.partyName.toLowerCase() === selectedLedgerParty.toLowerCase();
        if (!matchUid && !matchName) return false;
      }
      if (ledgerDateFrom && entry.date < ledgerDateFrom) return false;
      if (ledgerDateTo && entry.date > ledgerDateTo) return false;
      return true;
    });

    const withBalance = filtered.map(item => {
      balance += (item.debit - item.credit);
      tDebit += item.debit;
      tCredit += item.credit;
      return {
        ...item,
        runningBalance: balance
      };
    });

    return {
      filteredLedgerEntries: withBalance,
      ledgerTotalDebit: tDebit,
      ledgerTotalCredit: tCredit,
      ledgerNetBalance: balance
    };
  }, [allLedgerEntries, selectedLedgerParty, ledgerDateFrom, ledgerDateTo]);

  // Extract unique parties that have accounts
  const uniqueLedgerParties = useMemo(() => {
    const map = new Map();
    parties.forEach(p => {
      map.set(p.partyHeadUid, { uid: p.partyHeadUid, name: p.partyName, phone: p.contactPhone });
    });
    invoices.forEach(inv => {
      if (inv.partyHeadUid && !map.has(inv.partyHeadUid)) {
        map.set(inv.partyHeadUid, { uid: inv.partyHeadUid, name: inv.partyName, phone: inv.contactPhone });
      }
    });
    return Array.from(map.values());
  }, [parties, invoices]);

  const selectedPartyObj = useMemo(() => {
    if (selectedLedgerParty === 'ALL') return null;
    return uniqueLedgerParties.find(p => p.uid === selectedLedgerParty || p.name === selectedLedgerParty) || null;
  }, [selectedLedgerParty, uniqueLedgerParties]);

  const handlePrintLedger = () => {
    window.print();
  };

  return (
    <div className="space-y-4">

      {/* Print-only CSS for Clean Statement of Account */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 8mm 10mm !important;
          }
          body {
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .no-print, header, aside, nav, .print-hide {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .statement-sheet {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
        }
        .print-only {
          display: none;
        }
      `}} />
      
      {/* ============================================================= */}
      {/* 1. TOP MODULE TITLE & SEGMENTED VIEW SWITCHER                  */}
      {/* ============================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print-hide">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
              Module D
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {viewMode === 'INVOICES' ? 'Bill & Invoices Manager' : 'Party & Customer Accounts Ledger'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {viewMode === 'INVOICES' 
              ? 'Issue client bills, track payment status, and manage client billings.'
              : 'Complete running debit/credit statements, payment receipts history, and customer accounts.'}
          </p>
        </div>

        {/* View Switcher Tabs (Invoices vs Ledger) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleSwitchView('INVOICES')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'INVOICES'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-indigo-600" />
              <span>Bill ({invoices.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchView('LEDGER')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'LEDGER'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Accounts Ledger</span>
            </button>
          </div>

          {viewMode === 'INVOICES' ? (
            <button
              onClick={handleOpenCreateInvoice}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Bill</span>
            </button>
          ) : (
            <button
              onClick={handlePrintLedger}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0a192f] hover:bg-slate-800 text-[#dfba73] border border-[#dfba73]/40 rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Statement</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* 2. VIEW A: INVOICES LIST & BILLING ENGINE                     */}
      {/* ============================================================= */}
      {viewMode === 'INVOICES' && (
        <div className="space-y-4">
          
          {/* Search & Status Filters */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search bills by bill #, party, or UID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-slate-800"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
              {['ALL', 'SETTLED', 'PARTIAL', 'OVERDUE'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors shrink-0 ${
                    statusFilter === status
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Invoices Master Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                  <tr>
                    <th className="py-3 px-4 font-bold">Bill Ref #</th>
                    <th className="py-3 px-4 font-bold">Party Head (Debtor)</th>
                    <th className="py-3 px-4 font-bold">Departure &amp; Arrival</th>
                    <th className="py-3 px-4 font-bold text-right">Total Billed</th>
                    <th className="py-3 px-4 font-bold text-right">Paid Receipts</th>
                    <th className="py-3 px-4 font-bold text-right">Balance Due</th>
                    <th className="py-3 px-4 font-bold text-center">Financial Status</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="font-semibold">No invoices match your current filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold font-mono text-slate-900">
                          <Link href={`/invoice/${encodeURIComponent(inv.invoiceNo)}`} className="text-indigo-600 hover:underline">
                            {inv.invoiceNo}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 uppercase">{inv.partyName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{inv.partyHeadUid}</div>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <div className="font-bold text-slate-900 text-xs truncate max-w-[200px]" title={inv.packageTitle || inv.packageName}>
                            {inv.packageTitle || inv.packageName || 'Umrah Package'}
                          </div>
                          <div className="text-[10.5px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="text-emerald-700 font-semibold">{inv.departureDate || inv.issueDate}</span>
                            <span className="text-slate-400">&rarr;</span>
                            <span className="text-indigo-700 font-semibold">{inv.arrivalDate || inv.dueDate}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {inv.currency} {(inv.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                          {inv.currency} {(inv.paidAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black">
                          <span className={inv.balanceDue > 0 ? 'text-rose-600' : 'text-slate-400'}>
                            {inv.currency} {(inv.balanceDue || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {getStatusChip(inv.status)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {inv.balanceDue > 0 && (
                              <button
                                onClick={() => {
                                  setActiveInvoiceForPay(inv);
                                  setPayAmount(inv.balanceDue);
                                }}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[10.5px] font-bold border border-emerald-200 transition-colors"
                                title="Log Payment"
                              >
                                Record Pay
                              </button>
                            )}

                            {/* Edit Bill Button */}
                            <button
                              onClick={() => handleOpenEditInvoice(inv)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200/80 transition-colors"
                              title="Edit Bill & Line Items"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <Link
                              href={`/invoice/${encodeURIComponent(inv.invoiceNo)}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                              title="View Invoice"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNo)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Invoice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 3. VIEW B: PARTY ACCOUNTS & LEDGER STATEMENT                  */}
      {/* ============================================================= */}
      {viewMode === 'LEDGER' && (
        <div className="space-y-4 statement-sheet">

          {/* Statement Header for Print Only */}
          <div className="print-only pb-4 mb-4 border-b-2 border-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-black text-[#0a192f] uppercase tracking-tight">
                  NOOR E HARAM TRAVELS & TOURS
                </h1>
                <p className="text-xs text-slate-600">
                  Customer Account Ledger &bull; Statement of Account
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Generated On: {new Date().toLocaleDateString('en-GB')}
                </p>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 bg-[#0a192f] text-[#dfba73] font-mono font-bold text-xs rounded uppercase">
                  Statement
                </span>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  Account: {selectedPartyObj ? selectedPartyObj.name : 'All Accounts'}
                </p>
              </div>
            </div>
          </div>

          {/* Filter Bar & Account Selector */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 print-hide">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              
              {/* Account / Party Dropdown */}
              <div className="sm:col-span-5 space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase">
                  Select Customer / Account
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={selectedLedgerParty}
                    onChange={(e) => setSelectedLedgerParty(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white outline-none focus:border-slate-800 cursor-pointer"
                  >
                    <option value="ALL">All Parties / Master Consolidated Ledger</option>
                    {uniqueLedgerParties.map(p => (
                      <option key={p.uid} value={p.uid}>
                        {p.name} ({p.uid})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date From */}
              <div className="sm:col-span-3 space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase">
                  From Date
                </label>
                <CustomDatePicker
                  value={ledgerDateFrom}
                  onChange={(val) => setLedgerDateFrom(val)}
                  placeholder="DD-MM-YYYY"
                />
              </div>

              {/* Date To */}
              <div className="sm:col-span-3 space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase">
                  To Date
                </label>
                <CustomDatePicker
                  value={ledgerDateTo}
                  onChange={(val) => setLedgerDateTo(val)}
                  minDate={ledgerDateFrom || undefined}
                  placeholder="DD-MM-YYYY"
                />
              </div>

              {/* Reset Filters */}
              <div className="sm:col-span-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLedgerParty('ALL');
                    setLedgerDateFrom('');
                    setLedgerDateTo('');
                  }}
                  title="Reset Filters"
                  className="w-full p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Total Invoiced (Debit) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Billed (Debits)
                </span>
                <span className="text-xl font-black font-mono text-slate-900 block">
                  PKR {ledgerTotalDebit.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400">Total charges invoiced to client</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            {/* Total Received (Credit) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Received (Credits)
                </span>
                <span className="text-xl font-black font-mono text-emerald-700 block">
                  PKR {ledgerTotalCredit.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400">Payments collected &amp; cleared</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            {/* Net Balance Due */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Net Outstanding Balance
                </span>
                <span className={`text-xl font-black font-mono block ${
                  ledgerNetBalance > 0 ? 'text-rose-600' : (ledgerNetBalance === 0 ? 'text-emerald-700' : 'text-indigo-600')
                }`}>
                  PKR {ledgerNetBalance.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400">
                  {ledgerNetBalance > 0 ? 'Outstanding receivable' : (ledgerNetBalance === 0 ? 'Account fully settled' : 'Advance credit balance')}
                </span>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                ledgerNetBalance > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {ledgerNetBalance > 0 ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
            </div>

          </div>

          {/* Chronological Ledger Entries Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 print-hide">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Account Ledger Transactions ({filteredLedgerEntries.length})
                </span>
              </div>

              {selectedPartyObj && (
                <span className="text-xs font-mono font-bold text-slate-600 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                  {selectedPartyObj.name} &bull; {selectedPartyObj.phone}
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                  <tr>
                    <th className="py-3 px-3.5 font-bold">Date</th>
                    <th className="py-3 px-3.5 font-bold">Entry Type</th>
                    <th className="py-3 px-3.5 font-bold">Voucher / Ref #</th>
                    <th className="py-3 px-3.5 font-bold">Customer / Party</th>
                    <th className="py-3 px-3.5 font-bold">Particulars &amp; Details</th>
                    <th className="py-3 px-3.5 font-bold text-right">Debit (+)</th>
                    <th className="py-3 px-3.5 font-bold text-right">Credit (-)</th>
                    <th className="py-3 px-3.5 font-bold text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLedgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="font-semibold">No ledger entries found for this selection</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLedgerEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3.5 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                          {entry.date}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          {entry.type === 'INVOICE' ? (
                            <span className="px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                              INVOICE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                              RECEIPT
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {entry.invoiceId ? (
                            <Link 
                              href={`/invoice/${encodeURIComponent(entry.refNo)}`} 
                              className="text-indigo-600 hover:underline flex items-center gap-1"
                            >
                              <span>{entry.refNo}</span>
                            </Link>
                          ) : (
                            <span>{entry.refNo}</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="font-bold text-slate-900 uppercase block text-[11px]">
                            {entry.partyName}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 text-[11px]">
                          {entry.particulars}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {entry.debit > 0 ? `PKR ${entry.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                          {entry.credit > 0 ? `PKR ${entry.credit.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-black whitespace-nowrap">
                          <span className={entry.runningBalance > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                            PKR {entry.runningBalance.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Print Sign-off Footer */}
            <div className="print-only pt-8 mt-6 border-t border-slate-300">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <div className="text-center">
                  <div className="w-48 border-b border-slate-400 mb-1" />
                  <span>Prepared By / Cashier</span>
                </div>
                <div className="text-center">
                  <div className="w-48 border-b border-slate-400 mb-1" />
                  <span>Authorized Signature &amp; Stamp</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ============================================================= */}
      {/* 4. MODAL: CREATE / EDIT INVOICE                               */}
      {/* ============================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto print-hide">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                  editingInvoiceId ? 'bg-indigo-600' : 'bg-slate-900'
                }`}>
                  {editingInvoiceId ? <Edit3 className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {editingInvoiceId ? `Edit Corporate Bill: ${invoiceNo}` : 'Issue New Corporate Invoice'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingInvoiceId 
                      ? 'Update demographic PAX counts, itemized service allocations, and line pricing'
                      : 'Generate invoice with demographic PAX allocations, itemized services, and advance deposits'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingInvoiceId(null);
                }} 
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4">
              
              {/* Invoice Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Invoice Number *</label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:outline-none focus:border-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Billing Party *</label>
                  <select
                    value={selectedPartyUid}
                    onChange={(e) => handlePartySelectChange(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-800 bg-white focus:outline-none focus:border-slate-800 cursor-pointer"
                  >
                    <option value="CUSTOM">+ Custom / Walk-In Debtor</option>
                    {parties.map(p => (
                      <option key={p.partyHeadUid} value={p.partyHeadUid}>
                        {p.partyName} ({p.partyHeadUid})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Debtor Full Name *</label>
                  <input
                    type="text"
                    value={customPartyName}
                    onChange={(e) => setCustomPartyName(e.target.value)}
                    placeholder="e.g. MOHAMMED AHMED KHAN"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 uppercase focus:outline-none focus:border-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="0311-2264567"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-slate-800"
                  />
                </div>

                {/* Package Name with Single Typable Dropdown */}
                <div className="sm:col-span-2 lg:col-span-3 bg-slate-50 border border-slate-200/90 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-800 uppercase tracking-wide">
                        Package Name (Supabase Database) *
                      </label>
                      <span className="text-[9.5px] text-slate-400">
                        Single typable dropdown — select saved package to auto-fill travel dates
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <PackageCombobox
                      value={packageTitle}
                      onChange={(val) => setPackageTitle(val)}
                      onSelectPackage={(pkg) => handleSelectCloudPackage(pkg.id)}
                      packages={cloudPackages}
                      onDeletePackage={handleDeleteCloudPackage}
                      placeholder="Select or type package name..."
                    />
                    <button
                      type="button"
                      onClick={handleSavePackageToCloud}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
                      title="Save this Package Name and its Departure/Arrival dates straight into Supabase"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{packageSaveNotice ? 'Saved!' : 'Save Package'}</span>
                    </button>
                  </div>
                </div>

                {/* Departure Date */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Departure Date *</label>
                  <CustomDatePicker
                    value={issueDate}
                    onChange={(val) => setIssueDate(val)}
                    placeholder="DD-MM-YYYY"
                  />
                </div>

                {/* Arrival Date */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Arrival Date *</label>
                  <CustomDatePicker
                    value={dueDate}
                    onChange={(val) => setDueDate(val)}
                    minDate={issueDate || undefined}
                    placeholder="DD-MM-YYYY"
                  />
                </div>
              </div>

              {/* DEMOGRAPHIC PAX COUNTERS CARD */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Demographic PAX Breakdown
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Specify Adult, Child, and Infant counts for this booking
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200/80 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                    <span className="text-[10.5px] font-extrabold text-indigo-900 uppercase tracking-wider">Total PAX:</span>
                    <span className="text-sm font-black text-indigo-700 font-mono bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200 shadow-xs">
                      {totalPax}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* Adults */}
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between shadow-xs">
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-800 uppercase">Adults</label>
                      <span className="text-[9.5px] text-slate-400">12+ Years</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePaxStep('adults', -1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={adultsCount}
                        onChange={(e) => handlePaxInput('adults', e.target.value)}
                        className="w-12 text-center py-1 border border-slate-200 rounded-lg text-xs font-mono font-black text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => handlePaxStep('adults', 1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between shadow-xs">
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-800 uppercase">Children</label>
                      <span className="text-[9.5px] text-slate-400">2 - 11 Years</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePaxStep('children', -1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={childrenCount}
                        onChange={(e) => handlePaxInput('children', e.target.value)}
                        className="w-12 text-center py-1 border border-slate-200 rounded-lg text-xs font-mono font-black text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => handlePaxStep('children', 1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Infants */}
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between shadow-xs">
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-800 uppercase">Infants</label>
                      <span className="text-[9.5px] text-slate-400">&lt; 2 Years</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePaxStep('infants', -1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={infantsCount}
                        onChange={(e) => handlePaxInput('infants', e.target.value)}
                        className="w-12 text-center py-1 border border-slate-200 rounded-lg text-xs font-mono font-black text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => handlePaxStep('infants', 1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ITEMIZED LINE ITEMS & PRESET CATALOG */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                      Itemized Line Items &amp; Services
                    </label>
                    <p className="text-[10px] text-slate-400">
                      Select item, specify demographic rates (Adult, Child, Infant), and toggle SAR Currency Engine
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors shadow-xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Line Item</span>
                  </button>
                </div>

                {/* SAR CURRENCY CONVERSION ENGINE BAR */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-emerald-50/70 via-slate-50 to-emerald-50/70 border border-emerald-200/90 rounded-2xl p-2.5 shadow-2xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSarEngineActive(!sarEngineActive)}
                      className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 transition-all shadow-xs border cursor-pointer ${
                        sarEngineActive
                          ? 'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-500/20'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-sm">🇸🇦</span>
                      <span>SAR Currency Engine</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[8.5px] uppercase tracking-wider font-black ${
                        sarEngineActive ? 'bg-emerald-950 text-emerald-200' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {sarEngineActive ? 'ACTIVE' : 'OFF'}
                      </span>
                    </button>

                    {sarEngineActive && (
                      <div className="flex items-center gap-1.5 bg-white border border-emerald-300 rounded-full px-3 py-1 text-xs shadow-xs animate-in fade-in">
                        <span className="font-bold text-slate-600 text-[11px]">1 SAR =</span>
                        <span className="text-[11px] font-black text-emerald-800">PKR</span>
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          value={exchangeRateSarPkr}
                          onChange={(e) => setExchangeRateSarPkr(parseFloat(e.target.value) || 74.5)}
                          className="w-16 px-1.5 py-0.5 text-center font-mono font-black text-slate-900 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    )}
                  </div>

                  {sarEngineActive && (
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs animate-in fade-in">
                      <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5">Input Rates In:</span>
                      <button
                        type="button"
                        onClick={() => setPriceInputCurrency('PKR')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-black transition-colors cursor-pointer ${
                          priceInputCurrency === 'PKR' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        PKR
                      </button>
                      <button
                        type="button"
                        onClick={() => setPriceInputCurrency('SAR')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-black transition-colors cursor-pointer ${
                          priceInputCurrency === 'SAR' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        SAR (Riyal)
                      </button>
                    </div>
                  )}
                </div>

                {/* Table Header */}
                {(childrenCount >= 1 || infantsCount >= 1) ? (
                  <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-wider">
                    <div className="sm:col-span-5">Item / Service Description</div>
                    <div className="sm:col-span-5 text-right">
                      Price per Category ({priceInputCurrency}) — Adult {childrenCount >= 1 ? '/ Child' : ''} {infantsCount >= 1 ? '/ Infant' : ''}
                    </div>
                    <div className="sm:col-span-2 text-right">Total</div>
                  </div>
                ) : (
                  <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-wider">
                    <div className="sm:col-span-5">Item / Service Description</div>
                    <div className="sm:col-span-2 text-center">Qty</div>
                    <div className="sm:col-span-3 text-right">Price per Qty ({priceInputCurrency})</div>
                    <div className="sm:col-span-2 text-right">Total</div>
                  </div>
                )}

                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {lineItems.map((item, idx) => {
                    const lineTotal = calcLineItemTotal(item);
                    const isPriceDirty = item.originalPresetRate !== undefined && Number(item.rate) !== Number(item.originalPresetRate);
                    const isSavedNotice = !!savedNoticeMap[item.id];
                    const hasDemographics = (childrenCount >= 1 || infantsCount >= 1);

                    return (
                      <div 
                        key={item.id} 
                        className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 space-y-2 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-2 sm:items-center hover:bg-slate-100/50 transition-colors"
                      >
                        {/* Item Description Combobox */}
                        <div className="sm:col-span-5">
                          <ItemCombobox
                            value={item.description}
                            onChange={(val) => handleItemChange(idx, 'description', val)}
                            onSelectPreset={(preset) => {
                              const updated = [...lineItems];
                              const defaultPresetRate = priceInputCurrency === 'SAR' ? Math.round((preset.defaultRate / exchangeRateSarPkr) * 10) / 10 : preset.defaultRate;
                              updated[idx].description = preset.name;
                              updated[idx].rate = defaultPresetRate;
                              updated[idx].adultRate = defaultPresetRate;
                              updated[idx].originalPresetRate = defaultPresetRate;
                              updated[idx].selectedPreset = preset.name;
                              updated[idx].amount = calcLineItemTotal(updated[idx]);
                              setLineItems(updated);
                            }}
                            presets={itemPresets}
                            onDeletePreset={async (presetId) => {
                              if (confirm('Delete this preset from Supabase?')) {
                                await deleteCloudItemPreset(presetId);
                                const refreshed = await getCloudItemPresets();
                                setItemPresets(refreshed);
                              }
                            }}
                            placeholder="Select preset or type custom item..."
                          />
                        </div>

                        {/* Qty Column (only shown when no demographic breakdown) */}
                        {!hasDemographics && (
                          <div className="sm:col-span-2 flex items-center justify-between sm:justify-center gap-1">
                            <span className="sm:hidden text-[10px] font-bold text-slate-500 uppercase">Qty:</span>
                            <input
                              type="number"
                              min="1"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                              placeholder="Qty"
                              className="w-20 sm:w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 text-center font-mono font-bold focus:outline-none focus:border-indigo-500"
                              required
                            />
                          </div>
                        )}

                        {/* Price Inputs: Demographic Breakdown Stacked Vertically Below Each Other */}
                        {hasDemographics ? (
                          <div className="sm:col-span-5 space-y-1.5">
                            <div className="space-y-1.5 bg-white/80 border border-slate-200/90 rounded-xl p-2 shadow-2xs">
                              {/* Adult Input Row (below each other) */}
                              <div className="flex items-center gap-2">
                                <div className="w-24 shrink-0 flex items-center justify-between">
                                  <label className="text-[9.5px] font-black text-slate-700 uppercase tracking-tight">
                                    Adult {adultsCount > 1 ? `(x${adultsCount})` : ''}
                                  </label>
                                  {sarEngineActive && (
                                    <span className="text-[8px] font-mono text-emerald-700 font-bold">
                                      {priceInputCurrency === 'SAR' ? 'SAR' : 'PKR'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 relative">
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder="Adult"
                                    value={item.adultRate !== undefined ? item.adultRate : item.rate}
                                    onChange={(e) => handleDemographicRateChange(idx, 'adultRate', e.target.value)}
                                    className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 text-right font-mono font-bold focus:outline-none focus:border-indigo-500 shadow-2xs"
                                  />
                                </div>
                                {sarEngineActive && (
                                  <div className="w-24 shrink-0 text-right font-mono text-[9px] font-bold text-emerald-700 truncate">
                                    {priceInputCurrency === 'SAR'
                                      ? `≈ PKR ${Math.round((parseFloat(item.adultRate !== undefined ? item.adultRate : item.rate) || 0) * exchangeRateSarPkr).toLocaleString()}`
                                      : `≈ SAR ${(((parseFloat(item.adultRate !== undefined ? item.adultRate : item.rate) || 0) / exchangeRateSarPkr)).toFixed(1)}`}
                                  </div>
                                )}
                              </div>

                              {/* Child Input Row (if childrenCount >= 1, below adult) */}
                              {childrenCount >= 1 && (
                                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                                  <div className="w-24 shrink-0 flex items-center justify-between">
                                    <label className="text-[9.5px] font-black text-amber-700 uppercase tracking-tight">
                                      Child (x{childrenCount})
                                    </label>
                                    {sarEngineActive && (
                                      <span className="text-[8px] font-mono text-emerald-700 font-bold">
                                        {priceInputCurrency === 'SAR' ? 'SAR' : 'PKR'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1 relative">
                                    <input
                                      type="number"
                                      min="0"
                                      step="any"
                                      placeholder="Child"
                                      value={item.childRate !== undefined ? item.childRate : ''}
                                      onChange={(e) => handleDemographicRateChange(idx, 'childRate', e.target.value)}
                                      className="w-full px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs text-slate-900 text-right font-mono font-bold focus:outline-none focus:border-amber-500 shadow-2xs"
                                    />
                                  </div>
                                  {sarEngineActive && (
                                    <div className="w-24 shrink-0 text-right font-mono text-[9px] font-bold text-emerald-700 truncate">
                                      {priceInputCurrency === 'SAR'
                                        ? `≈ PKR ${Math.round((parseFloat(item.childRate) || 0) * exchangeRateSarPkr).toLocaleString()}`
                                        : `≈ SAR ${(((parseFloat(item.childRate) || 0) / exchangeRateSarPkr)).toFixed(1)}`}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Infant Input Row (if infantsCount >= 1, below child) */}
                              {infantsCount >= 1 && (
                                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                                  <div className="w-24 shrink-0 flex items-center justify-between">
                                    <label className="text-[9.5px] font-black text-indigo-700 uppercase tracking-tight">
                                      Infant (x{infantsCount})
                                    </label>
                                    {sarEngineActive && (
                                      <span className="text-[8px] font-mono text-emerald-700 font-bold">
                                        {priceInputCurrency === 'SAR' ? 'SAR' : 'PKR'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1 relative">
                                    <input
                                      type="number"
                                      min="0"
                                      step="any"
                                      placeholder="Infant"
                                      value={item.infantRate !== undefined ? item.infantRate : ''}
                                      onChange={(e) => handleDemographicRateChange(idx, 'infantRate', e.target.value)}
                                      className="w-full px-2.5 py-1 bg-white border border-indigo-300 rounded-lg text-xs text-slate-900 text-right font-mono font-bold focus:outline-none focus:border-indigo-500 shadow-2xs"
                                    />
                                  </div>
                                  {sarEngineActive && (
                                    <div className="w-24 shrink-0 text-right font-mono text-[9px] font-bold text-emerald-700 truncate">
                                      {priceInputCurrency === 'SAR'
                                        ? `≈ PKR ${Math.round((parseFloat(item.infantRate) || 0) * exchangeRateSarPkr).toLocaleString()}`
                                        : `≈ SAR ${(((parseFloat(item.infantRate) || 0) / exchangeRateSarPkr)).toFixed(1)}`}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-end gap-1.5 pt-0.5">
                              {isPriceDirty && (
                                <button
                                  type="button"
                                  onClick={() => handleSaveRateToPreset(idx)}
                                  className="text-[9.5px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors cursor-pointer"
                                  title="✔ Save this adult rate to preset catalog in Supabase"
                                >
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>Save Adult Rate</span>
                                </button>
                              )}
                              {isSavedNotice && (
                                <span className="text-[9.5px] font-bold text-emerald-700 animate-in fade-in">
                                  Saved!
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="sm:col-span-3 space-y-1">
                            <div className="flex items-center justify-between sm:justify-end gap-1.5">
                              <span className="sm:hidden text-[10px] font-bold text-slate-500 uppercase">Rate:</span>
                              <div className="relative flex-1 max-w-[140px] sm:max-w-none">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={item.rate}
                                  onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                                  placeholder={priceInputCurrency === 'SAR' ? "Rate (SAR)" : "Rate (PKR)"}
                                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 text-right font-mono font-bold focus:outline-none focus:border-indigo-500"
                                  required
                                />
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {isPriceDirty && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveRateToPreset(idx)}
                                      title="✔ Save this price per qty for this item into preset catalog in Supabase"
                                      className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors shadow-xs cursor-pointer"
                                    >
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleResetRateToPreset(idx)}
                                      title="✖ Reset price back to default saved rate"
                                      className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-end gap-1.5 text-[9.5px]">
                              {sarEngineActive && (
                                <span className="font-mono text-emerald-700 font-bold">
                                  {priceInputCurrency === 'SAR'
                                    ? `≈ PKR ${Math.round((parseFloat(item.rate) || 0) * exchangeRateSarPkr).toLocaleString()}`
                                    : `≈ SAR ${(((parseFloat(item.rate) || 0) / exchangeRateSarPkr)).toFixed(1)}`}
                                </span>
                              )}
                              {isSavedNotice && (
                                <span className="font-bold text-emerald-700 animate-in fade-in">
                                  Saved!
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Line Total & Remove Button */}
                        <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                          <div className="text-right">
                            <span className="sm:hidden text-[10px] text-slate-500 mr-2 uppercase font-bold">Total:</span>
                            <span className="font-mono font-black text-slate-900 text-xs block">
                              PKR {lineTotal.toLocaleString()}
                            </span>
                            {sarEngineActive && (
                              <span className="font-mono font-bold text-[10px] text-emerald-700 block">
                                SAR {(lineTotal / exchangeRateSarPkr).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>

                          {lineItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLineItem(idx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remove Line Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Calculation Card with SAR Engine Summary */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono shadow-md">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Grand Total Billed</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-white">PKR {calculatedTotalBilled.toLocaleString()}</span>
                    {sarEngineActive && (
                      <span className="text-sm font-black text-emerald-400">
                        (SAR {(calculatedTotalBilled / exchangeRateSarPkr).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                      </span>
                    )}
                  </div>
                </div>
                {hasInitialPayment && (
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-400 block uppercase font-bold tracking-wider">Net Balance Due</span>
                    <div className="flex items-baseline justify-end gap-2">
                      <span className="text-lg font-black text-emerald-300">PKR {calculatedBalanceDue.toLocaleString()}</span>
                      {sarEngineActive && (
                        <span className="text-sm font-black text-emerald-400">
                          (SAR {(calculatedBalanceDue / exchangeRateSarPkr).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Advance Payment Toggle (only for new invoices) */}
              {!editingInvoiceId && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasInitialPayment}
                      onChange={(e) => setHasInitialPayment(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span className="text-xs font-bold text-slate-800">Record Advance / Initial Deposit Now</span>
                  </label>

                  {hasInitialPayment && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 text-xs">
                      <div>
                        <label className="block text-[9.5px] font-bold text-emerald-900 uppercase">Paid Amount (PKR)</label>
                        <input
                          type="number"
                          value={initialPaymentAmount}
                          onChange={(e) => setInitialPaymentAmount(e.target.value)}
                          placeholder="e.g. 100000"
                          className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-mono font-bold focus:outline-none"
                          required={hasInitialPayment}
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-emerald-900 uppercase">Payment Method</label>
                        <select
                          value={initialPaymentMethod}
                          onChange={(e) => setInitialPaymentMethod(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs focus:outline-none"
                        >
                          <option>Online Bank Transfer</option>
                          <option>Cash Deposit</option>
                          <option>Cheque Clearance</option>
                          <option>Pay Order</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-emerald-900 uppercase">Reference #</label>
                        <input
                          type="text"
                          value={initialPaymentRef}
                          onChange={(e) => setInitialPaymentRef(e.target.value)}
                          placeholder="e.g. TRX-90412"
                          className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingInvoiceId(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-xs transition-colors flex items-center gap-2"
                >
                  {editingInvoiceId ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                      <span>Save Bill Changes</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4 text-indigo-300" />
                      <span>Confirm &amp; Issue Invoice</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 5. MODAL: RECORD PAYMENT                                      */}
      {/* ============================================================= */}
      {activeInvoiceForPay && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 print-hide">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Record Client Payment</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Invoice: {activeInvoiceForPay.invoiceNo}</p>
                </div>
              </div>
              <button onClick={() => setActiveInvoiceForPay(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Debtor</span>
                  <span className="font-bold text-slate-800">{activeInvoiceForPay.partyName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Balance Due</span>
                  <span className="font-bold text-rose-600 font-mono">
                    {activeInvoiceForPay.currency} {(activeInvoiceForPay.balanceDue || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Receipt Date</label>
                <CustomDatePicker
                  value={payDate}
                  onChange={(val) => setPayDate(val)}
                  placeholder="DD-MM-YYYY"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Payment Amount (PKR) *</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-sm outline-none focus:border-slate-800"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-800 text-xs outline-none"
                >
                  <option>Online Bank Transfer</option>
                  <option>Cash Deposit</option>
                  <option>Cheque Clearance</option>
                  <option>Pay Order</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Bank Reference / Cheque #</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. TRX-78291"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Notes / Description</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Received via Meezan Bank"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveInvoiceForPay(null)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs"
                >
                  Log Payment &amp; Credit Ledger
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
