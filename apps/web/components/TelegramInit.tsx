'use client';

import { useEffect } from 'react';

/**
 * Mounts the Telegram Mini App SDK (theme params, viewport, mini app) when
 * the page is opened from Telegram. Renders nothing. Outside Telegram (plain
 * browser) the SDK throws on init() — we swallow those errors so local dev
 * still works as a regular web page.
 */
export function TelegramInit() {
  useEffect(() => {
    (async () => {
      try {
        const sdk = await import('@telegram-apps/sdk-react');
        if (sdk.isTMA()) {
          sdk.init();
          if (sdk.themeParams.mount.isAvailable()) {
            sdk.themeParams.mount();
            sdk.themeParams.bindCssVars();
          }
          if (sdk.miniApp.mount.isAvailable()) {
            await sdk.miniApp.mount();
            sdk.miniApp.ready();
          }
          if (sdk.viewport.mount.isAvailable()) {
            await sdk.viewport.mount();
            sdk.viewport.expand();
          }
        }
      } catch {
        // Not running inside Telegram — ignore.
      }
    })();
  }, []);

  return null;
}
