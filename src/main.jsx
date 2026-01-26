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

function waitEventOnce(name, timeoutMs = 2200) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    let done = false;

    const finish = (timedOut) => {
      if (done) return;
      done = true;
      resolve({ name, timedOut, ms: Math.round(performance.now() - t0) });
    };

    try {
      window.addEventListener(name, () => finish(false), { once: true });
    } catch {}

    window.setTimeout(() => finish(true), timeoutMs);
  });
}

function devLog(...args) {
  if (import.meta.env.DEV) console.log(...args);
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

      // 1) preload critical boot (json + warm images)
      try {
        await preloadBootOnce();
      } catch (e) {
        devLog("[Boot] preloadBootOnce failed (ignored)", e);
      }
      if (!alive) return;
      mark("bootPreloadDone");
      devLog("[Boot] boot preload done", T.bootPreloadDone, "ms");

      // 2) mount app behind splash (React builds hidden)
      setShowApp(true);
      mark("appMountedBehindSplash");
      devLog("[Boot] App mounted behind splash", T.appMountedBehindSplash, "ms");

      // 3) wait fonts (avoid text pop)
      try {
        if (document.fonts?.ready) await document.fonts.ready;
      } catch {}
      if (!alive) return;
      mark("fontsReady");
      devLog("[Boot] fonts ready", T.fontsReady, "ms");

      // 4) let React commit at least once
      await rafN(2);
      if (!alive) return;
      mark("afterCommit");
      devLog("[Boot] after 2 RAF commit", T.afterCommit, "ms");

      // 5) wait for paint signals (best effort with timeouts)
      const results = await Promise.all([
        waitEventOnce("ag:essentialReady", 3200),
        waitEventOnce("ag:contactReady", 3200),
      ]);

      if (!alive) return;
      mark("signalsDone");

      // warn on timeouts (helps detect hidden bugs)
      const timedOut = results.filter((r) => r.timedOut);
      if (timedOut.length) {
        console.warn("[Boot] signal timeout(s):", timedOut);
      }

      devLog("[Boot] signals:", results);
      devLog("[Boot] signals done", T.signalsDone, "ms");

      // 6) final settle (blur/backdrop/compositing)
      await rafN(2);
      if (!alive) return;
      mark("finalSettle");
      devLog("[Boot] final settle", T.finalSettle, "ms");

      // 7) reveal
      try {
        window.__AG_REVEAL_DONE__ = true;
        document.documentElement.dataset.agReveal = "1";
        window.dispatchEvent(new Event("ag:revealDone"));
      } catch {}
      mark("revealFired");
      devLog("[Boot] reveal fired", T.revealFired, "ms");

      await raf();
      if (!alive) return;

      setHideSplash(true);
      mark("splashHidden");
      devLog("[Boot] splash hidden", T.splashHidden, "ms");

      devLog("[Boot] total", T.splashHidden - T.start, "ms");
    })();

    return () => {
      alive = false;
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
