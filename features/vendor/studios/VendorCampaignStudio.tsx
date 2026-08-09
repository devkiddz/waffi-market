import Link from 'next/link';
import {
  Clapperboard,
  Clock3,
  Images,
  ShieldCheck
} from 'lucide-react';

import {
  StudioDestinationPicker
} from '@/features/studio-controls';
import {
  AdminMetric,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  adminFieldClass
} from '@/features/admin/components';
import { getVendorAccess } from '@/features/vendor/auth/vendorAccess';
import { prisma } from '@/lib/prisma';

import { archiveVendorRecord, saveVendorCampaign } from './actions';
import { MediaChoiceGrid } from './MediaChoiceGrid';
import { VendorCampaignPreviewButton } from './VendorCampaignPreviewButton';

function dateTimeValue(value: Date | null | undefined) {
  if (!value) return '';
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

export async function VendorCampaignStudio({
  type,
  editId
}: {
  type: 'STORY' | 'REEL';
  editId?: string;
}) {
  const access = await getVendorAccess();

  if (!access.permissions.has('campaign:view')) {
    throw new Error('Campaign access is required.');
  }

  const campaignCapability = type === 'REEL' ? 'reels' : 'stories';

  if (!access.studio.capabilities[campaignCapability]) {
    throw new Error(
      `${type === 'REEL' ? 'Reels' : 'Stories'} are not available on the ${access.studio.tier.toLowerCase()} Vendor Studio tier.`
    );
  }

  if (type === 'REEL' && !access.studio.capabilities.video) {
    throw new Error('Video publishing is not available for this vendor.');
  }

  const [campaigns, media, products, promotions, collections, editing] =
    await Promise.all([
      prisma.storeStudioCampaign.findMany({
        where: {
          workspaceId: access.workspace.id,
          vendorProfileId: access.vendor.id,
          type,
        },
        include: {
          assets: {
            orderBy: { position: 'asc' },
            include: {
              mediaAsset: { select: { metadata: true } },
              mobileMediaAsset: { select: { metadata: true } },
              coverMediaAsset: { select: { metadata: true } },
              posterMediaAsset: { select: { metadata: true } }
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.mediaAsset.findMany({
        where: {
          workspaceId: access.workspace.id,
          vendorProfileId: access.vendor.id,
          status: 'ACTIVE',
          resourceType:
            type === 'REEL'
              ? 'VIDEO'
              : access.studio.capabilities.video
                ? { in: ['IMAGE', 'VIDEO'] }
                : 'IMAGE'
        },
        orderBy: { createdAt: 'desc' },
        take: 150
      }),
      prisma.product.findMany({
        where: {
          workspaceId: access.workspace.id,
          vendorProfileId: access.vendor.id,
          status: 'PUBLISHED',
          active: true
        },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          status: true,
          active: true,
          images: {
            orderBy: [{ primary: 'desc' }, { position: 'asc' }],
            take: 1,
            select: { url: true }
          },
          variants: {
            where: { active: true },
            include: { inventory: true }
          }
        }
      }),
      prisma.promotion.findMany({
        where: {
          workspaceId: access.workspace.id,
          vendorProfileId: access.vendor.id,
          status: 'PUBLISHED',
          active: true
        },
        orderBy: { title: 'asc' },
        select: {
          id: true,
          title: true,
          slug: true,
          bannerMediaAsset: { select: { secureUrl: true } }
        }
      }),
      prisma.storeCollection.findMany({
        where: {
          workspaceId: access.workspace.id,
          vendorProfileId: access.vendor.id,
          status: 'PUBLISHED',
          active: true
        },
        orderBy: { title: 'asc' },
        select: {
          id: true,
          title: true,
          slug: true,
          coverMediaAsset: { select: { secureUrl: true } }
        }
      }),
      editId
        ? prisma.storeStudioCampaign.findFirst({
            where: {
              id: editId,
              workspaceId: access.workspace.id,
              vendorProfileId: access.vendor.id,
              type
            },
            include: {
              assets: {
            orderBy: { position: 'asc' },
            include: {
              mediaAsset: { select: { metadata: true } },
              mobileMediaAsset: { select: { metadata: true } },
              coverMediaAsset: { select: { metadata: true } },
              posterMediaAsset: { select: { metadata: true } }
            }
          }
            }
          })
        : null
    ]);

  const plural = type === 'REEL' ? 'Reels' : 'Stories';
  const route = type === 'REEL' ? '/vendor/reels' : '/vendor/stories';
  const action = saveVendorCampaign.bind(null, type);
  const firstAsset = editing?.assets[0];
  const destinationValue = firstAsset?.productId
    ? `product:${firstAsset.productId}`
    : firstAsset?.promotionId
      ? `promotion:${firstAsset.promotionId}`
      : firstAsset?.collectionId
        ? `collection:${firstAsset.collectionId}`
        : '';

  return (
    <AdminPage>
      <div className="mx-auto max-w-[96rem] space-y-5">
        <AdminPageHeader
          eyebrow={`${access.vendor.name} · ${access.studio.tier} Studio`}
          title={`Vendor ${plural}`}
          description={`${plural} use your private Media Studio gallery. Marketplace publication remains subject to Waffi Market approval and distribution authority.`}
        />

        <section className="grid gap-3 sm:grid-cols-3">
          <AdminMetric icon={Clapperboard} label={plural} value={campaigns.length} />
          <AdminMetric
            icon={Clock3}
            label="Awaiting review"
            value={campaigns.filter(item => item.status === 'PENDING_REVIEW').length}
          />
          <AdminMetric
            icon={ShieldCheck}
            label="Public"
            value={
              campaigns.filter(item =>
                ['ACTIVE', 'SCHEDULED'].includes(item.status)
              ).length
            }
          />
        </section>

        {access.permissions.has('campaign:manage') ? (
          <AdminPanel
            title={editing ? `Edit ${editing.title}` : `Create ${type.toLowerCase()}`}
            description={
              type === 'REEL'
                ? 'Upload or select portrait videos. Each selected video becomes an ordered Reel asset.'
                : 'Upload or select images and videos to build an ordered Story timeline.'
            }
          >
            <form action={action} className="grid gap-4 lg:grid-cols-3">
              {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

              <Field label="Campaign title">
                <input
                  name="title"
                  defaultValue={editing?.title}
                  required
                  className={adminFieldClass}
                />
              </Field>

              <Field label="Destination">
                <StudioDestinationPicker
                  initialValue={destinationValue}
                  options={[
                    ...products.map(product => ({
                      id: product.id,
                      type: 'product' as const,
                      label: product.name,
                      description: `${product.status.replaceAll('_', ' ')} · ${product.variants.reduce((sum, variant) => sum + Math.max(0, (variant.inventory?.quantity ?? 0) - (variant.inventory?.reserved ?? 0)), 0)} available`,
                      imageUrl: product.images[0]?.url ?? null,
                      href: `/store?product=${encodeURIComponent(product.id)}`,
                      available: product.active && product.status === 'PUBLISHED'
                    })),
                    ...collections.map(collection => ({
                      id: collection.id,
                      type: 'collection' as const,
                      label: collection.title,
                      description: 'Published collection',
                      imageUrl: collection.coverMediaAsset?.secureUrl ?? null,
                      href: `/store?collection=${encodeURIComponent(collection.id)}`,
                      available: true
                    })),
                    ...promotions.map(promotion => ({
                      id: promotion.id,
                      type: 'promotion' as const,
                      label: promotion.title,
                      description: 'Published promotion',
                      imageUrl: promotion.bannerMediaAsset?.secureUrl ?? null,
                      href: `/promos/${promotion.slug}`,
                      available: true
                    }))
                  ]}
                />
              </Field>

              <Field label="Requested priority">
                <input
                  name="requestedPriority"
                  type="number"
                  min={0}
                  max={10}
                  defaultValue={editing?.requestedPriority ?? 0}
                  className={adminFieldClass}
                />
              </Field>

              {access.studio.capabilities.scheduling ? (
                <>
                  <Field label="Starts" optional>
                    <input
                      name="startsAt"
                      type="datetime-local"
                      defaultValue={dateTimeValue(editing?.startsAt)}
                      className={adminFieldClass}
                    />
                  </Field>

                  <Field label="Ends" optional>
                    <input
                      name="endsAt"
                      type="datetime-local"
                      defaultValue={dateTimeValue(editing?.endsAt)}
                      className={adminFieldClass}
                    />
                  </Field>
                </>
              ) : null}

              <Field label="Description" className="lg:col-span-3" optional>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editing?.description ?? ''}
                  className={adminFieldClass}
                />
              </Field>

              <fieldset className="lg:col-span-3">
                <legend className="mb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {type === 'REEL' ? 'Video gallery' : 'Story media gallery'}
                </legend>
                <MediaChoiceGrid
                  media={media}
                  name="mediaAssetIds"
                  multiple
                  initialIds={
                    editing?.assets
                      .map(item => item.mediaAssetId)
                      .filter((value): value is string => Boolean(value)) ?? []
                  }
                  apiBasePath="/api/vendor/media"
                  purpose={type === 'REEL' ? 'reels' : 'stories'}
                  uploadAccept={
                    type === 'REEL'
                      ? 'video'
                      : access.studio.capabilities.video
                        ? 'image-and-video'
                        : 'image'
                  }
                  acceptedResourceTypes={
                    type === 'REEL'
                      ? ['VIDEO']
                      : access.studio.capabilities.video
                        ? ['IMAGE', 'VIDEO']
                        : ['IMAGE']
                  }
                />
              </fieldset>

              <div className="flex flex-wrap gap-3 lg:col-span-3">
                <button
                  name="intent"
                  value="draft"
                  className="h-11 rounded-full border border-border px-5 text-xs font-bold"
                >
                  Save draft
                </button>
                <button
                  name="intent"
                  value="submit"
                  className="h-11 rounded-full bg-foreground px-5 text-xs font-bold text-background"
                >
                  Submit for approval
                </button>
                {editing ? (
                  <Link
                    href={route}
                    className="h-11 rounded-full px-5 text-xs font-bold leading-[2.75rem] text-muted-foreground"
                  >
                    Cancel editing
                  </Link>
                ) : null}
              </div>
            </form>
          </AdminPanel>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {campaigns.map(campaign => {
            const asset = campaign.assets[0];

            return (
              <article
                key={campaign.id}
                className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/75"
              >
                <div className="aspect-[9/12] max-h-72 bg-muted">
                  {asset?.mediaType === 'VIDEO' ? (
                    <video
                      src={asset.mediaUrl}
                      poster={asset.posterUrl ?? undefined}
                      muted
                      playsInline
                      preload="metadata"
                      className="size-full object-cover"
                    />
                  ) : asset ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.mediaUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="grid size-full place-items-center">
                      <Images className="size-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <span className="rounded-full bg-muted px-2 py-1 text-[8px] font-black">
                    {campaign.status.replaceAll('_', ' ')}
                  </span>
                  <h2 className="mt-3 text-lg font-black">{campaign.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {campaign.assets.length} asset
                    {campaign.assets.length === 1 ? '' : 's'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <VendorCampaignPreviewButton campaign={campaign} />
                    <Link
                      href={`${route}?edit=${campaign.id}`}
                      className="rounded-full bg-foreground px-3 py-2 text-[9px] font-bold text-background"
                    >
                      Edit
                    </Link>
                    <form action={archiveVendorRecord.bind(null, 'campaign')}>
                      <input type="hidden" name="id" value={campaign.id} />
                      <button className="rounded-full border border-border px-3 py-2 text-[9px] font-bold">
                        Archive
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </AdminPage>
  );
}

function Field({
  label,
  children,
  className = '',
  optional = false
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  optional?: boolean;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
        {optional ? ' · optional' : ''}
      </span>
      {children}
    </label>
  );
}
