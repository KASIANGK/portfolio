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
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve(name);
    };

    try {
      window.addEventListener(name, finish, { once: true });
    } catch {}

    window.setTimeout(finish, timeoutMs);
  });
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
      // 1) preload everything critical (json + warm images)
      try {
        await preloadBootOnce();
      } catch {}

      if (!alive) return;

      // 2) mount app behind splash (React builds hidden)
      setShowApp(true);

      // 3) wait fonts (avoid text pop)
      try {
        if (document.fonts?.ready) await document.fonts.ready;
      } catch {}

      // 4) let React commit at least once
      await rafN(2);
      if (!alive) return;

      // 5) wait for "real paint" signals from Home + Essential + Contact
      // - homeFirstPaint: Home says "DOM is there + 2 RAF"
      // - essentialReady/contactReady: sections say "I’m painted"
      await Promise.all([
        waitEventOnce("ag:homeFirstPaint", 2600),
        waitEventOnce("ag:essentialReady", 2800),
        waitEventOnce("ag:contactReady", 2800),
      ]);

      if (!alive) return;

      // 6) final settle (blur/backdrop/compositing)
      await rafN(2);
      if (!alive) return;

      // 7) reveal
      window.__AG_REVEAL_DONE__ = true;
      document.documentElement.dataset.agReveal = "1";
      window.dispatchEvent(new Event("ag:revealDone"));

      await raf();
      if (!alive) return;

      setHideSplash(true);
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
