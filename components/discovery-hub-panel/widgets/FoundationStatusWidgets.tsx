'use client';

import {
  ArrowRight,
  Bell,
  CircleDashed,
  Gift,
  Headphones,
  LayoutDashboard,
  TicketPercent
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  useRouter
} from 'next/navigation';

import {
  useFeedExperience
} from '@/features/feed-experience';

import {
  useIdentity
} from '@/providers/IdentityProvider';

import {
  useDiscoveryHub
} from '@/providers/DiscoveryHubProvider';

type FoundationCardProps = {
  eyebrow: string;
  title: string;
  description: string;

  statusLabel: string;
  statusDescription: string;

  actionLabel: string;
  onAction: () => void;

  icon:
    ReactNode;
};

function FoundationCard({
  eyebrow,
  title,
  description,
  statusLabel,
  statusDescription,
  actionLabel,
  onAction,
  icon
}: FoundationCardProps) {
  return (
    <section
      className="
        overflow-hidden rounded-3xl
        border border-primary/12
        bg-card/40 p-5
        shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_60px_rgba(0,0,0,0.25)]
      ">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="
              text-[11px] font-semibold
              uppercase tracking-[0.2em]
              text-primary/45
            ">
            {eyebrow}
          </p>

          <h3
            className="
              mt-1 text-base
              font-bold tracking-tight
              text-primary
            ">
            {title}
          </h3>

          <p
            className="
              mt-1 text-xs leading-5
              text-primary/50
            ">
            {description}
          </p>
        </div>

        <span
          className="
            grid size-11 shrink-0
            place-items-center
            rounded-2xl
            bg-primary/10
            text-primary
          ">
          {icon}
        </span>
      </header>

      <div
        className="
          mt-5 rounded-2xl
          border border-primary/10
          bg-background/35 p-4
        ">
        <div className="flex items-center gap-2">
          <CircleDashed className="size-4 text-primary/55" />

          <p className="text-xs font-semibold text-primary">
            {statusLabel}
          </p>
        </div>

        <p className="mt-2 text-[11px] leading-5 text-primary/50">
          {statusDescription}
        </p>
      </div>

      <button
        type="button"
        onClick={onAction}
        className="
          mt-4 flex w-full
          items-center justify-center
          gap-2 rounded-full
          bg-primary px-4 py-2.5
          text-xs font-semibold
          text-background transition
          hover:opacity-90
        ">
        {actionLabel}

        <ArrowRight className="size-3.5" />
      </button>
    </section>
  );
}

export function RewardsStatusWidget() {
  const router =
    useRouter();

  const {
    user,
    isAuthenticated
  } = useIdentity();

  const tier =
    user?.tier?.trim() ||
    (isAuthenticated
      ? 'member'
      : 'guest');

  return (
    <FoundationCard
      eyebrow="Membership"
      title="Rewards"
      description="Your membership identity is real; a points ledger is not active yet."
      statusLabel={`Current tier: ${tier}`}
      statusDescription="Shelsea will not display invented points, expiry dates or progress. The Rewards workspace documents the prepared capability until the ledger is implemented."
      actionLabel="Open Rewards"
      onAction={() =>
        router.push(
          '/rewards'
        )
      }
      icon={
        <Gift className="size-5" />
      }
    />
  );
}

export function CouponsStatusWidget() {
  const router =
    useRouter();

  return (
    <FoundationCard
      eyebrow="Offers"
      title="Coupons"
      description="A customer coupon wallet has not been activated in the production data model."
      statusLabel="No verified coupons"
      statusDescription="Only administrator-approved promotions shown in the Store are currently actionable. Fictional free-delivery and cash-off coupons have been removed from this Hub surface."
      actionLabel="Explore live promotions"
      onAction={() =>
        router.push(
          '/store?category=deals'
        )
      }
      icon={
        <TicketPercent className="size-5" />
      }
    />
  );
}

export function NotificationStatusWidget() {
  const router =
    useRouter();

  return (
    <FoundationCard
      eyebrow="Alerts"
      title="Notifications"
      description="The notification preference surface is prepared for the production Notification Engine."
      statusLabel="Unread count unavailable"
      statusDescription="No fake unread badge, push state or offer subscription is displayed. Order, list, delivery and support notifications will connect here when the engine is introduced."
      actionLabel="Open notification settings"
      onAction={() =>
        router.push(
          '/settings/notifications'
        )
      }
      icon={
        <Bell className="size-5" />
      }
    />
  );
}

export function HubSettingsStatusWidget() {
  const router =
    useRouter();

  const {
    groups,
    widgets
  } = useDiscoveryHub();

  return (
    <FoundationCard
      eyebrow="Discovery control"
      title="Hub Settings"
      description="A truthful projection of the Hub capabilities currently resolved for this customer surface."
      statusLabel={`${widgets.length} widgets across ${groups.length} groups`}
      statusDescription="The current Hub resolver controls eligibility and ordering. Dedicated customer customization preferences will be added without replacing the working resolver."
      actionLabel="Open Settings"
      onAction={() =>
        router.push(
          '/settings'
        )
      }
      icon={
        <LayoutDashboard className="size-5" />
      }
    />
  );
}

export function CustomerSupportWidget() {
  const router =
    useRouter();

  const {
    intent,
    context
  } = useFeedExperience();

  const openSupport =
    () => {
      const query =
        new URLSearchParams({
          source:
            'discovery-hub',

          intent:
            intent.type,

          surface:
            intent.surface ??
            'customer'
        });

      if (
        intent.targetId
      ) {
        query.set(
          'targetId',
          intent.targetId
        );
      }

      if (
        intent.categorySlug
      ) {
        query.set(
          'category',
          intent.categorySlug
        );
      }

      if (
        context.commerce?.orders
          .activeDelivery
          ?.orderNumber
      ) {
        query.set(
          'order',
          context.commerce.orders
            .activeDelivery
            .orderNumber
        );
      }

      router.push(
        `/support?${query.toString()}`
      );
    };

  return (
    <FoundationCard
      eyebrow="Customer care"
      title="Support"
      description="Carry the current product, order, list or delivery context into the customer-support workspace."
      statusLabel="Support entry ready"
      statusDescription="Case creation and live customer messaging are not active yet. The prepared workspace routes customers to the correct journey while preserving useful context."
      actionLabel="Open Support"
      onAction={
        openSupport
      }
      icon={
        <Headphones className="size-5" />
      }
    />
  );
}
