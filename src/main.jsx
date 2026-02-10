// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import App from "./App.jsx";
import BootSplashCanvas from "./BootSplashCanvas";
import { preloadBootOnce } from "./bootstrap/preloadBoot";

/* -----------------------------
   Splash
----------------------------- */
function BootSplash() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        background: "#050016",
      }}
    >
      <BootSplashCanvas />
    </div>
  );
}

/* -----------------------------
   RAF helpers
----------------------------- */
const raf = () => new Promise((r) => requestAnimationFrame(r));
const rafN = async (n = 2) => {
  for (let i = 0; i < n; i++) await raf();
};

function devLog(...args) {
  if (import.meta.env.DEV) console.log(...args);
}

/** non-blocking: listen once + set dataset flag */
function armReadyFlag(eventName, datasetKey, already = false) {
  if (typeof window === "undefined") return () => {};
  if (already) {
    document.documentElement.dataset[datasetKey] = "1";
    return () => {};
  }

  const on = () => {
    document.documentElement.dataset[datasetKey] = "1";
    // also keep your global flag if you want
    try {
      if (eventName === "ag:aboutReady") window.__AG_ABOUT_READY__ = true;
      if (eventName === "ag:projectsReady") window.__AG_PRJ_READY__ = true;
      if (eventName === "ag:contactReady") window.__AG_CTC_READY__ = true;
    } catch {}
  };

  window.addEventListener(eventName, on, { once: true });
  return () => window.removeEventListener(eventName, on);
}

/* -----------------------------
   Root
----------------------------- */
function Root() {
  const [showApp, setShowApp] = React.useState(false);
  const [hideSplash, setHideSplash] = React.useState(false);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      const T = {};
      const mark = (k) => (T[k] = Math.round(performance.now()));

      mark("start");
      devLog("[Boot] start", T.start);

      // 0) mount app immediately behind splash
      // (so it can start fetching/rendering ASAP)
      setShowApp(true);

      // (optional) ensure splash stays at least a bit (prevents flash on hot cache)
      const MIN_SPLASH_MS = 350;
      const tMin = performance.now() + MIN_SPLASH_MS;

      // 1) preload critical boot (json + warm images)
      try {
        await preloadBootOnce();
      } catch (e) {
        devLog("[Boot] preloadBootOnce failed (ignored)", e);
      }
      if (!alive) return;
      mark("bootPreloadDone");
      devLog("[Boot] boot preload done", T.bootPreloadDone - T.start, "ms");

      // 2) wait fonts (avoid text pop)
      try {
        if (document.fonts?.ready) await document.fonts.ready;
      } catch {}
      if (!alive) return;
      mark("fontsReady");
      devLog("[Boot] fonts ready", T.fontsReady - T.start, "ms");

      // 3) let React commit/layout settle a bit
      await rafN(2);
      if (!alive) return;
      mark("afterCommit");
      devLog("[Boot] after 2 RAF", T.afterCommit - T.start, "ms");

      // 4) reveal (DO NOT WAIT for about/projects/contact)
      try {
        window.__AG_REVEAL_DONE__ = true;
        document.documentElement.dataset.agReveal = "1";
        window.dispatchEvent(new Event("ag:revealDone"));
      } catch {}
      mark("revealFired");
      devLog("[Boot] reveal fired", T.revealFired - T.start, "ms");

      // wait until min splash time
      while (performance.now() < tMin) {
        await raf();
        if (!alive) return;
      }

      // one more frame then hide splash
      await raf();
      if (!alive) return;

      setHideSplash(true);
      mark("splashHidden");
      devLog("[Boot] splash hidden", T.splashHidden - T.start, "ms");
      devLog("[Boot] total", T.splashHidden - T.start, "ms");
    })();

    // non-blocking flags: these should not gate reveal
    const offAbout = armReadyFlag("ag:aboutReady", "agAbout", window.__AG_ABOUT_READY__ === true);
    const offPrj = armReadyFlag("ag:projectsReady", "agProjects", window.__AG_PRJ_READY__ === true);
    const offCtc = armReadyFlag("ag:contactReady", "agContact", window.__AG_CTC_READY__ === true);

    return () => {
      alive = false;
      offAbout();
      offPrj();
      offCtc();
    };
  }, []);

  return (
    <>
      {showApp && <App />}
      {!hideSplash && <BootSplash />}
    </>
  );
}

createRoot(document.getElementById("root")).render(<Root />);


