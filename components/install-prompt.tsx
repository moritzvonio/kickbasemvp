"use client";

/**
 * App-Install-Banner — macht aus der PWA eine "richtige" App auf dem Homescreen.
 *
 * Zwei Pfade:
 *  - Android/Chrome (+ Edge): natives `beforeinstallprompt`-Event → echter
 *    Install-Button, der den System-Dialog öffnet.
 *  - iOS (Safari/Chrome): kein Install-Event verfügbar → kurze Anleitung
 *    "Teilen → Zum Home-Bildschirm".
 *
 * Zeigt sich nie, wenn: bereits installiert (standalone), schon weggeklickt
 * (localStorage) oder Desktop ohne Install-Event.
 */

import { useEffect, useState } from "react";
import { Share, SquarePlus, X, Download } from "lucide-react";

const DISMISS_KEY = "lb-install-dismissed";
const SHOW_DELAY_MS = 2_500;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS-Safari-Spezifikum
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const classic = /iPhone|iPad|iPod/i.test(ua);
  // iPadOS meldet sich als "MacIntel" mit Touch
  const ipadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return classic || ipadOs;
}

export function InstallPrompt() {
  const [mode, setMode] = useState<"hidden" | "ios" | "native">("hidden");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    // Android/Chrome: natives Install-Event abfangen
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setMode("native");
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS: kein Event — nach kurzer Verzögerung Anleitung zeigen
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isIos()) {
      timer = setTimeout(() => {
        setMode((m) => (m === "hidden" ? "ios" : m));
      }, SHOW_DELAY_MS);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    setMode("hidden");
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setMode("hidden");
    } else {
      dismiss();
    }
  };

  if (mode === "hidden") return null;

  return (
    <div
      className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:right-4 sm:max-w-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      role="dialog"
      aria-label="LigaBase als App installieren"
    >
      <div className="rounded-xl border border-border bg-background/95 backdrop-blur shadow-lg ring-1 ring-primary/15 p-3.5">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt=""
            width={40}
            height={40}
            className="rounded-lg shrink-0"
          />
          <div className="min-w-0 flex-1 text-sm">
            <div className="font-semibold">LigaBase als App</div>
            {mode === "native" ? (
              <p className="text-xs text-muted-foreground mt-0.5">
                Direkt auf dem Homescreen — mit Vollbild und Push.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Tipp auf <Share className="inline size-3.5 -mt-0.5 text-primary" aria-label="Teilen" />{" "}
                <span className="font-medium text-foreground">Teilen</span> und dann{" "}
                <SquarePlus className="inline size-3.5 -mt-0.5 text-primary" aria-label="Zum Home-Bildschirm" />{" "}
                <span className="font-medium text-foreground">&bdquo;Zum Home-Bildschirm&ldquo;</span> —
                fertig ist die App.
              </p>
            )}
            {mode === "native" && (
              <button
                onClick={install}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Download className="size-3.5" />
                Installieren
              </button>
            )}
          </div>
          <button
            onClick={dismiss}
            aria-label="Hinweis schließen"
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
