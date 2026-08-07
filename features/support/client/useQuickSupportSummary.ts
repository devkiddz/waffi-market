'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';

import {
  useWorkspace
} from '@/features/workspace';

import type {
  QuickSupportSummary
} from '../quickSupportTypes';

export const QUICK_SUPPORT_SUMMARY_INVALIDATED_EVENT =
  'aj:support-summary-invalidated';

type QuickSupportSummaryState = {
  summary:
    QuickSupportSummary |
    null;
  loading:
    boolean;
  authenticationRequired:
    boolean;
  error:
    string |
    null;
  refresh:
    () => Promise<void>;
};

async function readFailure(
  response: Response
): Promise<string> {
  try {
    const payload =
      (await response.json()) as {
        error?: string;
      };

    return (
      payload.error ??
      'Shelsea could not refresh Quick Support.'
    );
  } catch {
    return 'Shelsea could not refresh Quick Support.';
  }
}

export function invalidateQuickSupportSummary(): void {
  if (
    typeof window ===
    'undefined'
  ) {
    return;
  }

  window.dispatchEvent(
    new Event(
      QUICK_SUPPORT_SUMMARY_INVALIDATED_EVENT
    )
  );
}

export function useQuickSupportSummary():
  QuickSupportSummaryState {
  const {
    activeWorkspace,
    loading:
      workspaceLoading
  } =
    useWorkspace();

  const workspaceId =
    activeWorkspace?.id ??
    null;

  const sequenceRef =
    useRef(0);

  const requestControllerRef =
    useRef<AbortController | null>(
      null
    );

  const [
    summary,
    setSummary
  ] =
    useState<
      QuickSupportSummary |
      null
    >(
      null
    );

  const [
    loading,
    setLoading
  ] =
    useState(true);

  const [
    authenticationRequired,
    setAuthenticationRequired
  ] =
    useState(false);

  const [
    error,
    setError
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const refresh =
    useCallback(
      async (): Promise<void> => {
        if (
          workspaceLoading
        ) {
          return;
        }

        if (
          !workspaceId
        ) {
          setSummary(
            null
          );

          setLoading(
            false
          );

          return;
        }

        const sequence =
          sequenceRef.current +
          1;

        sequenceRef.current =
          sequence;

        requestControllerRef.current
          ?.abort();

        const controller =
          new AbortController();

        requestControllerRef.current =
          controller;

        try {
          const response =
            await fetch(
              `/api/support/quick-chat/summary?workspaceId=${encodeURIComponent(
                workspaceId
              )}`,
              {
                credentials:
                  'same-origin',
                cache:
                  'no-store',
                signal:
                  controller.signal
              }
            );

          if (
            sequence !==
            sequenceRef.current
          ) {
            return;
          }

          if (
            response.status ===
            401
          ) {
            setSummary(
              null
            );

            setAuthenticationRequired(
              true
            );

            setError(
              null
            );

            return;
          }

          if (
            !response.ok
          ) {
            throw new Error(
              await readFailure(
                response
              )
            );
          }

          const next =
            (await response.json()) as
              QuickSupportSummary;

          if (
            next.workspaceId !==
            workspaceId
          ) {
            return;
          }

          setSummary(
            next
          );

          setAuthenticationRequired(
            false
          );

          setError(
            null
          );
        } catch (cause) {
          if (
            controller.signal.aborted
          ) {
            return;
          }

          if (
            sequence !==
            sequenceRef.current
          ) {
            return;
          }

          setError(
            cause instanceof Error
              ? cause.message
              : 'Shelsea could not refresh Quick Support.'
          );
        } finally {
          if (
            requestControllerRef.current ===
            controller
          ) {
            requestControllerRef.current =
              null;
          }

          if (
            sequence ===
            sequenceRef.current
          ) {
            setLoading(
              false
            );
          }
        }
      },
      [
        workspaceId,
        workspaceLoading
      ]
    );

  /* eslint-disable react-hooks/set-state-in-effect -- Workspace changes intentionally reset stale Support summary state before starting the next external request. */
  useEffect(
    () => {
      sequenceRef.current +=
        1;

      setSummary(
        null
      );

      setError(
        null
      );

      setLoading(
        true
      );

      const timer =
        window.setTimeout(
          () => {
            void refresh();
          },
          0
        );

      return () => {
        window.clearTimeout(
          timer
        );

        requestControllerRef.current
          ?.abort();
      };
    },
    [
      refresh,
      workspaceId
    ]
  );
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(
    () => {
      const handleRefresh =
        (): void => {
          void refresh();
        };

      const handleFocus =
        (): void => {
          void refresh();
        };

      window.addEventListener(
        QUICK_SUPPORT_SUMMARY_INVALIDATED_EVENT,
        handleRefresh
      );

      window.addEventListener(
        'focus',
        handleFocus
      );

      const interval =
        authenticationRequired
          ? null
          : window.setInterval(
              handleRefresh,
              30_000
            );

      return () => {
        window.removeEventListener(
          QUICK_SUPPORT_SUMMARY_INVALIDATED_EVENT,
          handleRefresh
        );

        window.removeEventListener(
          'focus',
          handleFocus
        );

        if (interval !== null) {
          window.clearInterval(
            interval
          );
        }
      };
    },
    [
      authenticationRequired,
      refresh
    ]
  );

  return {
    summary,
    loading,
    authenticationRequired,
    error,
    refresh
  };
}
