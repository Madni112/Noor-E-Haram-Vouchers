'use client';

import { 
  Users, 
  Building2, 
  Bus, 
  Receipt, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Activity, 
  DollarSign, 
  ShieldCheck, 
  Compass, 
  Layers,
  ArrowUpRight,
  ChevronRight,
  PlusCircle,
  Calendar,
  Sparkles,
  FileText
} from 'lucide-react';

export default function DashboardAnalytics({ 
  parties = [], 
  invoices = [], 
  hotelVouchers = [], 
  estimates = [], 
  tasks = [],
  auditLogs = [],
  onNavigate
}) {
  // Aggregate Metrics
  const totalParties = parties.length;
  
  let totalPax = 0, adults = 0, children = 0, infants = 0;
  parties.forEach(p => {
    (p.passengers || []).forEach(pax => {
      totalPax++;
      if (pax.category === 'Child') children++;
      else if (pax.category === 'Infant') infants++;
      else adults++;
    });
  });
  if (totalPax === 0) totalPax = parties.reduce((acc, curr) => acc + (curr.totalPax || 1), 0);

  const totalStays = hotelVouchers.reduce((acc, curr) => acc + (curr.stays?.length || 0), 0);
  const totalNights = hotelVouchers.reduce((acc, curr) => {
    return acc + (curr.stays || []).reduce((sAcc, s) => sAcc + (parseInt(s.nights) || 0), 0);
  }, 0);

  const totalInvoiced = invoices.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalCollected = invoices.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
  const totalOutstanding = invoices.reduce((acc, curr) => acc + (curr.balanceDue || 0), 0);
  const settlementRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

  const urgentTasks = (tasks || []).filter(t => t.status === 'Urgent' || t.status === 'Overdue Warning');

  return (
    <div className="space-y-6">
      
      {/* Executive Welcome & Operations Overview Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Operations Active
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">Live KSA &amp; Pakistan Network</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Executive Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Centralized command center managing Party Head manifests, multi-stay hotel allocations, pipeline sales estimates, and real-time financial settlement ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate && onNavigate('PASSENGERS')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95"
          >
            <Users className="w-3.5 h-3.5 text-slate-300" />
            <span>Manage Manifests</span>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('INVOICES')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200/90 shadow-xs transition-all active:scale-95"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-500" />
            <span>Financial Ledger</span>
          </button>
        </div>
      </div>

      {/* 4 Core KPI Cards (Stripe/Linear Clean Light Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Active Group Manifests */}
        <div 
          onClick={() => onNavigate && onNavigate('PASSENGERS')}
          className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Group Manifests</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalParties}</span>
            <span className="text-xs font-semibold text-emerald-600">Active Heads</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Sovereign Parent Nodes</span>
            <span className="font-semibold text-slate-700 group-hover:text-emerald-600 flex items-center gap-0.5">
              View <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Mutamers (PAX) Demographics */}
        <div 
          onClick={() => onNavigate && onNavigate('PASSENGERS')}
          className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pilgrims (PAX)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalPax}</span>
            <span className="text-xs font-medium text-slate-500">Verified Mutamers</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Adults: <strong>{adults}</strong>
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-amber-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Child: <strong>{children}</strong>
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-blue-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Infant: <strong>{infants}</strong>
            </span>
          </div>
        </div>

        {/* Card 3: Hotel Room Blocks & Stays */}
        <div 
          onClick={() => onNavigate && onNavigate('HOTELS')}
          className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hotel Stays</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalNights}</span>
            <span className="text-xs font-semibold text-amber-600">Total Nights</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Makkah &amp; Madinah</span>
            <span className="font-semibold text-slate-700 font-mono">{totalStays} Stays</span>
          </div>
        </div>

        {/* Card 4: Financial Ledger Health */}
        <div 
          onClick={() => onNavigate && onNavigate('INVOICES')}
          className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Financial Collection</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              PKR {(totalCollected / 1000).toLocaleString()}k
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {(totalInvoiced / 1000).toLocaleString()}k
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-rose-600 font-semibold font-mono">
              Due: PKR {(totalOutstanding / 1000).toLocaleString()}k
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
              {settlementRate}% Settled
            </span>
          </div>
        </div>

      </div>

      {/* Module Quick-Launchpad Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div 
          onClick={() => onNavigate && onNavigate('PASSENGERS')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700">Module A</span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mt-2">Passenger Manifests</h3>
          <p className="text-xs text-slate-500 mt-0.5">Strict parent-child registry &amp; Saudi visa numbers.</p>
          <div className="mt-3 text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <span>{parties.length} Party Heads</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate && onNavigate('HOTELS')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700">Module B</span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mt-2">Multi-Stay Hotel Vouchers</h3>
          <p className="text-xs text-slate-500 mt-0.5">Dual English/Urdu script &amp; QR verification.</p>
          <div className="mt-3 text-xs font-semibold text-amber-600 flex items-center gap-1">
            <span>{hotelVouchers.length} Stays Issued</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate && onNavigate('ESTIMATES')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700">Module C</span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mt-2">Pipeline Cost Estimator</h3>
          <p className="text-xs text-slate-500 mt-0.5">Itemized package margins with 1-click invoice conversion.</p>
          <div className="mt-3 text-xs font-semibold text-blue-600 flex items-center gap-1">
            <span>{estimates.length} Active Quotes</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate && onNavigate('INVOICES')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700">Module D</span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mt-2">Invoices &amp; Ledger</h3>
          <p className="text-xs text-slate-500 mt-0.5">Payment receipts, balance tracking &amp; audit trails.</p>
          <div className="mt-3 text-xs font-semibold text-purple-600 flex items-center gap-1">
            <span>{invoices.length} Registered Invoices</span>
          </div>
        </div>

      </div>

      {/* Main Two-Column Analytics Section: Active Manifests + Operations Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active Party Manifests Preview Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Active Party Head Manifests</h3>
              <p className="text-xs text-slate-500 mt-0.5">Sovereign parent nodes linked to all downstream documents.</p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('PASSENGERS')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Party Head</th>
                  <th className="py-3 px-4">UID</th>
                  <th className="py-3 px-4 text-center">PAX</th>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parties.slice(0, 5).map((party) => (
                  <tr key={party.partyHeadUid} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {party.partyName}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                      {party.partyHeadUid}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700 text-[11px]">
                        {party.passengers?.length || party.totalPax}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {party.packageTitle || 'Umrah Package'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {party.contactPhone || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onNavigate && onNavigate('PASSENGERS')}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Urgent Tasks & Audit Activity Feed */}
        <div className="space-y-6">
          
          {/* Urgent Deadlines Widget */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h4 className="font-bold text-sm text-slate-900">Critical Deadlines</h4>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('REMINDERS')}
                className="text-xs font-semibold text-amber-600 hover:underline"
              >
                All Tasks ({tasks.length})
              </button>
            </div>

            <div className="space-y-2.5">
              {urgentTasks.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No urgent operational deadlines today.</p>
              ) : (
                urgentTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{task.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                        {task.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{task.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
                      <span>Party: {task.partyHeadUid}</span>
                      <span>Due: {task.deadline}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Real-Time Operational Audit Feed */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Activity className="w-4 h-4 text-slate-700" />
                <h4 className="font-bold text-sm text-slate-900">Live Audit Activity</h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Security Stream</span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No audit logs recorded.</p>
              ) : (
                auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="px-1.5 py-0.5 rounded bg-slate-200/80 font-mono text-[9px] font-bold text-slate-700">
                        {log.action}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800 text-[11.5px]">{log.title}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Operator: <strong className="text-slate-600">{log.operator}</strong>
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
