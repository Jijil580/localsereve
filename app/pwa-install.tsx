"use client";

import { useEffect, useState } from "react";

type Language = "EN" | "ML";
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function PwaInstall() {
  const [language, setLanguage] = useState<Language>("EN");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const [instructions, setInstructions] = useState(false);

  useEffect(() => {
    const syncLanguage = () =>
      setLanguage(document.documentElement.dataset.language === "ML" ? "ML" : "EN");
    syncLanguage();
    const languageObserver = new MutationObserver(syncLanguage);
    languageObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-language"],
    });

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((registration) => registration.update())
        .catch(() => {});
    }

    const appleStandalone =
      "standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const installed =
      window.matchMedia("(display-mode: standalone)").matches || appleStandalone;
    const dismissed = window.sessionStorage.getItem("nearleo-install-dismissed") === "1";
    const appleDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const mobileDevice = appleDevice || /android/i.test(navigator.userAgent);

    setIos(appleDevice);
    if (!installed && !dismissed) setVisible(mobileDevice);

    const captureInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      if (!dismissed) setVisible(true);
    };
    const installedApp = () => {
      setVisible(false);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", captureInstall);
    window.addEventListener("appinstalled", installedApp);
    return () => {
      languageObserver.disconnect();
      window.removeEventListener("beforeinstallprompt", captureInstall);
      window.removeEventListener("appinstalled", installedApp);
    };
  }, []);

  async function install() {
    if (installEvent) {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") setVisible(false);
      setInstallEvent(null);
      return;
    }
    setInstructions(true);
  }

  function dismiss() {
    window.sessionStorage.setItem("nearleo-install-dismissed", "1");
    setVisible(false);
  }

  if (!visible) return null;
  const malayalam = language === "ML";

  return (
    <aside
      className={`pwa-install-card ${instructions ? "show-instructions" : ""}`}
      aria-label="Install Nearleo app"
    >
      <button type="button" className="pwa-install-main" onClick={install}>
        <img src="/nearleo-logo.svg" alt="" aria-hidden="true" />
        <span>
          <b>{malayalam ? "Nearleo ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുക" : "Install Nearleo app"}</b>
          <small>
            {malayalam
              ? "മൊബൈൽ ആപ്പുപോലെ ഉപയോഗിക്കാം"
              : "Open faster from your home screen"}
          </small>
        </span>
        <i aria-hidden="true">↓</i>
      </button>
      <button
        type="button"
        className="pwa-install-close"
        onClick={dismiss}
        aria-label="Dismiss install suggestion"
      >
        ×
      </button>
      {instructions && (
        <div className="pwa-install-instructions" role="status">
          <b>
            {ios
              ? malayalam
                ? "iPhone / iPad-ൽ"
                : "On iPhone or iPad"
              : malayalam
                ? "Android-ൽ"
                : "On Android"}
          </b>
          <p>
            {ios
              ? malayalam
                ? "ബ്രൗസറിലെ Share ബട്ടൺ അമർത്തി ‘Add to Home Screen’ തിരഞ്ഞെടുക്കുക."
                : "Tap the browser Share button, then choose ‘Add to Home Screen’."
              : malayalam
                ? "ബ്രൗസർ മെനു (⋮) തുറന്ന് ‘Install app’ അല്ലെങ്കിൽ ‘Add to Home screen’ തിരഞ്ഞെടുക്കുക."
                : "Open the browser menu (⋮), then choose ‘Install app’ or ‘Add to Home screen’."}
          </p>
        </div>
      )}
    </aside>
  );
}
