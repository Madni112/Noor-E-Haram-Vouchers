'use client';

import { useState } from 'react';
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
  FileText 
} from 'lucide-react';
import { addLedgerTransaction, getAllInvoices } from '../../lib/erpData';

export default function InvoiceLedger({ invoices = [], onInvoicesUpdated }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeInvoiceForPay, setActiveInvoiceForPay] = useState(null);
  
  // Payment modal state
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Online Bank Transfer');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!activeInvoiceForPay || !payAmount || parseFloat(payAmount) <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    try {
      addLedgerTransaction(activeInvoiceForPay.id, {
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            <span>SETTLED</span>
          </span>
        );
      case 'Partially Unlocked Balance':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black bg-amber-100 text-amber-950 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-700" />
            <span>PARTIAL</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black bg-rose-100 text-rose-950 border border-rose-300">
            <AlertCircle className="w-3 h-3 text-rose-700" />
            <span>OVERDUE</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Module Title Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
              Module D
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Financial Ledger Billing &amp; Invoice Engine
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Formal corporate invoices, payment receipt registers, and live debt collection balances.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {['ALL', 'SETTLED', 'PARTIAL', 'OVERDUE'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wider transition-all ${
                statusFilter === s
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search invoices by invoice #, party, or UID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-slate-50/50"
          />
        </div>
        <span className="text-xs text-slate-500 font-mono">
          Showing {filteredInvoices.length} Invoices
        </span>
      </div>

      {/* Invoices Spreadsheet Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-3 px-3.5 border-r border-slate-100">Invoice Ref #</th>
                <th className="py-3 px-3.5 border-r border-slate-100">Party Head (Debtor)</th>
                <th className="py-3 px-3.5 border-r border-slate-100 text-center">Issue / Due Date</th>
                <th className="py-3 px-3.5 border-r border-slate-100 text-right">Total Billed</th>
                <th className="py-3 px-3.5 border-r border-slate-100 text-right">Paid Receipts</th>
                <th className="py-3 px-3.5 border-r border-slate-100 text-right">Balance Due</th>
                <th className="py-3 px-3.5 border-r border-slate-100 text-center">Financial Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium italic">
                    No invoice records match this query.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono font-bold text-slate-900">
                      {inv.invoiceNo}
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100">
                      <span className="font-bold text-slate-900 block">
                        {inv.partyName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {inv.partyHeadUid}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-center font-mono text-xs text-slate-500">
                      {inv.issueDate} ➔ {inv.dueDate}
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-right font-mono font-bold text-slate-900">
                      {inv.currency} {(inv.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-right font-mono font-bold text-emerald-600">
                      {inv.currency} {(inv.paidAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-right font-mono font-bold text-rose-600">
                      {inv.currency} {(inv.balanceDue || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-center">
                      {getStatusChip(inv.status)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.balanceDue > 0 && (
                          <button
                            onClick={() => {
                              setActiveInvoiceForPay(inv);
                              setPayAmount(String(inv.balanceDue));
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-xs transition-all active:scale-95"
                          >
                            +Pay
                          </button>
                        )}
                        <Link
                          href={`/invoice/${inv.id}`}
                          target="_blank"
                          className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                          title="View Official Corporate Invoice"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {activeInvoiceForPay && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-black text-slate-900 text-sm uppercase">
                Record Payment for {activeInvoiceForPay.invoiceNo}
              </h3>
              <button onClick={() => setActiveInvoiceForPay(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-slate-800 uppercase">{activeInvoiceForPay.partyName} ({activeInvoiceForPay.partyHeadUid})</p>
                <div className="flex justify-between text-slate-600 font-mono">
                  <span>Balance Due:</span>
                  <span className="font-bold text-rose-800">{activeInvoiceForPay.currency} {activeInvoiceForPay.balanceDue.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Payment Amount ({activeInvoiceForPay.currency}) *
                </label>
                <input 
                  type="number" 
                  step="any"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Channel / Method</label>
                <select 
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Online Bank Transfer">Online Bank Transfer (Meezan / HBL)</option>
                  <option value="Cash Deposit">Cash Deposit at Operations Desk</option>
                  <option value="Corporate Cheque">Bank Crossed Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Bank Receipt Ref #</label>
                <input 
                  type="text" 
                  placeholder="e.g. FT-MEZN-881920"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Remarks</label>
                <input 
                  type="text" 
                  placeholder="e.g. Settlement installment"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveInvoiceForPay(null)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs transition-all active:scale-95"
                >
                  Post Payment to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
