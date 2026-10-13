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
  Lock,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Search,
  LogOut,
  LayoutDashboard,
  FileText,
  UserCheck,
  Settings
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
import { useAuth } from '../../lib/AuthContext';
import AdminLoginForm from '../../components/AdminLoginForm';
import DashboardAnalytics from '../../components/erp/DashboardAnalytics';
import PassengerManager from '../../components/erp/PassengerManager';
import HotelVoucherManager from '../../components/erp/HotelVoucherManager';
import CostEstimator from '../../components/erp/CostEstimator';
import InvoiceLedger from '../../components/erp/InvoiceLedger';
import RemindersPanel from '../../components/erp/RemindersPanel';
import SystemArchitectureModal from '../../components/erp/SystemArchitectureModal';

export default function ErpPortalPage() {
  const { isAdmin, isLoaded, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('DASHBOARD'); // DEFAULT: DASHBOARD
  const [parties, setParties] = useState([]);
  const [hotelVouchers, setHotelVouchers] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [currentRole, setCurrentRole] = useState(USER_ROLES.SUPER_ADMIN);
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile drawer
  const [searchQuery, setSearchQuery] = useState('');

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

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading Operations ERP...</p>
        </div>
      </div>
    );
  }

  // Admin access gatekeeper
  if (!isAdmin) {
    return <AdminLoginForm />;
  }

  const urgentTasksCount = tasks.filter(t => t.status === 'Urgent' || t.status === 'Overdue Warning').length;

  const navItems = [
    {
      id: 'DASHBOARD',
      label: 'Dashboard & Overview',
      icon: LayoutDashboard,
      badge: null,
      section: 'main'
    },
    {
      id: 'PASSENGERS',
      label: 'Passengers & Manifests',
      subtitle: 'Module A',
      icon: Users,
      badge: parties.length,
      section: 'modules'
    },
    {
      id: 'HOTELS',
      label: 'Multi-Stay Hotel Vouchers',
      subtitle: 'Module B',
      icon: Building2,
      badge: hotelVouchers.length,
      section: 'modules'
    },
    {
      id: 'ESTIMATES',
      label: 'Package Cost Estimator',
      subtitle: 'Module C',
      icon: Calculator,
      badge: estimates.length,
      section: 'modules'
    },
    {
      id: 'INVOICES',
      label: 'Invoices & Ledger',
      subtitle: 'Module D',
      icon: Receipt,
      badge: invoices.length,
      section: 'modules'
    },
    {
      id: 'REMINDERS',
      label: 'Tasks & Deadlines',
      icon: Clock,
      badge: urgentTasksCount > 0 ? `${urgentTasksCount} Urgent` : null,
      badgeColor: 'bg-rose-100 text-rose-700',
      section: 'workflow'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col md:flex-row text-slate-800 font-sans antialiased">
      
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* MODERN LEFT SIDEBAR (Stripe / Linear Clean Style) */}
      <aside 
        className={`fixed md:sticky top-0 h-screen w-72 bg-white border-r border-slate-200/90 z-50 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand & Top Header */}
        <div>
          <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm tracking-tighter shadow-xs group-hover:bg-emerald-600 transition-colors">
                CF
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-900 tracking-tight">CHEEPA TRAVELS</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ERP
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium -mt-0.5">Umrah Operations Suite</p>
              </div>
            </Link>

            <button 
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-3.5 space-y-6 overflow-y-auto max-h-[calc(100vh-14rem)]">
            
            {/* Main Overview */}
            <div className="space-y-1">
              <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Workspace
              </span>
              {navItems.filter(i => i.section === 'main').map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive 
                        ? 'bg-slate-900 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Core ERP Modules */}
            <div className="space-y-1">
              <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Operations Modules
              </span>
              {navItems.filter(i => i.section === 'modules').map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive 
                        ? 'bg-slate-900 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-left">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <div>
                        <div>{item.label}</div>
                      </div>
                    </div>

                    {item.badge !== null && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Workflow & Tools */}
            <div className="space-y-1">
              <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Workflow &amp; Field
              </span>
              {navItems.filter(i => i.section === 'workflow').map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive 
                        ? 'bg-slate-900 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.badgeColor || (isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600')
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <Link
                href="/"
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Bus className="w-4 h-4 text-slate-400" />
                  <span>Transport Vouchers</span>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </Link>
            </div>

          </div>
        </div>

        {/* Bottom Sidebar Footer: Role Clearance & Quick Actions */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 space-y-3">
          
          {/* Active Role Selector Card */}
          <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400">Security Clearance</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            
            <select
              value={currentRole.id}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
            >
              <option value="super_admin">Super Admin (L3)</option>
              <option value="ops_clerk">Operations Clerk (L2)</option>
              <option value="ground_support">Ground Support (L1)</option>
            </select>
          </div>

          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => setIsArchModalOpen(true)}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5"
            >
              <Network className="w-3.5 h-3.5 text-slate-400" />
              <span>Schema Matrix</span>
            </button>

            <button
              onClick={logout}
              title="Logout"
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

        </div>
      </aside>

      {/* MAIN CONTENT CANVAS & TOPBAR */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Crisp Top Navigation Command Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-8 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  {navItems.find(i => i.id === activeTab)?.label || 'Operations ERP'}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Synced
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block -mt-0.5">
                Parent-Child relational database engine
              </p>
            </div>
          </div>

          {/* Quick Actions & Short Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">New Voucher</span>
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              <Bus className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Transport Portal</span>
            </Link>

          </div>

        </header>

        {/* Dynamic Workspace Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          
          {activeTab === 'DASHBOARD' && (
            <DashboardAnalytics 
              parties={parties}
              invoices={invoices}
              hotelVouchers={hotelVouchers}
              estimates={estimates}
              tasks={tasks}
              auditLogs={auditLogs}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'PASSENGERS' && (
            <PassengerManager 
              parties={parties} 
              onPartiesUpdated={(updated) => {
                setParties(updated);
                loadAllErpData();
              }} 
            />
          )}

          {activeTab === 'HOTELS' && (
            <HotelVoucherManager 
              hotelVouchers={hotelVouchers}
              parties={parties}
              onVouchersUpdated={(updated) => {
                setHotelVouchers(updated);
                loadAllErpData();
              }}
            />
          )}

          {activeTab === 'ESTIMATES' && (
            <CostEstimator 
              estimates={estimates}
              parties={parties}
              onEstimatesUpdated={(updated) => {
                setEstimates(updated);
                loadAllErpData();
              }}
              onInvoiceGenerated={() => {
                loadAllErpData();
                setActiveTab('INVOICES');
              }}
            />
          )}

          {activeTab === 'INVOICES' && (
            <InvoiceLedger 
              invoices={invoices}
              parties={parties}
              onInvoicesUpdated={(updated) => {
                setInvoices(updated);
                loadAllErpData();
              }}
            />
          )}

          {activeTab === 'REMINDERS' && (
            <RemindersPanel 
              tasks={tasks}
              onTasksUpdated={(updated) => {
                setTasks(updated);
                loadAllErpData();
              }}
            />
          )}

        </main>

      </div>

      {/* System Architecture Matrix Modal */}
      <SystemArchitectureModal 
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />

    </div>
  );
}
