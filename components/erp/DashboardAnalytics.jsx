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
  Layers 
} from 'lucide-react';

export default function DashboardAnalytics({ 
  parties = [], 
  invoices = [], 
  hotelVouchers = [], 
  estimates = [], 
  auditLogs = [] 
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

  return (
    <div className="space-y-6">
      
      {/* 4 Core Financial & Operations Metric Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Active Parties & Groups */}
        <div className="bg-emerald-950 border border-emerald-800/80 rounded-xl p-4 shadow-lg text-white space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Active Group Manifests</span>
            <div className="p-1.5 bg-emerald-800/60 rounded-lg text-amber-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{totalParties}</span>
            <span className="text-xs text-amber-300 font-bold font-mono">Party Heads</span>
          </div>
          <div className="text-[10.5px] text-emerald-200/80 pt-1 border-t border-emerald-900/60 flex items-center justify-between">
            <span>Sovereign Parent Nodes</span>
            <span className="text-white font-mono font-bold">100% Linked</span>
          </div>
        </div>

        {/* Card 2: Mutamers (PAX) Demographics */}
        <div className="bg-slate-900 border border-emerald-900/60 rounded-xl p-4 shadow-lg text-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Total Pilgrims (PAX)</span>
            <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{totalPax}</span>
            <span className="text-xs text-slate-400 font-medium">Mutamers Verified</span>
          </div>
          <div className="text-[10px] text-slate-300 pt-1 border-t border-slate-800 flex items-center justify-between font-mono">
            <span>Adults: <strong className="text-white">{adults}</strong></span>
            <span>Children: <strong className="text-amber-300">{children}</strong></span>
            <span>Infants: <strong className="text-blue-300">{infants}</strong></span>
          </div>
        </div>

        {/* Card 3: Hotel Nights & Stays */}
        <div className="bg-slate-900 border border-emerald-900/60 rounded-xl p-4 shadow-lg text-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Hotel Room Blocks</span>
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{totalNights}</span>
            <span className="text-xs text-emerald-300 font-bold font-mono">Total Nights</span>
          </div>
          <div className="text-[10.5px] text-slate-400 pt-1 border-t border-slate-800 flex items-center justify-between">
            <span>Makkah &amp; Madinah</span>
            <span className="text-white font-mono font-bold">{totalStays} Contract Blocks</span>
          </div>
        </div>

        {/* Card 4: Financial Ledger Health */}
        <div className="bg-slate-900 border border-emerald-900/60 rounded-xl p-4 shadow-lg text-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Collected vs Outstanding</span>
            <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
              PKR {(totalCollected / 1000).toFixed(0)}k
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              / {(totalInvoiced / 1000).toFixed(0)}k
            </span>
          </div>
          <div className="text-[10px] pt-1 border-t border-slate-800 flex items-center justify-between">
            <span className="text-rose-400 font-bold font-mono">
              Due: PKR {(totalOutstanding / 1000).toFixed(0)}k
            </span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-300 font-bold text-[9px]">
              {totalInvoiced > 0 ? `${Math.round((totalCollected / totalInvoiced) * 100)}% Settled` : 'N/A'}
            </span>
          </div>
        </div>

      </div>

      {/* Real-Time Operational Audit Log Stream */}
      <div className="bg-slate-900 border border-emerald-900/60 rounded-xl p-5 shadow-xl text-white space-y-3">
        <div className="flex items-center justify-between border-b border-emerald-800/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">
              Real-Time Dashboard Operations &amp; Audit Logs
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Streaming live system events
          </span>
        </div>

        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {auditLogs.length === 0 ? (
            <p className="text-slate-500 text-xs italic text-center py-4">No logged events yet.</p>
          ) : (
            auditLogs.slice(0, 10).map((log) => (
              <div 
                key={log.id} 
                className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-xs transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                    {log.action}
                  </span>
                  <div>
                    <p className="font-bold text-slate-200">{log.title}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Operator: <span className="text-amber-300">{log.operator}</span> ({log.clearance})
                      {log.details && Object.keys(log.details).length > 0 && ` • ${JSON.stringify(log.details)}`}
                    </p>
                  </div>
                </div>

                <span className="text-[9.5px] font-mono text-slate-400 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
