import type {
  Metadata
} from 'next';

import {
  headers
} from 'next/headers';

import {
  notFound
} from 'next/navigation';

import {
  ProductPageExperience
} from '@/features/product-page/components';

import {
  getProductPage
} from '@/features/product-page/server';

import {
  auth
} from '@/lib/auth';

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic =
  'force-dynamic';

export const revalidate =
  0;

export async function generateMetadata({
  params
}: ProductPageProps): Promise<Metadata> {
  const {
    id: slug
  } = await params;

  const data =
    await getProductPage(
      slug
    );

  if (!data) {
    return {
      title:
        'Product unavailable',
      robots: {
        index: false,
        follow: false
      }
    };
  }

  const image =
    data.product.images?.[0] ??
    data.product.variants[0]?.image;

  return {
    title:
      data.product.name,

    description:
      data.product.shortDescription ||
      data.product.longDescription ||
      `Shop ${data.product.name} on Shelsea.`,

    alternates: {
      canonical:
        `/products/${encodeURIComponent(data.product.slug)}`
    },

    openGraph: {
      type:
        'website',
      title:
        data.product.name,
      description:
        data.product.shortDescription ||
        `Shop ${data.product.name} on Shelsea.`,
      url:
        `/products/${encodeURIComponent(data.product.slug)}`,
      ...(image
        ? {
            images: [
              {
                url:
                  image,
                alt:
                  data.product.name
              }
            ]
          }
        : {})
    }
  };
}

export default async function ProductPage({
  params
}: ProductPageProps) {
  const {
    id: slug
  } = await params;

  const data =
    await getProductPage(
      slug
    );

  if (!data) {
    notFound();
  }

  const session =
    await auth.api.getSession({
      headers:
        await headers()
    });

  const resolvedData = {
    ...data,
    reviews: {
      ...data.reviews,
      canWriteReview:
        Boolean(
          session?.user?.id
        )
    }
  };

  const firstVariant =
    data.product.variants.find(
      variant =>
        variant.stockLeft > 0
    ) ??
    data.product.variants[0];

  const image =
    data.product.images?.[0] ??
    firstVariant?.image;

  const productJsonLd = {
    '@context':
      'https://schema.org',
    '@type':
      'Product',
    name:
      data.product.name,
    description:
      data.product.longDescription ||
      data.product.shortDescription,
    sku:
      firstVariant?.id,
    ...(image
      ? {
          image: [
            image
          ]
        }
      : {}),
    ...(data.brand
      ? {
          brand: {
            '@type':
              'Brand',
            name:
              data.brand.name
          }
        }
      : {}),
    seller: {
      '@type':
        'Organization',
      name:
        data.product.merchant?.name ??
        data.workspace.name
    },
    ...(firstVariant
      ? {
          offers: {
            '@type':
              'Offer',
            priceCurrency:
              data.currency,
            price:
              firstVariant.price,
            availability:
              firstVariant.stockLeft > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            url:
              `/products/${encodeURIComponent(data.product.slug)}`
          }
        }
      : {}),
    ...(data.reviews.reviewCount > 0
      ? {
          aggregateRating: {
            '@type':
              'AggregateRating',
            ratingValue:
              data.reviews.averageRating,
            reviewCount:
              data.reviews.reviewCount
          }
        }
      : {})
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              productJsonLd
            ).replace(
              /</g,
              '\\u003c'
            )
        }}
      />

      <ProductPageExperience
        data={
          resolvedData
        }
      />
    </>
  );
}
