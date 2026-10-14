// lib/erpRouting.js
// Handles URL routing & synchronization for ERP modules

export const ERP_ROUTES = {
  DASHBOARD: {
    id: 'DASHBOARD',
    label: 'Dashboard & Overview',
    canonicalPath: '/erp/dashboard',
    aliases: ['dashboard', 'overview', '']
  },
  PASSENGERS: {
    id: 'PASSENGERS',
    label: 'Passengers',
    canonicalPath: '/erp/passengers',
    aliases: ['passengers', 'passenger', 'families', 'family', 'groups', 'manifest']
  },
  HOTELS: {
    id: 'HOTELS',
    label: 'Multi-Stay Hotel Vouchers',
    canonicalPath: '/erp/hotel-voucher',
    aliases: ['hotel-voucher', 'hotel voucher', 'hotel-vouchers', 'hotels', 'vouchers']
  },
  ESTIMATES: {
    id: 'ESTIMATES',
    label: 'Package Cost Estimator',
    canonicalPath: '/erp/package-calculator',
    aliases: ['package-calculator', 'package calculator', 'package-cost-estimator', 'cost-estimator', 'estimates', 'calculator']
  },
  INVOICES: {
    id: 'INVOICES',
    label: 'Invoices',
    canonicalPath: '/erp/invoices',
    aliases: ['invoices', 'invoice', 'billing']
  },
  LEDGER: {
    id: 'LEDGER',
    label: 'Accounts Ledger',
    canonicalPath: '/erp/ledger',
    aliases: ['ledger', 'account-ledger', 'party-ledger', 'statement', 'invoices-ledger']
  },
  REMINDERS: {
    id: 'REMINDERS',
    label: 'Tasks & Deadlines',
    canonicalPath: '/erp/tasks-deadlines',
    aliases: ['tasks-deadlines', 'tasks & deadlines', 'tasks', 'task', 'deadlines', 'reminders']
  }
};

/**
 * Resolves an active tab ID from a URL slug or pathname string.
 * Supports:
 * - array slug from Next.js dynamic params e.g. ['Hotel Voucher']
 * - string path e.g. '/erp/Hotel Voucher'
 */
export function resolveTabFromSlug(slugParam) {
  if (!slugParam) return 'DASHBOARD';
  let raw = '';
  if (Array.isArray(slugParam)) {
    raw = slugParam.join('/');
  } else {
    raw = String(slugParam);
  }

  // Remove leading /erp/ if present
  let clean = decodeURIComponent(raw).trim();
  clean = clean.replace(/^\/?erp\/?/i, '').toLowerCase();

  if (!clean) return 'DASHBOARD';

  if (clean.includes('hotel')) return 'HOTELS';
  if (clean.includes('passenger') || clean.includes('famil')) return 'PASSENGERS';
  if (clean.includes('package') || clean.includes('calculat') || clean.includes('estimate') || clean.includes('cost')) return 'ESTIMATES';
  if (clean === 'ledger' || clean.includes('account-ledger') || clean.includes('party-ledger') || clean.includes('statement')) return 'LEDGER';
  if (clean.includes('invoice') || clean.includes('bill')) return 'INVOICES';
  if (clean.includes('ledger')) return 'LEDGER';
  if (clean.includes('task') || clean.includes('deadline') || clean.includes('remind')) return 'REMINDERS';
  if (clean.includes('dashboard') || clean.includes('overview')) return 'DASHBOARD';

  return 'DASHBOARD';
}

/**
 * Returns canonical route for a given tab ID.
 */
export function getRouteForTab(tabId) {
  return ERP_ROUTES[tabId]?.canonicalPath || '/erp/dashboard';
}
