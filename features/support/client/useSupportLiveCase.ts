'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';

import type {
  SupportLiveEventItem,
  SupportLivePresenceItem,
  SupportLivePresencePayload
} from '../supportLiveTypes';

export type SupportLiveConnectionState =
  | 'connecting'
  | 'live'
  | 'reconnecting'
  | 'offline';

type UseSupportLiveCaseInput = {
  streamUrl: string;
  enabled?: boolean;
  onEvent: (
    event: SupportLiveEventItem
  ) => void | Promise<void>;
};

type UseSupportLiveCaseResult = {
  state:
    SupportLiveConnectionState;
  lastEventId:
    number;
  error:
    string |
    null;
  participants:
    SupportLivePresenceItem[];
  online:
    boolean;
  retry:
    () => void;
  setTyping: (
    typing: boolean
  ) => void;
};

function parseJson<T>(
  value: string
): T | null {
  try {
    return JSON.parse(
      value
    ) as T;
  } catch {
    return null;
  }
}

function appendCursor(
  streamUrl: string,
  cursor: number
): string {
  if (
    cursor <=
    0
  ) {
    return streamUrl;
  }

  return `${streamUrl}${streamUrl.includes('?') ? '&' : '?'}after=${cursor}`;
}

function browserOnline(): boolean {
  return (
    typeof navigator ===
      'undefined' ||
    navigator.onLine
  );
}

export function useSupportLiveCase({
  streamUrl,
  enabled = true,
  onEvent
}: UseSupportLiveCaseInput): UseSupportLiveCaseResult {
  const onEventRef =
    useRef(
      onEvent
    );

  const cursorRef =
    useRef(0);

  const previousStreamUrlRef =
    useRef(
      streamUrl
    );

  const typingStateRef =
    useRef(false);

  const lastTypingSentAtRef =
    useRef(0);

  const [
    state,
    setState
  ] =
    useState<SupportLiveConnectionState>(
      'connecting'
    );

  const [
    lastEventId,
    setLastEventId
  ] =
    useState(0);

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

  const [
    participants,
    setParticipants
  ] =
    useState<
      SupportLivePresenceItem[]
    >(
      []
    );

  const [
    online,
    setOnline
  ] =
    useState(
      browserOnline
    );

  const [
    reconnectEpoch,
    setReconnectEpoch
  ] =
    useState(0);

  const postActivity =
    useCallback(
      async (
        action:
          | 'heartbeat'
          | 'typing'
          | 'leave',
        typing?: boolean,
        keepalive = false
      ): Promise<void> => {
        if (
          !browserOnline() &&
          action !==
            'leave'
        ) {
          return;
        }

        const response =
          await fetch(
            streamUrl,
            {
              method:
                'POST',
              credentials:
                'same-origin',
              cache:
                'no-store',
              keepalive,
              headers: {
                'Content-Type':
                  'application/json'
              },
              body:
                JSON.stringify({
                  action,
                  ...(action ===
                  'typing'
                    ? {
                        typing:
                          Boolean(
                            typing
                          )
                      }
                    : {})
                })
            }
          );

        if (!response.ok) {
          throw new Error(
            'Shelsea could not update live Support activity.'
          );
        }
      },
      [
        streamUrl
      ]
    );

  const setTyping =
    useCallback(
      (
        typing: boolean
      ): void => {
        const now =
          Date.now();

        if (
          typing &&
          typingStateRef.current &&
          now -
            lastTypingSentAtRef.current <
            1500
        ) {
          return;
        }

        if (
          !typing &&
          !typingStateRef.current
        ) {
          return;
        }

        typingStateRef.current =
          typing;

        lastTypingSentAtRef.current =
          now;

        void postActivity(
          'typing',
          typing
        ).catch(
          cause => {
            console.error(
              'Support typing update failed.',
              cause
            );
          }
        );
      },
      [
        postActivity
      ]
    );

  const retry =
    useCallback(
      (): void => {
        if (!enabled) {
          return;
        }

        setOnline(
          browserOnline()
        );

        setState(
          browserOnline()
            ? 'reconnecting'
            : 'offline'
        );

        setReconnectEpoch(
          current =>
            current +
            1
        );
      },
      [
        enabled
      ]
    );

  useEffect(
    () => {
      onEventRef.current =
        onEvent;
    },
    [
      onEvent
    ]
  );

  useEffect(
    () => {
      if (
        previousStreamUrlRef.current ===
        streamUrl
      ) {
        return;
      }

      previousStreamUrlRef.current =
        streamUrl;

      cursorRef.current =
        0;

      typingStateRef.current =
        false;

      setLastEventId(
        0
      );

      setParticipants(
        []
      );

      setError(
        null
      );

      setState(
        enabled
          ? 'connecting'
          : 'offline'
      );
    },
    [
      enabled,
      streamUrl
    ]
  );

  useEffect(
    () => {
      const handleOnline =
        (): void => {
          setOnline(
            true
          );

          if (
            enabled
          ) {
            setState(
              'reconnecting'
            );

            setReconnectEpoch(
              current =>
                current +
                1
            );
          }
        };

      const handleOffline =
        (): void => {
          setOnline(
            false
          );

          setState(
            'offline'
          );

          setTyping(
            false
          );
        };

      window.addEventListener(
        'online',
        handleOnline
      );

      window.addEventListener(
        'offline',
        handleOffline
      );

      return () => {
        window.removeEventListener(
          'online',
          handleOnline
        );

        window.removeEventListener(
          'offline',
          handleOffline
        );
      };
    },
    [
      enabled,
      setTyping
    ]
  );

  /* eslint-disable react-hooks/set-state-in-effect -- This effect owns the EventSource lifecycle and mirrors transport state into React. */
  useEffect(
    () => {
      if (
        !enabled ||
        typeof EventSource ===
          'undefined'
      ) {
        setParticipants(
          []
        );

        return;
      }

      if (
        !browserOnline()
      ) {
        setOnline(
          false
        );

        setState(
          'offline'
        );

        return;
      }

      let closed =
        false;

      setOnline(
        true
      );

      setState(
        current =>
          current ===
            'live'
            ? 'reconnecting'
            : 'connecting'
      );

      const source =
        new EventSource(
          appendCursor(
            streamUrl,
            cursorRef.current
          ),
          {
            withCredentials:
              true
          }
        );

      const updateCursor =
        (
          cursor: number
        ): void => {
          cursorRef.current =
            cursor;

          setLastEventId(
            cursor
          );
        };

      const handleReady =
        (
          event: Event
        ): void => {
          if (closed) {
            return;
          }

          const payload =
            parseJson<{
              cursor?: number;
            }>(
              (
                event as
                  MessageEvent<string>
              ).data
            );

          if (
            typeof payload?.cursor ===
            'number'
          ) {
            updateCursor(
              payload.cursor
            );
          }

          setError(
            null
          );

          setState(
            'live'
          );
        };

      const handleSupport =
        (
          event: Event
        ): void => {
          if (closed) {
            return;
          }

          const payload =
            parseJson<
              SupportLiveEventItem
            >(
              (
                event as
                  MessageEvent<string>
              ).data
            );

          if (!payload) {
            setError(
              'Shelsea received an unreadable live Support event.'
            );

            return;
          }

          updateCursor(
            payload.id
          );

          setState(
            'live'
          );

          setError(
            null
          );

          void Promise.resolve(
            onEventRef.current(
              payload
            )
          ).catch(
            cause => {
              if (closed) {
                return;
              }

              setError(
                cause instanceof Error
                  ? cause.message
                  : 'Shelsea could not apply a live Support update.'
              );
            }
          );
        };

      const handlePresence =
        (
          event: Event
        ): void => {
          if (closed) {
            return;
          }

          const payload =
            parseJson<
              SupportLivePresencePayload
            >(
              (
                event as
                  MessageEvent<string>
              ).data
            );

          if (!payload) {
            return;
          }

          setParticipants(
            payload.participants
          );
        };

      const handleReconnect =
        (
          event: Event
        ): void => {
          if (closed) {
            return;
          }

          const payload =
            parseJson<{
              cursor?: number;
            }>(
              (
                event as
                  MessageEvent<string>
              ).data
            );

          if (
            typeof payload?.cursor ===
            'number'
          ) {
            updateCursor(
              payload.cursor
            );
          }

          setState(
            'reconnecting'
          );
        };

      const handleTransportError =
        (
          event: Event
        ): void => {
          if (closed) {
            return;
          }

          const payload =
            parseJson<{
              message?: string;
            }>(
              (
                event as
                  MessageEvent<string>
              ).data
            );

          setError(
            payload?.message ??
              'The live Support connection was interrupted.'
          );

          setState(
            browserOnline()
              ? 'reconnecting'
              : 'offline'
          );
        };

      source.addEventListener(
        'ready',
        handleReady
      );

      source.addEventListener(
        'support',
        handleSupport
      );

      source.addEventListener(
        'presence-snapshot',
        handlePresence
      );

      source.addEventListener(
        'reconnect',
        handleReconnect
      );

      source.addEventListener(
        'transport-error',
        handleTransportError
      );

      source.onerror =
        (): void => {
          if (closed) {
            return;
          }

          setState(
            browserOnline()
              ? 'reconnecting'
              : 'offline'
          );
        };

      const sendHeartbeat =
        (): void => {
          if (
            document.visibilityState !==
              'visible' ||
            !browserOnline()
          ) {
            return;
          }

          void postActivity(
            'heartbeat'
          ).catch(
            cause => {
              console.error(
                'Support presence heartbeat failed.',
                cause
              );
            }
          );
        };

      const heartbeat =
        window.setInterval(
          sendHeartbeat,
          10_000
        );

      sendHeartbeat();

      const handleVisibility =
        (): void => {
          if (
            document.visibilityState ===
            'visible'
          ) {
            sendHeartbeat();

            if (
              source.readyState ===
              EventSource.CLOSED
            ) {
              setReconnectEpoch(
                current =>
                  current +
                  1
              );
            }
          } else {
            setTyping(
              false
            );
          }
        };

      const handlePageHide =
        (): void => {
          setTyping(
            false
          );

          void postActivity(
            'leave',
            undefined,
            true
          ).catch(
            () => {
              // Page exit is
              // best-effort only.
            }
          );
        };

      document.addEventListener(
        'visibilitychange',
        handleVisibility
      );

      window.addEventListener(
        'pagehide',
        handlePageHide
      );

      return () => {
        closed =
          true;

        source.close();

        window.clearInterval(
          heartbeat
        );

        document.removeEventListener(
          'visibilitychange',
          handleVisibility
        );

        window.removeEventListener(
          'pagehide',
          handlePageHide
        );

        typingStateRef.current =
          false;

        void postActivity(
          'leave',
          undefined,
          true
        ).catch(
          () => {
            // Stream replacement is
            // best-effort only.
          }
        );
      };
    },
    [
      enabled,
      postActivity,
      reconnectEpoch,
      setTyping,
      streamUrl
    ]
  );
  /* eslint-enable react-hooks/set-state-in-effect */

  return {
    state,
    lastEventId,
    error,
    participants,
    online,
    retry,
    setTyping
  };
}
