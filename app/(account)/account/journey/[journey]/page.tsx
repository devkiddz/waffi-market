import type {
  Metadata
} from 'next';

import {
  cookies,
  headers
} from 'next/headers';

import {
  notFound,
  redirect
} from 'next/navigation';

import {
  CustomerJourneyPage
} from '@/features/customer-dashboard/journey/CustomerJourneyPage';

import {
  getCustomerDashboardData
} from '@/features/customer-dashboard';

import {
  getCustomerJourneyDefinition,
  isCustomerJourneySlug
} from '@/features/customer-experience/customerJourneyRoutes';

import {
  ACTIVE_WORKSPACE_COOKIE
} from '@/features/workspace/workspaceConstants';

import {
  getUserWorkspaces
} from '@/features/workspace/services/get-user-workspaces';

import {
  auth
} from '@/lib/auth';

type CustomerJourneyRouteProps = {
  params: Promise<{
    journey: string;
  }>;
};

export async function generateMetadata({
  params
}: CustomerJourneyRouteProps): Promise<Metadata> {
  const {
    journey
  } = await params;

  if (
    !isCustomerJourneySlug(
      journey
    )
  ) {
    return {
      title:
        'Customer Journey'
    };
  }

  const definition =
    getCustomerJourneyDefinition(
      journey
    );

  return {
    title:
      `${definition.title} Journey`,

    description:
      definition.description
  };
}

export default async function CustomerJourneyRoute({
  params
}: CustomerJourneyRouteProps) {
  const {
    journey
  } = await params;

  if (
    !isCustomerJourneySlug(
      journey
    )
  ) {
    notFound();
  }

  const destination =
    `/account/journey/${journey}`;

  const session =
    await auth.api.getSession({
      headers:
        await headers()
    });

  if (!session?.user?.id) {
    redirect(
      `/sign-in?returnTo=${encodeURIComponent(
        destination
      )}`
    );
  }

  const cookieStore =
    await cookies();

  const preferredWorkspaceId =
    cookieStore.get(
      ACTIVE_WORKSPACE_COOKIE
    )?.value ?? null;

  const workspaceRuntime =
    await getUserWorkspaces(
      session.user.id,
      preferredWorkspaceId
    );

  const activeWorkspace =
    workspaceRuntime.activeWorkspace;

  if (!activeWorkspace) {
    throw new Error(
      'Shelsea could not resolve an active workspace for this customer journey.'
    );
  }

  const dashboardData =
    await getCustomerDashboardData(
      session.user.id,
      activeWorkspace
    );

  return (
    <CustomerJourneyPage
      journey={journey}
      data={dashboardData}
    />
  );
}
