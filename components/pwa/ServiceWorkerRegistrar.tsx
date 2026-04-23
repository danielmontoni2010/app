"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[SW] Registrado com sucesso:", reg.scope);
        })
        .catch((err) => {
          console.warn("[SW] Falha no registro:", err);
        });
    }
  }, []);

  return null;
}
