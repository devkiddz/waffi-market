import { Suspense } from 'react';

import { getOptionalAdminAccess } from '@/features/admin/auth/adminPermissions';
import FeedExperienceWorkspace from '@/features/feed-experience/layout/FeedExperienceWorkspace';

/** Deep Discovery remains available for collections, promotions and list-building flows. */
export default async function DiscoverPage() {
  const adminAccess = await getOptionalAdminAccess();
  return (
    <Suspense fallback={null}>
      <FeedExperienceWorkspace
        canManageStoreStudio={Boolean(adminAccess?.permissions.has('approval:review'))}
        storeStudioWorkspaceId={adminAccess?.membership.workspaceId ?? null}
      />
    </Suspense>
  );
}
