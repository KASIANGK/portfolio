// src/Components/HomeCity/ui/FullScreenLoader.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { useTranslation } from "react-i18next";
import "./style/FullScreenLoader.css";

export default function FullScreenLoader({
  label = "Loading…",
  subLabel, // si undefined => i18n
  force = false,

  // ✅ optional external control (for App-level overlay during dynamic import)
  externalActive = null, // boolean | null
  externalPct = null, // number 0..100 | null
}) {
  const { t } = useTranslation("home");
  const { active: r3fActive, progress: r3fProgress } = useProgress();

  /* -----------------------------
     ✅ i18n sublabel by default
  ------------------------------ */
  const finalSubLabel =
    subLabel ?? t("loader.subLabel", { defaultValue: "Intrusion dans la matrice" });

  /* -----------------------------
     ✅ choose progress source
  ------------------------------ */
  const isExternal = externalActive !== null || externalPct !== null;
  const active = isExternal ? !!externalActive : r3fActive;
  const rawProgress = isExternal ? (externalPct ?? 0) : r3fProgress;
  const pctGlobal = Math.min(100, Math.max(0, Math.round(rawProgress)));

  /* -----------------------------
     ✅ phases coming from HomeCity
     expects window.dispatchEvent(new CustomEvent("ag:cityPhaseProgress", { detail: {...} }))
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
     ✅ Real ETA + elapsed + stall detector
     (only used for metaRight)
  ------------------------------ */
  const startRef = useRef(0);
  const lastEtaRef = useRef(null);
  const [etaSec, setEtaSec] = useState(null);

  const [elapsedSec, setElapsedSec] = useState(0);
  const lastPctRef = useRef(pctGlobal);
  const lastPctAtRef = useRef(performance.now());
  const [isStalling, setIsStalling] = useState(false);

  // Start/reset clocks when (active) toggles
  useEffect(() => {
    if (active && !startRef.current) {
      startRef.current = performance.now();
      lastEtaRef.current = null;
      setEtaSec(null);

      setElapsedSec(0);
      setIsStalling(false);
      lastPctRef.current = pctGlobal;
      lastPctAtRef.current = performance.now();
      return;
    }

    if (!active) {
      startRef.current = 0;
      lastEtaRef.current = null;
      setEtaSec(null);

      setElapsedSec(0);
      setIsStalling(false);
      lastPctRef.current = pctGlobal;
      lastPctAtRef.current = performance.now();
    }
  }, [active]); // intentionally not depending on pct

  // ETA computation (smooth)
  useEffect(() => {
    if (!active) return;

    const pct = pctGlobal;

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
  }, [active, pctGlobal]);

  // elapsed + stall detector (tick)
  useEffect(() => {
    if (!active) return;

    const tick = () => {
      if (!startRef.current) return;

      const now = performance.now();
      const elapsed = (now - startRef.current) / 1000;
      setElapsedSec(Math.floor(elapsed));

      // detect stall: pct doesn't move for > 1.2s (tweak)
      if (pctGlobal !== lastPctRef.current) {
        lastPctRef.current = pctGlobal;
        lastPctAtRef.current = now;
        setIsStalling(false);
      } else {
        const stillFor = (now - lastPctAtRef.current) / 1000;
        setIsStalling(stillFor > 1.2 && pctGlobal >= 60 && pctGlobal < 100);
      }
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [active, pctGlobal]);

  /* -----------------------------
     Auto-hide only if NOT forced
  ------------------------------ */
  if (!force && !active && pctGlobal >= 100) return null;

  /* -----------------------------
     ✅ Meta left = phases
     ✅ Progress bar = phases.overallPct if present, else pctGlobal
  ------------------------------ */
  const phaseLine = useMemo(() => {
    const g = phases.overallPct || pctGlobal;

    const parts = [
      `SCENE ${Math.round(phases.scenePct || 0)}%`,
      `COLLISION ${Math.round(phases.collisionPct || 0)}%`,
      `PORTALS ${Math.round(phases.portalsPct || 0)}%`,
    ];

    // optionnel:
    // parts.push(`PLAYER ${Math.round(phases.playerPct || 0)}%`);
    // parts.push(`GATE ${Math.round(phases.gatePct || 0)}%`);

    return { parts, global: Math.min(100, Math.max(0, Math.round(g))) };
  }, [phases, pctGlobal]);

  const pctBar = phaseLine.global;

  /* -----------------------------
     ✅ Meta right = ETA / elapsed / stall
     (remplace "build: neon")
  ------------------------------ */
  const metaRight = useMemo(() => {
    if (pctBar >= 100) return t("loader.calibrating");

    if (isStalling) {
      return t("loader.stall", {
        defaultValue: "Finalisation… (shaders/collisions)",
      });
    }

    if (etaSec != null) return t("loader.eta", { seconds: etaSec });

    return t("loader.elapsed", { seconds: elapsedSec });
  }, [pctBar, isStalling, etaSec, elapsedSec, t]);

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

          {/* ✅ % global (overall) */}
          <div className="agLoader__pct">{pctBar}%</div>
        </div>

        <div className="agLoader__bar">
          <div className="agLoader__barFill" style={{ width: `${pctBar}%` }} />
          <div className="agLoader__barGlow" style={{ width: `${pctBar}%` }} />
        </div>

        <div className="agLoader__meta">
          {/* ✅ phases */}
          <span className="agLoader__metaLeft">{phaseLine.parts.join(" · ")}</span>

          {/* ✅ ETA / elapsed / stall */}
          <span className="agLoader__metaRight">{metaRight}</span>
        </div>
      </div>
    </div>
  );
}
