'use client';

import { 
  Network, 
  Database, 
  Users, 
  Building2, 
  Bus, 
  Calculator, 
  Receipt, 
  QrCode, 
  ArrowRight, 
  ShieldCheck, 
  FileText,
  Lock,
  Layers,
  Sparkles,
  X
} from 'lucide-react';

export default function SystemArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 text-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150 my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                Core System Blueprint
              </span>
              <span className="text-xs text-emerald-600 font-mono font-bold">
                Operations ERP v2.4
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Network className="w-5 h-5 text-slate-700" />
              <span>Hierarchical Relational Schema &amp; Data Tracing Matrix</span>
            </h2>
            <p className="text-xs text-slate-500">
              Visualizing the strict parent-child relational architecture anchored by the unique <code className="text-slate-800 font-mono bg-slate-100 px-1.5 py-0.5 rounded">Party Head UID</code> node.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Mapping Matrix */}
        <div className="space-y-4">
          
          {/* 1. Parent Node */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-xs text-center relative">
            <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400 block mb-1">
              Top-Level Sovereign Entity (Parent Key)
            </span>
            <div className="flex items-center justify-center gap-2.5">
              <Database className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white tracking-wide">
                PARTY HEAD UID (<span className="text-emerald-400 font-mono">partyHeadUid</span>)
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-lg mx-auto">
              Single point of authority. Owns group passenger manifest, transport circuits, hotel vouchers, cost estimates, and ledger balances.
            </p>
          </div>

          <div className="flex justify-center -my-2">
            <span className="text-xs font-mono font-semibold bg-white text-slate-500 px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
              ↓ Cascading 1-to-Many Relational Foreign Links ↓
            </span>
          </div>

          {/* 2. Downstream Child Branches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Branch A: Passenger Matrix */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-xs uppercase text-slate-800">Module A: Passenger Manifest</h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">1 : N PAX Array</span>
              </div>
              <p className="text-xs text-slate-500">
                Full legal name, passport number, date of birth, demographics (Adult / Child / Infant), bed assignment, and Saudi visa hash.
              </p>
              <div className="bg-white p-2 rounded-lg text-[10px] font-mono text-slate-600 border border-slate-200">
                paxId • passportNo • dob • category • visaNo
              </div>
            </div>

            {/* Branch B: Multi-Stay Hotel Voucher */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <h4 className="font-bold text-xs uppercase text-slate-800">Module B: Multi-Stay Hotel Blocks</h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">1 : N Stay Blocks</span>
              </div>
              <p className="text-xs text-slate-500">
                Makkah ➔ Madinah chronological stays, check-in/out dates, room configurations, meal plan flags, and dual Urdu/English compliance terms.
              </p>
              <div className="bg-white p-2 rounded-lg text-[10px] font-mono text-slate-600 border border-slate-200">
                stayId • city • checkIn • checkOut • roomType • hcn
              </div>
            </div>

            {/* Branch C: Pre-Sales Pipeline Estimator */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <h4 className="font-bold text-xs uppercase text-slate-800">Module C: Cost Estimator</h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Pre-Sales Proposal</span>
              </div>
              <p className="text-xs text-slate-500">
                Itemized allocations for Saudi Umrah visas, carrier tickets, ground circuits, and hotel night tariffs. Dynamic markup overrides &amp; 1-Click invoice converter.
              </p>
              <div className="bg-white p-2 rounded-lg text-[10px] font-mono text-slate-600 border border-slate-200">
                estimateNo • visaCost • flightCost • margin% • perPax
              </div>
            </div>

            {/* Branch D: Corporate Billing & Ledger */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-purple-600" />
                  <h4 className="font-bold text-xs uppercase text-slate-800">Module D: Billing &amp; Invoices</h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Financial Ledger</span>
              </div>
              <p className="text-xs text-slate-500">
                Formal corporate accounting registers, status flags (Settled / Partial / Overdue), and audit-trailed payment receipts log.
              </p>
              <div className="bg-white p-2 rounded-lg text-[10px] font-mono text-slate-600 border border-slate-200">
                invoiceNo • totalAmount • paidAmount • balanceDue • txLog
              </div>
            </div>

          </div>

          {/* 3. Universal QR Engine Reusability Layer */}
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg text-slate-700 border border-slate-200 shadow-2xs">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 uppercase">
                  Universal Verifiable QR Engine
                </h4>
                <p className="text-[11px] text-slate-500">
                  Embeds live routing token directly onto Hotel Vouchers, Estimates &amp; Corporate Invoices for instant camera scanner validation.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
              Encrypted
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 font-mono">
            Relational Integrity Rules: Cascade deletions blocked on active debt invoices.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            Close Matrix
          </button>
        </div>

      </div>
    </div>
  );
}
