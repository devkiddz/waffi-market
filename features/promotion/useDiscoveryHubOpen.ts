'use client';

/* SHELSEA_PROMO_HUB_VISIBILITY_V1 */

import {
  useEffect,
  useState
} from 'react';

function renderedHubIsOpen(): boolean {
  const hub =
    document.querySelector<HTMLElement>(
      '[data-discovery-hub-panel]'
    );

  if (!hub) {
    return false;
  }

  const style =
    window.getComputedStyle(
      hub
    );

  const bounds =
    hub.getBoundingClientRect();

  return (
    !hub.hidden &&
    hub.getAttribute(
      'aria-hidden'
    ) !==
      'true' &&
    style.display !==
      'none' &&
    style.visibility !==
      'hidden' &&
    Number(
      style.opacity ||
        '1'
    ) >
      0 &&
    bounds.width >
      48 &&
    bounds.height >
      48
  );
}

export function useDiscoveryHubOpen(): boolean {
  const [
    hubOpen,
    setHubOpen
  ] = useState(false);

  useEffect(() => {
    const sync =
      (): void => {
        setHubOpen(
          renderedHubIsOpen()
        );
      };

    const frame =
      window.requestAnimationFrame(
        sync
      );

    const observer =
      new MutationObserver(
        sync
      );

    observer.observe(
      document.body,
      {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: [
          'class',
          'style',
          'hidden',
          'aria-hidden',
          'data-state'
        ]
      }
    );

    window.addEventListener(
      'resize',
      sync
    );

    return () => {
      window.cancelAnimationFrame(
        frame
      );

      observer.disconnect();

      window.removeEventListener(
        'resize',
        sync
      );
    };
  }, []);

  return hubOpen;
}
