"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    const id = window.setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch((e) => {
        console.warn("SW registration failed:", e);
      });
    }, 1500);
    return () => window.clearTimeout(id);
  }, []);
  return null;
}
