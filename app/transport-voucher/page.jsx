'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TransportVoucherRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/transport-only-voucher');
  }, [router]);
  return null;
}
