import { supabase } from './supabaseClient';

export const initialVouchers = [];

export function mapSupabaseToVoucher(row) {
  if (!row) return null;
  const idNum = parseInt(row.id || 1) || 1;
  const fallbackUb = `UB-${String(idNum).padStart(4, '0')}`;
  
  // Extract isSelfVisa safely
  let isSelfVisa = true;
  if (row.is_self_visa !== undefined && row.is_self_visa !== null) {
    isSelfVisa = Boolean(row.is_self_visa);
  } else if (row.isSelfVisa !== undefined && row.isSelfVisa !== null) {
    isSelfVisa = Boolean(row.isSelfVisa);
  } else if (row.passengers && row.passengers[0] && row.passengers[0].isSelfVisa !== undefined) {
    isSelfVisa = Boolean(row.passengers[0].isSelfVisa);
  }

  return {
    id: row.id,
    slug: row.slug,
    party: row.party,
    sheetName: row.sheet_name || `Voucher - ${row.party}`,
    ubNumber: row.ub_number || row.voucher_ref_no || fallbackUb,
    voucherRefNo: row.voucher_ref_no || row.ub_number || fallbackUb,
    companyName: row.company_name || 'NOOR E HARAM TRAVEL & TOURS',
    isSelfVisa: isSelfVisa,
    emergencyContact: row.emergency_contact,
    phone: row.phone || 'Mob : UBAID RAZA +92-311-2264567 / +92-348-3138424',
    voucherTitle: row.voucher_title || 'UMRAH PACKAGE VOUCHER',
    executive: row.executive || 'ADMIN',
    paxCounts: row.pax_counts,
    totalPax: row.total_pax,
    passengers: row.passengers || [],
    accommodations: row.accommodations || [],
    transports: row.transports || [],
    flights: row.flights || [],
    groundTransport: row.ground_transport,
    makkahHelpline: row.makkah_helpline,
    madinahHelpline: row.madinah_helpline,
    pakistanHelpline: row.pakistan_helpline || 'Mob : UBAID RAZA +92-311-2264567 / +92-348-3138424',
  };
}

export function mapVoucherToSupabase(v) {
  const idNum = parseInt(v.id || 1) || 1;
  const defaultUb = `UB-${String(idNum).padStart(4, '0')}`;
  const ub = v.ubNumber || v.voucherRefNo || defaultUb;
  const isSelfVisa = v.isSelfVisa !== false;

  const passengers = (v.passengers && v.passengers.length > 0)
    ? v.passengers.map((p, idx) => (idx === 0 ? { ...p, isSelfVisa: isSelfVisa } : p))
    : [{ isSelfVisa: isSelfVisa }];

  return {
    id: String(v.id || ('custom-' + Date.now())),
    slug: v.slug || slugify(v.party) || ('voucher-' + Date.now()),
    party: v.party || '',
    sheet_name: v.sheetName || '',
    ub_number: ub,
    voucher_ref_no: ub,
    company_name: v.companyName || 'NOOR E HARAM TRAVEL & TOURS',
    emergency_contact: v.emergencyContact || '+966 50 627 7492',
    phone: v.phone || 'Mob : UBAID RAZA +92-311-2264567 / +92-348-3138424',
    voucher_title: v.voucherTitle || 'UMRAH PACKAGE VOUCHER',
    executive: v.executive || 'ADMIN',
    pax_counts: v.paxCounts || '',
    total_pax: v.totalPax || (passengers ? passengers.length : 1),
    passengers: passengers,
    accommodations: v.accommodations || [],
    transports: v.transports || [],
    flights: v.flights || [],
    ground_transport: v.groundTransport || '+92 328 8189989',
    makkah_helpline: v.makkahHelpline || '+966 53 649 2846',
    madinah_helpline: v.madinahHelpline || '+966 57 593 0550',
    pakistan_helpline: v.pakistanHelpline || 'Mob : UBAID RAZA +92-311-2264567 / +92-348-3138424',
    updated_at: new Date().toISOString(),
  };
}

export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function getAllVouchers() {
  if (typeof window !== 'undefined') {
    const customVouchers = localStorage.getItem('custom_vouchers');
    const overrides = localStorage.getItem('voucher_overrides');
    let overrideMap = {};
    if (overrides) {
      try {
        overrideMap = JSON.parse(overrides);
      } catch (e) {}
    }
    if (customVouchers) {
      try {
        const parsed = JSON.parse(customVouchers);
        return parsed.map(v => {
          const key = v.slug || v.id;
          if (overrideMap[key] || overrideMap[v.id]) {
            return { ...v, ...(overrideMap[key] || overrideMap[v.id]) };
          }
          return v;
        });
      } catch (e) {}
    }
  }
  return [];
}

export function getVoucherBySlug(slugOrId) {
  if (!slugOrId) return null;
  const all = getAllVouchers();
  const normalized = decodeURIComponent(slugOrId).toLowerCase().trim();
  return all.find(v => (v.slug || '').toLowerCase() === normalized || (v.id || '').toString().toLowerCase() === normalized) || null;
}

export async function fetchSupabaseVouchers() {
  try {
    const { data, error } = await supabase.from('vouchers').select('*').order('created_at', { ascending: true });
    if (!error && Array.isArray(data)) {
      return data.map(mapSupabaseToVoucher);
    }
  } catch (err) {
    console.warn('Supabase fetch error:', err);
  }
  return [];
}

export async function fetchSupabaseVoucherBySlug(slugOrId) {
  if (!slugOrId) return null;
  const normalized = decodeURIComponent(slugOrId).toLowerCase().trim();
  try {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .or(`slug.eq.${normalized},id.eq.${normalized}`)
      .single();
    if (!error && data) {
      return mapSupabaseToVoucher(data);
    }
  } catch (err) {}

  return getVoucherBySlug(slugOrId);
}

export async function updateVoucher(slugOrId, updatedData) {
  const key = slugOrId || updatedData.slug || updatedData.id;
  if (typeof window !== 'undefined') {
    const overridesRaw = localStorage.getItem('voucher_overrides');
    let overrideMap = {};
    if (overridesRaw) {
      try {
        overrideMap = JSON.parse(overridesRaw);
      } catch (e) {}
    }
    overrideMap[key] = { ...updatedData };
    if (updatedData.slug) overrideMap[updatedData.slug] = { ...updatedData };
    if (updatedData.id) overrideMap[updatedData.id] = { ...updatedData };
    localStorage.setItem('voucher_overrides', JSON.stringify(overrideMap));
  }

  try {
    const row = mapVoucherToSupabase(updatedData);
    await supabase.from('vouchers').upsert(row, { onConflict: 'id' });
  } catch (e) {
    console.warn('Supabase update warning:', e);
  }

  return updatedData;
}

export async function saveCustomVoucher(voucher) {
  const newVoucher = {
    ...voucher,
    id: voucher.id || 'custom-' + Date.now(),
    slug: voucher.slug || slugify(voucher.party) || 'voucher-' + Date.now(),
  };

  if (typeof window !== 'undefined') {
    const customVouchers = localStorage.getItem('custom_vouchers');
    let list = [];
    if (customVouchers) {
      try {
        list = JSON.parse(customVouchers);
      } catch (e) {}
    }
    list.push(newVoucher);
    localStorage.setItem('custom_vouchers', JSON.stringify(list));
  }

  try {
    const row = mapVoucherToSupabase(newVoucher);
    await supabase.from('vouchers').insert(row);
  } catch (e) {
    console.warn('Supabase insert warning:', e);
  }

  return newVoucher;
}
