'use client';

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Receipt, 
  PlusCircle, 
  Search, 
  Printer, 
  ExternalLink, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Building, 
  User, 
  CreditCard, 
  X, 
  Filter,
  Check,
  FileText,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { saveInvoice } from '../../lib/erpData';
import CustomDatePicker from './CustomDatePicker';

export default function BillReceiptManager({
 
  invoices = [], 
  parties = [], 
  onInvoicesUpdated 
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState(null);

  // Form state for issuing a new bill receipt
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoices[0]?.id || invoices[0]?.invoiceNo || '');
  const [receiptAmount, setReceiptAmount] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptMethod, setReceiptMethod] = useState('Online Bank Transfer');
  const [receiptRef, setReceiptRef] = useState('');
  const [receiptNotes, setReceiptNotes] = useState('');

  // Extract all receipts/transactions across all invoices
  const allReceipts = useMemo(() => {
    const list = [];
    invoices.forEach(inv => {
      const txs = Array.isArray(inv.ledgerTransactions) ? inv.ledgerTransactions : [];
      txs.forEach((tx, idx) => {
        list.push({
          id: tx.id || `rcp-${inv.id || inv.invoiceNo}-${idx}`,
          receiptNo: tx.referenceNo?.startsWith('RCP-') ? tx.referenceNo : `RCP-${String(list.length + 1).padStart(4, '0')}`,
          referenceNo: tx.referenceNo || `TX-${idx + 1}`,
          invoiceId: inv.id || inv.invoiceNo,
          invoiceNo: inv.invoiceNo || inv.id,
          partyName: inv.partyName || 'Valued Client',
          partyHeadUid: inv.partyHeadUid || '',
          contactPhone: inv.contactPhone || '',
          companyName: inv.companyName || 'NOOR E HARAM TRAVELS & TOURS',
          currency: inv.currency || 'PKR',
          totalAmount: inv.totalAmount || 0,
          balanceDue: inv.balanceDue || 0,
          amount: parseFloat(tx.amount) || 0,
          date: tx.date || inv.issueDate || new Date().toISOString().split('T')[0],
          method: tx.method || 'Online Bank Transfer',
          notes: tx.notes || 'Payment against bill',
          receivedBy: tx.receivedBy || 'Operations Lead',
          bankDetails: inv.bankDetails || null,
        });
      });
    });

    // Sort newest receipt first
    return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [invoices]);

  // Statistics
  const totalCollected = useMemo(() => {
    return allReceipts.reduce((acc, r) => acc + (r.amount || 0), 0);
  }, [allReceipts]);

  const bankTransferTotal = useMemo(() => {
    return allReceipts
      .filter(r => (r.method || '').toLowerCase().includes('bank') || (r.method || '').toLowerCase().includes('online'))
      .reduce((acc, r) => acc + (r.amount || 0), 0);
  }, [allReceipts]);

  const cashChequeTotal = useMemo(() => {
    return allReceipts
      .filter(r => !(r.method || '').toLowerCase().includes('bank') && !(r.method || '').toLowerCase().includes('online'))
      .reduce((acc, r) => acc + (r.amount || 0), 0);
  }, [allReceipts]);

  // Filtered receipts
  const filteredReceipts = useMemo(() => {
    return allReceipts.filter(r => {
      const q = searchTerm.toLowerCase().trim();
      const matchQuery = !q || 
        r.receiptNo.toLowerCase().includes(q) ||
        r.referenceNo.toLowerCase().includes(q) ||
        r.invoiceNo.toLowerCase().includes(q) ||
        r.partyName.toLowerCase().includes(q) ||
        (r.partyHeadUid && r.partyHeadUid.toLowerCase().includes(q));

      const matchMethod = methodFilter === 'ALL' || 
        (methodFilter === 'BANK' && (r.method.toLowerCase().includes('bank') || r.method.toLowerCase().includes('online'))) ||
        (methodFilter === 'CASH' && r.method.toLowerCase().includes('cash')) ||
        (methodFilter === 'CHEQUE' && r.method.toLowerCase().includes('cheque'));

      return matchQuery && matchMethod;
    });
  }, [allReceipts, searchTerm, methodFilter]);

  // Handle issuing a new receipt
  const handleIssueReceipt = (e) => {
    e.preventDefault();
    const amountNum = parseFloat(receiptAmount);
    if (!amountNum || amountNum <= 0) {
      alert('Please enter a valid positive receipt amount.');
      return;
    }

    const targetInv = invoices.find(i => (i.id === selectedInvoiceId) || (i.invoiceNo === selectedInvoiceId));
    if (!targetInv) {
      alert('Please select a valid Bill / Invoice.');
      return;
    }

    const newTx = {
      id: `tx-${Date.now()}`,
      referenceNo: receiptRef.trim() || `RCP-${Date.now().toString().slice(-6)}`,
      date: receiptDate,
      amount: amountNum,
      method: receiptMethod,
      notes: receiptNotes.trim() || `Payment received for ${targetInv.invoiceNo}`,
      receivedBy: 'Operations Desk',
    };

    const currentTxs = Array.isArray(targetInv.ledgerTransactions) ? [...targetInv.ledgerTransactions] : [];
    const updatedTxs = [...currentTxs, newTx];
    const newPaidAmount = (parseFloat(targetInv.paidAmount) || 0) + amountNum;
    const newBalanceDue = Math.max(0, (parseFloat(targetInv.totalAmount) || 0) - newPaidAmount);

    let newStatus = 'Partially Unlocked Balance';
    if (newBalanceDue <= 0) {
      newStatus = 'Settled';
    }

    const updatedInv = {
      ...targetInv,
      paidAmount: newPaidAmount,
      balanceDue: newBalanceDue,
      status: newStatus,
      ledgerTransactions: updatedTxs,
      updatedAt: new Date().toISOString(),
    };

    saveInvoice(updatedInv);
    if (onInvoicesUpdated) {
      const refreshed = invoices.map(i => (i.id === updatedInv.id || i.invoiceNo === updatedInv.invoiceNo) ? updatedInv : i);
      onInvoicesUpdated(refreshed);
    }

    // Reset and close modal
    setShowIssueModal(false);
    setReceiptAmount('');
    setReceiptRef('');
    setReceiptNotes('');
  };

  const handlePrintReceipt = (receipt) => {
    setSelectedReceiptForPrint(receipt);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
              Sale / Receipts
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Bill Receipts &amp; Payment Registers
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            View, issue, and print official client payment receipts and bank wire acknowledgements.
          </p>
        </div>

        <button
          onClick={() => {
            if (invoices.length > 0 && !selectedInvoiceId) {
              setSelectedInvoiceId(invoices[0].id || invoices[0].invoiceNo);
            }
            setShowIssueModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md transition-all shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>+ Issue Bill Receipt</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Bill Receipts</span>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {allReceipts.length}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Recorded payment vouchers</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Collected (PKR)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            PKR {totalCollected.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Cleared inflows on client bills</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Online / Bank Wire</span>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            PKR {bankTransferTotal.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Cash / Cheque: PKR {cashChequeTotal.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search receipt #, bill #, client name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        {/* Method filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Methods' },
            { id: 'BANK', label: 'Bank Wire' },
            { id: 'CASH', label: 'Cash' },
            { id: 'CHEQUE', label: 'Cheque' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setMethodFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                methodFilter === f.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Receipts Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Receipt Ref #</th>
                <th className="py-3 px-4">Bill Ref #</th>
                <th className="py-3 px-4">Client / Party</th>
                <th className="py-3 px-4">Receipt Date</th>
                <th className="py-3 px-4">Channel / Method</th>
                <th className="py-3 px-4 text-right">Amount Received</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReceipts.map((rcp) => (
                <tr key={rcp.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                    <div className="flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{rcp.receiptNo}</span>
                    </div>
                    {rcp.referenceNo && rcp.referenceNo !== rcp.receiptNo && (
                      <span className="text-[10px] text-slate-400 font-normal block">
                        Ref: {rcp.referenceNo}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {rcp.invoiceNo}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 uppercase">{rcp.partyName}</div>
                    {rcp.partyHeadUid && (
                      <div className="text-[10px] text-slate-400 font-mono">{rcp.partyHeadUid}</div>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {rcp.date}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      <CreditCard className="w-3 h-3 text-emerald-600" />
                      <span>{rcp.method}</span>
                    </span>
                    {rcp.notes && (
                      <p className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">
                        {rcp.notes}
                      </p>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                    +{rcp.currency} {rcp.amount.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handlePrintReceipt(rcp)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-colors cursor-pointer"
                      title="View & Print Official Bill Receipt"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Receipt Slip</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredReceipts.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="font-semibold text-slate-600 text-sm">No bill receipts found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {searchTerm ? 'Try adjusting your search criteria.' : 'Issue your first receipt using the button above.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: ISSUE BILL RECEIPT                               */}
      {/* ========================================================= */}
      {showIssueModal && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">Issue Official Bill Receipt</h3>
              </div>
              <button 
                onClick={() => setShowIssueModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueReceipt} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Select Bill / Debtor <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => setSelectedInvoiceId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {invoices.map(inv => (
                    <option key={inv.id || inv.invoiceNo} value={inv.id || inv.invoiceNo}>
                      {inv.invoiceNo} � {inv.partyName} (Balance: PKR {(inv.balanceDue || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Receipt Amount (PKR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50000"
                    value={receiptAmount}
                    onChange={(e) => setReceiptAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Receipt Date <span className="text-red-500">*</span>
                  </label>
                  <CustomDatePicker
                    value={receiptDate}
                    onChange={(d) => setReceiptDate(d)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={receiptMethod}
                    onChange={(e) => setReceiptMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Online Bank Transfer">Online Bank Transfer</option>
                    <option value="Cash Deposit">Cash Deposit</option>
                    <option value="Bank Cheque / Pay Order">Bank Cheque / Pay Order</option>
                    <option value="International Wire (SWIFT)">International Wire (SWIFT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Reference / Cheque #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FT-MEZN-99120"
                    value={receiptRef}
                    onChange={(e) => setReceiptRef(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Notes / Payment Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Advance deposit for flight tickets & visa booking"
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Confirm &amp; Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL 2: PRINT OFFICIAL BILL RECEIPT SLIP                */}
      {/* ========================================================= */}
      {selectedReceiptForPrint && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
            
            {/* Top Toolbar (Non-printable buttons) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 no-print">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Official Verified Payment Receipt
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setSelectedReceiptForPrint(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Slip Container */}
            <div className="border-2 border-emerald-950 rounded-2xl p-6 sm:p-8 space-y-6 bg-amber-50/20">
              
              {/* Slip Header */}
              <div className="flex items-start justify-between border-b-2 border-emerald-950 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0">
                    <img src="/logo.png" alt="Company Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-emerald-950 uppercase tracking-tight">
                      {selectedReceiptForPrint.companyName}
                    </h1>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Official Payment Receipt � Umrah &amp; Hajj Travel Operations
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Tax Reg. B2B Voucher Portal
                    </p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className="inline-block px-2.5 py-1 rounded bg-emerald-950 text-amber-300 font-mono font-black text-xs uppercase tracking-wider">
                    PAYMENT RECEIPT
                  </span>
                  <div className="text-xs font-mono font-bold text-slate-900">
                    #{selectedReceiptForPrint.receiptNo}
                  </div>
                  <div className="text-[10.5px] text-slate-500">
                    Date: <strong className="text-slate-800">{selectedReceiptForPrint.date}</strong>
                  </div>
                </div>
              </div>

              {/* Bill & Client Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-white p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Received From (Debtor)
                  </span>
                  <p className="font-black text-slate-900 text-sm uppercase">
                    {selectedReceiptForPrint.partyName}
                  </p>
                  {selectedReceiptForPrint.partyHeadUid && (
                    <p className="font-mono text-slate-500 text-[10.5px]">
                      UID: {selectedReceiptForPrint.partyHeadUid}
                    </p>
                  )}
                  {selectedReceiptForPrint.contactPhone && (
                    <p className="text-slate-600 text-[10.5px]">
                      Phone: {selectedReceiptForPrint.contactPhone}
                    </p>
                  )}
                </div>

                <div className="space-y-1 text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Against Bill / Account
                  </span>
                  <p className="font-mono font-black text-emerald-950 text-sm">
                    {selectedReceiptForPrint.invoiceNo}
                  </p>
                  <p className="text-slate-500 text-[10.5px]">
                    Method: <strong className="text-slate-800">{selectedReceiptForPrint.method}</strong>
                  </p>
                  <p className="text-slate-500 text-[10.5px]">
                    Ref #: <span className="font-mono font-bold text-slate-800">{selectedReceiptForPrint.referenceNo}</span>
                  </p>
                </div>
              </div>

              {/* Amount Box */}
              <div className="bg-emerald-950 text-white p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    Total Amount Received
                  </span>
                  <div className="text-xs text-emerald-100 font-medium mt-0.5">
                    {selectedReceiptForPrint.notes || 'Full / partial liquidation against package bill'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
                    {selectedReceiptForPrint.currency} {selectedReceiptForPrint.amount.toLocaleString()}
                  </div>
                  <span className="text-[9.5px] font-bold text-emerald-300 uppercase tracking-widest">
                    Authorized Clearance
                  </span>
                </div>
              </div>

              {/* Signature & Verification Footer */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-300 text-center text-xs">
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 w-48 mx-auto" />
                  <p className="text-[10.5px] font-bold text-slate-700 mt-1 uppercase">Depositor Signature</p>
                  <p className="text-[9.5px] text-slate-400">Payer / Client Acknowledged</p>
                </div>

                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 w-48 mx-auto flex items-end justify-center pb-1">
                    <span className="text-[10.5px] font-black text-emerald-900 uppercase">
                      OFFICIALLY CLEARED
                    </span>
                  </div>
                  <p className="text-[10.5px] font-bold text-slate-700 mt-1 uppercase">Finance Officer Signature &amp; Stamp</p>
                  <p className="text-[9.5px] text-slate-400">Electronic verification confirmed</p>
                </div>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
