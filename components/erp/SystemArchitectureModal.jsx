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
  Sparkles
} from 'lucide-react';

export default function SystemArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-emerald-500/30 text-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150 my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-emerald-800/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Core System Blueprint
              </span>
              <span className="text-xs text-amber-300 font-mono font-bold">
                Noor E Haram Operations ERP v2.4
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Network className="w-6 h-6 text-amber-400" />
              <span>Hierarchical Relational Schema &amp; Data Tracing Matrix</span>
            </h2>
            <p className="text-xs text-slate-300">
              Visualizing the strict parent-child relational architecture anchored by the unique <code className="text-amber-300 font-mono bg-emerald-950 px-1.5 py-0.5 rounded">Party Head UID</code> node.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Visual Mapping Matrix */}
        <div className="space-y-4">
          
          {/* 1. Parent Node */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 border-2 border-amber-400/60 shadow-lg text-center relative">
            <span className="text-[10px] font-black tracking-widest uppercase text-amber-300 block mb-1">
              Top-Level Sovereign Entity (Parent Key)
            </span>
            <div className="flex items-center justify-center gap-3">
              <Database className="w-6 h-6 text-amber-400" />
              <h3 className="text-lg font-black text-white tracking-wide">
                PARTY HEAD UID (<span className="text-amber-300 font-mono">partyHeadUid</span>)
              </h3>
            </div>
            <p className="text-xs text-emerald-200 mt-1 max-w-lg mx-auto">
              Single point of authority. Owns group passenger manifest, transport circuits, hotel vouchers, cost estimates, and ledger balances.
            </p>
          </div>

          <div className="flex justify-center -my-2 text-amber-400">
            <span className="text-xs font-mono font-bold bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              ↓ Cascading 1-to-Many Relational Foreign Links ↓
            </span>
          </div>

          {/* 2. Downstream Child Branches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Branch A: Passenger Matrix */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-emerald-700/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-xs uppercase text-emerald-200">Module A: Passenger Manifest</h4>
                </div>
                <span className="text-[9px] font-mono text-slate-400">1 : N PAX Array</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Full legal name, SHA passport hash, date of birth, demographics categorization (Adult / Child / Infant), bed assignment, and Saudi MoFA visa hash.
              </p>
              <div className="bg-slate-900/90 p-2 rounded text-[10px] font-mono text-emerald-300 border border-slate-700">
                paxId • passportNo • dob • category • visaNo
              </div>
            </div>

            {/* Branch B: Multi-Stay Hotel Voucher */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-emerald-700/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-xs uppercase text-amber-200">Module B: Multi-Stay Hotel Blocks</h4>
                </div>
                <span className="text-[9px] font-mono text-slate-400">1 : N Stay Blocks</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Makkah ➔ Madinah chronological stays, check-in/out date matrix, room setups (Quad/Quint/Sharing), meal arrangement flags (RO/BB/HB), and dual Urdu/English terms.
              </p>
              <div className="bg-slate-900/90 p-2 rounded text-[10px] font-mono text-amber-300 border border-slate-700">
                stayId • city • checkIn • checkOut • roomType • hcn
              </div>
            </div>

            {/* Branch C: Pre-Sales Pipeline Estimator */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-emerald-700/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-400" />
                  <h4 className="font-bold text-xs uppercase text-blue-200">Module C: Cost Estimator</h4>
                </div>
                <span className="text-[9px] font-mono text-slate-400">Pre-Sales Proposal</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Itemized allocations for Saudi Umrah visas, carrier tickets, ground segments, and hotel night tariffs. Dynamic margin overrides and 1-Click invoice converter.
              </p>
              <div className="bg-slate-900/90 p-2 rounded text-[10px] font-mono text-blue-300 border border-slate-700">
                estimateNo • visaCost • flightCost • margin% • perPax
              </div>
            </div>

            {/* Branch D: Corporate Billing & Ledger */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-emerald-700/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-purple-400" />
                  <h4 className="font-bold text-xs uppercase text-purple-200">Module D: Billing &amp; Invoices</h4>
                </div>
                <span className="text-[9px] font-mono text-slate-400">Financial Ledger</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Formal corporate accounting registers, status flags (Settled / Partially Unlocked / Outstanding Overdue), and audit-trailed payment receipts log.
              </p>
              <div className="bg-slate-900/90 p-2 rounded text-[10px] font-mono text-purple-300 border border-slate-700">
                invoiceNo • totalAmount • paidAmount • balanceDue • txLog
              </div>
            </div>

          </div>

          {/* 3. Universal QR Engine Reusability Layer */}
          <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-900 rounded-lg text-amber-300">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white uppercase">
                  Universal Verifiable QR Engine
                </h4>
                <p className="text-[10px] text-emerald-200/90">
                  Decodes live URLs for: <strong className="text-white">Transport Vouchers</strong>, <strong className="text-white">Hotel Vouchers</strong>, <strong className="text-white">Quotations</strong>, and <strong className="text-white">Ledger Invoices</strong>.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-emerald-800/80 text-amber-300 font-mono text-[10px] font-bold border border-amber-400/30 shrink-0">
              SHA / AES Signed
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
          <span>Relational Integrity: Enforced locally &amp; mirrored to Supabase</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors"
          >
            Close Matrix Blueprint
          </button>
        </div>

      </div>
    </div>
  );
}
