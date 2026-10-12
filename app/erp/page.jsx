'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Network, 
  Users, 
  Building2, 
  Bus, 
  Calculator, 
  Receipt, 
  Bell, 
  ShieldCheck, 
  Layers, 
  PlusCircle, 
  Activity, 
  Clock, 
  Filter, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Lock 
} from 'lucide-react';
import { 
  getAllParties, 
  getAllHotelVouchers, 
  getAllEstimates, 
  getAllInvoices, 
  getAllTasks, 
  getAllAuditLogs, 
  getActiveRole, 
  setActiveRole, 
  USER_ROLES 
} from '../../lib/erpData';
import { getAllVouchers } from '../../lib/vouchersData';
import DashboardAnalytics from '../../components/erp/DashboardAnalytics';
import PassengerManager from '../../components/erp/PassengerManager';
import HotelVoucherManager from '../../components/erp/HotelVoucherManager';
import CostEstimator from '../../components/erp/CostEstimator';
import InvoiceLedger from '../../components/erp/InvoiceLedger';
import RemindersPanel from '../../components/erp/RemindersPanel';
import SystemArchitectureModal from '../../components/erp/SystemArchitectureModal';

export default function ErpPortalPage() {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [parties, setParties] = useState([]);
  const [hotelVouchers, setHotelVouchers] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [currentRole, setCurrentRole] = useState(USER_ROLES.SUPER_ADMIN);
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadAllErpData();
    }
  }, []);

  const loadAllErpData = () => {
    setParties(getAllParties());
    setHotelVouchers(getAllHotelVouchers());
    setEstimates(getAllEstimates());
    setInvoices(getAllInvoices());
    setTasks(getAllTasks());
    setAuditLogs(getAllAuditLogs());
    setCurrentRole(getActiveRole());
    setLoading(false);
  };

  const handleRoleChange = (roleId) => {
    const updated = setActiveRole(roleId);
    setCurrentRole(updated);
    setAuditLogs(getAllAuditLogs());
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const urgentTasksCount = tasks.filter(t => t.status === 'Urgent' || t.status === 'Overdue Warning').length;

  return (
    <div className="min-h-screen bg-slate-100/90 pb-16">
      
      {/* Top ERP Command Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white border-b border-emerald-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 space-y-4">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Title & Branding */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-emerald-950 border border-amber-300">
                  Operations ERP Console
                </span>
                <span className="text-xs text-emerald-200/90 font-mono font-bold">
                  Noor E Haram Travel &amp; Tours
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight flex items-center gap-2">
                <span>Enterprise Travel Operations Portal</span>
              </h1>
              <p className="text-xs text-emerald-200/80 max-w-2xl leading-relaxed">
                Centralized B2B execution engine managing Parent Party manifests, Multi-Stay Hotel Vouchers, Pre-Sales Estimator, Financial Ledgers &amp; Universal QR code verification.
              </p>
            </div>

            {/* Quick System Tools & Role Selector */}
            <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
              
              {/* Architecture Blueprint Trigger */}
              <button
                onClick={() => setIsArchModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/90 hover:bg-emerald-800 text-amber-300 rounded-lg text-xs font-bold border border-amber-400/30 transition-all shadow-sm active:scale-95"
              >
                <Network className="w-3.5 h-3.5" />
                <span>Architecture Map</span>
              </button>

              {/* Reminders Quick Toggle */}
              <button
                onClick={() => setActiveTab('REMINDERS')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  urgentTasksCount > 0
                    ? 'bg-rose-950/80 text-rose-200 border-rose-500/40 animate-pulse'
                    : 'bg-emerald-900/80 text-emerald-200 border-emerald-700/50 hover:bg-emerald-800'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Deadlines ({tasks.filter(t => t.status !== 'Completed').length})</span>
              </button>

              {/* RBAC Operator Selector */}
              <div className="flex items-center gap-1.5 bg-emerald-950/90 px-3 py-1.5 rounded-lg border border-emerald-700/60 text-xs">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400 font-bold hidden sm:inline">Role:</span>
                <select 
                  value={currentRole.id}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="bg-transparent font-bold text-amber-300 outline-none text-xs cursor-pointer"
                >
                  <option value="super_admin" className="bg-slate-900 text-white">Super Admin</option>
                  <option value="ops_clerk" className="bg-slate-900 text-white">Operations Clerk</option>
                  <option value="ground_support" className="bg-slate-900 text-white">Ground Support</option>
                </select>
              </div>

            </div>

          </div>

          {/* ERP Module Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pt-2 border-t border-emerald-800/60 no-scrollbar">
            
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'DASHBOARD'
                  ? 'bg-amber-400 text-emerald-950 shadow-md ring-1 ring-amber-300'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-900/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Overview &amp; Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('PASSENGERS')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'PASSENGERS'
                  ? 'bg-amber-400 text-emerald-950 shadow-md ring-1 ring-amber-300'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-900/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Module A: Passenger Manager ({parties.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('HOTELS')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'HOTELS'
                  ? 'bg-amber-400 text-emerald-950 shadow-md ring-1 ring-amber-300'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-900/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Module B: Multi-Stay Hotel Vouchers ({hotelVouchers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ESTIMATES')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'ESTIMATES'
                  ? 'bg-amber-400 text-emerald-950 shadow-md ring-1 ring-amber-300'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-900/60'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Module C: Package Cost Estimator ({estimates.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('INVOICES')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'INVOICES'
                  ? 'bg-amber-400 text-emerald-950 shadow-md ring-1 ring-amber-300'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-900/60'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Module D: Invoices &amp; Ledger ({invoices.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('REMINDERS')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'REMINDERS'
                  ? 'bg-amber-400 text-emerald-950 shadow-md ring-1 ring-amber-300'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-900/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Deadlines &amp; Tasks</span>
            </button>

            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-emerald-300 hover:text-white hover:bg-emerald-900/40 whitespace-nowrap ml-auto"
            >
              <Bus className="w-3.5 h-3.5" />
              <span>Transport Vouchers</span>
              <ExternalLink className="w-3 h-3 text-emerald-400" />
            </Link>

          </div>

        </div>
      </div>

      {/* Main ERP Workdesk Canvas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Tab 1: Executive Overview & Live Analytics */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            <DashboardAnalytics 
              parties={parties}
              invoices={invoices}
              hotelVouchers={hotelVouchers}
              estimates={estimates}
              auditLogs={auditLogs}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RemindersPanel 
                tasks={tasks}
                onTasksUpdated={(updated) => setTasks(updated)}
              />

              {/* Quick Links Matrix */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Operations Quick-Action Hub</span>
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    Sovereign Data Routing
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setActiveTab('PASSENGERS')}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-emerald-700/50 text-left transition-all space-y-1"
                  >
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                      <Users className="w-4 h-4" />
                      <span>Passenger Matrix</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500">
                      Manage group manifests, passports &amp; MoFA visas.
                    </p>
                  </button>

                  <button
                    onClick={() => setActiveTab('HOTELS')}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-emerald-700/50 text-left transition-all space-y-1"
                  >
                    <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                      <Building2 className="w-4 h-4" />
                      <span>Multi-Stay Vouchers</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500">
                      Generate Makkah/Madinah stay blocks with dual Urdu rules.
                    </p>
                  </button>

                  <button
                    onClick={() => setActiveTab('ESTIMATES')}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-emerald-700/50 text-left transition-all space-y-1"
                  >
                    <div className="flex items-center gap-1.5 text-blue-800 font-bold">
                      <Calculator className="w-4 h-4" />
                      <span>Cost Estimator</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500">
                      Draft holiday quotes &amp; apply margin overrides.
                    </p>
                  </button>

                  <button
                    onClick={() => setActiveTab('INVOICES')}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-emerald-700/50 text-left transition-all space-y-1"
                  >
                    <div className="flex items-center gap-1.5 text-purple-800 font-bold">
                      <Receipt className="w-4 h-4" />
                      <span>Billing &amp; Ledger</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500">
                      Log bank payments &amp; print A4 tax invoices.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Module A - Passenger Manager */}
        {activeTab === 'PASSENGERS' && (
          <PassengerManager 
            parties={parties}
            onPartiesUpdated={(updated) => setParties(updated)}
          />
        )}

        {/* Tab 3: Module B - Multi-Stay Hotel Vouchers */}
        {activeTab === 'HOTELS' && (
          <HotelVoucherManager 
            hotelVouchers={hotelVouchers}
            parties={parties}
            onVouchersUpdated={(updated) => setHotelVouchers(updated)}
          />
        )}

        {/* Tab 4: Module C - Package Cost Estimator */}
        {activeTab === 'ESTIMATES' && (
          <CostEstimator 
            estimates={estimates}
            parties={parties}
            onEstimatesUpdated={(updated) => setEstimates(updated)}
            onInvoiceCreated={(newInv) => setInvoices([newInv, ...invoices])}
          />
        )}

        {/* Tab 5: Module D - Invoices & Ledger */}
        {activeTab === 'INVOICES' && (
          <InvoiceLedger 
            invoices={invoices}
            onInvoicesUpdated={(updated) => setInvoices(updated)}
          />
        )}

        {/* Tab 6: Deadlines & Tasks */}
        {activeTab === 'REMINDERS' && (
          <RemindersPanel 
            tasks={tasks}
            onTasksUpdated={(updated) => setTasks(updated)}
          />
        )}

      </div>

      {/* System Architecture Blueprint Matrix Modal */}
      <SystemArchitectureModal 
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />

    </div>
  );
}
