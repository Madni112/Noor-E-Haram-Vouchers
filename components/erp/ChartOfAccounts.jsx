'use client';

import React, { useState, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';
import { 
  getChartOfAccounts, 
  saveChartOfAccount, 
  deleteChartOfAccount,
  getBankAccounts
} from '../../lib/erpData';

export default function ChartOfAccounts({ companyName = 'NOOR E HARAM TRAVELS & TOURS', invoices = [], parties = [] }) {
  const [accounts, setAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL'); // 'ALL' | 'ASSETS' | 'LIABILITIES' | 'EQUITY' | 'REVENUE' | 'DIRECT_COSTS' | 'EXPENSES'
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'ASSETS',
    subCategory: 'Current Assets',
    type: 'DEBIT',
    currency: 'Rs',
    balance: ''
  });

  const getNextAvailableCode = (cat, currentList) => {
    let prefix = 1000;
    if (cat === 'ASSETS') prefix = 1000;
    else if (cat === 'LIABILITIES') prefix = 2000;
    else if (cat === 'EQUITY') prefix = 3000;
    else if (cat === 'REVENUE') prefix = 4000;
    else if (cat === 'DIRECT_COSTS') prefix = 5000;
    else if (cat === 'EXPENSES') prefix = 6000;

    const list = currentList || accounts;
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
    const nextCode = getNextAvailableCode('ASSETS', accounts);
    setFormData({
      code: nextCode,
      name: '',
      category: 'ASSETS',
      subCategory: 'Current Assets',
      type: 'DEBIT',
      currency: 'Rs',
      balance: '0'
    });
    setShowAddModal(true);
  };

  const handleCategoryChangeInModal = (cat) => {
    let sub = 'Current Assets';
    let typ = 'DEBIT';
    if (cat === 'LIABILITIES') { sub = 'Current Liabilities'; typ = 'CREDIT'; }
    if (cat === 'EQUITY') { sub = 'Equity'; typ = 'CREDIT'; }
    if (cat === 'REVENUE') { sub = 'Operating Revenue'; typ = 'CREDIT'; }
    if (cat === 'DIRECT_COSTS') { sub = 'Cost of Sales'; typ = 'DEBIT'; }
    if (cat === 'EXPENSES') { sub = 'Operating Expenses'; typ = 'DEBIT'; }

    const autoCode = (!editingAccount) ? getNextAvailableCode(cat, accounts) : formData.code;

    setFormData({ 
      ...formData, 
      category: cat, 
      subCategory: sub, 
      type: typ,
      code: autoCode
    });
  };

  const handleOpenEdit = (acc) => {
    setEditingAccount(acc);
    setFormData({
      code: acc.code,
      name: acc.name,
      category: acc.category,
      subCategory: acc.subCategory,
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
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  {editingAccount ? `Edit Account: ${editingAccount.code}` : 'Add New General Ledger Account'}
                </h3>
                <p className="text-[11px] text-slate-300">
                  Standard double-entry Chart of Accounts classification
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase">
                      Account Code *
                    </label>
                    <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> Auto-suggested
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1060"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-slate-900 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Currency
                  </label>
                  <div className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-slate-100 text-slate-800">
                    Rs (Pakistani Rupee)
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Account Name / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cash in Hand - Petty Cash / Standard Chartered"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleCategoryChangeInModal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-slate-900"
                  >
                    <option value="ASSETS">Assets (1000s)</option>
                    <option value="LIABILITIES">Liabilities (2000s)</option>
                    <option value="EQUITY">Equity (3000s)</option>
                    <option value="REVENUE">Revenue (4000s)</option>
                    <option value="DIRECT_COSTS">Cost of Sales (5000s)</option>
                    <option value="EXPENSES">Operating Expenses (6000s)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Normal Balance
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-slate-900"
                  >
                    <option value="DEBIT">Debit (DR)</option>
                    <option value="CREDIT">Credit (CR)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Sub-Category
                  </label>
                  <input
                    type="text"
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Opening / Initial Balance (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {editingAccount ? 'Save Changes' : 'Confirm & Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
