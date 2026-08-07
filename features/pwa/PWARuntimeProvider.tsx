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

import {
  resolvePWAInstallMode,
  resolvePWAPlatform,
  resolveStandaloneMode
} from './pwaRuntime';

import type {
  BeforeInstallPromptEvent,
  PWAInstallOutcome,
  PWARuntimeValue,
  PWAShareOutcome
} from './pwaTypes';

const SERVICE_WORKER_PATH =
  '/sw.js';

const UPDATE_INTERVAL_MS =
  30 * 60 * 1000;

const INSTALL_MODE =
  resolvePWAInstallMode(
    process.env
      .NEXT_PUBLIC_PWA_INSTALL_MODE
  );

const PWARuntimeContext =
  createContext<PWARuntimeValue | null>(
    null
  );

type PWARuntimeProviderProps = {
  children:
    ReactNode;
};

export function PWARuntimeProvider({
  children
}: PWARuntimeProviderProps) {
  const [
    isOnline,
    setIsOnline
  ] = useState(
    true
  );

  const [
    isStandalone,
    setIsStandalone
  ] = useState(
    false
  );

  const [
    platform,
    setPlatform
  ] =
    useState<PWARuntimeValue['platform']>(
      'unknown'
    );

  const [
    installPrompt,
    setInstallPrompt
  ] =
    useState<BeforeInstallPromptEvent | null>(
      null
    );

  const [
    registration,
    setRegistration
  ] =
    useState<ServiceWorkerRegistration | null>(
      null
    );

  const [
    updateReady,
    setUpdateReady
  ] = useState(
    false
  );

  const [
    updateNoticeVisible,
    setUpdateNoticeVisible
  ] = useState(
    false
  );

  const [
    installGuideOpen,
    setInstallGuideOpen
  ] = useState(
    false
  );

  const [
    announcement,
    setAnnouncement
  ] =
    useState<string | null>(
      null
    );

  const reloadOnControllerChange =
    useRef(
      false
    );

  const announcementTimeout =
    useRef<number | null>(
      null
    );

  const announce =
    useCallback(
      (
        message:
          string
      ) => {
        setAnnouncement(
          message
        );

        if (
          announcementTimeout.current !==
          null
        ) {
          window.clearTimeout(
            announcementTimeout.current
          );
        }

        announcementTimeout.current =
          window.setTimeout(
            () => {
              setAnnouncement(
                null
              );

              announcementTimeout.current =
                null;
            },
            4200
          );
      },
      []
    );

  const markUpdateReady =
    useCallback(
      () => {
        setUpdateReady(
          true
        );

        setUpdateNoticeVisible(
          true
        );
      },
      []
    );

  useEffect(() => {
    const displayMode =
      window.matchMedia(
        '(display-mode: standalone)'
      );

    const syncEnvironment =
      () => {
        const standalone =
          resolveStandaloneMode();

        setIsStandalone(
          standalone
        );

        setIsOnline(
          navigator.onLine
        );

        setPlatform(
          resolvePWAPlatform(
            navigator.userAgent
          )
        );

        document.documentElement.dataset.pwaDisplayMode =
          standalone
            ? 'standalone'
            : 'browser';
      };

    const handleBeforeInstallPrompt =
      (
        event:
          Event
      ) => {
        const installEvent =
          event as
            BeforeInstallPromptEvent;

        /*
         * Keep browser-owned automatic prompts from interrupting
         * Shelsea. The environment-controlled install UI decides
         * whether the captured prompt is exposed.
         */
        installEvent.preventDefault();

        if (
          INSTALL_MODE ===
            'off' ||
          resolveStandaloneMode()
        ) {
          setInstallPrompt(
            null
          );

          return;
        }

        setInstallPrompt(
          installEvent
        );
      };

    const handleInstalled =
      () => {
        setInstallPrompt(
          null
        );

        setIsStandalone(
          true
        );

        document.documentElement.dataset.pwaDisplayMode =
          'standalone';

        announce(
          'Shelsea is installed and ready.'
        );
      };

    const handleOnline =
      () => {
        setIsOnline(
          true
        );

        announce(
          'Connection restored. Live commerce data is available again.'
        );
      };

    const handleOffline =
      () => {
        setIsOnline(
          false
        );
      };

    syncEnvironment();

    displayMode.addEventListener(
      'change',
      syncEnvironment
    );

    window.addEventListener(
      'beforeinstallprompt',
      handleBeforeInstallPrompt
    );

    window.addEventListener(
      'appinstalled',
      handleInstalled
    );

    window.addEventListener(
      'online',
      handleOnline
    );

    window.addEventListener(
      'offline',
      handleOffline
    );

    return () => {
      displayMode.removeEventListener(
        'change',
        syncEnvironment
      );

      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );

      window.removeEventListener(
        'appinstalled',
        handleInstalled
      );

      window.removeEventListener(
        'online',
        handleOnline
      );

      window.removeEventListener(
        'offline',
        handleOffline
      );

      if (
        announcementTimeout.current !==
        null
      ) {
        window.clearTimeout(
          announcementTimeout.current
        );
      }
    };
  }, [
    announce
  ]);

  useEffect(() => {
    if (
      !(
        'serviceWorker' in
        navigator
      )
    ) {
      return;
    }

    if (
      process.env.NODE_ENV !==
      'production'
    ) {
      void navigator.serviceWorker
        .getRegistrations()
        .then(
          registrations => {
            registrations.forEach(
              currentRegistration => {
                void currentRegistration.unregister();
              }
            );
          }
        )
        .catch(
          () =>
            undefined
        );

      return;
    }

    let disposed =
      false;

    let intervalId:
      number | null =
      null;

    let activeRegistration:
      ServiceWorkerRegistration | null =
      null;

    let updateFoundHandler:
      (() => void)
      | null =
      null;

    const handleControllerChange =
      () => {
        if (
          reloadOnControllerChange.current
        ) {
          window.location.reload();
        }
      };

    const inspectInstallingWorker =
      (
        worker:
          ServiceWorker | null
      ) => {
        if (!worker) {
          return;
        }

        const handleStateChange =
          () => {
            if (
              worker.state ===
                'installed' &&
              navigator.serviceWorker.controller
            ) {
              markUpdateReady();
            }
          };

        worker.addEventListener(
          'statechange',
          handleStateChange
        );
      };

    const requestUpdate =
      () => {
        void activeRegistration
          ?.update()
          .catch(
            () =>
              undefined
          );
      };

    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          'visible'
        ) {
          requestUpdate();
        }
      };

    const register =
      async () => {
        try {
          const currentRegistration =
            await navigator.serviceWorker.register(
              SERVICE_WORKER_PATH,
              {
                scope:
                  '/',

                updateViaCache:
                  'none'
              }
            );

          if (
            disposed
          ) {
            return;
          }

          activeRegistration =
            currentRegistration;

          setRegistration(
            currentRegistration
          );

          if (
            currentRegistration.waiting &&
            navigator.serviceWorker.controller
          ) {
            markUpdateReady();
          }

          updateFoundHandler =
            () => {
              inspectInstallingWorker(
                currentRegistration.installing
              );
            };

          currentRegistration.addEventListener(
            'updatefound',
            updateFoundHandler
          );

          inspectInstallingWorker(
            currentRegistration.installing
          );

          navigator.serviceWorker.addEventListener(
            'controllerchange',
            handleControllerChange
          );

          window.addEventListener(
            'online',
            requestUpdate
          );

          document.addEventListener(
            'visibilitychange',
            handleVisibilityChange
          );

          requestUpdate();

          intervalId =
            window.setInterval(
              requestUpdate,
              UPDATE_INTERVAL_MS
            );
        } catch (
          error
        ) {
          console.warn(
            'Shelsea PWA registration failed.',
            error
          );
        }
      };

    if (
      document.readyState ===
      'complete'
    ) {
      void register();
    } else {
      window.addEventListener(
        'load',
        register,
        {
          once:
            true
        }
      );
    }

    return () => {
      disposed =
        true;

      window.removeEventListener(
        'load',
        register
      );

      window.removeEventListener(
        'online',
        requestUpdate
      );

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );

      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        handleControllerChange
      );

      if (
        activeRegistration &&
        updateFoundHandler
      ) {
        activeRegistration.removeEventListener(
          'updatefound',
          updateFoundHandler
        );
      }

      if (
        intervalId !==
        null
      ) {
        window.clearInterval(
          intervalId
        );
      }
    };
  }, [
    markUpdateReady
  ]);

  const openInstallGuide =
    useCallback(
      () => {
        setInstallGuideOpen(
          true
        );
      },
      []
    );

  const closeInstallGuide =
    useCallback(
      () => {
        setInstallGuideOpen(
          false
        );
      },
      []
    );

  const install =
    useCallback(
      async (): Promise<PWAInstallOutcome> => {
        if (
          isStandalone
        ) {
          announce(
            'Shelsea is already installed.'
          );

          return 'installed';
        }

        if (
          INSTALL_MODE ===
          'off'
        ) {
          return 'unavailable';
        }

        if (
          installPrompt
        ) {
          const choice =
            await installPrompt.prompt();

          setInstallPrompt(
            null
          );

          if (
            choice.outcome ===
            'accepted'
          ) {
            announce(
              'Installation accepted. Shelsea will open as an app.'
            );

            return 'accepted';
          }

          announce(
            'Installation was dismissed. You can install later.'
          );

          return 'dismissed';
        }

        if (
          platform ===
          'ios'
        ) {
          setInstallGuideOpen(
            true
          );

          return 'guide-opened';
        }

        return 'unavailable';
      },
      [
        announce,
        installPrompt,
        isStandalone,
        platform
      ]
    );

  const shareCurrentExperience =
    useCallback(
      async (): Promise<PWAShareOutcome> => {
        const shareData = {
          title:
            document.title ||
            'Shelsea',

          text:
            'Explore this Shelsea experience.',

          url:
            window.location.href
        };

        if (
          typeof navigator.share ===
          'function'
        ) {
          try {
            await navigator.share(
              shareData
            );

            announce(
              'Shelsea experience shared.'
            );

            return 'shared';
          } catch (
            error
          ) {
            if (
              error instanceof
                DOMException &&
              error.name ===
                'AbortError'
            ) {
              return 'dismissed';
            }
          }
        }

        if (
          navigator.clipboard
            ?.writeText
        ) {
          await navigator.clipboard.writeText(
            shareData.url
          );

          announce(
            'Experience link copied.'
          );

          return 'copied';
        }

        announce(
          'Sharing is not available in this browser.'
        );

        return 'unsupported';
      },
      [
        announce
      ]
    );

  const applyUpdate =
    useCallback(
      async () => {
        const currentRegistration =
          registration ??
          await navigator.serviceWorker
            ?.getRegistration(
              '/'
            );

        if (
          !currentRegistration
        ) {
          return;
        }

        if (
          !currentRegistration.waiting
        ) {
          await currentRegistration.update();

          if (
            !currentRegistration.waiting
          ) {
            announce(
              'Shelsea is already up to date.'
            );

            return;
          }
        }

        reloadOnControllerChange.current =
          true;

        announce(
          'Applying the Shelsea update…'
        );

        currentRegistration.waiting?.postMessage({
          type:
            'SKIP_WAITING'
        });

        window.setTimeout(
          () => {
            if (
              reloadOnControllerChange.current
            ) {
              window.location.reload();
            }
          },
          7000
        );
      },
      [
        announce,
        registration
      ]
    );

  const dismissUpdateNotice =
    useCallback(
      () => {
        setUpdateNoticeVisible(
          false
        );
      },
      []
    );

  const installAvailable =
    !isStandalone &&
    INSTALL_MODE !==
      'off' &&
    (
      Boolean(
        installPrompt
      ) ||
      platform ===
        'ios'
    );

  const value =
    useMemo<PWARuntimeValue>(
      () => ({
        installMode:
          INSTALL_MODE,

        platform,

        isOnline,

        isStandalone,

        installAvailable,

        updateReady,

        updateNoticeVisible,

        installGuideOpen,

        announcement,

        install,

        shareCurrentExperience,

        applyUpdate,

        dismissUpdateNotice,

        openInstallGuide,

        closeInstallGuide
      }),
      [
        announcement,
        applyUpdate,
        closeInstallGuide,
        dismissUpdateNotice,
        install,
        installAvailable,
        installGuideOpen,
        isOnline,
        isStandalone,
        openInstallGuide,
        platform,
        shareCurrentExperience,
        updateNoticeVisible,
        updateReady
      ]
    );

  return (
    <PWARuntimeContext.Provider
      value={
        value
      }>
      {
        children
      }
    </PWARuntimeContext.Provider>
  );
}

export function usePWARuntime() {
  const context =
    useContext(
      PWARuntimeContext
    );

  if (!context) {
    throw new Error(
      'usePWARuntime must be used within PWARuntimeProvider.'
    );
  }

  return context;
}
