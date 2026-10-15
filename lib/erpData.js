// lib/erpData.js
// Cheepa Travels ERP Operations Portal - Core Data Models, Parent-Child Relational Engine & Storage
import { getAllVouchers, slugify } from './vouchersData';
import { supabase } from './supabaseClient';

export const USER_ROLES = {
  SUPER_ADMIN: {
    id: 'super_admin',
    name: 'Super Admin / Operations Lead',
    clearance: 'Level 3 - Unrestricted',
    permissions: ['view_all', 'edit_all', 'manage_finances', 'override_margins', 'delete_records', 'manage_rbac'],
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
  },
  OPS_CLERK: {
    id: 'ops_clerk',
    name: 'Operations Clerk / Ticketing Agent',
    clearance: 'Level 2 - Operations & Sales',
    permissions: ['view_all', 'edit_passengers', 'create_vouchers', 'create_estimates', 'log_payments'],
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
  },
  GROUND_SUPPORT: {
    id: 'ground_support',
    name: 'Ground Support / Front Desk Agent',
    clearance: 'Level 1 - Field & Verification',
    permissions: ['view_vouchers', 'qr_verification', 'view_passengers', 'checkin_status'],
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
  },
};

const ERP_STORAGE_KEYS = {
  PARTIES: 'neh_erp_parties_v1',
  GROUPS: 'neh_erp_groups_v1',
  HOTEL_VOUCHERS: 'neh_erp_hotel_vouchers_v1',
  ESTIMATES: 'neh_erp_estimates_v1',
  INVOICES: 'neh_erp_invoices_v1',
  TASKS: 'neh_erp_tasks_v1',
  AUDIT_LOGS: 'neh_erp_audit_logs_v1',
  ACTIVE_ROLE: 'neh_erp_active_role_v1',
  HOTELS: 'neh_erp_hotels_v1',
  HOTEL_STARS: 'neh_erp_hotel_stars_v1',
  ROOM_TYPES: 'neh_erp_room_types_v1',
  HOTEL_RATES: 'neh_erp_hotel_rates_v1',
  HOTEL_DISTANCES: 'neh_erp_hotel_distances_v1',
  TRANSPORT_ONLY_VOUCHERS: 'neh_erp_transport_only_vouchers_v2',
};

// Safe LocalStorage helpers
function readStorage(key, defaultValue = []) {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key}:`, e);
    return defaultValue;
  }
}

function writeStorage(key, value) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key}:`, e);
  }
}

// -------------------------------------------------------------
// 0. SUPABASE CLOUD SYNCHRONIZATION ENGINE
// -------------------------------------------------------------
export async function pushErpMetaToCloud() {
  if (typeof window === 'undefined') return;
  try {
    const groups = readStorage(ERP_STORAGE_KEYS.GROUPS, []);
    const hotelVouchers = readStorage(ERP_STORAGE_KEYS.HOTEL_VOUCHERS, []);
    const estimates = readStorage(ERP_STORAGE_KEYS.ESTIMATES, []);
    const invoices = readStorage(ERP_STORAGE_KEYS.INVOICES, []);
    const tasks = readStorage(ERP_STORAGE_KEYS.TASKS, []);
    const auditLogs = readStorage(ERP_STORAGE_KEYS.AUDIT_LOGS, []);
    const hotels = readStorage(ERP_STORAGE_KEYS.HOTELS, null);

    const payload = {
      id: 'neh_erp_cloud_sync',
      slug: 'neh-erp-cloud-sync',
      party: 'NEH ERP CLOUD SYNC STATE',
      sheet_name: 'ERP Cloud Sync Record',
      accommodations: hotelVouchers,
      transports: estimates,
      flights: invoices,
      passengers: { tasks, auditLogs, groups, hotels: hotels || DEFAULT_REGISTERED_HOTELS },
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('vouchers').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('pushErpMetaToCloud warning:', error);
    }
  } catch (err) {
    console.warn('pushErpMetaToCloud exception:', err);
  }
}

export async function fetchErpCloudData() {
  if (typeof window === 'undefined') return null;

  try {
    const { data: rows, error } = await supabase.from('vouchers').select('*');
    if (error) {
      console.warn('Supabase fetchErpCloudData error:', error);
      return null;
    }

    if (!rows || rows.length === 0) return null;

    // 1. Process ERP meta sync record (id = 'neh_erp_cloud_sync')
    const syncRow = rows.find(r => r.id === 'neh_erp_cloud_sync');
    let hotelVouchers = [];
    let estimates = [];
    let invoices = [];
    let tasks = [];
    let auditLogs = [];

    if (syncRow) {
      if (Array.isArray(syncRow.accommodations) && syncRow.accommodations.length > 0) {
        hotelVouchers = syncRow.accommodations;
        writeStorage(ERP_STORAGE_KEYS.HOTEL_VOUCHERS, hotelVouchers);
      }
      if (Array.isArray(syncRow.transports) && syncRow.transports.length > 0) {
        estimates = syncRow.transports;
        writeStorage(ERP_STORAGE_KEYS.ESTIMATES, estimates);
      }
      if (Array.isArray(syncRow.flights) && syncRow.flights.length > 0) {
        invoices = syncRow.flights;
        writeStorage(ERP_STORAGE_KEYS.INVOICES, invoices);
      }
      if (syncRow.passengers) {
        if (Array.isArray(syncRow.passengers)) {
          tasks = syncRow.passengers;
        } else if (typeof syncRow.passengers === 'object') {
          tasks = Array.isArray(syncRow.passengers.tasks) ? syncRow.passengers.tasks : [];
          auditLogs = Array.isArray(syncRow.passengers.auditLogs) ? syncRow.passengers.auditLogs : [];
          if (syncRow.passengers.hotels && typeof syncRow.passengers.hotels === 'object') {
            writeStorage(ERP_STORAGE_KEYS.HOTELS, syncRow.passengers.hotels);
          }
        }
        if (tasks.length > 0) writeStorage(ERP_STORAGE_KEYS.TASKS, tasks);
        if (auditLogs.length > 0) writeStorage(ERP_STORAGE_KEYS.AUDIT_LOGS, auditLogs);
      }
    }

    // 2. Process real party manifest rows (all rows except syncRow)
    const partyRows = rows.filter(r => r.id !== 'neh_erp_cloud_sync' && r.party);
    const cloudParties = partyRows.map((r, idx) => {
      const uid = r.id || `PHU-${String(idx + 1).padStart(4, '0')}`;
      const passengers = (Array.isArray(r.passengers) ? r.passengers : []).map((p, pIdx) => ({
        id: p.id || `pax-${uid}-${pIdx + 1}`,
        sNo: p.sNo || String(pIdx + 1),
        name: p.name || 'Unnamed Pilgrim',
        prefix: p.prefix || 'MR',
        passportNo: p.passportNo || '',
        dob: p.dob || '',
        gender: p.gender || 'M',
        category: p.category || (p.prefix === 'CHD' ? 'Child' : p.prefix === 'INF' ? 'Infant' : 'Adult'),
        hasBed: p.hasBed !== false,
        visaNo: p.visaNo || '',
        relationship: p.relationship || (pIdx === 0 ? 'Head of Family' : 'Family Member'),
        groupNo: p.groupNo || 'GRP-1',
        contactPhone: p.contactPhone || r.phone || '',
      }));

      return {
        partyHeadUid: uid,
        voucherRefNo: r.ub_number || r.voucher_ref_no || `UB-${String(idx + 1).padStart(4, '0')}`,
        partyName: r.party || 'Unnamed Group',
        companyName: r.company_name || 'NOOR E HARAM TRAVELS & TOURS',
        contactPhone: r.phone || '0311-2264567',
        backupPhone: '0312-8039911',
        totalPax: r.total_pax || passengers.length || 1,
        isSelfVisa: r.is_self_visa !== false,
        packageTitle: r.voucher_title || 'Umrah Package',
        status: 'Active Operations',
        createdAt: r.created_at || new Date().toISOString(),
        updatedAt: r.updated_at || new Date().toISOString(),
        passengers,
        accommodations: Array.isArray(r.accommodations) ? r.accommodations : [],
        transports: Array.isArray(r.transports) ? r.transports : [],
        flights: Array.isArray(r.flights) ? r.flights : [],
        transportHelpline: r.pakistan_helpline || '0311-2264567',
      };
    });

    // Merge cloud parties with local parties
    const localParties = readStorage(ERP_STORAGE_KEYS.PARTIES, []);
    let finalParties = [...cloudParties];

    // Only retain locally created parties if not in cloud and not duplicate of existing party
    localParties.forEach(lp => {
      const existsInCloud = finalParties.some(cp => cp.partyHeadUid === lp.partyHeadUid);
      const lpNorm = (lp.partyName || '').trim().replace(/^MR\s+/i, '').replace(/^MRS\s+/i, '').replace(/^MS\s+/i, '').trim().toUpperCase();
      const sameNameInCloud = finalParties.some(cp => 
        (cp.partyName || '').trim().replace(/^MR\s+/i, '').replace(/^MRS\s+/i, '').replace(/^MS\s+/i, '').trim().toUpperCase() === lpNorm
      );
      if (!existsInCloud && !sameNameInCloud && !lp.partyHeadUid.startsWith('PHU-0012')) {
        finalParties.push(lp);
        saveParty(lp);
      }
    });

    writeStorage(ERP_STORAGE_KEYS.PARTIES, finalParties);

    // If meta sync row was empty, populate from defaults and push
    if (hotelVouchers.length === 0) {
      hotelVouchers = getAllHotelVouchers();
      pushErpMetaToCloud();
    }
    if (estimates.length === 0) {
      estimates = getAllEstimates();
      pushErpMetaToCloud();
    }
    if (invoices.length === 0) {
      invoices = getAllInvoices();
    }
    if (tasks.length === 0) {
      tasks = getAllTasks();
    }
    if (auditLogs.length === 0) {
      auditLogs = getAllAuditLogs();
    }

    return {
      parties: finalParties,
      hotelVouchers,
      estimates,
      invoices,
      tasks,
      auditLogs,
    };
  } catch (err) {
    console.error('fetchErpCloudData error:', err);
    return null;
  }
}

// -------------------------------------------------------------
// 1. DATA LINKAGE: Bridge Existing Transport Vouchers into Parties
// -------------------------------------------------------------
export function initializeErpParties() {
  const existingParties = readStorage(ERP_STORAGE_KEYS.PARTIES, null);
  if (existingParties && existingParties.length > 0) {
    return existingParties;
  }

  // Synthesize initial parties from existing vouchers in the system
  const vouchers = getAllVouchers();
  const synthesizedParties = vouchers.map((v, idx) => {
    const uid = `PHU-${String(v.id || idx + 1).padStart(4, '0')}`;
    const cleanParty = v.party || `Group ${idx + 1}`;

    // Convert passengers
    const passengers = (v.passengers || []).map((p, pIdx) => ({
      id: `pax-${uid}-${pIdx + 1}`,
      sNo: p.sNo || String(pIdx + 1),
      name: p.name || 'Unnamed Pilgrim',
      prefix: p.prefix || 'MR',
      passportNo: p.passportNo || `PK${Math.floor(1000000 + Math.random() * 9000000)}`,
      dob: p.dob || '1985-05-15',
      gender: p.gender || 'M',
      category: p.category || (p.prefix === 'CHD' ? 'Child' : p.prefix === 'INF' ? 'Infant' : 'Adult'),
      hasBed: p.hasBed !== false,
      visaNo: p.visaNo || `617${Math.floor(1000000 + Math.random() * 9000000)}`,
      groupNo: p.groupNo || 'GRP-A',
      contactPhone: p.contactPhone || p.passengerPhone || '',
    }));

    // Multi-Stay Hotel accommodations
    const accommodations = (v.accommodations || []).map((a, aIdx) => ({
      id: `hotel-${uid}-${aIdx + 1}`,
      city: a.city || (aIdx === 0 ? 'Makkah' : 'Medinah'),
      hotelName: a.hotelName || (aIdx === 0 ? 'VOCO 5 STAR' : 'GULNAR HV'),
      distance: a.distance || (aIdx === 0 ? '850m from Haram' : '150m from Nabawi'),
      checkIn: a.checkIn || '2026-10-10',
      checkOut: a.checkOut || '2026-10-18',
      nights: a.nights || 8,
      roomType: a.roomType || 'QUAD',
      roomsCount: a.roomsCount || 1,
      mealPlan: a.meal || 'RO',
      hcn: a.hcn || `HCN-${Math.floor(100000 + Math.random() * 900000)}`,
      bookingRef: `BK-${uid}-${aIdx + 1}`,
      hotelPhone: a.city === 'Medinah' ? '+966 57 593 0550' : '+966 53 649 2846',
    }));

    return {
      partyHeadUid: uid,
      voucherRefNo: v.ubNumber || v.voucherRefNo || `UB-${String(idx + 1).padStart(4, '0')}`,
      partyName: cleanParty,
      companyName: v.companyName || 'NOOR E HARAM TRAVELS & TOURS',
      contactPhone: v.passengerPhone || v.customerPhone || '',
      backupPhone: '',
      totalPax: passengers.length || v.totalPax || 1,
      isSelfVisa: v.isSelfVisa !== false,
      packageTitle: v.voucherTitle || '18 Standard Umrah',
      status: 'Active Operations',
      createdAt: v.voucherDate || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      passengers,
      accommodations,
      transports: v.transports || [],
      flights: v.flights || [],
      transportHelpline: v.pakistanHelpline || 'UBAID RAZA MEMON 0311-2264567 / BACKUP: MADNI RAZA MEMON 0312-8039911',
    };
  });

  // Seed default demo parties if list was empty
  if (synthesizedParties.length === 0) {
    synthesizedParties.push({
      partyHeadUid: 'PHU-0001',
      voucherRefNo: 'UB-0001',
      partyName: 'ABDUL KARIM',
      companyName: 'NOOR E HARAM TRAVELS & TOURS',
      contactPhone: '',
      backupPhone: '',
      totalPax: 2,
      isSelfVisa: true,
      packageTitle: '21 Days Premium Umrah Package',
      status: 'Active Operations',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      passengers: [
        { id: 'pax-1', sNo: '1', name: 'ABDUL KARIM', prefix: 'MR', passportNo: 'PK9928172', dob: '1978-02-14', gender: 'M', category: 'Adult', hasBed: true, visaNo: '6178829102', groupNo: 'GRP-1', contactPhone: '' },
        { id: 'pax-2', sNo: '2', name: 'HAJRA KARIM', prefix: 'MRS', passportNo: 'PK9928173', dob: '1982-08-20', gender: 'F', category: 'Adult', hasBed: true, visaNo: '6178829103', groupNo: 'GRP-1', contactPhone: '' }
      ],
      accommodations: [
        { id: 'hotel-1', city: 'Makkah', hotelName: 'VOCO 5 STAR', checkIn: '2026-10-10', checkOut: '2026-10-18', nights: 8, roomType: 'DOUBLE', roomsCount: 1, mealPlan: 'BB', hcn: 'HCN-982711', bookingRef: 'BK-MAK-01', hotelPhone: '+966 53 649 2846' },
        { id: 'hotel-2', city: 'Medinah', hotelName: 'GULNAR HV', checkIn: '2026-10-18', checkOut: '2026-10-27', nights: 9, roomType: 'DOUBLE', roomsCount: 1, mealPlan: 'RO', hcn: 'HCN-982712', bookingRef: 'BK-MED-01', hotelPhone: '+966 57 593 0550' }
      ],
      transports: [
        { date: '2026-10-10', service: 'JED AIRPORT TO MAKKAH HOTEL', transporter: 'Private Transport', vehicleType: 'STARIA' },
        { date: '2026-10-18', service: 'MAKKAH HOTEL TO MADINAH HOTEL', transporter: 'Private Transport', vehicleType: 'STARIA' },
        { date: '2026-10-27', service: 'MADINAH HOTEL TO MADINAH AIRPORT', transporter: 'Private Transport', vehicleType: 'STARIA' }
      ],
      flights: [
        { type: 'Departure', date: '2026-10-10', flight: 'FZ-831', sector: 'DXB-JED', departure: '04:50', arrival: '06:50', pnr: 'GDXHMK' },
        { type: 'Return', date: '2026-10-27', flight: 'FZ-898', sector: 'MED-DXB', departure: '04:00', arrival: '07:30', pnr: 'GDXHMK' }
      ],
      transportHelpline: 'UBAID RAZA MEMON 0311-2264567 / BACKUP: MADNI RAZA MEMON 0312-8039911',
    });
  }

  writeStorage(ERP_STORAGE_KEYS.PARTIES, synthesizedParties);
  seedInitialEstimatesAndInvoices(synthesizedParties);
  seedInitialTasks(synthesizedParties);
  return synthesizedParties;
}

export function isAgencyPhone(str) {
  if (!str) return false;
  const s = String(str).toUpperCase();
  return (
    s.includes('UBAID') ||
    s.includes('MADNI') ||
    s.includes('FAIZAN') ||
    s.includes('MURTAZA') ||
    s.includes('2264567') ||
    s.includes('2324764') ||
    s.includes('3608683') ||
    s.includes('3138424') ||
    s.includes('8039911') ||
    s.includes('CHEEPA') ||
    s.includes('NOOR E HARAM')
  );
}

export function assignFidToParties(partiesList) {
  if (!Array.isArray(partiesList)) return partiesList;
  let updatedAny = false;

  // Deduplicate unused parties: If multiple parties have the same name (e.g. JALAAL HASSAN), keep the one with a real voucher (UB-0008) and discard the unused duplicate
  const seenNorms = new Map();
  const deduped = [];
  for (const p of partiesList) {
    const norm = (p.partyName || '').trim().replace(/^MR\s+/i, '').replace(/^MRS\s+/i, '').replace(/^MS\s+/i, '').trim().toUpperCase();
    if (!norm) {
      deduped.push(p);
      continue;
    }
    const hasVoucher = Boolean(p.voucherRefNo && !p.voucherRefNo.startsWith('FID-') && p.voucherRefNo.startsWith('UB-'));
    if (seenNorms.has(norm)) {
      const existing = seenNorms.get(norm);
      const existingHasVoucher = Boolean(existing.voucherRefNo && !existing.voucherRefNo.startsWith('FID-') && existing.voucherRefNo.startsWith('UB-'));
      if (hasVoucher && !existingHasVoucher) {
        const idx = deduped.indexOf(existing);
        if (idx !== -1) deduped[idx] = p;
        seenNorms.set(norm, p);
        updatedAny = true;
      } else {
        updatedAny = true;
      }
    } else {
      seenNorms.set(norm, p);
      deduped.push(p);
    }
  }
  partiesList = deduped;

  // Assign clean sequence-wise unique 3-digit FIDs: FID-001, FID-002, FID-003...
  partiesList.forEach((p, idx) => {
    const targetFid = `FID-${String(idx + 1).padStart(3, '0')}`;
    if (p.fid !== targetFid) {
      p.fid = targetFid;
      if (p.passengers && Array.isArray(p.passengers)) {
        p.passengers.forEach(pax => {
          pax.fid = targetFid;
        });
      }
      updatedAny = true;
    }

    // Auto-heal 'Unnamed Pilgrim' for party heads
    if (p.passengers && Array.isArray(p.passengers) && p.passengers.length > 0) {
      if ((!p.passengers[0].name || p.passengers[0].name.toLowerCase().includes('unnamed')) && p.partyName && !p.partyName.toLowerCase().includes('unnamed')) {
        p.passengers[0].name = p.partyName;
        updatedAny = true;
      }
    }

    // Strip duplicated prefix from partyName and passenger names (e.g. "MR JALAAL HASSAN" -> "JALAAL HASSAN")
    if (p.partyName && p.partyName.toUpperCase().startsWith('MR ')) {
      p.partyName = p.partyName.slice(3).trim();
      updatedAny = true;
    }
    if (p.passengers && Array.isArray(p.passengers)) {
      p.passengers.forEach((pax, pIdx) => {
        if (!pax.id) {
          pax.id = `pax-${p.partyHeadUid || (idx + 1)}-${pIdx + 1}`;
          updatedAny = true;
        }
        if (pax.prefix && pax.name && pax.name.toUpperCase().startsWith(`${pax.prefix.toUpperCase()} `)) {
          pax.name = pax.name.slice(pax.prefix.length).trim();
          updatedAny = true;
        }
        if (isAgencyPhone(pax.contactPhone)) {
          pax.contactPhone = '';
          updatedAny = true;
        }
      });
    }

    // Clean agency helpline mistakenly copied as passenger phone
    if (isAgencyPhone(p.contactPhone)) {
      p.contactPhone = '';
      updatedAny = true;
    }
    if (isAgencyPhone(p.backupPhone)) {
      p.backupPhone = '';
      updatedAny = true;
    }
  });

  if (updatedAny && typeof window !== 'undefined') {
    writeStorage(ERP_STORAGE_KEYS.PARTIES, partiesList);
  }

  return partiesList;
}

export function getNextFidNumber() {
  const parties = readStorage(ERP_STORAGE_KEYS.PARTIES, []);
  if (!parties || parties.length === 0) return '001';
  return String(parties.length + 1).padStart(3, '0');
}

export function getAllParties() {
  const parties = readStorage(ERP_STORAGE_KEYS.PARTIES, []);
  if (!parties || parties.length === 0) {
    const initialized = initializeErpParties();
    return assignFidToParties(initialized);
  }
  return assignFidToParties(parties);
}

export function getPartyByUid(partyHeadUid) {
  if (!partyHeadUid) return null;
  const list = getAllParties();
  return list.find(p => p.partyHeadUid === partyHeadUid || p.fid === partyHeadUid || p.voucherRefNo === partyHeadUid || p.partyName.toLowerCase() === partyHeadUid.toLowerCase()) || null;
}

export function saveParty(partyData) {
  const list = getAllParties();
  const uid = partyData.partyHeadUid || `PHU-${String(list.length + 1).padStart(4, '0')}`;
  const now = new Date().toISOString();

  let fid = partyData.fid;
  if (!fid) {
    fid = `FID-${getNextFidNumber()}`;
  } else if (!fid.startsWith('FID-')) {
    fid = `FID-${fid}`;
  }

  const record = {
    ...partyData,
    partyHeadUid: uid,
    fid,
    updatedAt: now,
    createdAt: partyData.createdAt || now,
    totalPax: (partyData.passengers || []).length || partyData.totalPax || 1,
  };

  const idx = list.findIndex(p => p.partyHeadUid === uid || (p.fid && p.fid === fid));
  if (idx !== -1) {
    list[idx] = record;
  } else {
    list.push(record);
  }

  writeStorage(ERP_STORAGE_KEYS.PARTIES, list);
  logAuditAction('PARTY_UPSERT', `Updated Family ${fid} (${record.partyName})`, { partyHeadUid: uid, fid, name: record.partyName });

  // Async sync to Supabase Cloud Database & Transport Portal
  if (typeof window !== 'undefined') {
    const row = {
      id: record.partyHeadUid,
      slug: slugify(record.partyName) || ('party-' + Date.now()),
      party: record.partyName,
      sheet_name: `Party - ${record.partyName}`,
      ub_number: record.voucherRefNo || record.partyHeadUid,
      voucher_ref_no: record.voucherRefNo || record.partyHeadUid,
      company_name: record.companyName || 'NOOR E HARAM TRAVELS & TOURS',
      phone: record.contactPhone || '',
      voucher_title: record.packageTitle || 'Umrah Package',
      total_pax: record.totalPax || (record.passengers?.length || 1),
      passengers: record.passengers || [],
      accommodations: record.accommodations || [],
      transports: record.transports || [],
      flights: record.flights || [],
      pakistan_helpline: record.transportHelpline || '',
      updated_at: now,
    };

    // 1. Only sync to Supabase vouchers table IF this party is linked to an actual voucher (do NOT auto-create)
    const isActualVoucher = record.voucherRefNo && !record.voucherRefNo.startsWith('FID-') && !record.partyHeadUid.startsWith('PHU-');
    if (isActualVoucher) {
      supabase.from('vouchers').update({
        party: record.partyName,
        total_pax: record.totalPax || (record.passengers?.length || 1),
        passengers: record.passengers || [],
        updated_at: now,
      }).eq('id', record.partyHeadUid).then(({ error }) => {
        if (error) console.warn('Supabase party sync warning:', error);
      });
    }

    // 2. Only update custom_vouchers if the voucher already existed (do NOT auto-create)
    try {
      const rawCustom = localStorage.getItem('custom_vouchers');
      if (rawCustom) {
        let customList = JSON.parse(rawCustom);
        const vIdx = customList.findIndex(v => 
          (v.id === record.partyHeadUid || v.voucherRefNo === record.voucherRefNo || v.ubNumber === record.voucherRefNo) &&
          !String(v.id).startsWith('PHU-') && !(v.voucherRefNo || '').startsWith('FID-')
        );
        if (vIdx !== -1) {
          customList[vIdx] = {
            ...customList[vIdx],
            party: record.partyName,
            totalPax: record.totalPax,
            passengers: record.passengers || [],
            updatedAt: now,
          };
          localStorage.setItem('custom_vouchers', JSON.stringify(customList));
        }
      }
    } catch (e) {
      console.warn('Sync custom_vouchers error:', e);
    }

    // 3. Sync to voucher_overrides
    try {
      const rawOverrides = localStorage.getItem('voucher_overrides');
      let overrides = rawOverrides ? JSON.parse(rawOverrides) : {};
      const keysToMatch = [
        (record.partyHeadUid || '').toLowerCase(),
        (record.voucherRefNo || '').toLowerCase(),
        (row.slug || '').toLowerCase(),
        slugify(record.partyName || '').toLowerCase(),
      ].filter(Boolean);

      let updatedAny = false;
      for (const k of Object.keys(overrides)) {
        const item = overrides[k];
        if (
          keysToMatch.includes(k.toLowerCase()) ||
          item?.id === record.partyHeadUid ||
          item?.voucherRefNo === record.voucherRefNo ||
          item?.ubNumber === record.voucherRefNo
        ) {
          overrides[k] = {
            ...item,
            party: record.partyName,
            totalPax: record.totalPax,
            passengers: record.passengers || [],
            updatedAt: now,
          };
          updatedAny = true;
        }
      }
      if (!updatedAny && record.partyHeadUid) {
        overrides[record.partyHeadUid.toLowerCase()] = {
          party: record.partyName,
          totalPax: record.totalPax,
          passengers: record.passengers || [],
          updatedAt: now,
        };
      }
      localStorage.setItem('voucher_overrides', JSON.stringify(overrides));
    } catch (e) { }
  }

  return record;
}

export function deleteParty(partyHeadUid) {
  const list = getAllParties();
  const partyToDelete = list.find(p => p.partyHeadUid === partyHeadUid);
  const filtered = list.filter(p => p.partyHeadUid !== partyHeadUid);
  writeStorage(ERP_STORAGE_KEYS.PARTIES, filtered);
  logAuditAction('PARTY_DELETE', 'Deleted Party Group Manifest', { partyHeadUid });

  // Async delete from Supabase & Transport Portal local caches
  if (typeof window !== 'undefined') {
    // 1. Delete from Supabase
    supabase.from('vouchers').delete().eq('id', partyHeadUid).then(({ error }) => {
      if (error) console.warn('Supabase party delete warning:', error);
    });

    // 2. Remove from local custom_vouchers in Transport Portal
    try {
      const rawCustom = localStorage.getItem('custom_vouchers');
      if (rawCustom) {
        let customList = JSON.parse(rawCustom);
        const partySlug = partyToDelete?.partyName ? slugify(partyToDelete.partyName).toLowerCase() : '';
        customList = customList.filter(v =>
          v.id !== partyHeadUid &&
          v.voucherRefNo !== partyToDelete?.voucherRefNo &&
          v.ubNumber !== partyToDelete?.voucherRefNo &&
          (!partySlug || (v.slug || '').toLowerCase() !== partySlug)
        );
        localStorage.setItem('custom_vouchers', JSON.stringify(customList));
      }
    } catch (e) { }

    // 3. Remove from voucher_overrides
    try {
      const rawOverrides = localStorage.getItem('voucher_overrides');
      if (rawOverrides) {
        let overrides = JSON.parse(rawOverrides);
        const keysToRemove = [
          (partyHeadUid || '').toLowerCase(),
          (partyToDelete?.voucherRefNo || '').toLowerCase(),
          (partyToDelete?.partyName ? slugify(partyToDelete.partyName).toLowerCase() : ''),
        ].filter(Boolean);

        for (const k of Object.keys(overrides)) {
          const item = overrides[k];
          if (
            keysToRemove.includes(k.toLowerCase()) ||
            item?.id === partyHeadUid ||
            item?.voucherRefNo === partyToDelete?.voucherRefNo ||
            item?.ubNumber === partyToDelete?.voucherRefNo
          ) {
            delete overrides[k];
          }
        }
        localStorage.setItem('voucher_overrides', JSON.stringify(overrides));
      }
    } catch (e) { }
  }

  return filtered;
}

export function checkPassengerDependencies(paxIds) {
  if (!Array.isArray(paxIds) || paxIds.length === 0) return [];
  const list = getAllParties();
  const hotelVouchers = getAllHotelVouchers();
  const invoices = getAllInvoices();
  const estimates = getAllEstimates();

  const blocked = [];

  paxIds.forEach(paxId => {
    let foundPax = null;
    let foundParty = null;
    let isHead = false;

    for (const party of list) {
      const idx = (party.passengers || []).findIndex(p => p.id === paxId);
      if (idx !== -1) {
        foundPax = party.passengers[idx];
        foundParty = party;
        isHead = idx === 0;
        break;
      }
    }

    if (!foundPax) return;

    const paxName = (foundPax.name || '').trim().toUpperCase();
    const passportNo = (foundPax.passportNo || '').trim().toUpperCase();
    const partyUid = foundParty.partyHeadUid;
    const voucherRefNo = foundParty.voucherRefNo || partyUid;
    const deps = [];

    // 1. Check in Hotel Vouchers (Module B)
    hotelVouchers.forEach(hv => {
      const matchInPax = (hv.passengers || []).some(hp =>
        hp.id === paxId ||
        (paxName && hp.name && hp.name.trim().toUpperCase() === paxName) ||
        (passportNo && hp.passportNo && hp.passportNo.trim().toUpperCase() === passportNo)
      );
      const matchParty = isHead && (hv.partyHeadUid === partyUid || (hv.partyName && hv.partyName.trim().toUpperCase() === paxName));

      if (matchInPax || matchParty) {
        const hotelSummary = (hv.stays || []).map(s => s.hotelName).filter(Boolean).join(' / ') || 'Multi-Stay Accommodations';
        deps.push({
          type: 'Hotel Voucher',
          label: `Hotel Voucher #${hv.voucherNo || hv.id}`,
          detail: hotelSummary,
          refId: hv.id || hv.voucherNo,
        });
      }
    });

    // 2. Check in Transport Vouchers (Module E / Ground Services)
    if (foundParty.transports && foundParty.transports.length > 0) {
      const serviceSummary = foundParty.transports.map(t => t.service || t.description).filter(Boolean).slice(0, 2).join(', ');
      deps.push({
        type: 'Transport Voucher',
        label: `Transport Voucher #${voucherRefNo}`,
        detail: `${foundParty.transports.length} service(s)${serviceSummary ? ` (${serviceSummary})` : ''}`,
        refId: voucherRefNo,
      });
    }

    // Also check in custom_vouchers (Transport Vouchers portal)
    try {
      const rawCustom = typeof window !== 'undefined' ? localStorage.getItem('custom_vouchers') : null;
      if (rawCustom) {
        const customList = JSON.parse(rawCustom);
        if (Array.isArray(customList)) {
          customList.forEach(cv => {
            const cvMatchPax = (cv.passengers || []).some(cp =>
              cp.id === paxId ||
              (paxName && cp.name && cp.name.trim().toUpperCase() === paxName) ||
              (passportNo && cp.passportNo && cp.passportNo.trim().toUpperCase() === passportNo)
            );
            const cvMatchParty = isHead && (
              (cv.party && cv.party.trim().toUpperCase() === paxName) ||
              cv.ubNumber === voucherRefNo ||
              cv.voucherRefNo === voucherRefNo
            );
            if (cvMatchPax || cvMatchParty) {
              const cvUb = cv.ubNumber || cv.voucherRefNo || cv.id || voucherRefNo;
              deps.push({
                type: 'Transport Voucher',
                label: `Transport Voucher #${cvUb}`,
                detail: cv.voucherTitle || 'Umrah Transport Voucher',
                refId: cv.id || cvUb,
              });
            }
          });
        }
      }
    } catch (e) { }

    // 3. Check in Bills / Invoices & Ledger (Module D)
    invoices.forEach(inv => {
      const matchParty = inv.partyHeadUid === partyUid || (inv.partyName && inv.partyName.trim().toUpperCase() === paxName);
      if (matchParty && (Number(inv.totalAmount) > 0 || (inv.ledgerTransactions && inv.ledgerTransactions.length > 0))) {
        deps.push({
          type: 'Bill / Invoice',
          label: `Invoice #${inv.invoiceNo || inv.id}`,
          detail: `${inv.currency || 'PKR'} ${Number(inv.totalAmount).toLocaleString()} (${inv.status || 'Active'})`,
          refId: inv.id || inv.invoiceNo,
        });
      }
    });

    // 4. Check in Pre-Sales Package Estimates (Module C)
    estimates.forEach(est => {
      const matchParty = est.partyHeadUid === partyUid || (est.partyName && est.partyName.trim().toUpperCase() === paxName);
      if (matchParty && isHead) {
        deps.push({
          type: 'Package Cost Estimate',
          label: `Estimate #${est.estimateNo || est.id}`,
          detail: est.packageDuration || 'Cost Quotation',
          refId: est.id || est.estimateNo,
        });
      }
    });

    if (deps.length > 0) {
      const uniqueDeps = [];
      const seenLabels = new Set();
      deps.forEach(d => {
        if (!seenLabels.has(d.label)) {
          seenLabels.add(d.label);
          uniqueDeps.push(d);
        }
      });

      const locationsText = uniqueDeps.map(d => d.label).join(', ');
      blocked.push({
        paxId,
        paxName: foundPax.name || 'Passenger',
        passportNo: foundPax.passportNo || '',
        parentPartyName: foundParty.partyName,
        voucherRefNo,
        isHead,
        dependencies: uniqueDeps,
        errorMessage: `the passenger name can't be deleted as it is currently using in ${locationsText}, first remove the name from there`,
      });
    }
  });

  return blocked;
}

export function deletePassenger(partyHeadUid, paxId) {
  return deletePassengers(partyHeadUid, [paxId]);
}

export function deletePassengers(partyHeadUid, paxIds) {
  const list = getAllParties();
  const party = list.find(p => p.partyHeadUid === partyHeadUid);
  if (!party) return list;
  const idsSet = new Set(paxIds.map(String));
  let remainingPax = (party.passengers || []).filter((p, idx) => 
    !idsSet.has(String(p.id)) && !idsSet.has(`pax-${partyHeadUid}-${idx + 1}`)
  );

  if (remainingPax.length === 0) {
    return deleteParty(partyHeadUid);
  }

  // Re-index serial numbers cleanly
  remainingPax = remainingPax.map((p, idx) => ({
    ...p,
    sNo: String(idx + 1),
    relationship: idx === 0 ? 'Head of Family' : (p.relationship === 'Head of Family' || p.relationship === 'Family Head / Lead Pilgrim' ? 'Family Member' : p.relationship),
  }));

  party.passengers = remainingPax;
  party.totalPax = remainingPax.length;

  // If previous family head was removed, re-anchor party head to the first remaining passenger
  if (party.passengers.length > 0 && party.partyName !== party.passengers[0].name) {
    party.partyName = party.passengers[0].name;
  }

  writeStorage(ERP_STORAGE_KEYS.PARTIES, list);
  logAuditAction('PASSENGER_DELETE', `Removed ${paxIds.length} pilgrim(s) from manifest`, { partyHeadUid, count: paxIds.length });

  // Re-sync party to Supabase with updated passenger manifest
  saveParty(party);

  return list;
}

export function updatePassenger(partyHeadUid, paxId, updatedPaxData) {
  const list = getAllParties();
  const party = list.find(p => p.partyHeadUid === partyHeadUid);
  if (!party) return list;

  const paxIdx = (party.passengers || []).findIndex(p => p.id === paxId);
  if (paxIdx === -1) return list;

  const oldPax = party.passengers[paxIdx];
  const cleanName = (updatedPaxData.name || oldPax.name || '').trim().toUpperCase();
  const cleanPassport = (updatedPaxData.passportNo !== undefined ? updatedPaxData.passportNo : (oldPax.passportNo || '')).trim().toUpperCase();
  const cleanVisa = (updatedPaxData.visaNo !== undefined ? updatedPaxData.visaNo : (oldPax.visaNo || '')).trim();

  const mergedPax = {
    ...oldPax,
    ...updatedPaxData,
    id: paxId,
    sNo: oldPax.sNo || String(paxIdx + 1),
    name: cleanName,
    passportNo: cleanPassport,
    visaNo: cleanVisa,
    prefix: updatedPaxData.prefix || oldPax.prefix || 'MR',
    gender: updatedPaxData.gender || oldPax.gender || (updatedPaxData.prefix === 'MRS' || updatedPaxData.prefix === 'MS' ? 'F' : 'M'),
    category: updatedPaxData.category || oldPax.category || 'Adult',
    hasBed: updatedPaxData.hasBed !== undefined ? Boolean(updatedPaxData.hasBed) : (oldPax.hasBed !== false),
    relationship: updatedPaxData.relationship || oldPax.relationship || (paxIdx === 0 ? 'Head of Family' : 'Family Member'),
    dob: updatedPaxData.dob !== undefined ? updatedPaxData.dob : (oldPax.dob || ''),
  };

  party.passengers[paxIdx] = mergedPax;

  // If this passenger is the Lead Pilgrim (index 0), re-anchor partyName so family name matches
  if (paxIdx === 0 && cleanName && cleanName !== party.partyName) {
    party.partyName = cleanName;
  }

  writeStorage(ERP_STORAGE_KEYS.PARTIES, list);
  logAuditAction('PASSENGER_UPDATE', `Updated passenger details for ${cleanName} (${cleanPassport || 'No Passport'})`, { partyHeadUid, paxId });

  // 1. Re-sync party to Supabase and Transport Voucher caches (custom_vouchers, voucher_overrides)
  saveParty(party);

  // 2. Also sync to Hotel Vouchers cache
  try {
    const hotelVouchers = readStorage(ERP_STORAGE_KEYS.HOTEL_VOUCHERS, []);
    let hotelModified = false;
    const updatedHotelVouchers = hotelVouchers.map(hv => {
      if (hv.partyHeadUid === partyHeadUid) {
        hotelModified = true;
        const updatedHotelPax = (hv.passengers || []).map(hp => {
          if (hp.id === paxId) {
            return { ...hp, ...mergedPax };
          }
          return hp;
        });
        return {
          ...hv,
          partyName: party.partyName,
          passengers: updatedHotelPax,
        };
      }
      return hv;
    });
    if (hotelModified) {
      writeStorage(ERP_STORAGE_KEYS.HOTEL_VOUCHERS, updatedHotelVouchers);
    }
  } catch (e) {
    console.warn('Sync hotel voucher on passenger edit error:', e);
  }

  // 3. Also sync Estimates and Invoices if partyName changed
  try {
    const estimates = readStorage(ERP_STORAGE_KEYS.ESTIMATES, []);
    let estModified = false;
    const updatedEst = estimates.map(est => {
      if (est.partyHeadUid === partyHeadUid) {
        estModified = true;
        return { ...est, partyName: party.partyName };
      }
      return est;
    });
    if (estModified) writeStorage(ERP_STORAGE_KEYS.ESTIMATES, updatedEst);

    const invoices = readStorage(ERP_STORAGE_KEYS.INVOICES, []);
    let invModified = false;
    const updatedInv = invoices.map(inv => {
      if (inv.partyHeadUid === partyHeadUid) {
        invModified = true;
        return { ...inv, partyName: party.partyName };
      }
      return inv;
    });
    if (invModified) writeStorage(ERP_STORAGE_KEYS.INVOICES, updatedInv);
  } catch (e) { }

  return list;
}

// -------------------------------------------------------------
// 2. MODULE B: Multi-Stay Hotel Vouchers Engine
// -------------------------------------------------------------
export function getAllHotelVouchers() {
  const vouchers = readStorage(ERP_STORAGE_KEYS.HOTEL_VOUCHERS, []);
  if (vouchers.length === 0) {
    // Generate from existing parties
    const parties = getAllParties();
    const seeded = parties.map(p => {
      const hotelId = `HV-${p.voucherRefNo || p.partyHeadUid}`;
      return {
        id: hotelId,
        voucherNo: hotelId,
        partyHeadUid: p.partyHeadUid,
        partyName: p.partyName,
        companyName: p.companyName || 'NOOR E HARAM TRAVELS & TOURS',
        totalPax: p.totalPax,
        passengers: p.passengers || [],
        stays: p.accommodations || [],
        issueDate: p.createdAt ? p.createdAt.split('T')[0] : '2026-10-08',
        specialInstructions: 'Hotel check-in standard is 14:00. Check-out is 12:00. Room keycards provided upon passport presentation.',
        urduComplianceText: [
          'ہوٹل اور پیکیج اس دستاویز میں لکھ دیا گیا ہے۔',
          'سفری سامان حرمین شریفین کی طرف لے جانا سعودی انتظامیہ کی طرف سے ممنوع ہے۔ خلاف ورزی پر جرمانہ ہوگا۔',
          'نشہ آور اشیاء کا لانا قانوناً ممنوع ہے، سعودیہ میں منشیات لے جانے کی سزا موت ہے۔',
          'حرمین شریفین کے اندر زمین پر گری پڑی چیز (پرس، موبائل فون یا کوئی قیمتی چیز) ہرگز نہ اٹھائیں۔',
          'ہوٹل سے چیک آؤٹ ٹائم دوپہر 2 بجے ہے۔ اس کے بعد اگلی Night چارج ہوگی، واؤچر کی 4 کاپیاں پاس رکھیں۔'
        ],
        emergencyHelpline: 'UBAID RAZA MEMON 0311-2264567 / BACKUP: MADNI RAZA MEMON 0312-8039911',
        status: 'Confirmed & Verified',
      };
    });
    writeStorage(ERP_STORAGE_KEYS.HOTEL_VOUCHERS, seeded);
    return seeded;
  }
  return vouchers;
}

export function getHotelVoucherById(id) {
  if (!id) return null;
  const list = getAllHotelVouchers();
  const normalized = id.toLowerCase().trim();
  return list.find(v => v.id.toLowerCase() === normalized || v.voucherNo.toLowerCase() === normalized || v.partyHeadUid.toLowerCase() === normalized) || null;
}

export function saveHotelVoucher(voucherData) {
  const list = getAllHotelVouchers();
  const id = voucherData.id || `HV-HTL-${Date.now().toString().slice(-6)}`;
  const record = {
    ...voucherData,
    id,
    voucherNo: voucherData.voucherNo || id,
    updatedAt: new Date().toISOString(),
  };

  const idx = list.findIndex(v => v.id === id);
  if (idx !== -1) {
    list[idx] = record;
  } else {
    list.unshift(record);
  }

  writeStorage(ERP_STORAGE_KEYS.HOTEL_VOUCHERS, list);
  logAuditAction('HOTEL_VOUCHER_SAVED', 'Generated Multi-Stay Hotel Voucher', { id, partyHeadUid: record.partyHeadUid });
  pushErpMetaToCloud();
  return record;
}

export function deleteHotelVoucher(id) {
  if (!id) return false;
  const list = getAllHotelVouchers();
  const normalized = id.toLowerCase().trim();
  const updated = list.filter(v =>
    v.id.toLowerCase() !== normalized &&
    (v.voucherNo || '').toLowerCase() !== normalized
  );
  writeStorage(ERP_STORAGE_KEYS.HOTEL_VOUCHERS, updated);
  logAuditAction('HOTEL_VOUCHER_DELETED', 'Deleted Hotel Voucher', { id });
  pushErpMetaToCloud();
  return updated;
}

// -------------------------------------------------------------
// 2B. MODULE: Dedicated Transport Voucher Engine (Only Transport)
// -------------------------------------------------------------
// DEDICATED TRANSPORT ONLY VOUCHERS STORAGE & MIGRATION
// -------------------------------------------------------------
export function getNextTransportVoucherNo(prefix = 'CTV-') {
  const vouchers = getAllTransportOnlyVouchers();
  const regex = new RegExp(`^${prefix}(\\d+)`, 'i');
  let max = 0;
  vouchers.forEach(v => {
    const code = v.voucherNo || v.id || '';
    const m = code.match(regex);
    if (m) {
      const num = parseInt(m[1], 10);
      if (num > max) max = num;
    }
  });
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

export function getAllTransportOnlyVouchers() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('neh_erp_transport_only_vouchers_v1');
    } catch (e) { }
  }
  const vouchers = readStorage(ERP_STORAGE_KEYS.TRANSPORT_ONLY_VOUCHERS, []);
  return vouchers;
}

export function getTransportOnlyVoucherById(id) {
  if (!id) return null;
  const list = getAllTransportOnlyVouchers();
  const normalized = id.toLowerCase().trim();
  return list.find(v =>
    (v.id || '').toLowerCase() === normalized ||
    (v.voucherNo || '').toLowerCase() === normalized ||
    (v.partyHeadUid && v.partyHeadUid.toLowerCase() === normalized)
  ) || null;
}

export function saveTransportOnlyVoucher(voucherData) {
  const list = getAllTransportOnlyVouchers();
  const id = voucherData.voucherNo || voucherData.id || getNextTransportVoucherNo('CTV-');
  const record = {
    ...voucherData,
    id,
    voucherNo: id,
    updatedAt: new Date().toISOString(),
  };

  const idx = list.findIndex(v => v.id.toLowerCase() === id.toLowerCase() || (v.voucherNo && v.voucherNo.toLowerCase() === id.toLowerCase()));
  if (idx !== -1) {
    list[idx] = record;
  } else {
    list.unshift(record);
  }

  writeStorage(ERP_STORAGE_KEYS.TRANSPORT_ONLY_VOUCHERS, list);
  logAuditAction('TRANSPORT_VOUCHER_SAVED', 'Generated Dedicated Transport Voucher', { id, customerName: record.customerName });
  pushErpMetaToCloud();
  return record;
}

export function deleteTransportOnlyVoucher(id) {
  if (!id) return false;
  const list = getAllTransportOnlyVouchers();
  const normalized = id.toLowerCase().trim();
  const updated = list.filter(v =>
    (v.id || '').toLowerCase() !== normalized &&
    (v.voucherNo || '').toLowerCase() !== normalized
  );
  writeStorage(ERP_STORAGE_KEYS.TRANSPORT_ONLY_VOUCHERS, updated);
  logAuditAction('TRANSPORT_VOUCHER_DELETED', 'Deleted Dedicated Transport Voucher', { id });
  pushErpMetaToCloud();
  return updated;
}

// -------------------------------------------------------------
// 2B. HOTEL MASTER REGISTRY (City-Grouped & Supabase Synced)
// -------------------------------------------------------------
export const DEFAULT_REGISTERED_HOTELS = {
  makkah: [
    'VOCO 5 STAR',
    'SWISSOTEL MAKKAH',
    'FAIRMONT CLOCK TOWER',
    'PULLMAN ZAMZAM',
    'AL SAFWAH ROYALE ORCHID',
    'DAR AL EIMAN GRAND',
    'MAKKAH TOWERS',
    'HILTON SUITES MAKKAH',
    'ANJUM HOTEL MAKKAH',
    'LE MERIDIEN TOWERS',
  ],
  medinah: [
    'GULNAR HV',
    'ANWAR AL MADINAH MOVENPICK',
    'DAR AL TAQWA',
    'INTERCONTINENTAL DAR AL IMAN',
    'PULLMAN ZAMZAM MADINA',
    'MADINAH HILTON',
    'RUVE AL MADINAH',
    'AL HARAM HOTEL',
    'ODST AL MADINAH',
    'SAJA AL MADINAH',
  ],
  jeddah: [
    'CLARION HOTEL JEDDAH AIRPORT',
    'RADISSON BLU JEDDAH',
    'INTERCONTINENTAL JEDDAH',
    'PRIME HOTEL JEDDAH',
  ],
};

export function normalizeCityKey(city = '') {
  const c = (city || '').toLowerCase().trim();
  if (c.includes('makkah')) return 'makkah';
  if (c.includes('madin') || c.includes('medin')) return 'medinah';
  if (c.includes('jeddah')) return 'jeddah';
  return c || 'makkah';
}

export function getRegisteredHotels() {
  const stored = readStorage(ERP_STORAGE_KEYS.HOTELS, null);
  if (!stored || typeof stored !== 'object') {
    writeStorage(ERP_STORAGE_KEYS.HOTELS, DEFAULT_REGISTERED_HOTELS);
    return DEFAULT_REGISTERED_HOTELS;
  }
  return {
    makkah: Array.isArray(stored.makkah) ? stored.makkah : DEFAULT_REGISTERED_HOTELS.makkah,
    medinah: Array.isArray(stored.medinah) ? stored.medinah : DEFAULT_REGISTERED_HOTELS.medinah,
    jeddah: Array.isArray(stored.jeddah) ? stored.jeddah : DEFAULT_REGISTERED_HOTELS.jeddah,
  };
}

export function addRegisteredHotel(city, rawHotelName) {
  const hotelName = (rawHotelName || '').trim().toUpperCase();
  if (!hotelName) return getRegisteredHotels();
  const cityKey = normalizeCityKey(city);
  const current = getRegisteredHotels();
  const list = current[cityKey] || [];

  const exists = list.some(h => h.trim().toUpperCase() === hotelName);
  if (!exists) {
    const updatedCityHotels = [...list, hotelName];
    const updatedMaster = { ...current, [cityKey]: updatedCityHotels };
    writeStorage(ERP_STORAGE_KEYS.HOTELS, updatedMaster);
    logAuditAction('HOTEL_REGISTERED', `Added new hotel "${hotelName}" to ${cityKey.toUpperCase()}`, { city: cityKey, hotelName });
    pushErpMetaToCloud();
    return updatedMaster;
  }
  return current;
}

export function updateRegisteredHotel(city, oldName, newName) {
  const cleanOld = (oldName || '').trim().toUpperCase();
  const cleanNew = (newName || '').trim().toUpperCase();
  if (!cleanOld || !cleanNew) return getRegisteredHotels();
  const cityKey = normalizeCityKey(city);
  const current = getRegisteredHotels();
  const list = current[cityKey] || [];

  const updatedCityHotels = list.map(h => h.trim().toUpperCase() === cleanOld ? cleanNew : h);
  const updatedMaster = { ...current, [cityKey]: updatedCityHotels };
  writeStorage(ERP_STORAGE_KEYS.HOTELS, updatedMaster);
  logAuditAction('HOTEL_UPDATED', `Renamed hotel from "${cleanOld}" to "${cleanNew}" in ${cityKey.toUpperCase()}`, { city: cityKey, oldName: cleanOld, newName: cleanNew });
  pushErpMetaToCloud();
  return updatedMaster;
}

export function deleteRegisteredHotel(city, rawHotelName) {
  const hotelName = (rawHotelName || '').trim().toUpperCase();
  if (!hotelName) return getRegisteredHotels();
  const cityKey = normalizeCityKey(city);
  const current = getRegisteredHotels();
  const list = current[cityKey] || [];

  const updatedCityHotels = list.filter(h => h.trim().toUpperCase() !== hotelName);
  const updatedMaster = { ...current, [cityKey]: updatedCityHotels };
  writeStorage(ERP_STORAGE_KEYS.HOTELS, updatedMaster);
  logAuditAction('HOTEL_DELETED', `Removed hotel "${hotelName}" from ${cityKey.toUpperCase()}`, { city: cityKey, hotelName });
  pushErpMetaToCloud();
  return updatedMaster;
}

// -------------------------------------------------------------
// 2C. HOTEL STAR RATINGS & ROOM TYPES REGISTRY
// -------------------------------------------------------------
export const DEFAULT_HOTEL_STARS = {
  'VOCO 5 STAR': 5,
  'SWISSOTEL MAKKAH': 5,
  'FAIRMONT CLOCK TOWER': 5,
  'PULLMAN ZAMZAM': 5,
  'AL SAFWAH ROYALE ORCHID': 5,
  'DAR AL EIMAN GRAND': 4,
  'MAKKAH TOWERS': 5,
  'HILTON SUITES MAKKAH': 5,
  'ANJUM HOTEL MAKKAH': 5,
  'LE MERIDIEN TOWERS': 5,
  'GULNAR HV': 4,
  'ANWAR AL MADINAH MOVENPICK': 5,
  'DAR AL TAQWA': 5,
  'INTERCONTINENTAL DAR AL IMAN': 5,
  'PULLMAN ZAMZAM MADINA': 5,
  'MADINAH HILTON': 5,
  'RUVE AL MADINAH': 4,
  'AL HARAM HOTEL': 4,
  'ODST AL MADINAH': 4,
  'SAJA AL MADINAH': 4,
  'CLARION HOTEL JEDDAH AIRPORT': 4,
  'RADISSON BLU JEDDAH': 5,
  'INTERCONTINENTAL JEDDAH': 5,
  'PRIME HOTEL JEDDAH': 4,
};

export function getRegisteredHotelStars() {
  const stored = readStorage(ERP_STORAGE_KEYS.HOTEL_STARS, null);
  if (!stored || typeof stored !== 'object') {
    writeStorage(ERP_STORAGE_KEYS.HOTEL_STARS, DEFAULT_HOTEL_STARS);
    return DEFAULT_HOTEL_STARS;
  }
  return { ...DEFAULT_HOTEL_STARS, ...stored };
}

export function saveRegisteredHotelStar(hotelName, stars) {
  const clean = (hotelName || '').trim().toUpperCase();
  if (!clean) return getRegisteredHotelStars();
  const current = getRegisteredHotelStars();
  const starNum = (stars !== undefined && stars !== null) ? (parseInt(stars, 10) || 0) : 5;
  const updated = { ...current, [clean]: starNum };
  writeStorage(ERP_STORAGE_KEYS.HOTEL_STARS, updated);
  return updated;
}

// -------------------------------------------------------------
// 2C-2. HOTEL DISTANCE REGISTRY
// -------------------------------------------------------------
export const DEFAULT_HOTEL_DISTANCES = {
  'VOCO 5 STAR': '850m from Haram (Free 24/7 Shuttle)',
  'SWISSOTEL MAKKAH': '0m (Direct Abraj Al Bait Clock Tower Access)',
  'FAIRMONT CLOCK TOWER': '0m (Direct Clock Tower Haram View)',
  'PULLMAN ZAMZAM': '0m (Abraj Al Bait Complex)',
  'AL SAFWAH ROYALE ORCHID': '50m from Haram Courtyard',
  'DAR AL EIMAN GRAND': '750m Ibrahim Khalil Road',
  'MAKKAH TOWERS': '0m (Direct Haram Front)',
  'HILTON SUITES MAKKAH': '100m Ibrahim Khalil Road',
  'ANJUM HOTEL MAKKAH': '350m Umrah Gate with Tunnels',
  'LE MERIDIEN TOWERS': '1.2km Kudai with 24/7 Shuttle',
  'GULNAR HV': '150m from Masjid Nabawi Northern Courtyard',
  'ANWAR AL MADINAH MOVENPICK': '0m (Direct Gate 16 Haram Front)',
  'DAR AL TAQWA': '0m (Front of Ladies Gate Courtyard)',
  'INTERCONTINENTAL DAR AL IMAN': '0m (Direct Prophet Mosque Plaza)',
  'PULLMAN ZAMZAM MADINA': '150m from Bab Al Salam',
  'MADINAH HILTON': '0m (Direct Northern Plaza)',
  'RUVE AL MADINAH': '250m Central Northern Markazia',
  'AL HARAM HOTEL': '100m Western Markazia',
  'ODST AL MADINAH': '200m Southern Markazia',
  'SAJA AL MADINAH': '350m Northern Markazia',
  'CLARION HOTEL JEDDAH AIRPORT': '10 mins to Jeddah Terminal 1',
};

export function getRegisteredHotelDistances() {
  const stored = readStorage(ERP_STORAGE_KEYS.HOTEL_DISTANCES, null);
  if (!stored || typeof stored !== 'object') {
    writeStorage(ERP_STORAGE_KEYS.HOTEL_DISTANCES, DEFAULT_HOTEL_DISTANCES);
    return DEFAULT_HOTEL_DISTANCES;
  }
  return { ...DEFAULT_HOTEL_DISTANCES, ...stored };
}

export function getHotelDistance(hotelName) {
  if (!hotelName) return '';
  const clean = (hotelName || '').trim().toUpperCase();
  const all = getRegisteredHotelDistances();
  const matchedKey = Object.keys(all).find(k => k.trim().toUpperCase() === clean);
  return matchedKey ? all[matchedKey] : '';
}

export function saveRegisteredHotelDistance(hotelName, distance) {
  const clean = (hotelName || '').trim().toUpperCase();
  if (!clean) return getRegisteredHotelDistances();
  const current = getRegisteredHotelDistances();
  const updated = { ...current, [clean]: (distance || '').trim() };
  writeStorage(ERP_STORAGE_KEYS.HOTEL_DISTANCES, updated);
  pushErpMetaToCloud();
  return updated;
}

export const DEFAULT_ROOM_TYPES = [
  'Sharing',
  'Quint',
  'Quad',
  'Triple',
  'Double',
  'Single'
];

export function getRegisteredRoomTypes() {
  const stored = readStorage(ERP_STORAGE_KEYS.ROOM_TYPES, null);
  if (!Array.isArray(stored) || stored.length === 0) {
    writeStorage(ERP_STORAGE_KEYS.ROOM_TYPES, DEFAULT_ROOM_TYPES);
    return DEFAULT_ROOM_TYPES;
  }
  return stored;
}

export function addRegisteredRoomType(type) {
  const clean = (type || '').trim();
  if (!clean) return getRegisteredRoomTypes();
  const current = getRegisteredRoomTypes();
  const exists = current.some(t => t.toLowerCase() === clean.toLowerCase());
  if (!exists) {
    const updated = [...current, clean];
    writeStorage(ERP_STORAGE_KEYS.ROOM_TYPES, updated);
    return updated;
  }
  return current;
}

export function getRegisteredHotelRates() {
  const defaultRates = {
    'VOCO 5 STAR': { 'Sharing': 450, 'Quad': 550, 'Triple': 650, 'Double': 800 },
    'SWISSOTEL MAKKAH': { 'Sharing': 850, 'Quad': 950, 'Triple': 1150, 'Double': 1400 },
    'FAIRMONT CLOCK TOWER': { 'Sharing': 1050, 'Quad': 1200, 'Triple': 1450, 'Double': 1800 },
    'PULLMAN ZAMZAM': { 'Sharing': 750, 'Quad': 850, 'Triple': 1050, 'Double': 1300 },
    'AL SAFWAH ROYALE ORCHID': { 'Sharing': 700, 'Quad': 800, 'Triple': 950, 'Double': 1200 },
    'DAR AL EIMAN GRAND': { 'Sharing': 420, 'Quad': 500, 'Triple': 600, 'Double': 750 },
    'MAKKAH TOWERS': { 'Sharing': 650, 'Quad': 750, 'Triple': 900, 'Double': 1150 },
    'HILTON SUITES MAKKAH': { 'Sharing': 800, 'Quad': 900, 'Triple': 1100, 'Double': 1350 },
    'ANJUM HOTEL MAKKAH': { 'Sharing': 600, 'Quad': 700, 'Triple': 850, 'Double': 1100 },
    'LE MERIDIEN TOWERS': { 'Sharing': 480, 'Quad': 550, 'Triple': 680, 'Double': 850 },
    'GULNAR HV': { 'Sharing': 380, 'Quad': 450, 'Triple': 550, 'Double': 700 },
    'ANWAR AL MADINAH MOVENPICK': { 'Sharing': 750, 'Quad': 850, 'Triple': 1050, 'Double': 1300 },
    'DAR AL TAQWA': { 'Sharing': 950, 'Quad': 1100, 'Triple': 1350, 'Double': 1700 },
    'INTERCONTINENTAL DAR AL IMAN': { 'Sharing': 1000, 'Quad': 1150, 'Triple': 1400, 'Double': 1750 },
    'PULLMAN ZAMZAM MADINA': { 'Sharing': 650, 'Quad': 750, 'Triple': 900, 'Double': 1150 },
    'MADINAH HILTON': { 'Sharing': 720, 'Quad': 800, 'Triple': 980, 'Double': 1250 },
    'RUVE AL MADINAH': { 'Sharing': 430, 'Quad': 500, 'Triple': 620, 'Double': 780 },
    'AL HARAM HOTEL': { 'Sharing': 480, 'Quad': 550, 'Triple': 680, 'Double': 850 },
    'ODST AL MADINAH': { 'Sharing': 360, 'Quad': 420, 'Triple': 520, 'Double': 650 },
    'SAJA AL MADINAH': { 'Sharing': 410, 'Quad': 480, 'Triple': 590, 'Double': 740 },
  };

  const stored = readStorage(ERP_STORAGE_KEYS.HOTEL_RATES, null);
  if (!stored || typeof stored !== 'object') {
    writeStorage(ERP_STORAGE_KEYS.HOTEL_RATES, defaultRates);
    return defaultRates;
  }
  return { ...defaultRates, ...stored };
}

export function saveRegisteredHotelRate(hotelName, roomType, rate) {
  const rawH = (hotelName || '').trim();
  if (!rawH) return getRegisteredHotelRates();
  const rawR = (roomType || 'Quad').trim();
  const rateNum = parseFloat(rate) || 0;

  const current = getRegisteredHotelRates();

  // Find existing hotel key in current registry (case-insensitive)
  const matchedHKey = Object.keys(current).find(k => k.trim().toUpperCase() === rawH.toUpperCase()) || rawH.toUpperCase();
  const hotelObj = { ...(current[matchedHKey] || {}) };

  // Find existing room type key in this hotel (case-insensitive)
  const matchedRKey = Object.keys(hotelObj).find(k => k.trim().toLowerCase() === rawR.toLowerCase()) || rawR;

  // Update existing rate in place
  hotelObj[matchedRKey] = rateNum;

  const updated = {
    ...current,
    [matchedHKey]: hotelObj
  };

  writeStorage(ERP_STORAGE_KEYS.HOTEL_RATES, updated);
  pushErpMetaToCloud();
  return updated;
}

export function getHotelRate(hotelName, roomType) {
  if (!hotelName) return null;
  const hKey = (hotelName || '').trim().toUpperCase();
  const rKey = (roomType || 'Quad').trim();
  const all = getRegisteredHotelRates();
  const matchedHKey = Object.keys(all).find(k => k.trim().toUpperCase() === hKey) || hKey;
  const hotelObj = all[matchedHKey];
  if (!hotelObj) return null;
  if (hotelObj[rKey] !== undefined) return hotelObj[rKey];
  const matchingKey = Object.keys(hotelObj).find(k => k.toLowerCase() === rKey.toLowerCase());
  if (matchingKey && hotelObj[matchingKey] !== undefined) {
    return hotelObj[matchingKey];
  }
  return null;
}

// -------------------------------------------------------------
// 3. MODULE C: Pipeline Package Cost Estimator (Pre-Sales)
// -------------------------------------------------------------
function seedInitialEstimatesAndInvoices(parties) {
  const estimates = [];
  const invoices = [];

  parties.forEach((p, idx) => {
    const estId = `EST-2026-${String(idx + 1).padStart(3, '0')}`;
    const paxCount = p.totalPax || 1;
    const visaTotal = paxCount * 45000; // PKR 45,000 per pax
    const flightTotal = paxCount * 135000; // PKR 135,000 per pax
    const transportTotal = 65000;
    const hotelTotal = paxCount * 95000;
    const ziyaratTotal = 25000;
    const subtotal = visaTotal + flightTotal + transportTotal + hotelTotal + ziyaratTotal;
    const markup = Math.round(subtotal * 0.12); // 12% margin
    const grandTotal = subtotal + markup;

    const estimate = {
      id: estId,
      estimateNo: estId,
      partyHeadUid: p.partyHeadUid,
      partyName: p.partyName,
      companyName: p.companyName || 'NOOR E HARAM TRAVELS & TOURS',
      contactPhone: p.contactPhone,
      paxCount: paxCount,
      packageDuration: '18 Days Standard Umrah',
      currency: 'PKR',
      items: {
        visaCostPerPax: 45000,
        visaTotal: visaTotal,
        flightCostPerPax: 135000,
        flightTotal: flightTotal,
        transportSegmentCost: transportTotal,
        hotelBlocksCost: hotelTotal,
        ziyaratAndLogistics: ziyaratTotal,
        subtotal: subtotal,
        marginPercent: 12,
        marginAmount: markup,
        grandTotal: grandTotal,
        perPaxQuote: Math.round(grandTotal / paxCount),
      },
      validityDays: 14,
      status: idx === 0 ? 'Converted to Invoice' : idx === 1 ? 'Approved by Client' : 'Draft Proposal',
      isDraftLayout: true,
      notes: 'Includes Saudi Umrah Electronic Visa, Direct Carrier Flights, Dedicated Ground Transport, and 4/5-star Makkah/Madinah Accommodations.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    estimates.push(estimate);

    // Initial Invoice for first party
    if (idx === 0) {
      const invId = `INV-2026-${String(idx + 1).padStart(3, '0')}`;
      invoices.push({
        id: invId,
        invoiceNo: invId,
        partyHeadUid: p.partyHeadUid,
        partyName: p.partyName,
        companyName: p.companyName || 'NOOR E HARAM TRAVELS & TOURS',
        contactPhone: p.contactPhone,
        estimateRefId: estId,
        issueDate: '2026-10-08',
        dueDate: '2026-10-25',
        currency: 'PKR',
        totalAmount: grandTotal,
        paidAmount: Math.round(grandTotal * 0.6), // 60% advance paid
        balanceDue: Math.round(grandTotal * 0.4),
        status: 'Partially Unlocked Balance', // 'Settled' | 'Partially Unlocked Balance' | 'Outstanding Overdue Collections'
        paymentTerms: '50% Upon Confirmation, 50% 7 Days Prior to Departure.',
        bankDetails: {
          bankName: 'Meezan Bank Limited',
          accountTitle: 'NOOR E HARAM TRAVELS & TOURS',
          accountNumber: '0289-0105829101',
          iban: 'PK49MEZN0002890105829101',
          branch: 'Main Boulevard Branch',
        },
        ledgerTransactions: [
          {
            id: 'tx-1',
            date: '2026-10-09',
            amount: Math.round(grandTotal * 0.6),
            method: 'Online Bank Transfer',
            referenceNo: 'FT-MEZN-982103',
            notes: 'Advance booking confirmation deposit',
            receivedBy: 'Madni Raza Memon',
          }
        ],
        createdAt: new Date().toISOString(),
      });
    }
  });

  writeStorage(ERP_STORAGE_KEYS.ESTIMATES, estimates);
  writeStorage(ERP_STORAGE_KEYS.INVOICES, invoices);
}

export function getAllEstimates() {
  const estimates = readStorage(ERP_STORAGE_KEYS.ESTIMATES, []);
  if (estimates.length === 0) {
    initializeErpParties();
    return readStorage(ERP_STORAGE_KEYS.ESTIMATES, []);
  }
  return estimates;
}

export function getEstimateById(id) {
  if (!id) return null;
  const list = getAllEstimates();
  const normalized = id.toLowerCase().trim();
  return list.find(e => e.id.toLowerCase() === normalized || e.estimateNo.toLowerCase() === normalized) || null;
}

export function saveEstimate(estimateData) {
  const list = getAllEstimates();
  const id = estimateData.id || `EST-2026-${String(list.length + 1).padStart(3, '0')}`;
  const record = {
    ...estimateData,
    id,
    estimateNo: estimateData.estimateNo || id,
    updatedAt: new Date().toISOString(),
  };

  const idx = list.findIndex(e =>
    (e.id && e.id.toLowerCase() === id.toLowerCase()) ||
    (e.estimateNo && e.estimateNo.toLowerCase() === id.toLowerCase())
  );
  if (idx !== -1) {
    list[idx] = record;
  } else {
    list.unshift(record);
  }

  writeStorage(ERP_STORAGE_KEYS.ESTIMATES, list);
  logAuditAction('ESTIMATE_SAVED', 'Created Pre-Sales Cost Quotation', { id, partyHeadUid: record.partyHeadUid, grandTotal: record.items?.grandTotal });
  pushErpMetaToCloud();
  return record;
}

export function deleteEstimate(id) {
  if (!id) return false;
  const list = getAllEstimates();
  const normalized = id.toLowerCase().trim();
  const updated = list.filter(e =>
    e.id.toLowerCase() !== normalized &&
    (e.estimateNo || '').toLowerCase() !== normalized
  );
  writeStorage(ERP_STORAGE_KEYS.ESTIMATES, updated);
  logAuditAction('ESTIMATE_DELETED', 'Deleted Pre-Sales Cost Quotation', { id });
  pushErpMetaToCloud();
  return updated;
}

// -------------------------------------------------------------
// 4. MODULE D: Financial Ledger Billing & 1-Click Invoice Engine
// -------------------------------------------------------------
export function getAllInvoices() {
  const invoices = readStorage(ERP_STORAGE_KEYS.INVOICES, []);
  if (invoices.length === 0) {
    initializeErpParties();
    return readStorage(ERP_STORAGE_KEYS.INVOICES, []);
  }
  return invoices;
}

export function getInvoiceById(id) {
  if (!id) return null;
  const list = getAllInvoices();
  const normalized = id.toLowerCase().trim();
  return list.find(inv => inv.id.toLowerCase() === normalized || inv.invoiceNo.toLowerCase() === normalized || inv.partyHeadUid.toLowerCase() === normalized) || null;
}

export function saveInvoice(invoiceData) {
  const invoices = getAllInvoices();
  const invId = invoiceData.id || invoiceData.invoiceNo || `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`;

  const totalAmount = parseFloat(invoiceData.totalAmount) || 0;
  const initialPayment = parseFloat(invoiceData.initialPayment) || 0;
  const paidAmount = parseFloat(invoiceData.paidAmount) || initialPayment || 0;
  const balanceDue = Math.max(0, totalAmount - paidAmount);

  let status = 'Outstanding Overdue Collections';
  if (balanceDue <= 0 && totalAmount > 0) {
    status = 'Settled';
  } else if (paidAmount > 0) {
    status = 'Partially Unlocked Balance';
  }

  let ledgerTransactions = Array.isArray(invoiceData.ledgerTransactions) ? [...invoiceData.ledgerTransactions] : [];
  if (initialPayment > 0 && ledgerTransactions.length === 0) {
    ledgerTransactions.push({
      id: `tx-init-${Date.now()}`,
      date: invoiceData.issueDate || new Date().toISOString().split('T')[0],
      amount: initialPayment,
      method: invoiceData.paymentMethod || 'Online Bank Transfer',
      referenceNo: invoiceData.paymentRef || `PAY-${Date.now().toString().slice(-6)}`,
      notes: invoiceData.paymentNotes || 'Advance deposit upon invoice issuance',
      receivedBy: 'Operations Desk',
    });
  }

  const record = {
    ...invoiceData,
    id: invId,
    invoiceNo: invoiceData.invoiceNo || invId,
    partyHeadUid: invoiceData.partyHeadUid || 'CUSTOM-DEBTOR',
    partyName: invoiceData.partyName || 'Valued Client',
    companyName: invoiceData.companyName || 'NOOR E HARAM TRAVELS & TOURS',
    contactPhone: invoiceData.contactPhone || '0311-2264567',
    packageTitle: invoiceData.packageTitle || 'Umrah Services Package',
    estimateRefId: invoiceData.estimateRefId || null,
    issueDate: invoiceData.issueDate || new Date().toISOString().split('T')[0],
    dueDate: invoiceData.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    currency: invoiceData.currency || 'PKR',
    totalAmount,
    paidAmount,
    balanceDue,
    status: invoiceData.status || status,
    paymentTerms: invoiceData.paymentTerms || 'Full Payment Required Prior to Visa Stamp & Flight Issuance.',
    bankDetails: invoiceData.bankDetails || {
      bankName: 'Meezan Bank Limited',
      accountTitle: 'NOOR E HARAM TRAVELS & TOURS',
      accountNumber: '0289-0105829101',
      iban: 'PK49MEZN0002890105829101',
      branch: 'Main Boulevard Branch',
    },
    lineItems: invoiceData.lineItems || [],
    ledgerTransactions,
    notes: invoiceData.notes || '',
    createdAt: invoiceData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const idx = invoices.findIndex(i => i.id === invId || i.invoiceNo === invId);
  if (idx !== -1) {
    invoices[idx] = record;
  } else {
    invoices.unshift(record);
  }

  writeStorage(ERP_STORAGE_KEYS.INVOICES, invoices);
  logAuditAction('INVOICE_SAVED', `Created/Updated Corporate Invoice ${record.invoiceNo}`, {
    invoiceNo: record.invoiceNo,
    partyHeadUid: record.partyHeadUid,
    totalAmount: record.totalAmount,
    balanceDue: record.balanceDue
  });
  pushErpMetaToCloud();
  return record;
}

export const createInvoice = saveInvoice;

export function deleteInvoice(id) {
  if (!id) return false;
  const list = getAllInvoices();
  const normalized = id.toLowerCase().trim();
  const updated = list.filter(inv =>
    inv.id.toLowerCase() !== normalized &&
    (inv.invoiceNo || '').toLowerCase() !== normalized
  );
  writeStorage(ERP_STORAGE_KEYS.INVOICES, updated);
  logAuditAction('INVOICE_DELETED', 'Deleted Corporate Invoice', { id });
  pushErpMetaToCloud();
  return updated;
}

export function convertEstimateToInvoice(estimateId) {
  const estimate = getEstimateById(estimateId);
  if (!estimate) throw new Error('Estimate not found');

  const invoices = getAllInvoices();
  const invId = `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`;
  const total = estimate.items?.grandTotal || 0;

  const newInvoice = {
    id: invId,
    invoiceNo: invId,
    partyHeadUid: estimate.partyHeadUid,
    partyName: estimate.partyName,
    companyName: estimate.companyName || 'NOOR E HARAM TRAVELS & TOURS',
    contactPhone: estimate.contactPhone,
    estimateRefId: estimate.id,
    packageTitle: estimate.packageDuration || 'Umrah Package',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    currency: estimate.currency || 'PKR',
    totalAmount: total,
    paidAmount: 0,
    balanceDue: total,
    status: 'Outstanding Overdue Collections', // default unpaid
    paymentTerms: 'Full Payment Required Prior to Visa Stamp & Flight Issuance.',
    bankDetails: {
      bankName: 'Meezan Bank Limited',
      accountTitle: 'NOOR E HARAM TRAVELS & TOURS',
      accountNumber: '0289-0105829101',
      iban: 'PK49MEZN0002890105829101',
      branch: 'Main Boulevard Branch',
    },
    lineItems: [
      { description: 'Saudi Umrah Electronic Visas', quantity: estimate.paxCount || 1, rate: estimate.items?.visaCostPerPax || 0, amount: estimate.items?.visaTotal || 0 },
      { description: 'Direct International Flight Tickets', quantity: estimate.paxCount || 1, rate: estimate.items?.flightCostPerPax || 0, amount: estimate.items?.flightTotal || 0 },
      { description: 'Makkah & Madinah Hotel Accommodation Blocks', quantity: 1, rate: estimate.items?.hotelBlocksCost || 0, amount: estimate.items?.hotelBlocksCost || 0 },
      { description: 'Dedicated Ground Transport Fleet', quantity: 1, rate: estimate.items?.transportSegmentCost || 0, amount: estimate.items?.transportSegmentCost || 0 },
      { description: 'Holy Ziyarat Guidance & Operations Liaison', quantity: 1, rate: estimate.items?.ziyaratAndLogistics || 0, amount: estimate.items?.ziyaratAndLogistics || 0 },
      { description: 'Agency Operations & Service Markup', quantity: 1, rate: estimate.items?.marginAmount || 0, amount: estimate.items?.marginAmount || 0 },
    ].filter(item => item.amount > 0),
    ledgerTransactions: [],
    createdAt: new Date().toISOString(),
  };

  invoices.unshift(newInvoice);
  writeStorage(ERP_STORAGE_KEYS.INVOICES, invoices);

  // Update estimate status
  estimate.status = 'Converted to Invoice';
  saveEstimate(estimate);

  logAuditAction('INVOICE_CONVERTED', '1-Click Converted Estimate to Corporate Invoice', { invoiceNo: invId, estimateId, totalAmount: total });
  return newInvoice;
}

export function addLedgerTransaction(invoiceId, transactionData) {
  const invoices = getAllInvoices();
  const invoice = invoices.find(inv => inv.id === invoiceId || inv.invoiceNo === invoiceId);
  if (!invoice) throw new Error('Invoice not found');

  const txAmount = parseFloat(transactionData.amount) || 0;
  const newTx = {
    id: `tx-${Date.now()}`,
    date: transactionData.date || new Date().toISOString().split('T')[0],
    amount: txAmount,
    method: transactionData.method || 'Online Bank Transfer',
    referenceNo: transactionData.referenceNo || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
    notes: transactionData.notes || 'Payment recorded',
    receivedBy: transactionData.receivedBy || 'Staff Cashier',
  };

  invoice.ledgerTransactions = invoice.ledgerTransactions || [];
  invoice.ledgerTransactions.push(newTx);
  invoice.paidAmount = (parseFloat(invoice.paidAmount) || 0) + txAmount;
  invoice.balanceDue = Math.max(0, invoice.totalAmount - invoice.paidAmount);

  // Update Status
  if (invoice.balanceDue <= 0) {
    invoice.status = 'Settled';
  } else if (invoice.paidAmount > 0) {
    invoice.status = 'Partially Unlocked Balance';
  } else {
    invoice.status = 'Outstanding Overdue Collections';
  }

  writeStorage(ERP_STORAGE_KEYS.INVOICES, invoices);
  logAuditAction('PAYMENT_RECORDED', `Logged Payment of ${invoice.currency} ${txAmount.toLocaleString()}`, { invoiceId: invoice.id, reference: newTx.referenceNo });
  pushErpMetaToCloud();
  return invoice;
}

// -------------------------------------------------------------
// 5. AUTOMATED TASK REMINDERS & DEADLINES
// -------------------------------------------------------------
function seedInitialTasks(parties) {
  const tasks = [
    {
      id: 'task-1',
      partyHeadUid: parties[0]?.partyHeadUid || 'PHU-0001',
      partyName: parties[0]?.partyName || 'ABDUL KARIM',
      title: 'Saudi Nusuk / MoFA Visa Biometrics Cutoff',
      category: 'Visa Regulations',
      dueDate: '2026-10-15',
      deadlineHoursRemaining: 48,
      status: 'Urgent',
      assignedTo: 'Ubaid Raza Memon',
    },
    {
      id: 'task-2',
      partyHeadUid: parties[0]?.partyHeadUid || 'PHU-0001',
      partyName: parties[0]?.partyName || 'ABDUL KARIM',
      title: 'Makkah VOCO Hotel Final Room Confirmation & Meal Voucher',
      category: 'Hotel Reservation',
      dueDate: '2026-10-17',
      deadlineHoursRemaining: 96,
      status: 'Pending',
      assignedTo: 'Madni Raza Memon',
    },
    {
      id: 'task-3',
      partyHeadUid: parties[1]?.partyHeadUid || 'PHU-0002',
      partyName: parties[1]?.partyName || 'TAHIRA BEGUM',
      title: 'Collect Remaining Ledger Balance Before Flight Manifest',
      category: 'Finance Overdue',
      dueDate: '2026-10-14',
      deadlineHoursRemaining: 24,
      status: 'Overdue Warning',
      assignedTo: 'Accounts Desk',
    },
    {
      id: 'task-4',
      partyHeadUid: parties[0]?.partyHeadUid || 'PHU-0001',
      partyName: parties[0]?.partyName || 'ABDUL KARIM',
      title: 'JED Ground Fleet Airport Pickup Dispatch Notification',
      category: 'Transport Logistics',
      dueDate: '2026-10-18',
      deadlineHoursRemaining: 120,
      status: 'Scheduled',
      assignedTo: 'KSA Dispatch Team',
    },
  ];
  writeStorage(ERP_STORAGE_KEYS.TASKS, tasks);
}

export function getAllTasks() {
  return readStorage(ERP_STORAGE_KEYS.TASKS, []);
}

export function toggleTaskCompleted(taskId) {
  const tasks = getAllTasks();
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.status = task.status === 'Completed' ? 'Pending' : 'Completed';
    writeStorage(ERP_STORAGE_KEYS.TASKS, tasks);
    pushErpMetaToCloud();
  }
  return tasks;
}

// -------------------------------------------------------------
// 6. REAL-TIME AUDIT LOGS & SYSTEM ARCHITECTURE
// -------------------------------------------------------------
export function logAuditAction(action, title, details = {}) {
  const logs = readStorage(ERP_STORAGE_KEYS.AUDIT_LOGS, []);
  const activeRole = getActiveRole();
  const entry = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action,
    title,
    operator: activeRole?.name || 'Operations Lead',
    clearance: activeRole?.clearance || 'Level 3',
    details,
  };
  logs.unshift(entry);
  if (logs.length > 100) logs.pop();
  writeStorage(ERP_STORAGE_KEYS.AUDIT_LOGS, logs);
}

export function getAllAuditLogs() {
  const logs = readStorage(ERP_STORAGE_KEYS.AUDIT_LOGS, []);
  if (logs.length === 0) {
    const initialLogs = [
      {
        id: 'log-1',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        action: 'SYSTEM_BOOT',
        title: 'ERP Relational Engine Initialized',
        operator: 'System Core',
        clearance: 'Level 3',
        details: { status: 'Strict Parent-Child Schema Online' }
      },
      {
        id: 'log-2',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        action: 'QR_ENGINE_MOUNT',
        title: 'Dynamic QR Routines Mounted for Hotel & Invoices',
        operator: 'Super Admin',
        clearance: 'Level 3',
        details: { modules: ['Transport', 'Hotel', 'Invoices', 'Estimates'] }
      }
    ];
    writeStorage(ERP_STORAGE_KEYS.AUDIT_LOGS, initialLogs);
    return initialLogs;
  }
  return logs;
}

// -------------------------------------------------------------
// 7. ROLE-BASED ACCESS CONTROL (RBAC) STATE
// -------------------------------------------------------------
export function getActiveRole() {
  const savedId = readStorage(ERP_STORAGE_KEYS.ACTIVE_ROLE, 'super_admin');
  return USER_ROLES[savedId.toUpperCase()] || USER_ROLES.SUPER_ADMIN;
}

export function setActiveRole(roleId) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ERP_STORAGE_KEYS.ACTIVE_ROLE, JSON.stringify(roleId));
  }
  logAuditAction('RBAC_ROLE_SWITCH', `Switched operator context to ${roleId}`, { roleId });
  return USER_ROLES[roleId.toUpperCase()] || USER_ROLES.SUPER_ADMIN;
}

// -------------------------------------------------------------
// 8. DEDICATED UMRAH GROUPS (GID) MANAGEMENT ENGINE
// -------------------------------------------------------------
export function getAllGroups() {
  return readStorage(ERP_STORAGE_KEYS.GROUPS, []);
}

export function saveGroup(groupData) {
  const groups = getAllGroups();
  const index = groups.findIndex(g => g.id === groupData.id || g.gid === groupData.gid);

  const record = {
    ...groupData,
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    groups[index] = record;
  } else {
    record.id = record.id || `group_${Date.now()}`;
    record.createdAt = record.createdAt || new Date().toISOString();
    groups.unshift(record);
  }

  writeStorage(ERP_STORAGE_KEYS.GROUPS, groups);
  logAuditAction('GROUP_SAVED', `Saved group ${record.gid} (${record.groupName || 'Unnamed'}) with ${record.totalPax || 0} PAX`, {
    gid: record.gid,
    groupName: record.groupName,
    totalPax: record.totalPax,
  });
  pushErpMetaToCloud();
  return groups;
}

export function deleteGroup(groupId) {
  let groups = getAllGroups();
  const target = groups.find(g => g.id === groupId || g.gid === groupId);
  groups = groups.filter(g => g.id !== groupId && g.gid !== groupId);
  writeStorage(ERP_STORAGE_KEYS.GROUPS, groups);
  if (target) {
    logAuditAction('GROUP_DELETED', `Deleted group ${target.gid} (${target.groupName || 'Unnamed'})`, {
      gid: target.gid,
      groupName: target.groupName,
    });
  }
  pushErpMetaToCloud();
  return groups;
}

export function getNextGidNumber() {
  const groups = getAllGroups();
  if (!groups || groups.length === 0) return '001';

  // Collect all already assigned numeric IDs
  const usedNumbers = new Set();
  groups.forEach(g => {
    const match = (g.gid || '').match(/\d+/);
    if (match) {
      usedNumbers.add(parseInt(match[0], 10));
    }
  });

  // Find the first free positive integer starting from 1 (001, 002, 003...)
  let nextNum = 1;
  while (usedNumbers.has(nextNum)) {
    nextNum++;
  }

  return String(nextNum).padStart(3, '0');
}

