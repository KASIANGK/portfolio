// src/Components/HomeCity/ui/FullScreenLoader.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { useTranslation } from "react-i18next";
import "./style/FullScreenLoader.css";

export default function FullScreenLoader({
  label = "Loading…",
  subLabel = "Booting systems…",
  force = false,

  // ✅ optional external control (for App-level overlay during dynamic import)
  externalActive = null, // boolean | null
  externalPct = null,    // number 0..100 | null
}) {
  const { t } = useTranslation("home");
  const { active: r3fActive, progress: r3fProgress } = useProgress();

  // ✅ choose source
  const isExternal = externalActive !== null || externalPct !== null;
  const active = isExternal ? !!externalActive : r3fActive;
  const rawProgress = isExternal ? (externalPct ?? 0) : r3fProgress;

  const pct = Math.min(100, Math.max(0, Math.round(rawProgress)));

  // --- Real ETA engine ---
  const startRef = useRef(0);
  const lastEtaRef = useRef(null);
  const [etaSec, setEtaSec] = useState(null);

  useEffect(() => {
    // start timer when loader becomes active
    if (active && !startRef.current) {
      startRef.current = performance.now();
      lastEtaRef.current = null;
      setEtaSec(null);
      return;
    }

    // reset when inactive
    if (!active) {
      startRef.current = 0;
      lastEtaRef.current = null;
      setEtaSec(null);
      return;
    }

    // compute ETA only when we have a meaningful pct
    if (pct <= 1 || pct >= 100) {
      setEtaSec(pct >= 100 ? 0 : null);
      return;
    }

    const elapsed = (performance.now() - startRef.current) / 1000;
    if (elapsed < 0.2) return; // avoid nonsense early

    const speed = pct / Math.max(0.001, elapsed); // % per sec
    const rawEta = (100 - pct) / Math.max(0.001, speed); // seconds

    // clamp + smooth (avoid jumpy eta)
    const clamped = Math.max(1, Math.min(999, rawEta));
    const prev = lastEtaRef.current;

    // exponential smoothing: 70% old / 30% new
    const smooth = prev == null ? clamped : prev * 0.7 + clamped * 0.3;

    lastEtaRef.current = smooth;
    setEtaSec(Math.ceil(smooth));
  }, [active, pct]);

  // Auto-hide only if NOT forced
  if (!force && !active && pct >= 100) return null;

  const statusLine = useMemo(() => {
    if (pct < 100) {
      if (etaSec == null) {
        return t("loader.estimating", { defaultValue: "Estimating…" });
      }
      return t("loader.eta", { seconds: etaSec });
    }
    return t("loader.calibrating");
  }, [pct, etaSec, t]);

  return (
    <div className="agLoader" role="status" aria-live="polite" aria-label="Loading">
      <div className="agLoader__darkbg" aria-hidden="true"></div>
      <div className="agLoader__bg" aria-hidden="true" />
      <div className="agLoader__noise" aria-hidden="true" />
      <div className="agLoader__scan" aria-hidden="true" />

      <div className="agLoader__card">
        <div className="agLoader__sheen" aria-hidden="true"></div>
        <div className="agLoader__edge" aria-hidden="true"></div>

        <span className="agLoader__corner tl" aria-hidden="true" />
        <span className="agLoader__corner tr" aria-hidden="true" />
        <span className="agLoader__corner bl" aria-hidden="true" />
        <span className="agLoader__corner br" aria-hidden="true" />

        <div className="agLoader__topline" aria-hidden="true" />
        <div className="agLoader__kicker">
          <span className="agLoader__dot" aria-hidden="true" />
          KASIA // INTERACTIVE PORTFOLIO
        </div>

        <div className="agLoader__row">
          <div className="agLoader__ring" aria-hidden="true">
            <div className="agLoader__ringGlow" />
            <div className="agLoader__ringSpin" />
            <div className="agLoader__ringCore" />
          </div>

          <div className="agLoader__text">
            <div className="agLoader__label">{label}</div>
            <div className="agLoader__sub">{subLabel}</div>
          </div>

          <div className="agLoader__pct">{pct}%</div>
        </div>

        <div className="agLoader__bar">
          <div className="agLoader__barFill" style={{ width: `${pct}%` }} />
          <div className="agLoader__barGlow" style={{ width: `${pct}%` }} />
        </div>

        <div className="agLoader__meta">
          <span className="agLoader__metaLeft">{statusLine}</span>
          <span className="agLoader__metaRight">build: neon</span>
        </div>
      </div>
    </div>
  );
}





// // src/Components/HomeCity/ui/FullScreenLoader.jsx
// import React, { useMemo } from "react";
// import { useProgress } from "@react-three/drei";
// import { useTranslation } from "react-i18next";
// import "./style/FullScreenLoader.css";

// export default function FullScreenLoader({
//   label = "Loading…",
//   subLabel = "Booting systems…",
//   force = false,
// }) {
//   const { t } = useTranslation("home");
//   const { active, progress } = useProgress();

//   const pct = Math.min(100, Math.max(0, Math.round(progress)));
//   const eta = pct >= 100 ? 0 : Math.ceil((100 - pct) / 18);

//   // Auto-hide only if NOT forced
//   if (!force && !active && pct >= 100) return null;

//   const statusLine = useMemo(() => {
//     if (pct < 100) return t("loader.eta", { seconds: eta });
//     return t("loader.calibrating");
//   }, [pct, eta, t]);

//   return (
//     <div className="agLoader" role="status" aria-live="polite" aria-label="Loading">
//       {/* background FX */}
//       <div className="agLoader__darkbg" aria-hidden="true"></div>
//       <div className="agLoader__bg" aria-hidden="true" />
//       <div className="agLoader__noise" aria-hidden="true" />
//       <div className="agLoader__scan" aria-hidden="true" />

//       <div className="agLoader__card">

//         <div className="agLoader__sheen" aria-hidden="true"></div>
//         <div className="agLoader__edge" aria-hidden="true"></div>

//         {/* corners */}
//         <span className="agLoader__corner tl" aria-hidden="true" />
//         <span className="agLoader__corner tr" aria-hidden="true" />
//         <span className="agLoader__corner bl" aria-hidden="true" />
//         <span className="agLoader__corner br" aria-hidden="true" />

//         <div className="agLoader__topline" aria-hidden="true" />
//         <div className="agLoader__kicker">
//           <span className="agLoader__dot" aria-hidden="true" />
//           KASIA // INTERACTIVE PORTFOLIO
//         </div>

//         <div className="agLoader__row">
//           {/* ring */}
//           <div className="agLoader__ring" aria-hidden="true">
//             <div className="agLoader__ringGlow" />
//             <div className="agLoader__ringSpin" />
//             <div className="agLoader__ringCore" />
//           </div>

//           <div className="agLoader__text">
//             <div className="agLoader__label">{label}</div>
//             <div className="agLoader__sub">
//               {subLabel} 
//             </div>
//           </div>

//           <div className="agLoader__pct">{pct}%</div>
//         </div>

//         {/* progress bar */}
//         <div className="agLoader__bar">
//           <div className="agLoader__barFill" style={{ width: `${pct}%` }} />
//           <div className="agLoader__barGlow" style={{ width: `${pct}%` }} />
//         </div>

//         <div className="agLoader__meta">
//           <span className="agLoader__metaLeft">{statusLine}</span>
//           <span className="agLoader__metaRight">build: neon</span>
//         </div>
//       </div>
//     </div>
//   );
// }

