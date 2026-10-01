"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
const TOKEN_WAIT_MS = 15000;

type TurnstileApi = {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () =>
      window.turnstile
        ? resolve(window.turnstile)
        : reject(new Error("Turnstile did not initialise"));
    script.onerror = () => {
      scriptPromise = null;
      script.remove();
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

type TokenWaiter = (token: string | null) => void;

/**
 * Invisible Cloudflare Turnstile check. Pass `attachContainer` as the `ref` of a div in the form
 * (it stays empty unless Cloudflare needs the visitor to interact), call
 * `getToken()` on submit and `reset()` after every submission, since tokens
 * are single-use. Disabled (no widget, null token) when no site key is set.
 */
export function useTurnstile(action: string) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const failedRef = useRef(false);
  const waitersRef = useRef<TokenWaiter[]>([]);

  const settle = useCallback((token: string | null) => {
    const waiters = waitersRef.current;
    waitersRef.current = [];
    waiters.forEach((waiter) => waiter(token));
  }, []);

  useEffect(() => {
    if (!SITE_KEY || !container) return undefined;
    let cancelled = false;

    loadTurnstile()
      .then((api) => {
        if (cancelled) return;
        widgetIdRef.current = api.render(container, {
          sitekey: SITE_KEY,
          action,
          appearance: "interaction-only",
          callback: (token: string) => {
            tokenRef.current = token;
            failedRef.current = false;
            settle(token);
          },
          "expired-callback": () => {
            tokenRef.current = null;
          },
          "error-callback": () => {
            tokenRef.current = null;
            failedRef.current = true;
            settle(null);
          },
        });
      })
      .catch(() => {
        failedRef.current = true;
        settle(null);
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current) window.turnstile?.remove(widgetIdRef.current);
      widgetIdRef.current = null;
      tokenRef.current = null;
    };
  }, [action, container, settle]);

  /** Resolves with a token, or null if the check failed or timed out. */
  const getToken = useCallback((): Promise<string | null> => {
    if (!SITE_KEY) return Promise.resolve(null);
    if (tokenRef.current) return Promise.resolve(tokenRef.current);
    if (failedRef.current) return Promise.resolve(null);
    return new Promise((resolve) => {
      const waiter: TokenWaiter = (token) => {
        clearTimeout(timer);
        resolve(token);
      };
      const timer = setTimeout(() => {
        waitersRef.current = waitersRef.current.filter((w) => w !== waiter);
        resolve(null);
      }, TOKEN_WAIT_MS);
      waitersRef.current.push(waiter);
    });
  }, []);

  const reset = useCallback(() => {
    tokenRef.current = null;
    if (!widgetIdRef.current) return;
    failedRef.current = false;
    window.turnstile?.reset(widgetIdRef.current);
  }, []);

  return {
    attachContainer: setContainer,
    enabled: Boolean(SITE_KEY),
    getToken,
    reset,
  };
}
