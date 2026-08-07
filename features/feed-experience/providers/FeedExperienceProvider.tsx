'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';

import { publishCustomerExperienceIntent } from '@/features/customer-experience/customerExperienceEvents';
import { recordProductView } from '@/features/product-activity';

import {
  previewProductInHub
} from '@/features/product-experience-state/hubProductPreviewBridge';

import {
  selectProductVariant
} from '@/features/product-experience-state';

import type { ExperienceTarget, FeedActions, FeedContext, FeedExperience, FeedIntent } from '../contracts';

import { feedExperienceEngine } from '../engine';

const MIN_RESOLUTION_DURATION_MS = 320;

/* AJ_FEED_PREVIEW_UPDATES_HUB_ONLY_V1 */

// ============================================================
// PRODUCT DETAILS DISCLOSURE
// ============================================================

export type ProductDetailsDisclosure = {
  productId: string | null;
  expanded: boolean;
  requestId: number;
};

export type ProductDetailsControls = {
  reveal: (productId: string) => void;
  collapse: (productId?: string) => void;
  toggle: (productId: string) => void;
};

// ============================================================
// CONTEXT CONTRACT
// ============================================================

type FeedExperienceContextValue = {
  intent: FeedIntent;

  context: FeedContext;

  experience: FeedExperience;

  actions: FeedActions;

  isResolving: boolean;

  pendingIntent: FeedIntent | null;

  /**
   * Presentation state for progressively revealing the
   * complete Product Experience inside the central Feed.
   *
   * The Product Experience remains one intent. Revealing
   * details does not create another page, modal or intent.
   */
  productDetailsDisclosure: ProductDetailsDisclosure;

  productDetailsControls: ProductDetailsControls;

  /**
   * Restores the latest non-product experience captured before
   * the current Product Experience. This is the runtime bridge
   * for the Hub's Continue Discovery action.
   */
  continueDiscovery: () => void;

};

const FeedExperienceContext = createContext<FeedExperienceContextValue | null>(null);

// ============================================================
// PROVIDER PROPS
// ============================================================

type FeedExperienceProviderProps = {
  children: ReactNode;

  initialIntent: FeedIntent;

  context: FeedContext;

  baseActions: Omit<
    FeedActions,
    'previewProduct' | 'openExperience' | 'restoreExperience' | 'resetExperience'
  >;

  /**
   * Store-owned providers publish their richer in-feed intent so the
   * single global Discovery Hub can remain synchronized without the
   * Store rendering a second Hub instance.
   */
  broadcastIntent?: boolean;
};

// ============================================================
// INTENT FACTORY
// ============================================================

function createIntent(target: ExperienceTarget): FeedIntent {
  const createdAt = new Date().toISOString();

  const nonce = `${Date.now()}-${crypto.randomUUID()}`;

  switch (target.type) {
    case 'home':
      return {
        id: `home:${nonce}`,
        type: 'home',
        source: 'user-action',
        route: '/',
        surface: 'home',
        title: 'Shelsea home',
        createdAt
      };

    case 'store-discovery': {
      const categorySlug = target.categorySlug ?? 'all';
      const route =
        categorySlug === 'all'
          ? '/store'
          : `/store?category=${encodeURIComponent(categorySlug)}`;

      return {
        id: `store-discovery:${categorySlug}:${nonce}`,
        type: 'store-discovery',
        source: 'user-action',
        categorySlug,
        route,
        surface: 'store',
        title: categorySlug === 'all' ? 'Store discovery' : `Browse ${categorySlug}`,
        createdAt
      };
    }

    case 'category':
      return {
        id: `category:${target.categorySlug}:${nonce}`,
        type: 'category',
        source: 'user-action',
        categorySlug: target.categorySlug,
        route: `/store?category=${encodeURIComponent(target.categorySlug)}`,
        surface: 'store',
        title: `Browse ${target.categorySlug}`,
        createdAt
      };

    case 'product':
      return {
        id: `product:${target.productId}:${nonce}`,
        type: 'product',
        source: 'user-action',
        targetId: target.productId,
        route: `/store?product=${encodeURIComponent(target.productId)}`,
        surface: 'product',
        title: 'Product experience',
        createdAt
      };

    case 'collection':
      return {
        id: `collection:${target.collectionId}:${nonce}`,
        type: 'collection',
        source: 'user-action',
        targetId: target.collectionId,
        route: `/store?collection=${encodeURIComponent(target.collectionId)}`,
        surface: 'collection',
        title: 'Collection experience',
        createdAt
      };

    case 'promotion':
      return {
        id: `promotion:${target.promotionId}:${nonce}`,
        type: 'promotion',
        source: 'user-action',
        targetId: target.promotionId,
        route: `/store?promotion=${encodeURIComponent(target.promotionId)}`,
        surface: 'promotion',
        title: 'Promotion experience',
        createdAt
      };

    case 'search':
      return {
        id: `search:${target.query}:${nonce}`,
        type: 'search',
        source: 'search',
        query: target.query,
        route: `/store?q=${encodeURIComponent(target.query)}`,
        surface: 'search',
        title: `Search: ${target.query}`,
        createdAt
      };
  }
}

// ============================================================
// PROVIDER
// ============================================================

export function FeedExperienceProvider({
  children,
  initialIntent,
  context,
  baseActions,
  broadcastIntent = false
}: FeedExperienceProviderProps) {
  const [intent, setIntent] = useState<FeedIntent>(initialIntent);

  const [pendingIntent, setPendingIntent] = useState<FeedIntent | null>(null);

  const [productDetailsDisclosure, setProductDetailsDisclosure] = useState<ProductDetailsDisclosure>({
    productId: initialIntent.type === 'product' ? (initialIntent.targetId ?? null) : null,

    expanded: false,

    requestId: 0
  });

  const lastInitialIntentIdRef = useRef(initialIntent.id);

  /**
   * Lightweight in-memory continuity stack.
   *
   * The database-backed Experience Stack can replace this
   * storage later without changing the Hub or Feed controls.
   */
  const intentHistoryRef = useRef<FeedIntent[]>([]);


  const resolutionFrameRef = useRef<number | null>(null);

  const completionTimerRef = useRef<number | null>(null);

  const resolutionStartedAtRef = useRef(0);

  const cancelResolutionWork = useCallback(() => {
    if (resolutionFrameRef.current !== null) {
      window.cancelAnimationFrame(resolutionFrameRef.current);

      resolutionFrameRef.current = null;
    }

    if (completionTimerRef.current !== null) {
      window.clearTimeout(completionTimerRef.current);

      completionTimerRef.current = null;
    }
  }, []);

  const beginResolution = useCallback(
    (
      nextIntent: FeedIntent,
      options: {
        recordCurrent?: boolean;
      } = {}
    ) => {
      cancelResolutionWork();

      if (nextIntent.id === intent.id) {
        setPendingIntent(null);

        return;
      }

      if (options.recordCurrent !== false) {
        const history = intentHistoryRef.current;

        const latestEntry = history[history.length - 1];

        if (latestEntry?.id !== intent.id) {
          history.push(intent);

          if (history.length > 50) {
            history.splice(0, history.length - 50);
          }
        }
      }

      resolutionStartedAtRef.current = window.performance.now();

      setPendingIntent(nextIntent);

      resolutionFrameRef.current = window.requestAnimationFrame(() => {
        resolutionFrameRef.current = null;

        setIntent(nextIntent);
      });
    },
    [cancelResolutionWork, intent]
  );

  // ==========================================================
  // ROUTE INTENT SYNCHRONISATION
  // ==========================================================

  useEffect(() => {
    if (lastInitialIntentIdRef.current === initialIntent.id) {
      return;
    }

    lastInitialIntentIdRef.current = initialIntent.id;

    beginResolution(initialIntent);
  }, [beginResolution, initialIntent]);

  useEffect(() => {
    if (!broadcastIntent) {
      return;
    }

    publishCustomerExperienceIntent(intent);
  }, [broadcastIntent, intent]);

  /**
   * Every committed Product Experience begins in overview mode.
   *
   * Revealing details is presentation state inside that same
   * experience. A different intent resets the disclosure.
   */
  useEffect(() => {
    const activeProductId =
      intent.type === 'product'
        ? intent.targetId ??
          null
        : null;

    setProductDetailsDisclosure(currentDisclosure => ({
      productId:
        activeProductId,

      expanded:
        false,

      requestId:
        currentDisclosure.requestId
    }));
  }, [
    intent.id,
    intent.targetId,
    intent.type
  ]);

  // ==========================================================
  // EXPERIENCE ACTIONS
  // ==========================================================

  const previewCatalogProductInHub =
    useCallback(
      (
        productId:
          string
      ): void => {
        const normalizedProductId =
          String(
            productId
          ).trim();

        if (!normalizedProductId) {
          return;
        }

        const product =
          context.catalog.products.find(
            candidate =>
              String(candidate.id) ===
              normalizedProductId
          );

        if (!product) {
          return;
        }

        const variant =
          product.variants.find(
            candidate =>
              candidate.stockLeft >
              0
          ) ??
          product.variants[0];

        if (variant) {
          selectProductVariant({
            productId:
              product.id,

            variantId:
              variant.id,

            source:
              'feed'
          });
        }

        previewProductInHub({
          productId:
            product.id,

          variantId:
            variant?.id ??
            null,

          source:
            'feed',

          reveal:
            true
        });

        void recordProductView({
          productId:
            product.id
        });
      },
      [
        context.catalog.products
      ]
    );

  const openExperience = useCallback(
    (target: ExperienceTarget) => {
      /**
       * Product discovery no longer mutates the central Feed.
       *
       * The Feed remains on its current intent, module composition,
       * history entry and scroll position while the independent Hub
       * preview authority receives the selected product.
       */
      if (target.type === 'product') {
        previewCatalogProductInHub(
          target.productId
        );

        return;
      }

      beginResolution(
        createIntent(
          target
        )
      );
    },
    [
      beginResolution,
      previewCatalogProductInHub
    ]
  );

  const restoreExperience = useCallback(
    (restoredIntent: FeedIntent) => {
      beginResolution(restoredIntent);
    },
    [beginResolution]
  );

  const resetExperience = useCallback(() => {
    /**
     * Start Fresh resets only navigation continuity.
     * Commerce and customer-owned state remain untouched.
     */
    intentHistoryRef.current = [];

    beginResolution(
      createIntent({
        type:
          'store-discovery',

        categorySlug:
          'all'
      }),
      {
        recordCurrent:
          false
      }
    );
  }, [beginResolution]);

  const revealProductDetails = useCallback((productId: string) => {
    setProductDetailsDisclosure(currentDisclosure => ({
      productId,

      expanded: true,

      requestId: currentDisclosure.requestId + 1
    }));
  }, []);

  const collapseProductDetails = useCallback((productId?: string) => {
    setProductDetailsDisclosure(currentDisclosure => {
      if (productId && currentDisclosure.productId !== productId) {
        return currentDisclosure;
      }

      return {
        ...currentDisclosure,
        expanded: false
      };
    });
  }, []);

  const toggleProductDetails = useCallback((productId: string) => {
    setProductDetailsDisclosure(currentDisclosure => {
      const currentlyExpanded = currentDisclosure.productId === productId && currentDisclosure.expanded;

      return {
        productId,
        expanded: !currentlyExpanded,
        requestId: currentlyExpanded ? currentDisclosure.requestId : currentDisclosure.requestId + 1
      };
    });
  }, []);

  /**
   * The same product action has two contextual meanings:
   *
   * Outside Product Experience:
   *   open the Product Experience.
   *
   * Inside that exact Product Experience:
   *   toggle its complete Feed details open or closed.
   */
  const previewProduct =
    useCallback<
      FeedActions[
        'previewProduct'
      ]
    >(
      product => {
        previewCatalogProductInHub(
          product.id
        );
      },
      [
        previewCatalogProductInHub
      ]
    );

  const productDetailsControls = useMemo<ProductDetailsControls>(
    () => ({
      reveal: revealProductDetails,
      collapse: collapseProductDetails,
      toggle: toggleProductDetails
    }),
    [collapseProductDetails, revealProductDetails, toggleProductDetails]
  );

  const continueDiscovery = useCallback(() => {
    const history = intentHistoryRef.current;

    let previousIntent: FeedIntent | undefined;

    while (history.length > 0) {
      const candidate = history.pop();

      if (candidate && candidate.id !== intent.id && candidate.type !== 'product') {
        previousIntent = candidate;

        break;
      }
    }

    if (previousIntent) {
      beginResolution(previousIntent, {
        recordCurrent: false
      });

      return;
    }

    const activeProduct =
      intent.type === 'product' && intent.targetId
        ? context.catalog.products.find(product => product.id === intent.targetId)
        : undefined;

    beginResolution(
      createIntent({
        type: 'store-discovery',
        categorySlug: activeProduct?.category ?? 'all'
      }),
      {
        recordCurrent: false
      }
    );
  }, [beginResolution, context.catalog.products, intent.id, intent.targetId, intent.type]);

  const actions = useMemo<FeedActions>(
    () => ({
      ...baseActions,

      previewProduct,

      openExperience,

      restoreExperience,

      resetExperience
    }),
    [baseActions, previewProduct, openExperience, restoreExperience, resetExperience]
  );

  // ==========================================================
  // EXPERIENCE RESOLUTION
  // ==========================================================

  const experience = useMemo(
    () =>
      feedExperienceEngine.resolve({
        intent,
        context
      }),
    [intent, context]
  );

  useEffect(() => {
    if (!pendingIntent) {
      return;
    }

    if (pendingIntent.id !== intent.id) {
      return;
    }

    const elapsed = window.performance.now() - resolutionStartedAtRef.current;

    const remaining = Math.max(
      0,

      MIN_RESOLUTION_DURATION_MS - elapsed
    );

    completionTimerRef.current = window.setTimeout(() => {
      completionTimerRef.current = null;

      setPendingIntent(currentPendingIntent =>
        currentPendingIntent?.id === intent.id ? null : currentPendingIntent
      );
    }, remaining);

    return () => {
      if (completionTimerRef.current !== null) {
        window.clearTimeout(completionTimerRef.current);

        completionTimerRef.current = null;
      }
    };
  }, [experience.id, intent.id, pendingIntent]);

  useEffect(
    () => () => {
      cancelResolutionWork();
    },
    [cancelResolutionWork]
  );

  const isResolving = pendingIntent !== null;

  const value = useMemo<FeedExperienceContextValue>(
    () => ({
      intent,

      context,

      experience,

      actions,

      isResolving,

      pendingIntent,

      productDetailsDisclosure,

      productDetailsControls,

      continueDiscovery
    }),
    [
      intent,
      context,
      experience,
      actions,
      isResolving,
      pendingIntent,
      productDetailsDisclosure,
      productDetailsControls,
      continueDiscovery
    ]
  );

  return <FeedExperienceContext.Provider value={value}>{children}</FeedExperienceContext.Provider>;
}

// ============================================================
// CONSUMER HOOK
// ============================================================

export function useFeedExperienceContext() {
  const value = useContext(FeedExperienceContext);

  if (!value) {
    throw new Error('useFeedExperienceContext must be used inside FeedExperienceProvider.');
  }

  return value;
}
