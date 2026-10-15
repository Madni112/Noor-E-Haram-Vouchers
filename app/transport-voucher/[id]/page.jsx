'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function TransportVoucherSheetRedirect() {
  const params = useParams();
  const router = useRouter();
  useEffect(() => {
    if (params?.id) {
      router.replace(`/transport-only-voucher/${params.id}`);
    } else {
      router.replace('/transport-only-voucher');
    }
  }, [params, router]);
  return null;
}
