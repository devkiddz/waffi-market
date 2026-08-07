import Link from 'next/link';

import {
  BarChart3,
  Boxes,
  BrainCircuit,
  Clock3,
  ExternalLink,
  GalleryVerticalEnd,
  Layers3,
  ShoppingBag,
  Sparkles
} from 'lucide-react';

import {
  AdminGridLink,
  AdminMetric,
  AdminPage,
  AdminPageHeader,
  AdminPanel
} from '@/features/admin/components';
import { getVendorAccess } from '@/features/vendor/auth/vendorAccess';
import { prisma } from '@/lib/prisma';

export default async function VendorOverviewPage() {
  const access = await getVendorAccess();

  const [
    products,
    media,
    campaigns,
    collections,
    promotions,
    pending
  ] = await Promise.all([
    prisma.product.count({
      where: {
        workspaceId: access.workspace.id,
        vendorProfileId: access.vendor.id,
        status: { not: 'ARCHIVED' }
      }
    }),
    prisma.mediaAsset.count({
      where: {
        workspaceId: access.workspace.id,
        vendorProfileId: access.vendor.id,
        status: 'ACTIVE'
      }
    }),
    prisma.storeStudioCampaign.count({
      where: {
        workspaceId: access.workspace.id,
        vendorProfileId: access.vendor.id,
        status: { not: 'EXPIRED' }
      }
    }),
    prisma.storeCollection.count({
      where: {
        workspaceId: access.workspace.id,
        vendorProfileId: access.vendor.id,
        status: { not: 'ARCHIVED' }
      }
    }),
    prisma.promotion.count({
      where: {
        workspaceId: access.workspace.id,
        vendorProfileId: access.vendor.id,
        status: { not: 'ARCHIVED' }
      }
    }),
    prisma.adminApprovalRequest.count({
      where: {
        workspaceId: access.workspace.id,
        requestedById: access.session.user.id,
        status: {
          in: ['PENDING', 'IN_INSPECTION', 'ON_HOLD', 'CHANGES_REQUESTED']
        }
      }
    })
  ]);

  return (
    <AdminPage>
      <div className="mx-auto max-w-[96rem] space-y-5">
        <AdminPageHeader
          eyebrow="Vendor Studio"
          title={access.vendor.name}
          description="Manage your catalogue and campaigns inside Shelsea. Every public change remains subject to workspace approval."
          action={
            <Link
              href={`/shops/${encodeURIComponent(access.vendor.slug)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-4 text-xs font-bold text-background">
              View public shop
              <ExternalLink className="size-3.5" />
            </Link>
          }
        />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminMetric icon={Boxes} label="Products" value={products} />
          <AdminMetric icon={GalleryVerticalEnd} label="Media assets" value={media} />
          <AdminMetric icon={Sparkles} label="Campaigns" value={campaigns} />
          <AdminMetric icon={Clock3} label="Open approvals" value={pending} />
        </section>

        <AdminPanel
          title="Studios"
          description="Each Studio shares the same vendor ownership, Media Gallery and approval boundary.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <AdminGridLink
              href="/vendor/products"
              icon={Boxes}
              title="Product Studio"
              description="Products, galleries, variants and stock."
              meta={`${products} records`}
            />
            <AdminGridLink
              href="/vendor/media"
              icon={GalleryVerticalEnd}
              title="Media Studio"
              description="Upload and reuse your images and videos."
              meta={`${media} assets`}
            />
            <AdminGridLink
              href="/vendor/collections"
              icon={Layers3}
              title="Collection Studio"
              description="Assemble your published products into discovery groups."
              meta={`${collections} collections`}
            />
            <AdminGridLink
              href="/vendor/promotions"
              icon={ShoppingBag}
              title="Promotion Studio"
              description="Submit controlled offers for your catalogue."
              meta={`${promotions} promotions`}
            />
            <AdminGridLink
              href="/vendor/stories"
              icon={Sparkles}
              title="Stories"
              description="Build independent Story campaigns from uploaded media."
            />
            <AdminGridLink
              href="/vendor/reels"
              icon={Sparkles}
              title="Reels"
              description="Build independent portrait-video campaigns."
            />
            <AdminGridLink
              href="/vendor/analytics"
              icon={BarChart3}
              title="Analytics"
              description="Review activity associated with your products and campaigns."
            />
            <AdminGridLink
              href="/vendor/assistant"
              icon={BrainCircuit}
              title="AJ Studio Manager"
              description="Prepare reviewable listing, campaign and submission suggestions."
              meta="Draft-only"
            />
          </div>
        </AdminPanel>

        <div className="rounded-[2rem] border border-border/60 bg-card/70 p-5 text-xs leading-5 text-muted-foreground">
          <strong className="text-foreground">Commerce Mode:</strong>{' '}
          {access.workspace.commerceMode.replaceAll('_', ' ')}. Your public shop
          uses the same approved products, Collections, promotions, Stories and
          Reels managed through these Studios.
        </div>
      </div>
    </AdminPage>
  );
}
