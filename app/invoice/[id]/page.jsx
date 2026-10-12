'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import { 
  Receipt, 
  ArrowLeft, 
  Printer, 
  Copy, 
  Check, 
  DollarSign, 
  PlusCircle, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  CreditCard 
} from 'lucide-react';
import { getInvoiceById, addLedgerTransaction } from '../../../lib/erpData';

export default function InvoiceViewPage() {
  const params = useParams();
  const id = params?.id ? decodeURIComponent(params.id) : '';
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Online Bank Transfer');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      loadInvoice();
    }
  }, [id]);

  const loadInvoice = () => {
    const data = getInvoiceById(id);
    setInvoice(data);
    setLoading(false);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && invoice) {
      const url = `${origin}/invoice/${invoice.id || id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    try {
      addLedgerTransaction(invoice.id, {
        amount: parseFloat(payAmount),
        method: payMethod,
        referenceNo: payRef || `PAY-${Date.now().toString().slice(-6)}`,
        notes: payNotes || 'Payment recorded',
      });
      setShowPaymentModal(false);
      setPayAmount('');
      setPayRef('');
      setPayNotes('');
      loadInvoice();
    } catch (err) {
      alert(`Error logging payment: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <Receipt className="w-16 h-16 text-slate-400 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-800">Invoice Record Not Found</h2>
        <p className="text-slate-500 text-sm">
          No corporate invoice matches reference <code className="bg-slate-200 px-2 py-0.5 rounded font-mono">{id}</code>.
        </p>
        <Link 
          href="/erp" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 text-white rounded-lg text-sm font-semibold hover:bg-emerald-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to ERP Portal</span>
        </Link>
      </div>
    );
  }

  const liveQrUrl = `${origin}/invoice/${invoice.id || id}`;

  // Financial Status Badge formatting
  const getStatusChip = (status) => {
    switch (status) {
      case 'Settled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>SETTLED (PAID IN FULL)</span>
          </span>
        );
      case 'Partially Unlocked Balance':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-950 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>PARTIALLY UNLOCKED BALANCE</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-950 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
            <span>OUTSTANDING OVERDUE COLLECTIONS</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/80 py-6 sm:py-10">
      
      {/* Top Action Bar (Screen Only) */}
      <div className="max-w-[850px] mx-auto px-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <Link 
          href="/erp" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-900 hover:text-emerald-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Operations ERP</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Record Payment</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied' : 'Share QR Link'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice (A4)</span>
          </button>
        </div>
      </div>

      {/* Main Corporate Invoice Container (Standard A4 Dimensions) */}
      <div className="max-w-[850px] mx-auto bg-white shadow-2xl border border-slate-300 print:shadow-none print:border-none p-6 sm:p-8 print:p-4 text-slate-800 text-[11px] leading-tight print:w-full print:max-w-full">
        
        {/* Invoice Header */}
        <div className="flex items-start justify-between border-b-2 border-emerald-950 pb-4 mb-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded bg-emerald-950 text-amber-300">
                Official Corporate Tax Invoice
              </span>
              {getStatusChip(invoice.status)}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-emerald-950 uppercase tracking-tight">
              {invoice.companyName || 'NOOR E HARAM TRAVELS & TOURS'}
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Registered Umrah &amp; Hajj Tour Operator • Corporate Finance Division
            </p>
            <p className="text-[10.5px] text-slate-500 font-mono">
              INVOICE #: <strong className="text-emerald-950 font-black">{invoice.invoiceNo}</strong> • DUE DATE: {invoice.dueDate}
            </p>
          </div>

          {/* QR Verification Node */}
          <div className="flex flex-col items-center text-center shrink-0">
            <div className="p-1.5 bg-white border-2 border-emerald-900 rounded-lg shadow-sm">
              <QRCodeSVG 
                value={liveQrUrl} 
                size={80} 
                level="M" 
                includeMargin={false}
              />
            </div>
            <span className="text-[8.5px] font-black uppercase text-emerald-900 mt-1 tracking-wider">
              Verify Invoice
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-900 font-extrabold text-[8px] border border-emerald-200 mt-0.5">
              Secure Ledger
            </span>
          </div>
        </div>

        {/* Invoice Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
          <div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Billed To (Party Head)</span>
            <span className="font-black text-xs sm:text-sm text-slate-900 block mt-0.5 uppercase">
              {invoice.partyName}
            </span>
            <span className="text-[9px] font-mono text-slate-500">{invoice.partyHeadUid}</span>
          </div>

          <div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Contact Phone</span>
            <span className="font-mono font-bold text-xs text-emerald-800 block mt-0.5">
              {invoice.contactPhone || '0311-2264567'}
            </span>
          </div>

          <div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Issue Date</span>
            <span className="font-medium font-mono text-xs text-slate-800 block mt-0.5">
              {invoice.issueDate}
            </span>
          </div>

          <div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Payment Terms</span>
            <span className="font-bold text-[10px] text-amber-900 block mt-0.5">
              Strict 14-Day Cycle
            </span>
          </div>
        </div>

        {/* Financial Balance Summary Strip */}
        <div className="grid grid-cols-3 gap-3 bg-emerald-950 text-white rounded-lg p-3 mb-4 text-center">
          <div className="border-r border-emerald-800/80 pr-2">
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider block">Total Billed</span>
            <span className="font-black font-mono text-sm sm:text-base text-white mt-0.5 block">
              {invoice.currency} {(invoice.totalAmount || 0).toLocaleString()}
            </span>
          </div>

          <div className="border-r border-emerald-800/80 pr-2">
            <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider block">Amount Received</span>
            <span className="font-black font-mono text-sm sm:text-base text-emerald-300 mt-0.5 block">
              {invoice.currency} {(invoice.paidAmount || 0).toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider block">Balance Due</span>
            <span className={`font-black font-mono text-sm sm:text-base mt-0.5 block ${invoice.balanceDue > 0 ? 'text-amber-300' : 'text-emerald-400'}`}>
              {invoice.currency} {(invoice.balanceDue || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Payment History / Ledger Transactions */}
        <div className="mb-4">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-2.5">
            <h2 className="font-black text-xs sm:text-sm text-emerald-950 uppercase tracking-wide">
              Official Payment Receipts &amp; Ledger Log
            </h2>
            <span className="text-[9.5px] font-bold text-slate-500">
              {(invoice.ledgerTransactions || []).length} Transaction Records
            </span>
          </div>

          <table className="w-full text-left border-collapse border border-slate-300 text-[10.5px]">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-300">
                <th className="py-2 px-3 border-r border-slate-300">Payment Date</th>
                <th className="py-2 px-3 border-r border-slate-300">Receipt Ref #</th>
                <th className="py-2 px-3 border-r border-slate-300">Payment Channel</th>
                <th className="py-2 px-3 border-r border-slate-300">Notes / Remarks</th>
                <th className="py-2 px-3 text-right">Amount Paid ({invoice.currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(invoice.ledgerTransactions && invoice.ledgerTransactions.length > 0) ? (
                invoice.ledgerTransactions.map((tx, idx) => (
                  <tr key={tx.id || idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-700">
                      {tx.date}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-emerald-900">
                      {tx.referenceNo}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-medium">
                      {tx.method}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-500 text-[10px]">
                      {tx.notes}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-black text-emerald-900">
                      +{(tx.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400 font-medium italic">
                    No transactions recorded yet. Balance is pending payment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bank Wire Details & Terms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t-2 border-emerald-950 pt-3">
          
          {/* Bank Payment Coordinates */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 text-[10px] space-y-1">
            <span className="font-bold text-amber-950 uppercase tracking-wide block border-b border-amber-200 pb-1 mb-1.5">
              Official Wire &amp; Bank Coordinates (Noor E Haram)
            </span>
            <p><strong className="text-slate-800">Bank Name:</strong> {invoice.bankDetails?.bankName || 'Meezan Bank Limited'}</p>
            <p><strong className="text-slate-800">Account Title:</strong> {invoice.bankDetails?.accountTitle || 'NOOR E HARAM TRAVELS & TOURS'}</p>
            <p><strong className="text-slate-800">Account #:</strong> <span className="font-mono font-bold">{invoice.bankDetails?.accountNumber || '0289-0105829101'}</span></p>
            <p><strong className="text-slate-800">IBAN:</strong> <span className="font-mono font-bold">{invoice.bankDetails?.iban || 'PK49MEZN0002890105829101'}</span></p>
            <p className="text-[9px] text-amber-900/80 pt-1">
              * Please mention Party Head UID <code className="font-bold">{invoice.partyHeadUid}</code> in transfer remarks.
            </p>
          </div>

          {/* Payment Terms */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[10px] space-y-1.5">
            <span className="font-bold text-slate-800 uppercase tracking-wide block border-b border-slate-200 pb-1">
              Corporate Accounting Compliance
            </span>
            <p className="text-slate-600 leading-relaxed">
              Invoices are issued under the standard B2B Tour Operator charter. Proof of payment must be furnished prior to ticketing and final accommodation confirmation lock.
            </p>
            <p className="text-slate-500 font-mono text-[9.5px]">
              Helpline: UBAID RAZA MEMON 0311-2264567 | BACKUP: MADNI RAZA MEMON 0312-8039911
            </p>
          </div>

        </div>

      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-black text-slate-900 text-sm uppercase">Record Ledger Payment</h3>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Payment Amount ({invoice.currency}) *
                </label>
                <input 
                  type="number" 
                  step="any"
                  required
                  placeholder={`e.g. ${invoice.balanceDue}`}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm focus:ring-2 focus:ring-emerald-600 outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Remaining balance due: {invoice.currency} {invoice.balanceDue.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Payment Method</label>
                <select 
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Online Bank Transfer">Online Bank Transfer (Meezan / HBL)</option>
                  <option value="Cash Deposit">Cash Deposit at Operations Desk</option>
                  <option value="Corporate Cheque">Bank Crossed Cheque</option>
                  <option value="Foreign Wire / SAR Remittance">Foreign Wire / SAR Remittance</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Bank / Transaction Reference #</label>
                <input 
                  type="text" 
                  placeholder="e.g. FT-MEZN-881920"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Remarks / Notes</label>
                <input 
                  type="text" 
                  placeholder="e.g. 50% advance deposit received"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold shadow"
                >
                  Confirm &amp; Log Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
