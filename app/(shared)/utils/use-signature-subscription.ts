'use client';

import React from 'react';

import { createSubscriptions, toSignature } from '@/app/(shared)/utils/rpc';

// signatureSubscribe fires once per commitment then the server closes it, so we
// walk commitments in order to get an early ('confirmed') push and a terminal
// ('finalized') one. Each notification triggers a refetch of the tx state.
const COMMITMENTS = ['confirmed', 'finalized'] as const;

/**
 * Subscribe to a transaction signature over websocket and invoke `onNotify`
 * whenever it reaches a new commitment level. Realtime replacement for interval
 * polling; when the websocket can't be opened, `onFailure` fires so the caller
 * can fall back to polling. No-op while `enabled` is false or inputs are missing.
 */
export function useSignatureSubscription(
  signature: string | undefined,
  wsUrl: string | undefined,
  enabled: boolean,
  onNotify: () => void,
  onFailure?: () => void,
): void {
  // Keep callbacks in refs so identity changes don't tear down the subscription.
  const onNotifyRef = React.useRef(onNotify);
  onNotifyRef.current = onNotify;
  const onFailureRef = React.useRef(onFailure);
  onFailureRef.current = onFailure;

  React.useEffect(() => {
    if (!enabled || !signature || !wsUrl) return;

    const abort = new AbortController();
    let cancelled = false;

    (async () => {
      let subscriptions;
      try {
        subscriptions = createSubscriptions(wsUrl);
      } catch {
        if (!cancelled) onFailureRef.current?.();
        return;
      }

      for (const commitment of COMMITMENTS) {
        if (cancelled) return;
        try {
          const notifications = await subscriptions
            .signatureNotifications(toSignature(signature), { commitment })
            .subscribe({ abortSignal: abort.signal });

          for await (const _notification of notifications) {
            if (cancelled) return;
            onNotifyRef.current();
            break; // fire-once per commitment; move on to the next level
          }
        } catch (err) {
          if (cancelled || abort.signal.aborted) return;
          // Websocket unreachable / errored — let the caller resume polling.
          onFailureRef.current?.();
          return;
        }
      }
    })();

    return () => {
      cancelled = true;
      abort.abort();
    };
  }, [signature, wsUrl, enabled]);
}
