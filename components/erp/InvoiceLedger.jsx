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
  RotateCcw
} from 'lucide-react';
import { addLedgerTransaction, getAllInvoices, saveInvoice, deleteInvoice } from '../../lib/erpData';
import CustomDatePicker from './CustomDatePicker';

export default function InvoiceLedger({ 
  invoices = [], 
  parties = [], 
  initialView = 'INVOICES', 
  onViewChange,
  onInvoicesUpdated 
}) {
  const [viewMode, setViewMode] = useState(initialView || 'INVOICES'); // 'INVOICES' | 'LEDGER'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeInvoiceForPay, setActiveInvoiceForPay] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
  // CREATE INVOICE MODAL STATE
  // -------------------------------------------------------------
  const nextInvoiceNum = `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`;
  const [selectedPartyUid, setSelectedPartyUid] = useState(parties[0]?.partyHeadUid || 'CUSTOM');
  const [customPartyName, setCustomPartyName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [customCompany, setCustomCompany] = useState('NOOR E HARAM TRAVELS & TOURS');
  const [invoiceNo, setInvoiceNo] = useState(nextInvoiceNum);
  const [packageTitle, setPackageTitle] = useState('15 Days Executive Umrah Package');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [paymentTerms, setPaymentTerms] = useState('Full Payment Required Prior to Visa Stamp & Flight Issuance.');
  const [lineItems, setLineItems] = useState([
    { id: '1', description: 'Saudi Umrah Electronic Visas & Medical Insurance', quantity: 2, rate: 45000, amount: 90000 },
    { id: '2', description: 'Makkah & Madinah Hotel Accommodation Blocks', quantity: 1, rate: 180000, amount: 180000 },
    { id: '3', description: 'Dedicated Ground Transport & Holy Ziyarat', quantity: 1, rate: 65000, amount: 65000 },
    { id: '4', description: 'Direct International Flight Tickets', quantity: 2, rate: 135000, amount: 270000 }
  ]);
  const [hasInitialPayment, setHasInitialPayment] = useState(false);
  const [initialPaymentAmount, setInitialPaymentAmount] = useState('');
  const [initialPaymentMethod, setInitialPaymentMethod] = useState('Online Bank Transfer');
  const [initialPaymentRef, setInitialPaymentRef] = useState('');

  // -------------------------------------------------------------
  // PARTY LEDGER STATEMENT FILTER STATE
  // -------------------------------------------------------------
  const [selectedLedgerParty, setSelectedLedgerParty] = useState('ALL');
  const [ledgerDateFrom, setLedgerDateFrom] = useState('');
  const [ledgerDateTo, setLedgerDateTo] = useState('');

  // Line Items Helper
  const handleItemChange = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    if (field === 'quantity' || field === 'rate') {
      const q = parseFloat(field === 'quantity' ? value : updated[index].quantity) || 0;
      const r = parseFloat(field === 'rate' ? value : updated[index].rate) || 0;
      updated[index].amount = Math.round(q * r);
    }
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: String(Date.now()), description: '', quantity: 1, rate: 0, amount: 0 }
    ]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const calculatedTotalBilled = lineItems.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
  const initialPaidNum = hasInitialPayment ? (parseFloat(initialPaymentAmount) || 0) : 0;
  const calculatedBalanceDue = Math.max(0, calculatedTotalBilled - initialPaidNum);

  // Handle party change in create modal
  const handlePartySelectChange = (uid) => {
    setSelectedPartyUid(uid);
    if (uid !== 'CUSTOM') {
      const p = parties.find(party => party.partyHeadUid === uid);
      if (p) {
        setCustomPartyName(p.partyName || '');
        setCustomPhone(p.contactPhone || '');
        setCustomCompany(p.companyName || 'NOOR E HARAM TRAVELS & TOURS');
        setPackageTitle(p.packageTitle || `${p.totalPax || 2} PAX Umrah Package`);
      }
    }
  };

  // Submit Create Invoice
  const handleCreateInvoiceSubmit = (e) => {
    e.preventDefault();
    const finalPartyName = selectedPartyUid === 'CUSTOM' ? (customPartyName || 'WALK-IN CLIENT') : customPartyName;
    const finalPhone = selectedPartyUid === 'CUSTOM' ? customPhone : (parties.find(p => p.partyHeadUid === selectedPartyUid)?.contactPhone || '');
    const cleanCompany = customCompany || 'NOOR E HARAM TRAVELS & TOURS';

    const transactions = [];
    if (hasInitialPayment && initialPaidNum > 0) {
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

    const newInvoiceObj = {
      id: `inv-${Date.now()}`,
      invoiceNo,
      partyHeadUid: selectedPartyUid,
      partyName: finalPartyName,
      contactPhone: finalPhone,
      companyName: cleanCompany,
      packageTitle,
      issueDate,
      dueDate,
      currency: 'PKR',
      items: lineItems.filter(item => (item.description || '').trim() !== ''),
      totalAmount: calculatedTotalBilled,
      paidAmount: initialPaidNum,
      balanceDue: calculatedBalanceDue,
      status: calculatedBalanceDue <= 0 ? 'Settled' : (initialPaidNum > 0 ? 'Partially Unlocked Balance' : 'Outstanding Overdue Collections'),
      paymentTerms,
      ledgerTransactions: transactions,
      createdAt: new Date().toISOString()
    };

    saveInvoice(newInvoiceObj);
    if (onInvoicesUpdated) onInvoicesUpdated(getAllInvoices());
    setShowCreateModal(false);
  };

  const handleDeleteInvoice = (id, invoiceNo) => {
    if (confirm(`Are you sure you want to delete invoice ${invoiceNo}? This cannot be undone.`)) {
      deleteInvoice(id);
      if (onInvoicesUpdated) onInvoicesUpdated(getAllInvoices());
    }
  };

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!activeInvoiceForPay || !payAmount || parseFloat(payAmount) <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    try {
      addLedgerTransaction(activeInvoiceForPay.id, {
        date: payDate || new Date().toISOString().split('T')[0],
        amount: parseFloat(payAmount),
        method: payMethod,
        referenceNo: payRef || `PAY-${Date.now().toString().slice(-6)}`,
        notes: payNotes || 'Payment recorded',
      });
      setActiveInvoiceForPay(null);
      setPayAmount('');
      setPayRef('');
      setPayNotes('');
      if (onInvoicesUpdated) onInvoicesUpdated(getAllInvoices());
    } catch (err) {
      alert(`Error logging payment: ${err.message}`);
    }
  };

  // Filtered invoices for Invoices view
  const filteredInvoices = invoices.filter(inv => {
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
    invoices.forEach(inv => {
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
              {viewMode === 'INVOICES' ? 'Invoices & Billing Manager' : 'Party & Customer Accounts Ledger'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {viewMode === 'INVOICES' 
              ? 'Issue corporate invoices, track payment status, and manage client billings.'
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
              <span>Invoices ({invoices.length})</span>
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
              onClick={() => {
                setInvoiceNo(`INV-2026-${String(invoices.length + 1).padStart(3, '0')}`);
                if (parties.length > 0 && selectedPartyUid === 'CUSTOM') {
                  handlePartySelectChange(parties[0].partyHeadUid);
                }
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
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
                placeholder="Search invoices by invoice #, party, or UID..."
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
                    <th className="py-3 px-4 font-bold">Invoice Ref #</th>
                    <th className="py-3 px-4 font-bold">Party Head (Debtor)</th>
                    <th className="py-3 px-4 font-bold">Issue / Due Date</th>
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
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                          <span>{inv.issueDate}</span>
                          <span className="mx-1 text-slate-400">&rarr;</span>
                          <span className={inv.balanceDue > 0 && new Date(inv.dueDate) < new Date() ? 'text-rose-600 font-bold' : ''}>
                            {inv.dueDate}
                          </span>
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
      {/* 4. MODAL: CREATE INVOICE                                      */}
      {/* ============================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto print-hide">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Issue New Corporate Invoice</h3>
                  <p className="text-[11px] text-slate-400">Generate invoice with line items and advance payments</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4">
              
              {/* Invoice Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Invoice Number *</label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Billing Party *</label>
                  <select
                    value={selectedPartyUid}
                    onChange={(e) => handlePartySelectChange(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-800 bg-white"
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
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Debtor Full Name</label>
                  <input
                    type="text"
                    value={customPartyName}
                    onChange={(e) => setCustomPartyName(e.target.value)}
                    placeholder="e.g. MOHAMMED AHMED KHAN"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 uppercase"
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
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Issue Date</label>
                  <CustomDatePicker
                    value={issueDate}
                    onChange={(val) => setIssueDate(val)}
                    placeholder="DD-MM-YYYY"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Due Date</label>
                  <CustomDatePicker
                    value={dueDate}
                    onChange={(val) => setDueDate(val)}
                    minDate={issueDate || undefined}
                    placeholder="DD-MM-YYYY"
                  />
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase">Itemized Line Items</label>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Row</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {lineItems.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-xl text-xs">
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          placeholder="Description"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 text-xs"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          placeholder="Qty"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 text-xs text-center font-mono"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                          placeholder="Rate"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 text-xs text-right font-mono"
                          required
                        />
                      </div>
                      <div className="col-span-2 text-right font-mono font-bold text-slate-800 text-[11px]">
                        {(item.amount || 0).toLocaleString()}
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation Card */}
              <div className="bg-slate-900 text-white p-3.5 rounded-xl flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Grand Total Billed</span>
                  <span className="text-base font-black text-white">PKR {calculatedTotalBilled.toLocaleString()}</span>
                </div>
                {hasInitialPayment && (
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-400 block uppercase">Net Balance Due</span>
                    <span className="text-base font-black text-emerald-300">PKR {calculatedBalanceDue.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Advance Payment Toggle */}
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 text-xs">
                    <div>
                      <label className="block text-[9.5px] font-bold text-emerald-900 uppercase">Paid Amount (PKR)</label>
                      <input
                        type="number"
                        value={initialPaymentAmount}
                        onChange={(e) => setInitialPaymentAmount(e.target.value)}
                        placeholder="e.g. 100000"
                        className="w-full px-2 py-1 bg-white border border-emerald-200 rounded text-xs font-mono font-bold"
                        required={hasInitialPayment}
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] font-bold text-emerald-900 uppercase">Payment Method</label>
                      <select
                        value={initialPaymentMethod}
                        onChange={(e) => setInitialPaymentMethod(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-emerald-200 rounded text-xs"
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
                        className="w-full px-2 py-1 bg-white border border-emerald-200 rounded text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-xs"
                >
                  Confirm &amp; Issue Invoice
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
