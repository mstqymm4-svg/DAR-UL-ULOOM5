// ─────────────────────────────────────────────────────────────────────────
// Capacitor native bridge — only active inside the packaged Android app.
// No-ops on the web (dev/preview/deployed) build.
// Handles: splash hide, status bar styling, hardware back button.
// ─────────────────────────────────────────────────────────────────────────

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export const isNative = Capacitor.isNativePlatform();

export async function setupNativeApp() {
  if (!isNative) return;

  try {
    await SplashScreen.hide();
  } catch (e) {
    /* ignore */
  }

  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setBackgroundColor({ color: '#276850' });
    await StatusBar.setStyle({ style: 'LIGHT' });
  } catch (e) {
    /* ignore */
  }

  try {
    App.addListener('backButton', ({ canGoBack }) => {
      const idx = window.history?.state?.idx;
      if (canGoBack || (typeof idx === 'number' && idx > 0)) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  } catch (e) {
    /* ignore */
  }
}
