import type { ReactNode } from 'react';

import { getVendorAccess } from '@/features/vendor/auth/vendorAccess';
import { VendorShell } from '@/features/vendor/shell/VendorShell';

export const dynamic = 'force-dynamic';

export default async function VendorLayout({ children }: { children: ReactNode }) {
  const access = await getVendorAccess();

  return (
    <VendorShell
      vendor={access.vendor.name}
      vendorSlug={access.vendor.slug}
      role={access.membership.role}
      permissions={Array.from(access.permissions)}
      studioCapabilities={access.studio.capabilities}>
      {children}
    </VendorShell>
  );
}
