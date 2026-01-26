// src/hooks/useBoot.js

import { useEffect, useState } from "react";

function readBoot() {
  try {
    return window.__AG_BOOT__ || {};
  } catch {
    return {};
  }
}

export default function useBoot() {
  const [boot, setBoot] = useState(() => readBoot());

  useEffect(() => {
    if (typeof window === "undefined") return;

    // si déjà prêt, on sync direct
    if (window.__AG_BOOT_READY__) {
      setBoot(readBoot());
      return;
    }

    const onReady = () => setBoot(readBoot());
    window.addEventListener("ag:bootReady", onReady);
    return () => window.removeEventListener("ag:bootReady", onReady);
  }, []);

  return boot;
}
