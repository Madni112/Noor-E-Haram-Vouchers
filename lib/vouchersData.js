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

  // Extract creation voucher date safely
  const voucherDate = row.voucher_date || row.created_at || (row.passengers && row.passengers[0] && row.passengers[0].voucherDate) || row.updated_at || new Date().toISOString();

  return {
    id: row.id,
    slug: row.slug,
    party: row.party,
    sheetName: row.sheet_name || `Voucher - ${row.party}`,
    ubNumber: row.ub_number || row.voucher_ref_no || fallbackUb,
    voucherRefNo: row.voucher_ref_no || row.ub_number || fallbackUb,
    companyName: row.company_name || 'CHEEPA FJ TRAVELS',
    isSelfVisa: isSelfVisa,
    voucherDate: voucherDate,
    createdAt: row.created_at || voucherDate,
    emergencyContact: row.emergency_contact,
    phone: row.phone || 'MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683',
    voucherTitle: row.voucher_title || 'UMRAH PACKAGE VOUCHER',
    executive: row.executive || 'MUHAMMAD FAIZAN',
    paxCounts: row.pax_counts,
    totalPax: row.total_pax,
    passengers: row.passengers || [],
    accommodations: row.accommodations || [],
    transports: row.transports || [],
    flights: row.flights || [],
    groundTransport: row.ground_transport,
    makkahHelpline: row.makkah_helpline,
    madinahHelpline: row.madinah_helpline,
    pakistanHelpline: row.pakistan_helpline || 'MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683',
    ksaJeddahAirport: row.ksa_jeddah_airport ?? row.ksaJeddahAirport ?? (row.passengers && row.passengers[0]?.ksaJeddahAirport) ?? '',
    ksaJeddahSpecial: row.ksa_jeddah_special ?? row.ksaJeddahSpecial ?? (row.passengers && row.passengers[0]?.ksaJeddahSpecial) ?? '',
    ksaJeddahSharing: row.ksa_jeddah_sharing ?? row.ksaJeddahSharing ?? (row.passengers && row.passengers[0]?.ksaJeddahSharing) ?? '',
    ksaMakkahSharing: row.ksa_makkah_sharing ?? row.ksaMakkahSharing ?? (row.passengers && row.passengers[0]?.ksaMakkahSharing) ?? '',
    ksaMakkahSpecial: row.ksa_makkah_special ?? row.ksaMakkahSpecial ?? (row.passengers && row.passengers[0]?.ksaMakkahSpecial) ?? '',
    ksaMadinahSharing: row.ksa_madinah_sharing ?? row.ksaMadinahSharing ?? (row.passengers && row.passengers[0]?.ksaMadinahSharing) ?? '',
    ksaMadinahSpecial: row.ksa_madinah_special ?? row.ksaMadinahSpecial ?? (row.passengers && row.passengers[0]?.ksaMadinahSpecial) ?? '',
  };
}

export function mapVoucherToSupabase(v) {
  const idNum = parseInt(v.id || 1) || 1;
  const defaultUb = `UB-${String(idNum).padStart(4, '0')}`;
  const ub = v.ubNumber || v.voucherRefNo || defaultUb;
  const isSelfVisa = v.isSelfVisa !== false;
  const voucherDate = v.voucherDate || v.createdAt || v.created_at || new Date().toISOString();

  const ksaJeddahAirport = v.ksaJeddahAirport !== undefined && v.ksaJeddahAirport !== null ? String(v.ksaJeddahAirport).trim() : '';
  const ksaJeddahSpecial = v.ksaJeddahSpecial !== undefined && v.ksaJeddahSpecial !== null ? String(v.ksaJeddahSpecial).trim() : '';
  const ksaJeddahSharing = v.ksaJeddahSharing !== undefined && v.ksaJeddahSharing !== null ? String(v.ksaJeddahSharing).trim() : '';
  const ksaMakkahSharing = v.ksaMakkahSharing !== undefined && v.ksaMakkahSharing !== null ? String(v.ksaMakkahSharing).trim() : '';
  const ksaMakkahSpecial = v.ksaMakkahSpecial !== undefined && v.ksaMakkahSpecial !== null ? String(v.ksaMakkahSpecial).trim() : '';
  const ksaMadinahSharing = v.ksaMadinahSharing !== undefined && v.ksaMadinahSharing !== null ? String(v.ksaMadinahSharing).trim() : '';
  const ksaMadinahSpecial = v.ksaMadinahSpecial !== undefined && v.ksaMadinahSpecial !== null ? String(v.ksaMadinahSpecial).trim() : '';

  const metaObj = {
    isSelfVisa,
    voucherDate,
    ksaJeddahAirport,
    ksaJeddahSpecial,
    ksaJeddahSharing,
    ksaMakkahSharing,
    ksaMakkahSpecial,
    ksaMadinahSharing,
    ksaMadinahSpecial,
  };

  const passengers = (v.passengers && v.passengers.length > 0)
    ? v.passengers.map((p, idx) => (idx === 0 ? { ...p, ...metaObj } : p))
    : [{ ...metaObj }];

  return {
    id: String(v.id || ('custom-' + Date.now())),
    slug: v.slug || slugify(v.party) || ('voucher-' + Date.now()),
    party: v.party || '',
    sheet_name: v.sheetName || '',
    ub_number: ub,
    voucher_ref_no: ub,
    company_name: v.companyName || 'CHEEPA FJ TRAVELS',
    emergency_contact: v.emergencyContact || '+966 50 627 7492',
    phone: v.phone || 'MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683',
    voucher_title: v.voucherTitle || 'UMRAH PACKAGE VOUCHER',
    executive: v.executive || 'MUHAMMAD FAIZAN',
    pax_counts: v.paxCounts || '',
    total_pax: v.totalPax || (passengers ? passengers.length : 1),
    passengers: passengers,
    accommodations: v.accommodations || [],
    transports: v.transports || [],
    flights: v.flights || [],
    ground_transport: v.groundTransport || '+92 328 8189989',
    makkah_helpline: v.makkahHelpline || '+966 53 649 2846',
    madinah_helpline: v.madinahHelpline || '+966 57 593 0550',
    pakistan_helpline: v.pakistanHelpline || 'MUHAMMAD FAIZAN 0311-2324764 / G.MURTAZA (HAJI) 0312-3608683',
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
    let list = [];
    if (customVouchers) {
      try {
        list = JSON.parse(customVouchers);
      } catch (e) {}
    }
    return list.map(v => {
      const key = (v.slug || v.id || '').toLowerCase();
      const override = overrideMap[key] || overrideMap[v.slug] || overrideMap[v.id];
      if (override) {
        return { ...v, ...override };
      }
      return v;
    });
  }
  return [];
}

export function getVoucherBySlug(slugOrId) {
  if (!slugOrId) return null;
  const normalized = decodeURIComponent(slugOrId).toLowerCase().trim();
  if (typeof window !== 'undefined') {
    const overridesRaw = localStorage.getItem('voucher_overrides');
    if (overridesRaw) {
      try {
        const overrideMap = JSON.parse(overridesRaw);
        if (overrideMap[normalized]) return overrideMap[normalized];
        if (overrideMap[slugOrId]) return overrideMap[slugOrId];
        for (const k in overrideMap) {
          if (k.toLowerCase() === normalized) return overrideMap[k];
        }
      } catch (e) {}
    }
  }
  const all = getAllVouchers();
  return all.find(v => (v.slug || '').toLowerCase() === normalized || (v.id || '').toString().toLowerCase() === normalized) || null;
}

export async function fetchSupabaseVouchers() {
  try {
    const { data, error } = await supabase.from('vouchers').select('*').order('created_at', { ascending: true });
    if (!error && Array.isArray(data)) {
      const overridesRaw = typeof window !== 'undefined' ? localStorage.getItem('voucher_overrides') : null;
      let overrideMap = {};
      if (overridesRaw) {
        try { overrideMap = JSON.parse(overridesRaw); } catch (e) {}
      }
      const remoteList = data.map(row => {
        const v = mapSupabaseToVoucher(row);
        const key = (v.slug || v.id || '').toLowerCase();
        const override = overrideMap[key] || overrideMap[v.slug] || overrideMap[v.id];
        return override ? { ...v, ...override } : v;
      });

      // Merge any locally stored custom vouchers so new vouchers immediately appear
      if (typeof window !== 'undefined') {
        const localCustomRaw = localStorage.getItem('custom_vouchers');
        if (localCustomRaw) {
          try {
            const localList = JSON.parse(localCustomRaw);
            for (const lv of localList) {
              const lvSlug = (lv.slug || '').toLowerCase();
              const lvId = (lv.id || '').toString().toLowerCase();
              const alreadyExists = remoteList.some(rv => 
                (rv.slug || '').toLowerCase() === lvSlug || 
                (rv.id || '').toString().toLowerCase() === lvId
              );
              if (!alreadyExists) {
                const key = lvSlug || lvId;
                const override = overrideMap[key] || overrideMap[lv.slug] || overrideMap[lv.id];
                remoteList.push(override ? { ...lv, ...override } : lv);
              }
            }
          } catch (e) {}
        }
      }

      return remoteList;
    }
  } catch (err) {
    console.warn('Supabase fetch error:', err);
  }
  return getAllVouchers();
}

export async function fetchSupabaseVoucherBySlug(slugOrId) {
  if (!slugOrId) return null;
  const normalized = decodeURIComponent(slugOrId).toLowerCase().trim();
  let result = null;
  try {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .or(`slug.eq.${normalized},id.eq.${normalized}`)
      .single();
    if (!error && data) {
      result = mapSupabaseToVoucher(data);
    }
  } catch (err) {}

  if (!result) {
    result = getVoucherBySlug(slugOrId);
  }

  // Apply any client-side override to guarantee freshly edited data displays
  if (result && typeof window !== 'undefined') {
    const overridesRaw = localStorage.getItem('voucher_overrides');
    if (overridesRaw) {
      try {
        const overrideMap = JSON.parse(overridesRaw);
        const key = (result.slug || result.id || slugOrId || '').toLowerCase();
        const override = overrideMap[key] || overrideMap[result.slug] || overrideMap[result.id] || overrideMap[normalized];
        if (override) {
          result = { ...result, ...override };
        }
      } catch (e) {}
    }
  }

  return result;
}

export async function updateVoucher(slugOrId, updatedData) {
  const normalizedKey = (slugOrId || updatedData.slug || updatedData.id || '').toLowerCase();
  
  if (typeof window !== 'undefined') {
    // 1. Update voucher_overrides map
    const overridesRaw = localStorage.getItem('voucher_overrides');
    let overrideMap = {};
    if (overridesRaw) {
      try {
        overrideMap = JSON.parse(overridesRaw);
      } catch (e) {}
    }
    overrideMap[normalizedKey] = { ...updatedData };
    if (updatedData.slug) {
      overrideMap[updatedData.slug] = { ...updatedData };
      overrideMap[updatedData.slug.toLowerCase()] = { ...updatedData };
    }
    if (updatedData.id) {
      overrideMap[updatedData.id] = { ...updatedData };
      overrideMap[String(updatedData.id).toLowerCase()] = { ...updatedData };
    }
    localStorage.setItem('voucher_overrides', JSON.stringify(overrideMap));

    // 2. Also directly update in custom_vouchers list
    const customVouchersRaw = localStorage.getItem('custom_vouchers');
    if (customVouchersRaw) {
      try {
        let list = JSON.parse(customVouchersRaw);
        const idx = list.findIndex(v => 
          (v.slug || '').toLowerCase() === normalizedKey || 
          (v.id || '').toString().toLowerCase() === normalizedKey ||
          (v.slug || '').toLowerCase() === (updatedData.slug || '').toLowerCase() ||
          (v.id || '').toString().toLowerCase() === (updatedData.id || '').toString().toLowerCase()
        );
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updatedData };
        } else {
          list.push({ ...updatedData });
        }
        localStorage.setItem('custom_vouchers', JSON.stringify(list));
      } catch (e) {}
    }
  }

  // 3. Update Supabase
  try {
    const row = mapVoucherToSupabase(updatedData);
    const { error: upsertErr } = await supabase.from('vouchers').upsert(row, { onConflict: 'id' });
    if (upsertErr) {
      // Fallback update by slug
      if (updatedData.slug) {
        await supabase.from('vouchers').update(row).eq('slug', updatedData.slug);
      }
    }
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
    const idx = list.findIndex(v => 
      (v.slug || '').toLowerCase() === (newVoucher.slug || '').toLowerCase() ||
      (v.id || '').toString().toLowerCase() === (newVoucher.id || '').toString().toLowerCase()
    );
    if (idx !== -1) {
      list[idx] = newVoucher;
    } else {
      list.push(newVoucher);
    }
    localStorage.setItem('custom_vouchers', JSON.stringify(list));
  }

  try {
    const row = mapVoucherToSupabase(newVoucher);
    const { error: insErr } = await supabase.from('vouchers').insert(row);
    if (insErr) {
      console.warn('Supabase insert failed, trying upsert:', insErr);
      await supabase.from('vouchers').upsert(row, { onConflict: 'id' });
    }
  } catch (e) {
    console.warn('Supabase insert warning:', e);
  }

  return newVoucher;
}
