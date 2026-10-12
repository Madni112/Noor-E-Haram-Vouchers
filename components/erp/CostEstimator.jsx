'use client';

import { useState } from 'react';
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
  ExternalLink, 
  Search, 
  CheckCircle2, 
  Sparkles, 
  FileText 
} from 'lucide-react';
import { saveEstimate, convertEstimateToInvoice } from '../../lib/erpData';

export default function CostEstimator({ estimates = [], parties = [], onEstimatesUpdated, onInvoiceCreated }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isConvertingId, setIsConvertingId] = useState(null);

  // Form State
  const [targetPartyUid, setTargetPartyUid] = useState(parties[0]?.partyHeadUid || '');
  const [paxCount, setPaxCount] = useState(parties[0]?.totalPax || 2);
  const [pkgTitle, setPkgTitle] = useState('18 Days Standard Umrah');
  const [visaFee, setVisaFee] = useState(45000);
  const [flightCost, setFlightCost] = useState(135000);
  const [transportCost, setTransportCost] = useState(65000);
  const [hotelCost, setHotelCost] = useState(190000);
  const [ziyaratCost, setZiyaratCost] = useState(25000);
  const [markupPercent, setMarkupPercent] = useState(12);

  const calculateSubtotal = () => {
    const vTotal = (parseInt(paxCount) || 1) * (parseFloat(visaFee) || 0);
    const fTotal = (parseInt(paxCount) || 1) * (parseFloat(flightCost) || 0);
    return vTotal + fTotal + (parseFloat(transportCost) || 0) + (parseFloat(hotelCost) || 0) + (parseFloat(ziyaratCost) || 0);
  };

  const subtotal = calculateSubtotal();
  const marginAmt = Math.round(subtotal * ((parseFloat(markupPercent) || 0) / 100));
  const grandTotal = subtotal + marginAmt;
  const perPax = Math.round(grandTotal / (parseInt(paxCount) || 1));

  const handleCreateEstimate = (e) => {
    e.preventDefault();
    const party = parties.find(p => p.partyHeadUid === targetPartyUid);
    if (!party) {
      alert('Selected party head not found');
      return;
    }

    const estId = `EST-2026-${String(estimates.length + 1).padStart(3, '0')}`;
    const pCount = parseInt(paxCount) || 1;
    const vTotal = pCount * (parseFloat(visaFee) || 0);
    const fTotal = pCount * (parseFloat(flightCost) || 0);

    const newEstimate = {
      id: estId,
      estimateNo: estId,
      partyHeadUid: party.partyHeadUid,
      partyName: party.partyName,
      companyName: party.companyName || 'NOOR E HARAM TRAVELS & TOURS',
      contactPhone: party.contactPhone,
      paxCount: pCount,
      packageDuration: pkgTitle,
      currency: 'PKR',
      items: {
        visaCostPerPax: parseFloat(visaFee) || 0,
        visaTotal: vTotal,
        flightCostPerPax: parseFloat(flightCost) || 0,
        flightTotal: fTotal,
        transportSegmentCost: parseFloat(transportCost) || 0,
        hotelBlocksCost: parseFloat(hotelCost) || 0,
        ziyaratAndLogistics: parseFloat(ziyaratCost) || 0,
        subtotal: subtotal,
        marginPercent: parseFloat(markupPercent) || 0,
        marginAmount: marginAmt,
        grandTotal: grandTotal,
        perPaxQuote: perPax,
      },
      validityDays: 14,
      status: 'Draft Proposal',
      isDraftLayout: true,
      notes: 'Itemized package quote designed for B2B client review.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveEstimate(newEstimate);
    if (onEstimatesUpdated) onEstimatesUpdated([newEstimate, ...estimates]);
    setShowCreateModal(false);
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

  const filteredEstimates = estimates.filter(e => {
    const q = searchTerm.toLowerCase();
    return (
      (e.estimateNo || '').toLowerCase().includes(q) ||
      (e.partyName || '').toLowerCase().includes(q) ||
      (e.partyHeadUid || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      
      {/* Module Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-100 text-blue-900 border border-blue-300">
              Module C
            </span>
            <h2 className="text-base sm:text-lg font-black text-emerald-950 uppercase">
              Pipeline Package Cost Estimator (Pre-Sales)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Custom holiday package pricing with variable markup overrides, customer draft quotes &amp; 1-Click invoice conversion.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>New Cost Proposal</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search proposals by estimate # or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>
        <span className="text-xs text-slate-500 font-mono">
          Showing {filteredEstimates.length} Proposals
        </span>
      </div>

      {/* Proposals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEstimates.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs italic">
            No proposals found. Click "New Cost Proposal" to calculate and draft a quotation.
          </div>
        ) : (
          filteredEstimates.map((est) => (
            <div 
              key={est.id} 
              className="bg-white border border-slate-200 hover:border-emerald-700/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-mono font-bold text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {est.estimateNo}
                    </span>
                    <h3 className="font-black text-sm text-slate-900 mt-1 uppercase">
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
                  <div className="flex justify-between text-amber-800">
                    <span>Internal Margin:</span>
                    <span className="font-mono font-bold">
                      {est.items?.marginPercent}% (+{(est.items?.marginAmount || 0).toLocaleString()})
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-950 font-black text-sm border-t border-slate-100 pt-1">
                    <span>Total Client Quote:</span>
                    <span className="font-mono text-emerald-800">
                      {est.currency} {(est.items?.grandTotal || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 text-right">
                    Per PAX: <strong className="text-slate-800 font-mono">{est.currency} {(est.items?.perPaxQuote || 0).toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  href={`/estimate/${est.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-emerald-900 transition-colors"
                >
                  <span>Draft Quote (A4)</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </Link>

                {est.status !== 'Converted to Invoice' && (
                  <button
                    onClick={() => handleConvert(est.id)}
                    disabled={isConvertingId === est.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-lg text-[10.5px] font-black shadow-sm transition-all active:scale-95"
                  >
                    <Receipt className="w-3 h-3 stroke-[2.5]" />
                    <span>{isConvertingId === est.id ? 'Converting...' : '1-Click Invoice'}</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: New Proposal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-black text-slate-900 text-sm uppercase">Create Pre-Sales Cost Proposal</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateEstimate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Target Party Head UID *</label>
                <select 
                  value={targetPartyUid}
                  onChange={(e) => {
                    setTargetPartyUid(e.target.value);
                    const found = parties.find(p => p.partyHeadUid === e.target.value);
                    if (found) setPaxCount(found.totalPax || 1);
                  }}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 font-bold text-slate-800"
                >
                  {parties.map(p => (
                    <option key={p.partyHeadUid} value={p.partyHeadUid}>
                      {p.partyHeadUid}: {p.partyName} ({p.passengers?.length || p.totalPax} PAX)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Total Pilgrims (PAX)</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={paxCount} 
                    onChange={(e) => setPaxCount(e.target.value)} 
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold" 
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Package Title</label>
                  <input 
                    type="text" 
                    value={pkgTitle} 
                    onChange={(e) => setPkgTitle(e.target.value)} 
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg" 
                  />
                </div>
              </div>

              {/* Itemized Allocations */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 uppercase text-[10px] block">
                  Itemized Cost Allocations (PKR)
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-500 font-medium mb-0.5">Visa Fee (Per PAX)</label>
                    <input 
                      type="number" 
                      value={visaFee} 
                      onChange={(e) => setVisaFee(e.target.value)} 
                      className="w-full px-2 py-1 border border-slate-300 rounded font-mono font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-0.5">Flight Cost (Per PAX)</label>
                    <input 
                      type="number" 
                      value={flightCost} 
                      onChange={(e) => setFlightCost(e.target.value)} 
                      className="w-full px-2 py-1 border border-slate-300 rounded font-mono font-bold" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-500 font-medium mb-0.5">Transport Total</label>
                    <input 
                      type="number" 
                      value={transportCost} 
                      onChange={(e) => setTransportCost(e.target.value)} 
                      className="w-full px-2 py-1 border border-slate-300 rounded font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-0.5">Hotel Blocks Total</label>
                    <input 
                      type="number" 
                      value={hotelCost} 
                      onChange={(e) => setHotelCost(e.target.value)} 
                      className="w-full px-2 py-1 border border-slate-300 rounded font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-0.5">Ziyarat Total</label>
                    <input 
                      type="number" 
                      value={ziyaratCost} 
                      onChange={(e) => setZiyaratCost(e.target.value)} 
                      className="w-full px-2 py-1 border border-slate-300 rounded font-mono" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-0.5">Markup Margin (% Override)</label>
                  <input 
                    type="number" 
                    value={markupPercent} 
                    onChange={(e) => setMarkupPercent(e.target.value)} 
                    className="w-full px-2 py-1 border border-amber-300 rounded bg-amber-50 font-mono font-bold" 
                  />
                </div>
              </div>

              {/* Dynamic Live Calculation Preview */}
              <div className="p-3 bg-emerald-950 text-white rounded-lg text-xs space-y-1">
                <div className="flex justify-between text-emerald-300">
                  <span>Net Subtotal:</span>
                  <span className="font-mono">PKR {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-amber-300">
                  <span>Markup ({markupPercent}%):</span>
                  <span className="font-mono">+PKR {marginAmt.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white font-black text-sm border-t border-emerald-800 pt-1">
                  <span>Grand Total Quote:</span>
                  <span className="text-amber-300 font-mono">PKR {grandTotal.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-emerald-200 text-right">
                  Per PAX: PKR {perPax.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold shadow"
                >
                  Save Pre-Sales Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
