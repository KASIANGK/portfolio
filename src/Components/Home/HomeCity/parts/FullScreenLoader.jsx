// src/Components/HomeCity/ui/FullScreenLoader.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { useTranslation } from "react-i18next";
import "./style/FullScreenLoader.css";

export default function FullScreenLoader({
  label = "Loading…",
  subLabel, // si undefined => i18n
  force = false,

  // optional external control (App overlay during dynamic import)
  externalActive = null, // boolean | null
  externalPct = null, // number 0..100 | null
}) {
  const { t } = useTranslation("home");
  const { active: r3fActive, progress: r3fProgress } = useProgress();

  /* -----------------------------
     i18n sublabel by default
  ------------------------------ */
  const finalSubLabel =
    subLabel ?? t("loader.subLabel", { defaultValue: "Intrusion dans la matrice" });

  /* -----------------------------
     choose progress source
  ------------------------------ */
  const isExternal = externalActive !== null || externalPct !== null;
  const active = isExternal ? !!externalActive : r3fActive;
  const rawProgress = isExternal ? (externalPct ?? 0) : r3fProgress;
  const pctGlobal = Math.min(100, Math.max(0, Math.round(rawProgress)));

  /* -----------------------------
     phases coming from HomeCity
  ------------------------------ */
  const [phases, setPhases] = useState({
    scenePct: 0,
    collisionPct: 0,
    portalsPct: 0,
    playerPct: 0,
    gatePct: 0,
    overallPct: 0,
  });

  useEffect(() => {
    const onPhase = (e) => {
      const d = e?.detail;
      if (!d) return;
      setPhases((prev) => ({ ...prev, ...d }));
    };
    window.addEventListener("ag:cityPhaseProgress", onPhase);
    return () => window.removeEventListener("ag:cityPhaseProgress", onPhase);
  }, []);

  /* -----------------------------
     Auto-hide only if NOT forced
  ------------------------------ */
  if (!force && !active && pctGlobal >= 100) return null;

  /* -----------------------------
     Progress bar = phases.overallPct if present, else pctGlobal
  ------------------------------ */
  const pctBar = useMemo(() => {
    const g = phases.overallPct || pctGlobal;
    return Math.min(100, Math.max(0, Math.round(g)));
  }, [phases.overallPct, pctGlobal]);

  /* -----------------------------
     Meta left = phases
  ------------------------------ */
  const metaLeft = useMemo(() => {
    const parts = [
      `SCENE ${Math.round(phases.scenePct || 0)}%`,
      `COLLISION ${Math.round(phases.collisionPct || 0)}%`,
      `PORTALS ${Math.round(phases.portalsPct || 0)}%`,
    ];
    return parts.join(" · ");
  }, [phases.scenePct, phases.collisionPct, phases.portalsPct]);

  /* -----------------------------
     Real ETA engine + stall fallback
     Goal: ALWAYS show seconds during collision/shader/finalization stalls
  ------------------------------ */
  const startRef = useRef(0);
  const lastEtaRef = useRef(null);
  const [etaSec, setEtaSec] = useState(null);

  const [elapsedSec, setElapsedSec] = useState(0);

  const lastPctRef = useRef(pctBar);
  const lastPctAtRef = useRef(performance.now());
  const [stallSec, setStallSec] = useState(0);

  // When active toggles: reset clocks
  useEffect(() => {
    if (active && !startRef.current) {
      startRef.current = performance.now();
      lastEtaRef.current = null;
      setEtaSec(null);
      setElapsedSec(0);

      lastPctRef.current = pctBar;
      lastPctAtRef.current = performance.now();
      setStallSec(0);
      return;
    }

    if (!active) {
      startRef.current = 0;
      lastEtaRef.current = null;
      setEtaSec(null);
      setElapsedSec(0);

      lastPctRef.current = pctBar;
      lastPctAtRef.current = performance.now();
      setStallSec(0);
    }
  }, [active]); // intentionally not depending on pct

  // Compute ETA from speed (smooth) when we have meaningful movement
  useEffect(() => {
    if (!active) return;

    // If complete
    if (pctBar >= 100) {
      setEtaSec(0);
      return;
    }

    // Ignore too early / too low
    if (pctBar <= 1) {
      setEtaSec(null);
      return;
    }

    const elapsed = (performance.now() - startRef.current) / 1000;
    if (elapsed < 0.35) return;

    const speed = pctBar / Math.max(0.001, elapsed); // % per sec
    const rawEta = (100 - pctBar) / Math.max(0.001, speed);

    const clamped = Math.max(1, Math.min(999, rawEta));
    const prev = lastEtaRef.current;

    // smooth
    const smooth = prev == null ? clamped : prev * 0.7 + clamped * 0.3;

    lastEtaRef.current = smooth;
    setEtaSec(Math.ceil(smooth));
  }, [active, pctBar]);

  // Tick: elapsed + stall seconds
  useEffect(() => {
    if (!active) return;

    const tick = () => {
      const now = performance.now();
      if (startRef.current) {
        setElapsedSec(Math.floor((now - startRef.current) / 1000));
      }

      // stall tracking
      if (pctBar !== lastPctRef.current) {
        lastPctRef.current = pctBar;
        lastPctAtRef.current = now;
        setStallSec(0);
      } else {
        const s = (now - lastPctAtRef.current) / 1000;
        setStallSec(Math.floor(s));
      }
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [active, pctBar]);

  /* -----------------------------
     Step counter fallback (i/N)
     - used when ETA is not reliable yet (early stage)
     - also useful if you want "progress story" even when pct stalls
  ------------------------------ */
  const STEPS = useMemo(
    () => [
      { key: "SCENE", pct: phases.scenePct },
      { key: "COLLISION", pct: phases.collisionPct },
      { key: "PORTALS", pct: phases.portalsPct },
      { key: "PLAYER", pct: phases.playerPct },
      { key: "GATE", pct: phases.gatePct },

      // “virtual” steps driven by global progress / stall:
      { key: "SHADERS", pct: Math.max(0, Math.min(100, (pctBar - 70) * 3.33)) }, // 70->100 maps to 0->100
      { key: "POSTFX", pct: Math.max(0, Math.min(100, (pctBar - 78) * 4.55)) },
      { key: "TEXTURES", pct: Math.max(0, Math.min(100, (pctBar - 60) * 2.5)) },
      { key: "FINALIZE", pct: Math.max(0, Math.min(100, (pctBar - 85) * 6.67)) },
      { key: "READY", pct: pctBar >= 100 ? 100 : 0 },
    ],
    [phases.scenePct, phases.collisionPct, phases.portalsPct, phases.playerPct, phases.gatePct, pctBar]
  );

  const stepInfo = useMemo(() => {
    const total = STEPS.length;

    // current step = first not completed (pct < 100)
    let idx = STEPS.findIndex((s) => (s.pct ?? 0) < 100);
    if (idx === -1) idx = total - 1;

    const stepNumber = Math.min(total, Math.max(1, idx + 1));
    const stepKey = STEPS[idx]?.key || "LOADING";

    return { total, stepNumber, stepKey };
  }, [STEPS]);

  /* -----------------------------
     Meta right policy:
     - If we have ETA -> show ~XXs (ALWAYS, even during stalls)
     - Else show step i/N
     - If stalling hard (>=2s) and eta exists -> still show ~XXs (no "finalisation" text)
  ------------------------------ */
  const metaRight = useMemo(() => {
    if (pctBar >= 100) return t("loader.calibrating");

    // ✅ Always show seconds if eta is available
    if (etaSec != null) return t("loader.eta", { seconds: etaSec });

    // fallback: show steps
    return t("loader.step", {
      defaultValue: `${stepInfo.stepNumber}/${stepInfo.total}`,
      current: stepInfo.stepNumber,
      total: stepInfo.total,
      key: stepInfo.stepKey,
    });
  }, [pctBar, etaSec, stepInfo, t]);

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
            <div className="agLoader__sub">{finalSubLabel}</div>
          </div>

          <div className="agLoader__pct">{pctBar}%</div>
        </div>

        <div className="agLoader__bar">
          <div className="agLoader__barFill" style={{ width: `${pctBar}%` }} />
          <div className="agLoader__barGlow" style={{ width: `${pctBar}%` }} />
        </div>

        <div className="agLoader__meta">
          <span className="agLoader__metaLeft">{metaLeft}</span>
          <span className="agLoader__metaRight">{metaRight}</span>
        </div>

        {/* optionnel debug discret  */}
        {/* <div style={{ marginTop: 8, fontSize: 10, opacity: 0.5 }}>
          elapsed {elapsedSec}s · stall {stallSec}s
        </div> */}
      </div>
    </div>
  );
}
