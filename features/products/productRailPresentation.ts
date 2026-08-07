export const EXPERIENCE_PRODUCT_RAIL_CLASS = `
  flex w-full min-w-0
  snap-x snap-mandatory
  items-stretch gap-2
  overflow-x-auto overflow-y-hidden
  overscroll-x-contain
  scroll-smooth
  px-0.5 pb-2.5
  scrollbar-none

  sm:gap-2.5
  sm:px-1
`;

/**
 * Shared Store product-card density.
 *
 * Mobile keeps two complete cards and exposes part of the next.
 * Larger viewports use one standard Tailwind width step less than
 * the previous presentation so rails feel denser without making
 * product text or actions cramped.
 */
export const EXPERIENCE_PRODUCT_ITEM_CLASS = `
  w-[calc(45%_-_0.35rem)]
  min-w-[calc(45%_-_0.35rem)]
  max-w-[calc(45%_-_0.35rem)]
  flex-none snap-start

  sm:w-48
  sm:min-w-48
  sm:max-w-48

  md:w-52
  md:min-w-52
  md:max-w-52

  xl:w-56
  xl:min-w-56
  xl:max-w-56
`;

const FALLBACK_PRODUCT_ITEM_WIDTH = 192;
const FALLBACK_PRODUCT_RAIL_GAP = 8;

export function getProductRailScrollStep(
  viewport: HTMLElement,
  itemSelector = '[data-experience-product-item]'
): number {
  const firstItem =
    viewport.querySelector<HTMLElement>(
      itemSelector
    );

  const itemWidth =
    firstItem?.getBoundingClientRect()
      .width ??
    FALLBACK_PRODUCT_ITEM_WIDTH;

  const computedStyle =
    window.getComputedStyle(viewport);

  const parsedGap =
    Number.parseFloat(
      computedStyle.columnGap ||
        computedStyle.gap
    );

  const gap =
    Number.isFinite(parsedGap)
      ? parsedGap
      : FALLBACK_PRODUCT_RAIL_GAP;

  return itemWidth + gap;
}
