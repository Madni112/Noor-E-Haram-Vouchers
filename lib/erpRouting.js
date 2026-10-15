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
    label: 'Transport Vouchers',
    canonicalPath: '/transports',
    aliases: ['transports', 'transport-vouchers', 'transport', 'umrah-vouchers', 'vouchers', 'erp/transports', 'erp/transport-vouchers']
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
  HOTELS: {
    id: 'HOTELS',
    label: 'Multi-Stay Hotel Vouchers',
    canonicalPath: '/hotel-vouchers',
    aliases: ['hotel-vouchers', 'hotel-voucher', 'hotels', 'stays', 'erp/hotel-voucher', 'erp/hotel-vouchers']
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
  REMINDERS: {
    id: 'REMINDERS',
    label: 'Tasks & Deadlines',
    canonicalPath: '/tasks-deadlines',
    aliases: ['tasks-deadlines', 'tasks & deadlines', 'tasks', 'task', 'deadlines', 'reminders', 'erp/tasks-deadlines']
  }
};

/**
 * Resolves an active tab ID from a URL slug or pathname string.
 * Supports:
 * - array slug from Next.js dynamic params e.g. ['transports']
 * - string path e.g. '/transports' or '/erp/hotel-voucher'
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

  if (clean.includes('transport') || clean === 'vouchers' || clean === 'voucher') return 'TRANSPORTS';
  if (clean.includes('hotel')) return 'HOTELS';
  if (clean.includes('group') || clean.includes('part') || clean.includes('famil')) return 'GROUPS';
  if (clean.includes('passenger') || clean.includes('pax') || clean.includes('manifest')) return 'PASSENGERS';
  if (clean.includes('package') || clean.includes('calculat') || clean.includes('estimate') || clean.includes('cost')) return 'ESTIMATES';
  if (clean === 'ledger' || clean.includes('account-ledger') || clean.includes('party-ledger') || clean.includes('statement')) return 'LEDGER';
  if (clean.includes('receipt')) return 'RECEIPTS';
  if (clean.includes('invoice') || clean.includes('bill')) return 'INVOICES';
  if (clean.includes('ledger')) return 'LEDGER';
  if (clean.includes('task') || clean.includes('deadline') || clean.includes('remind')) return 'REMINDERS';

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
  if (pathname.startsWith('/transports') || pathname.startsWith('/transport-vouchers')) return true;
  if (pathname.startsWith('/groups')) return true;
  if (pathname.startsWith('/passengers')) return true;
  if (pathname.startsWith('/hotel-vouchers')) return true;
  if (pathname.startsWith('/package-calculator')) return true;
  if (pathname === '/invoices' || pathname.startsWith('/invoices/')) return true;
  if (pathname.startsWith('/bill-receipts')) return true;
  if (pathname.startsWith('/ledger')) return true;
  if (pathname.startsWith('/tasks-deadlines')) return true;
  if (pathname.startsWith('/hotel-voucher')) return true;
  return false;
}
