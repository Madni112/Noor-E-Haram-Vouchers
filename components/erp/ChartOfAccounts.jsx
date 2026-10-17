'use client';
import { createPortal } from 'react-dom';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Printer, 
  FileText, 
  Landmark, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Check, 
  X, 
  Trash2, 
  Edit3, 
  ShieldCheck, 
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { 
  getChartOfAccounts, 
  saveChartOfAccount, 
  deleteChartOfAccount,
  getBankAccounts,
  getCustomSubCategories,
  saveCustomSubCategory
} from '../../lib/erpData';

const SUB_CATEGORIES_BY_CATEGORY = {
  ASSETS: [
    'Bank Account',
    'Cash in Hand / Cash Drawer',
    'Accounts Receivable (Debtors)',
    'Prepaid Expenses & Advances',
    'Fixed Assets (Furniture, Equipment, Vehicles)',
    'Other Current Assets'
  ],
  LIABILITIES: [
    'Current Liabilities',
    'Accounts Payable (Vendors)',
    'Customer Advances Received',
    'Payroll & Taxes Payable',
    'Long-Term Liabilities'
  ],
  EQUITY: [
    "Owner's Capital",
    'Retained Earnings',
    'Drawings / Distributions'
  ],
  REVENUE: [
    'Operating Revenue',
    'Umrah Packages Revenue',
    'Flight Ticket Commission',
    'Hotel & Visa Margins',
    'Other Income'
  ],
  DIRECT_COSTS: [
    'Cost of Sales',
    'Saudi Umrah Visas Cost',
    'Hotel Accommodation Cost',
    'Airlines & Ground Transport Cost'
  ],
  EXPENSES: [
    'Operating Expenses',
    'Office Rent & Utilities',
    'Staff Salaries & Benefits',
    'Marketing & Promotions',
    'Bank Fees & Financial Charges',
    'Admin & Office Supplies'
  ]
};

const CATEGORIES_LIST = [
  { id: 'ASSETS', name: 'Assets (1000s)', range: '1000s', type: 'DEBIT', desc: 'Cash, Banks, Receivables, Fixed Assets' },
  { id: 'LIABILITIES', name: 'Liabilities (2000s)', range: '2000s', type: 'CREDIT', desc: 'Payables, Customer Advances, Loans' },
  { id: 'EQUITY', name: 'Equity (3000s)', range: '3000s', type: 'CREDIT', desc: "Owner's Capital, Retained Earnings, Drawings" },
  { id: 'REVENUE', name: 'Revenue (4000s)', range: '4000s', type: 'CREDIT', desc: 'Umrah Packages, Tickets, Margins' },
  { id: 'DIRECT_COSTS', name: 'Cost of Sales (5000s)', range: '5000s', type: 'DEBIT', desc: 'Saudi Visas, Hotel Blocks, Transport' },
  { id: 'EXPENSES', name: 'Operating Expenses (6000s)', range: '6000s', type: 'DEBIT', desc: 'Rent, Staff Salaries, Marketing, Utilities' },
];

export default function ChartOfAccounts({
 companyName = 'NOOR E HARAM TRAVELS & TOURS', invoices = [], parties = [] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const [accounts, setAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL'); // 'ALL' | 'ASSETS' | 'LIABILITIES' | 'EQUITY' | 'REVENUE' | 'DIRECT_COSTS' | 'EXPENSES'
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'ASSETS',
    subCategory: 'Bank Account',
    type: 'DEBIT',
    currency: 'Rs',
    balance: ''
  });

  // Searchable & Addable Dropdowns State
  const [customSubCategories, setCustomSubCategories] = useState({});
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [isSubCategoryOpen, setIsSubCategoryOpen] = useState(false);
  const [subCategorySearch, setSubCategorySearch] = useState('');
  const categoryRef = useRef(null);
  const subCategoryRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
      if (subCategoryRef.current && !subCategoryRef.current.contains(event.target)) {
        setIsSubCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAvailableSubCategories = (category) => {
    const defaults = SUB_CATEGORIES_BY_CATEGORY[category] || [];
    const customs = customSubCategories[category] || [];
    const fromAccounts = accounts
      .filter(a => a.category === category && a.subCategory)
      .map(a => a.subCategory);

    const seen = new Set();
    const result = [];
    [...defaults, ...customs, ...fromAccounts].forEach(item => {
      const trimmed = (item || '').trim();
      if (trimmed && !seen.has(trimmed.toLowerCase())) {
        seen.add(trimmed.toLowerCase());
        result.push(trimmed);
      }
    });
    return result;
  };

  const suggestCodeForSubCategory = (cat, subCat, currentList) => {
    const list = currentList || accounts;
    const sub = (subCat || '').toLowerCase();
    
    if (cat === 'ASSETS') {
      if (sub.includes('bank')) {
        const codes = list.filter(a => a.category === 'ASSETS' && a.code.startsWith('102')).map(a => parseInt(a.code, 10)).filter(n => !isNaN(n));
        return codes.length === 0 ? '1020' : String(Math.max(...codes) + 1);
      }
      if (sub.includes('cash')) {
        const codes = list.filter(a => a.category === 'ASSETS' && a.code.startsWith('101')).map(a => parseInt(a.code, 10)).filter(n => !isNaN(n));
        return codes.length === 0 ? '1010' : String(Math.max(...codes) + 1);
      }
      if (sub.includes('fixed') || sub.includes('furniture') || sub.includes('equipment') || sub.includes('vehicle') || sub.includes('asset')) {
        const codes = list.filter(a => a.category === 'ASSETS' && a.code.startsWith('15')).map(a => parseInt(a.code, 10)).filter(n => !isNaN(n));
        return codes.length === 0 ? '1510' : String(Math.max(...codes) + 10);
      }
      if (sub.includes('receivable')) {
        return '1030';
      }
      if (sub.includes('prepaid') || sub.includes('advance')) {
        const codes = list.filter(a => a.category === 'ASSETS' && a.code.startsWith('104')).map(a => parseInt(a.code, 10)).filter(n => !isNaN(n));
        return codes.length === 0 ? '1040' : String(Math.max(...codes) + 10);
      }
      const codes = list.filter(a => a.category === 'ASSETS' && !a.code.startsWith('101') && !a.code.startsWith('102')).map(a => parseInt(a.code, 10)).filter(n => !isNaN(n));
      return codes.length === 0 ? '1050' : String(Math.max(...codes) + 10);
    }

    let prefix = 1000;
    if (cat === 'LIABILITIES') prefix = 2000;
    else if (cat === 'EQUITY') prefix = 3000;
    else if (cat === 'REVENUE') prefix = 4000;
    else if (cat === 'DIRECT_COSTS') prefix = 5000;
    else if (cat === 'EXPENSES') prefix = 6000;

    const catCodes = list
      .filter(a => a.category === cat)
      .map(a => parseInt(a.code, 10))
      .filter(n => !isNaN(n) && n >= prefix && n < prefix + 1000);

    if (catCodes.length === 0) return String(prefix + 10);
    const maxCode = Math.max(...catCodes);
    return String(maxCode + 10);
  };

  const loadAccounts = () => {
    const list = getChartOfAccounts(companyName);
    setCustomSubCategories(getCustomSubCategories(companyName));
    
    // Invoices total billed and customer debt
    const totalBilled = invoices.reduce((sum, inv) => sum + (parseFloat(inv.netTotal || inv.totalAmount) || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (parseFloat(inv.paidAmount) || 0), 0);
    const totalReceivables = Math.max(0, totalBilled - totalPaid);

    const updated = list.map(a => {
      let b = a.balance;
      if (a.code === '1030') {
        b = totalReceivables;
      } else if (a.code === '4010') {
        b = totalBilled;
      } else if (a.code === '2030') {
        b = totalPaid;
      }
      return { ...a, currency: 'Rs', balance: b };
    });

    setAccounts(updated);
  };

  useEffect(() => {
    loadAccounts();
  }, [companyName, invoices, parties]);

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setIsCategoryOpen(false);
    setCategorySearch('');
    setIsSubCategoryOpen(false);
    setSubCategorySearch('');
    const defaultSub = 'Bank Account';
    const nextCode = suggestCodeForSubCategory('ASSETS', defaultSub, accounts);
    setFormData({
      code: nextCode,
      name: '',
      category: 'ASSETS',
      subCategory: defaultSub,
      type: 'DEBIT',
      currency: 'Rs',
      balance: '0'
    });
    setShowAddModal(true);
  };

  const handleCategoryChangeInModal = (cat) => {
    const subs = getAvailableSubCategories(cat);
    const defaultSub = subs[0] || 'General';
    let typ = 'DEBIT';
    if (['LIABILITIES', 'EQUITY', 'REVENUE'].includes(cat)) {
      typ = 'CREDIT';
    }

    const autoCode = (!editingAccount) ? suggestCodeForSubCategory(cat, defaultSub, accounts) : formData.code;

    setFormData({ 
      ...formData, 
      category: cat, 
      subCategory: defaultSub, 
      type: typ,
      code: autoCode
    });
  };

  const handleSubCategoryChangeInModal = (subCat) => {
    const autoCode = (!editingAccount) ? suggestCodeForSubCategory(formData.category, subCat, accounts) : formData.code;
    setFormData({
      ...formData,
      subCategory: subCat,
      code: autoCode
    });
  };

  const selectCategory = (catId) => {
    handleCategoryChangeInModal(catId);
    setIsCategoryOpen(false);
    setCategorySearch('');
  };

  const selectSubCategory = (sub) => {
    handleSubCategoryChangeInModal(sub);
    setIsSubCategoryOpen(false);
    setSubCategorySearch('');
  };

  const handleAddNewSubCategory = (newSubName) => {
    const trimmed = (newSubName || '').trim();
    if (!trimmed) return;
    const updated = saveCustomSubCategory(formData.category, trimmed, companyName);
    setCustomSubCategories(updated);
    selectSubCategory(trimmed);
  };

  const handleOpenEdit = (acc) => {
    setEditingAccount(acc);
    setIsCategoryOpen(false);
    setCategorySearch('');
    setIsSubCategoryOpen(false);
    setSubCategorySearch('');
    setFormData({
      code: acc.code,
      name: acc.name,
      category: acc.category,
      subCategory: acc.subCategory || (SUB_CATEGORIES_BY_CATEGORY[acc.category]?.[0] || 'General'),
      type: acc.type,
      currency: 'Rs',
      balance: acc.balance.toString()
    });
    setShowAddModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      alert('Please enter Account Code and Account Name');
      return;
    }

    const payload = {
      ...(editingAccount ? { id: editingAccount.id, isSystem: editingAccount.isSystem } : {}),
      code: formData.code.trim(),
      name: formData.name.trim(),
      category: formData.category,
      subCategory: formData.subCategory,
      type: formData.type,
      currency: 'Rs',
      balance: parseFloat(formData.balance) || 0
    };

    saveChartOfAccount(payload, companyName);
    setShowAddModal(false);
    loadAccounts();
  };

  const handleDelete = (acc) => {
    if (acc.isSystem) {
      alert('System-locked general ledger accounts cannot be deleted to protect audit trail integrity.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete account "${acc.code} - ${acc.name}"?`)) {
      deleteChartOfAccount(acc.id, companyName);
      loadAccounts();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered accounts
  const filteredAccounts = accounts.filter(acc => {
    const matchesCategory = activeCategory === 'ALL' || acc.category === activeCategory;
    const matchesSearch = 
      acc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.subCategory.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate totals for KPI cards
  const totalAssets = accounts
    .filter(a => a.category === 'ASSETS')
    .reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);

  const totalLiabilities = accounts
    .filter(a => a.category === 'LIABILITIES')
    .reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);

  const totalEquity = accounts
    .filter(a => a.category === 'EQUITY')
    .reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);

  const totalRevenue = accounts
    .filter(a => a.category === 'REVENUE')
    .reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);

  const totalCostsExpenses = accounts
    .filter(a => a.category === 'DIRECT_COSTS' || a.category === 'EXPENSES')
    .reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'ASSETS':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Assets</span>;
      case 'LIABILITIES':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Liabilities</span>;
      case 'EQUITY':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Equity</span>;
      case 'REVENUE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Revenue</span>;
      case 'DIRECT_COSTS':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Cost of Sales</span>;
      case 'EXPENSES':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">Operating Expenses</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{cat}</span>;
    }
  };

  return (
    <div className="space-y-4">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .coa-print-container, .coa-print-container * {
            visibility: visible;
          }
          .coa-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-hide {
            display: none !important;
          }
        }
      `}} />

      {/* Top Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print-hide">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
              Module D3
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Chart of Accounts (COA)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Official double-entry general ledger code matrix, classification, live balances, and financial structure.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0a192f] hover:bg-slate-800 text-[#dfba73] border border-[#dfba73]/40 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print COA Statement</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Summary Cards (Assets, Liabilities, Equity, Revenue, Expenses) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 print-hide">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">1000 • Total Assets</span>
            <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">A</span>
          </div>
          <span className="text-lg font-black font-mono text-slate-900 block mt-1">
            Rs. {totalAssets.toLocaleString()}
          </span>
          <span className="text-[10px] text-blue-600 font-semibold">Cash, Banks &amp; Receivables</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">2000 • Liabilities</span>
            <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">L</span>
          </div>
          <span className="text-lg font-black font-mono text-rose-700 block mt-1">
            Rs. {totalLiabilities.toLocaleString()}
          </span>
          <span className="text-[10px] text-rose-600 font-semibold">Payables &amp; Advances</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">3000 • Equity</span>
            <span className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">E</span>
          </div>
          <span className="text-lg font-black font-mono text-purple-700 block mt-1">
            Rs. {totalEquity.toLocaleString()}
          </span>
          <span className="text-[10px] text-purple-600 font-semibold">Capital &amp; Reserves</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">4000 • Total Revenue</span>
            <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">R</span>
          </div>
          <span className="text-lg font-black font-mono text-emerald-700 block mt-1">
            Rs. {totalRevenue.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold">Umrah &amp; Visa Sales</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">5000/6000 • Costs &amp; Exp</span>
            <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">C</span>
          </div>
          <span className="text-lg font-black font-mono text-amber-700 block mt-1">
            Rs. {totalCostsExpenses.toLocaleString()}
          </span>
          <span className="text-[10px] text-amber-600 font-semibold">Direct Costs &amp; Admin</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs space-y-3 print-hide">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Accounts', count: accounts.length },
            { id: 'ASSETS', label: 'Assets (1000)', count: accounts.filter(a => a.category === 'ASSETS').length },
            { id: 'LIABILITIES', label: 'Liabilities (2000)', count: accounts.filter(a => a.category === 'LIABILITIES').length },
            { id: 'EQUITY', label: 'Equity (3000)', count: accounts.filter(a => a.category === 'EQUITY').length },
            { id: 'REVENUE', label: 'Revenue (4000)', count: accounts.filter(a => a.category === 'REVENUE').length },
            { id: 'DIRECT_COSTS', label: 'Cost of Sales (5000)', count: accounts.filter(a => a.category === 'DIRECT_COSTS').length },
            { id: 'EXPENSES', label: 'Expenses (6000)', count: accounts.filter(a => a.category === 'EXPENSES').length },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeCategory === tab.id ? 'bg-slate-100 text-slate-900' : 'bg-slate-200/80 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search account by code (e.g. 1010), account title, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
          />
        </div>
      </div>

      {/* Main Table / Print Container */}
      <div className="coa-print-container bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {/* Print Only Official Letterhead */}
        <div className="hidden print:block p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">{companyName}</h1>
              <p className="text-xs text-slate-500 font-semibold">Official General Ledger Chart of Accounts (COA)</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p className="font-bold">Printed: {new Date().toLocaleDateString('en-GB')}</p>
              <p>Currency: PKR / Rs.</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-24">Code</th>
                <th className="py-3 px-4">Account Title</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Sub-Category</th>
                <th className="py-3 px-4 text-center">Normal</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right print-hide w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">No accounts found matching your criteria</p>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map(acc => (
                  <tr key={acc.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-xs">
                      {acc.code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{acc.name}</span>
                        {acc.isSystem && (
                          <span title="System Core Account" className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-mono font-semibold">
                            CORE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getCategoryBadge(acc.category)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {acc.subCategory}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        acc.type === 'DEBIT' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {acc.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      Rs. {parseFloat(acc.balance || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right print-hide">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(acc)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Account"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {!acc.isSystem && (
                          <button
                            type="button"
                            onClick={() => handleDelete(acc)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Account Modal */}
      {showAddModal && (() => {
        const filteredCategories = CATEGORIES_LIST.filter(c => 
          c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
          c.id.toLowerCase().includes(categorySearch.toLowerCase()) ||
          c.desc.toLowerCase().includes(categorySearch.toLowerCase())
        );

        const availableSubs = getAvailableSubCategories(formData.category);
        const filteredSubs = availableSubs.filter(sub => 
          sub.toLowerCase().includes(subCategorySearch.toLowerCase())
        );
        const isExactSubMatch = availableSubs.some(
          sub => sub.toLowerCase() === subCategorySearch.trim().toLowerCase()
        );

        if (!mounted || typeof document === 'undefined') return null;
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 my-auto">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between rounded-t-2xl">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    {editingAccount ? `Edit Account: ${editingAccount.code}` : 'Add New General Ledger Account'}
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                      {editingAccount ? 'Update Mode' : 'New Entry'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Standard double-entry Chart of Accounts classification with auto-ledger sync
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5">
                {/* 1. Category & Sub-Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Dropdown (Searchable) */}
                  <div className="relative" ref={categoryRef}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase">
                        Category *
                      </label>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        formData.type === 'DEBIT'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {formData.type === 'DEBIT' ? 'Debit (DR)' : 'Credit (CR)'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCategoryOpen(!isCategoryOpen);
                        setIsSubCategoryOpen(false);
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left flex items-center justify-between transition-colors shadow-xs group cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    >
                      <div className="truncate">
                        <span className="font-bold text-xs text-slate-800 block truncate">
                          {CATEGORIES_LIST.find(c => c.id === formData.category)?.name || formData.category}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {CATEGORIES_LIST.find(c => c.id === formData.category)?.desc}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 shrink-0 ml-2 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isCategoryOpen && (
                      <div className="absolute z-30 mt-1.5 w-full bg-white rounded-xl shadow-2xl border border-slate-200 p-2 animate-in fade-in zoom-in-95 duration-150">
                        <div className="relative mb-2">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            autoFocus
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            placeholder="Search category or range..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 font-medium"
                          />
                        </div>
                        <div className="max-h-56 overflow-y-auto space-y-1">
                          {filteredCategories.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-400">No categories found</div>
                          ) : (
                            filteredCategories.map((cat) => {
                              const isSelected = formData.category === cat.id;
                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => selectCategory(cat.id)}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                    isSelected ? 'bg-slate-900 text-white font-bold' : 'hover:bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  <div>
                                    <div className="font-bold">{cat.name}</div>
                                    <div className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                                      {cat.desc}
                                    </div>
                                  </div>
                                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ml-2 ${
                                    isSelected 
                                      ? 'bg-slate-800 text-white' 
                                      : cat.type === 'DEBIT' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                                  }`}>
                                    {cat.type}
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sub-Category Dropdown (Searchable & Addable) */}
                  <div className="relative" ref={subCategoryRef}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase">
                        Sub-Category *
                      </label>
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Search or Add Custom
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsSubCategoryOpen(!isSubCategoryOpen);
                        setIsCategoryOpen(false);
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left flex items-center justify-between transition-colors shadow-xs group cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900/10 min-h-[46px]"
                    >
                      <div className="truncate">
                        <span className="font-bold text-xs text-slate-800 block truncate">
                          {formData.subCategory || 'Select or type sub-category...'}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {formData.category} classification
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 shrink-0 ml-2 ${isSubCategoryOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isSubCategoryOpen && (
                      <div className="absolute z-30 mt-1.5 w-full bg-white rounded-xl shadow-2xl border border-slate-200 p-2 animate-in fade-in zoom-in-95 duration-150">
                        <div className="relative mb-2">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            autoFocus
                            value={subCategorySearch}
                            onChange={(e) => setSubCategorySearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (filteredSubs.length > 0 && isExactSubMatch) {
                                  selectSubCategory(filteredSubs[0]);
                                } else if (subCategorySearch.trim() && !isExactSubMatch) {
                                  handleAddNewSubCategory(subCategorySearch.trim());
                                } else if (filteredSubs.length > 0) {
                                  selectSubCategory(filteredSubs[0]);
                                }
                              }
                            }}
                            placeholder="Type to search or add custom..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 font-medium"
                          />
                        </div>

                        <div className="max-h-56 overflow-y-auto space-y-1">
                          {/* Quick Add Custom Sub-Category button if search text has no exact match */}
                          {subCategorySearch.trim() && !isExactSubMatch && (
                            <button
                              type="button"
                              onClick={() => handleAddNewSubCategory(subCategorySearch.trim())}
                              className="w-full text-left p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-between transition-colors border border-dashed border-emerald-300 mb-1 cursor-pointer"
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                Add "{subCategorySearch.trim()}"
                              </span>
                              <span className="text-[10px] bg-emerald-200/80 px-1.5 py-0.5 rounded text-emerald-900 font-semibold shrink-0">
                                New Sub-Category
                              </span>
                            </button>
                          )}

                          {filteredSubs.length === 0 && !subCategorySearch.trim() ? (
                            <div className="p-3 text-center text-xs text-slate-400">No sub-categories available</div>
                          ) : (
                            filteredSubs.map((sub) => {
                              const isSelected = formData.subCategory === sub;
                              return (
                                <button
                                  key={sub}
                                  type="button"
                                  onClick={() => selectSubCategory(sub)}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                    isSelected ? 'bg-slate-900 text-white font-bold' : 'hover:bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  <span className="truncate">{sub}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-2" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Account Code (Auto-suggested) & Opening Balance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase">
                        Account Code *
                      </label>
                      <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-0.5">
                        <Sparkles className="w-3 h-3 text-indigo-500" /> Auto-suggested
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1060"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-slate-900 bg-slate-50/70"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase">
                        Opening Balance (Rs.)
                      </label>
                      <span className="text-[10px] font-mono font-semibold text-slate-500">
                        ({formData.type === 'DEBIT' ? 'Debit / DR' : 'Credit / CR'})
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={formData.balance}
                      onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                {/* 3. Account Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                    Account Name / Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cash in Hand - Petty Cash / Standard Chartered / Office Rent"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
                  >
                    {editingAccount ? 'Save Changes' : 'Confirm & Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

