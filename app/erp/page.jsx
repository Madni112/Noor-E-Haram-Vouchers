'use client';

import { useState, useEffect, useMemo } from 'react';
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
  ChevronDown,
  Menu,
  X,
  Search,
  LogOut,
  LayoutDashboard,
  FileText,
  UserCheck,
  Settings,
  RotateCw,
  Landmark
} from 'lucide-react';
import { 
  getAllParties, 
  getAllGroups,
  getAllHotelVouchers, 
  getAllTransportOnlyVouchers,
  getAllEstimates, 
  getAllInvoices, 
  getAllTasks, 
  getAllAuditLogs, 
  getActiveRole, 
  setActiveRole, 
  fetchErpCloudData,
  getRegisteredHotelStars,
  getHotelDistance,
  USER_ROLES 
} from '../../lib/erpData';
import { useAuth } from '../../lib/AuthContext';
import AdminLoginForm from '../../components/AdminLoginForm';
import DashboardAnalytics from '../../components/erp/DashboardAnalytics';
import GroupManager from '../../components/erp/GroupManager';
import PassengerManager from '../../components/erp/PassengerManager';
import HotelVoucherManager from '../../components/erp/HotelVoucherManager';
import TransportVoucherManager from '../../components/erp/TransportVoucherManager';
import TransportOnlyManager from '../../components/erp/TransportOnlyManager';
import CostEstimator from '../../components/erp/CostEstimator';
import InvoiceLedger from '../../components/erp/InvoiceLedger';
import ChartOfAccounts from '../../components/erp/ChartOfAccounts';
import BillReceiptManager from '../../components/erp/BillReceiptManager';
import RemindersPanel from '../../components/erp/RemindersPanel';
import SystemArchitectureModal from '../../components/erp/SystemArchitectureModal';
import { resolveTabFromSlug, getRouteForTab } from '../../lib/erpRouting';

export default function ErpPortalPage({ initialTab = 'DASHBOARD' }) {
  const { isAdmin, isLoaded, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab || 'DASHBOARD');
  const [parties, setParties] = useState([]);
  const [groups, setGroups] = useState([]);
  const [hotelVouchers, setHotelVouchers] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [currentRole, setCurrentRole] = useState(USER_ROLES.SUPER_ADMIN);
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile drawer
  const [passengerMenuOpen, setPassengerMenuOpen] = useState(true); // Dropdown for Passenger
  const [voucherMenuOpen, setVoucherMenuOpen] = useState(true); // Dropdown for Vouchers
  const [salesMenuOpen, setSalesMenuOpen] = useState(true); // Dropdown for Invoice / Sale
  const [accountsMenuOpen, setAccountsMenuOpen] = useState(true); // Dropdown for Accounts & Ledger
  const [cloudSyncStatus, setCloudSyncStatus] = useState('syncing'); // 'synced' | 'syncing' | 'offline'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hotelPrefillData, setHotelPrefillData] = useState(null);
  const [transportOnlyVouchers, setTransportOnlyVouchers] = useState([]);
  const [openTransportCreateTrigger, setOpenTransportCreateTrigger] = useState(0);

  const handleGenerateHotelFromTransport = (transportVoucher) => {
    const matchingParty = parties.find(p => 
      (p.voucherRefNo && p.voucherRefNo === (transportVoucher.ubNumber || transportVoucher.voucherRefNo)) ||
      (p.partyName && p.partyName.toLowerCase() === (transportVoucher.party || '').toLowerCase())
    ) || parties[0];
    
    const partyHeadUid = matchingParty?.partyHeadUid || parties[0]?.partyHeadUid || '';
    
    const starMap = getRegisteredHotelStars();
    const mappedStays = (transportVoucher.accommodations || []).map((acc, idx) => {
      const city = acc.city ? (acc.city.toLowerCase().includes('med') ? 'Medinah' : 'Makkah') : 'Makkah';
      const hotelName = (acc.hotelName || '').trim().toUpperCase();
      const stars = (starMap[hotelName] !== undefined && starMap[hotelName] !== null) ? starMap[hotelName] : 5;
      const distance = getHotelDistance(hotelName) || '';
      return {
        id: `stay-${idx + 1}`,
        city: city,
        hotelName: hotelName || (city === 'Medinah' ? 'GULNAR HV' : 'VOCO 5 STAR'),
        distance: distance,
        stars: stars,
        category: stars > 0 ? `${stars} Star Hotel` : '',
        checkIn: acc.checkIn || '2026-10-10',
        checkOut: acc.checkOut || '2026-10-15',
        roomType: acc.roomType || 'Quad',
        mealPlan: acc.meal || 'RO',
        hcn: `HCN-${Math.floor(100000 + Math.random() * 900000)}`,
        hotelPhone: city === 'Medinah' ? '+966 57 593 0550' : '+966 53 649 2846'
      };
    });

    setHotelPrefillData({
      partyHeadUid: partyHeadUid,
      stays: mappedStays.length > 0 ? mappedStays : undefined
    });

    handleTabSwitch('HOTELS');
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadAllErpData();
      syncWithCloud();

      // Check current URL pathname if direct navigation
      const currentPath = window.location.pathname;
      const resolved = resolveTabFromSlug(currentPath);
      if (resolved && resolved !== 'DASHBOARD') {
        setActiveTab(resolved);
      } else if (initialTab) {
        setActiveTab(initialTab);
      }

      // Handle browser back/forward buttons
      const handlePopState = () => {
        const tab = resolveTabFromSlug(window.location.pathname);
        setActiveTab(tab);
      };

      // Safety failsafe: ensure loading screen never hangs
      const safetyTimer = setTimeout(() => {
        setLoading(false);
      }, 600);

      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
        clearTimeout(safetyTimer);
      };
    }
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabSwitch = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
    if (typeof window !== 'undefined') {
      const targetRoute = getRouteForTab(tabId);
      if (window.location.pathname !== targetRoute) {
        window.history.pushState({ tabId }, '', targetRoute);
      }
    }
  };

  const loadAllErpData = () => {
    try {
      setParties(getAllParties());
      setGroups(getAllGroups());
      setHotelVouchers(getAllHotelVouchers());
      setTransportOnlyVouchers(getAllTransportOnlyVouchers());
      setEstimates(getAllEstimates());
      setInvoices(getAllInvoices());
      setTasks(getAllTasks());
      setAuditLogs(getAllAuditLogs());
      setCurrentRole(getActiveRole());
    } catch (err) {
      console.error('loadAllErpData error:', err);
    } finally {
      setLoading(false);
    }
  };

  const syncWithCloud = async () => {
    setCloudSyncStatus('syncing');
    try {
      const cloudData = await fetchErpCloudData();
      if (cloudData) {
        if (cloudData.parties?.length) setParties(cloudData.parties);
        if (cloudData.groups?.length) setGroups(cloudData.groups);
        if (cloudData.hotelVouchers?.length) setHotelVouchers(cloudData.hotelVouchers);
        if (cloudData.estimates?.length) setEstimates(cloudData.estimates);
        if (cloudData.invoices?.length) setInvoices(cloudData.invoices);
        if (cloudData.tasks?.length) setTasks(cloudData.tasks);
        if (cloudData.auditLogs?.length) setAuditLogs(cloudData.auditLogs);
      }
      setCloudSyncStatus('synced');
    } catch (err) {
      console.warn('Supabase Cloud Sync error:', err);
      setCloudSyncStatus('offline');
    } finally {
      setIsRefreshing(false);
    }
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

  const allReceiptsCount = invoices.reduce((acc, inv) => acc + (Array.isArray(inv.ledgerTransactions) ? inv.ledgerTransactions.length : 0), 0);
  const totalPassengersCount = parties.reduce((acc, p) => acc + (p.passengers?.length || parseInt(p.totalPax) || 1), 0);

  const navItems = [
    {
      id: 'DASHBOARD',
      label: 'Dashboard & Overview',
      icon: LayoutDashboard,
      badge: null,
      section: 'main'
    },
    {
      id: 'PASSENGER_DROPDOWN',
      isDropdown: true,
      label: 'Passenger',
      icon: Users,
      badge: parties.length,
      section: 'modules',
      subItems: [
        {
          id: 'GROUPS',
          label: 'Group',
          icon: Users,
          badge: groups.length,
        },
        {
          id: 'PASSENGERS',
          label: 'Passengers',
          icon: UserCheck,
          badge: totalPassengersCount,
        }
      ]
    },
    {
      id: 'GROUPS',
      label: 'Group',
      icon: Users,
      badge: groups.length,
      hidden: true,
    },
    {
      id: 'PASSENGERS',
      label: 'Passengers',
      icon: UserCheck,
      badge: totalPassengersCount,
      hidden: true,
    },
    {
      id: 'VOUCHER_DROPDOWN',
      isDropdown: true,
      label: 'Vouchers',
      icon: Layers,
      badge: 3,
      section: 'modules',
      subItems: [
        {
          id: 'TRANSPORTS',
          label: 'Transport + Hotel',
          icon: Bus,
          badge: parties.length || null,
        },
        {
          id: 'HOTELS',
          label: 'Hotel Voucher',
          icon: Building2,
          badge: hotelVouchers.length || null,
        },
        {
          id: 'TRANSPORT_ONLY',
          label: 'Transport Voucher',
          icon: Bus,
          badge: transportOnlyVouchers.length || null,
        }
      ]
    },
    {
      id: 'TRANSPORTS',
      label: 'Transport + Hotel',
      icon: Bus,
      badge: parties.length || null,
      hidden: true,
    },
    {
      id: 'HOTELS',
      label: 'Hotel Voucher',
      icon: Building2,
      badge: hotelVouchers.length || null,
      hidden: true,
    },
    {
      id: 'TRANSPORT_ONLY',
      label: 'Transport Voucher',
      icon: Bus,
      badge: transportOnlyVouchers.length || null,
      hidden: true,
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
      id: 'SALES_DROPDOWN',
      isDropdown: true,
      label: 'Invoice / Sale',
      icon: Receipt,
      badge: invoices.length,
      section: 'modules',
      subItems: [
        {
          id: 'INVOICES',
          label: 'Bill',
          icon: FileText,
          badge: invoices.length,
        },
        {
          id: 'RECEIPTS',
          label: 'Bill Receipt',
          icon: Receipt,
          badge: allReceiptsCount,
        }
      ]
    },
    {
      id: 'RECEIPTS',
      label: 'Bill Receipt',
      icon: Receipt,
      badge: allReceiptsCount,
      hidden: true,
    },
    {
      id: 'ACCOUNTS_DROPDOWN',
      isDropdown: true,
      label: 'Accounts & Ledger',
      icon: Landmark,
      badge: null,
      section: 'modules',
      subItems: [
        {
          id: 'LEDGER_CUSTOMERS',
          label: 'Customer Accounts',
          icon: Users,
          badge: parties.length || null,
        },
        {
          id: 'LEDGER_BANKS',
          label: 'Bank & Cash Accounts',
          icon: Landmark,
          badge: null,
        },
        {
          id: 'CHART_OF_ACCOUNTS',
          label: 'Chart of Accounts (COA)',
          icon: Layers,
          badge: null,
        },
        {
          id: 'LEDGER_JOURNAL',
          label: 'General Journal',
          icon: FileText,
          badge: null,
        }
      ]
    },
    {
      id: 'LEDGER',
      label: 'Accounts Ledger',
      icon: FileText,
      hidden: true,
    },
    {
      id: 'LEDGER_CUSTOMERS',
      label: 'Customer Accounts',
      icon: Users,
      hidden: true,
    },
    {
      id: 'LEDGER_BANKS',
      label: 'Bank & Cash Accounts',
      icon: Landmark,
      hidden: true,
    },
    {
      id: 'CHART_OF_ACCOUNTS',
      label: 'Chart of Accounts',
      icon: Layers,
      hidden: true,
    },
    {
      id: 'LEDGER_JOURNAL',
      label: 'General Journal',
      icon: FileText,
      hidden: true,
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
          <div className="min-h-[76px] px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-center p-1 shadow-xs group-hover:border-emerald-400 group-hover:shadow-md transition-all shrink-0 overflow-hidden">
                <img 
                  src="/logo.png" 
                  alt="Noor E Haram Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-900 tracking-tight leading-tight">NOOR E HARAM TRAVELS</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    ERP
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Umrah Operations Suite</p>
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
                    onClick={() => handleTabSwitch(item.id)}
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
                if (item.hidden) return null;

                if (item.isDropdown) {
                  const isPassenger = item.id === 'PASSENGER_DROPDOWN';
                  const isVoucher = item.id === 'VOUCHER_DROPDOWN';
                  const isAccounts = item.id === 'ACCOUNTS_DROPDOWN';
                  const isOpen = isPassenger ? passengerMenuOpen : isVoucher ? voucherMenuOpen : isAccounts ? accountsMenuOpen : salesMenuOpen;
                  const setIsOpen = isPassenger ? setPassengerMenuOpen : isVoucher ? setVoucherMenuOpen : isAccounts ? setAccountsMenuOpen : setSalesMenuOpen;
                  const isAnySubActive = item.subItems.some(sub => activeTab === sub.id);
                  const DropIcon = item.icon;

                  return (
                    <div key={item.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isAnySubActive && !isOpen
                            ? 'bg-slate-900 text-white shadow-xs'
                            : isAnySubActive
                            ? 'bg-slate-100 text-slate-900 font-bold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 text-left">
                          <DropIcon className={`w-4 h-4 shrink-0 ${isAnySubActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {item.badge !== null && (
                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-slate-200/80 text-slate-700">
                              {item.badge}
                            </span>
                          )}
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="ml-3.5 pl-3 border-l-2 border-slate-200 space-y-1 pt-0.5">
                          {item.subItems.map(sub => {
                            const SubIcon = sub.icon;
                            const isSubActive = activeTab === sub.id;
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => handleTabSwitch(sub.id)}
                                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                  isSubActive
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                                  <span>{sub.label}</span>
                                </div>
                                {sub.badge !== null && (
                                  <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                                    isSubActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {sub.badge}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabSwitch(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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
                    onClick={() => handleTabSwitch(item.id)}
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
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  {navItems.find(i => i.id === activeTab)?.label || 'Operations ERP'}
                </h2>
                
                {cloudSyncStatus === 'syncing' && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <div className="w-2 h-2 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                    Syncing...
                  </span>
                )}

                <button
                  onClick={() => {
                    setIsRefreshing(true);
                    syncWithCloud();
                  }}
                  title="Force re-sync with Supabase Cloud"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <RotateCw className={`w-3 h-3 ${isRefreshing || cloudSyncStatus === 'syncing' ? 'animate-spin text-slate-700' : ''}`} />
                </button>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block -mt-0.5">
                Parent-Child relational database engine
              </p>
            </div>
          </div>

          {/* Quick Actions & Short Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {activeTab === 'TRANSPORTS' ? (
              <button
                type="button"
                onClick={() => setOpenTransportCreateTrigger(prev => prev + 1)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden sm:inline">New Voucher</span>
              </button>
            ) : (
              <Link
                href="/create"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden sm:inline">New Voucher</span>
              </Link>
            )}

            <button
              onClick={() => handleTabSwitch('TRANSPORTS')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                activeTab === 'TRANSPORTS'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90'
              }`}
            >
              <Bus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Transport Vouchers</span>
            </button>

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
              onNavigate={(tab) => handleTabSwitch(tab)}
            />
          )}

          {activeTab === 'GROUPS' && (
            <GroupManager 
              groups={groups}
              parties={parties} 
              onGroupsUpdated={(updated) => {
                setGroups(updated);
                loadAllErpData();
              }} 
              onNavigateToPassengers={() => {
                handleTabSwitch('PASSENGERS');
              }}
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

          {activeTab === 'TRANSPORTS' && (
            <TransportVoucherManager 
              parties={parties}
              onGenerateHotelVoucher={handleGenerateHotelFromTransport}
              openCreateTrigger={openTransportCreateTrigger}
            />
          )}

          {activeTab === 'HOTELS' && (
            <HotelVoucherManager 
              hotelVouchers={hotelVouchers}
              parties={parties}
              prefillData={hotelPrefillData}
              onClearPrefill={() => setHotelPrefillData(null)}
              onVouchersUpdated={(updated) => {
                setHotelVouchers(updated);
                loadAllErpData();
              }}
              onPartiesUpdated={(updated) => {
                setParties(updated);
              }}
            />
          )}

          {activeTab === 'TRANSPORT_ONLY' && (
            <TransportOnlyManager 
              parties={parties}
              onVouchersUpdated={() => {
                loadAllErpData();
              }}
              onPartiesUpdated={(updated) => {
                setParties(updated);
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
              onInvoiceCreated={() => {
                loadAllErpData();
                handleTabSwitch('INVOICES');
              }}
            />
          )}

          {(activeTab === 'INVOICES' || activeTab === 'LEDGER' || activeTab === 'LEDGER_CUSTOMERS' || activeTab === 'LEDGER_BANKS' || activeTab === 'LEDGER_JOURNAL') && (
            <InvoiceLedger 
              invoices={invoices}
              parties={parties}
              initialView={activeTab === 'INVOICES' ? 'INVOICES' : 'LEDGER'}
              initialLedgerSubTab={
                activeTab === 'LEDGER_BANKS' 
                  ? 'BANKS' 
                  : activeTab === 'LEDGER_JOURNAL' 
                  ? 'JOURNAL' 
                  : 'CUSTOMERS'
              }
              onViewChange={(newView) => handleTabSwitch(newView)}
              onInvoicesUpdated={(updated) => {
                setInvoices(updated);
                loadAllErpData();
              }}
            />
          )}

          {activeTab === 'CHART_OF_ACCOUNTS' && (
            <ChartOfAccounts 
              companyName="NOOR E HARAM TRAVELS & TOURS"
              invoices={invoices}
              parties={parties}
            />
          )}

          {activeTab === 'RECEIPTS' && (
            <BillReceiptManager 
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
