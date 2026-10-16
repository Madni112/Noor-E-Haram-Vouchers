// lib/erpRouting.js
// Handles URL routing & synchronization for ERP modules (Root & Module Level)

export const ERP_ROUTES = {
  DASHBOARD: {
    id: 'DASHBOARD',
    label: 'Dashboard & Overview',
    canonicalPath: '/',
    aliases: ['dashboard', 'overview', '', 'erp', 'erp/dashboard']
  },
  TRANSPORTS: {
    id: 'TRANSPORTS',
    label: 'Transport + Hotel',
    canonicalPath: '/transport-hotel',
    aliases: ['transport-hotel', 'transport+hotel', 'transports', 'transport-vouchers', 'vouchers', 'erp/transports']
  },
  HOTELS: {
    id: 'HOTELS',
    label: 'Hotel Voucher',
    canonicalPath: '/hotel-voucher',
    aliases: ['hotel-voucher', 'hotel-vouchers', 'hotels', 'stays', 'erp/hotel-voucher', 'erp/hotel-vouchers']
  },
  TRANSPORT_ONLY: {
    id: 'TRANSPORT_ONLY',
    label: 'Transport Voucher',
    canonicalPath: '/transport-only-voucher',
    aliases: ['transport-only-voucher', 'transport-voucher', 'transport-only', 'transport', 'tv', 'erp/transport-only-voucher', 'erp/transport-voucher']
  },
  GROUPS: {
    id: 'GROUPS',
    label: 'Group',
    canonicalPath: '/groups',
    aliases: ['groups', 'group', 'party-heads', 'parties', 'family-groups', 'erp/groups']
  },
  PASSENGERS: {
    id: 'PASSENGERS',
    label: 'Passengers',
    canonicalPath: '/passengers',
    aliases: ['passengers', 'passenger', 'manifest', 'erp/passengers']
  },
  ESTIMATES: {
    id: 'ESTIMATES',
    label: 'Package Cost Estimator',
    canonicalPath: '/package-calculator',
    aliases: ['package-calculator', 'package calculator', 'package-cost-estimator', 'cost-estimator', 'estimates', 'calculator', 'erp/package-calculator']
  },
  INVOICES: {
    id: 'INVOICES',
    label: 'Bill',
    canonicalPath: '/invoices',
    aliases: ['invoices', 'invoice', 'billing', 'bill', 'bills', 'erp/invoices']
  },
  RECEIPTS: {
    id: 'RECEIPTS',
    label: 'Bill Receipt',
    canonicalPath: '/bill-receipts',
    aliases: ['bill-receipts', 'bill-receipt', 'receipts', 'receipt', 'payment-receipts', 'erp/bill-receipts']
  },
  LEDGER: {
    id: 'LEDGER',
    label: 'Accounts Ledger',
    canonicalPath: '/ledger',
    aliases: ['ledger', 'account-ledger', 'party-ledger', 'statement', 'invoices-ledger', 'erp/ledger']
  },
  LEDGER_CUSTOMERS: {
    id: 'LEDGER_CUSTOMERS',
    label: 'Customer Accounts',
    canonicalPath: '/customer-accounts',
    aliases: ['customer-accounts', 'customers-ledger', 'debtors', 'erp/customer-accounts']
  },
  LEDGER_BANKS: {
    id: 'LEDGER_BANKS',
    label: 'Bank & Cash Accounts',
    canonicalPath: '/bank-accounts',
    aliases: ['bank-accounts', 'banks', 'cash-counter', 'bank-cash', 'erp/bank-accounts']
  },
  LEDGER_JOURNAL: {
    id: 'LEDGER_JOURNAL',
    label: 'General Journal',
    canonicalPath: '/general-journal',
    aliases: ['general-journal', 'journal', 'erp/general-journal']
  },
  REMINDERS: {
    id: 'REMINDERS',
    label: 'Tasks & Deadlines',
    canonicalPath: '/tasks-deadlines',
    aliases: ['tasks-deadlines', 'tasks & deadlines', 'tasks', 'task', 'deadlines', 'reminders', 'erp/tasks-deadlines']
  }
};

/**
 * Resolves an active tab ID from a URL slug or pathname string.
 */
export function resolveTabFromSlug(slugParam) {
  if (!slugParam) return 'DASHBOARD';
  let raw = '';
  if (Array.isArray(slugParam)) {
    raw = slugParam.join('/');
  } else {
    raw = String(slugParam);
  }

  // Remove leading /erp/ or / if present
  let clean = decodeURIComponent(raw).trim();
  clean = clean.replace(/^\/?erp\/?/i, '').replace(/^\//, '').toLowerCase();

  if (!clean || clean === 'dashboard' || clean === 'overview') return 'DASHBOARD';

  if (clean.includes('transport-hotel') || clean.includes('transport+hotel') || clean === 'transports' || clean === 'transport-vouchers') return 'TRANSPORTS';
  if (clean === 'transport-only-voucher' || clean === 'transport-voucher' || clean.includes('transport-only') || clean === 'tv') return 'TRANSPORT_ONLY';
  if (clean.includes('hotel')) return 'HOTELS';
  if (clean.includes('group') || clean.includes('part') || clean.includes('famil')) return 'GROUPS';
  if (clean.includes('passenger') || clean.includes('pax') || clean.includes('manifest')) return 'PASSENGERS';
  if (clean.includes('package') || clean.includes('calculat') || clean.includes('estimate') || clean.includes('cost')) return 'ESTIMATES';
  if (clean === 'ledger' || clean.includes('account-ledger') || clean.includes('party-ledger') || clean.includes('statement')) return 'LEDGER';
  if (clean.includes('receipt')) return 'RECEIPTS';
  if (clean.includes('invoice') || clean.includes('bill')) return 'INVOICES';
  if (clean.includes('ledger')) return 'LEDGER';
  if (clean.includes('task') || clean.includes('deadline') || clean.includes('remind')) return 'REMINDERS';
  if (clean.includes('transport')) return 'TRANSPORT_ONLY';

  return 'DASHBOARD';
}

/**
 * Returns canonical route for a given tab ID.
 */
export function getRouteForTab(tabId) {
  if (tabId === 'DASHBOARD') return '/';
  return ERP_ROUTES[tabId]?.canonicalPath || '/';
}

/**
 * Detects if a pathname is an ERP portal route (used to hide website navbar/footer)
 */
export function isErpRoute(pathname) {
  if (!pathname) return false;
  if (pathname === '/') return true;
  if (pathname.startsWith('/erp')) return true;
  if (pathname.startsWith('/dashboard')) return true;
  if (pathname.startsWith('/transport-hotel') || pathname.startsWith('/transports') || pathname.startsWith('/transport-vouchers')) return true;
  if (pathname === '/transport-only-voucher' || pathname === '/transport-voucher') return true;
  if (pathname.startsWith('/groups')) return true;
  if (pathname.startsWith('/passengers')) return true;
  if (pathname.startsWith('/hotel-vouchers') || pathname === '/hotel-voucher') return true;
  if (pathname.startsWith('/package-calculator')) return true;
  if (pathname === '/invoices' || pathname.startsWith('/invoices/')) return true;
  if (pathname.startsWith('/bill-receipts')) return true;
  if (pathname.startsWith('/ledger')) return true;
  if (pathname.startsWith('/tasks-deadlines')) return true;
  // Specific public print views have their own layout (Navbar/Footer hidden)
  if (pathname.startsWith('/hotel-voucher/')) return true;
  if (pathname.startsWith('/transport-only-voucher/') || pathname.startsWith('/transport-voucher/')) return true;
  return false;
}
