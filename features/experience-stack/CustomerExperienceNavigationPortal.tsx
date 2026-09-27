'use client';

import {
  Fragment,
  useEffect,
  useState
} from 'react';

import { createPortal } from 'react-dom';

import {
  ExperienceBackControl,
  ExperienceHistoryControl
} from './ExperienceNavigationControls';

const CUSTOMER_HISTORY_SLOT_ID = 'customer-experience-history-slot';
const CUSTOMER_ACCOUNT_HISTORY_SLOT_ID = 'customer-experience-history-account-slot';
const CUSTOMER_BACK_SLOT_ID = 'customer-experience-back-slot';
const CLOSE_ACCOUNT_SHEET_EVENT = 'rcentz:close-account-sheet';

type NavigationTargets = {
  desktopHistory: HTMLElement | null;
  accountHistory: HTMLElement | null;
  back: HTMLElement | null;
};

const EMPTY_TARGETS: NavigationTargets = {
  desktopHistory: null,
  accountHistory: null,
  back: null
};

export default function CustomerExperienceNavigationPortal() {
  const [targets, setTargets] = useState<NavigationTargets>(EMPTY_TARGETS);

  useEffect(() => {
    const synchronizeTargets = () => {
      const nextTargets: NavigationTargets = {
        desktopHistory: document.getElementById(CUSTOMER_HISTORY_SLOT_ID),
        accountHistory: document.getElementById(CUSTOMER_ACCOUNT_HISTORY_SLOT_ID),
        back: document.getElementById(CUSTOMER_BACK_SLOT_ID)
      };

      setTargets(current =>
        current.desktopHistory === nextTargets.desktopHistory &&
        current.accountHistory === nextTargets.accountHistory &&
        current.back === nextTargets.back
          ? current
          : nextTargets
      );
    };

    const frameId = window.requestAnimationFrame(synchronizeTargets);
    const observer = new MutationObserver(synchronizeTargets);

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, []);

  const closeAccountSheet = () => {
    window.dispatchEvent(new Event(CLOSE_ACCOUNT_SHEET_EVENT));
  };

  return (
    <Fragment>
      {targets.desktopHistory
        ? createPortal(
            <div className="hidden lg:block">
              <ExperienceHistoryControl />
            </div>,
            targets.desktopHistory
          )
        : null}

      {targets.accountHistory
        ? createPortal(
            <div>
              <ExperienceHistoryControl
                presentation="account-sheet"
                onResolved={closeAccountSheet}
              />
            </div>,
            targets.accountHistory
          )
        : null}

      {targets.back ? createPortal(<ExperienceBackControl />, targets.back) : null}
    </Fragment>
  );
}
