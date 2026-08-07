'use client';

import type { ReactNode } from 'react';

import { usePathname } from 'next/navigation';

import { isCustomerExperienceRoute } from '@/features/customer-experience/customerExperienceRoutes';

type ApplicationShellBoundaryProps = {
  customerShell: ReactNode;
  operationalShell: ReactNode;
};

/**
 * Customer routes use the Shelsea navigation, sidebar, Hub and footer.
 * Admin, Vendor and Developer-login routes own dedicated operational shells
 * and must not inherit customer chrome or spacing.
 */
export default function ApplicationShellBoundary({
  customerShell,
  operationalShell
}: ApplicationShellBoundaryProps) {
  const pathname = usePathname();

  return isCustomerExperienceRoute(pathname) ? customerShell : operationalShell;
}
