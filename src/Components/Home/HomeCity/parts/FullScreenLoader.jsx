// src/Components/HomeCity/ui/FullScreenLoader.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { useTranslation } from "react-i18next";
import "./style/FullScreenLoader.css";

export default function FullScreenLoader({
  label = "Loading…",
  subLabel, // si undefined => i18n
  force = false,
  externalActive = null,
  externalPct = null,
}) {
  const { t } = useTranslation("home");
  const { active: r3fActive, progress: r3fProgress } = useProgress();

  // ✅ i18n sublabel by default
  const finalSubLabel =
    subLabel ?? t("loader.subLabel", { defaultValue: "Intrusion dans la matrice" });

  // progress source
  const isExternal = externalActive !== null || externalPct !== null;
  const active = isExternal ? !!externalActive : r3fActive;
  const rawProgress = isExternal ? (externalPct ?? 0) : r3fProgress;
  const pctGlobal = Math.min(100, Math.max(0, Math.round(rawProgress)));

  // ✅ phases venant de HomeCity
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

  // Auto-hide only if NOT forced
  if (!force && !active && pctGlobal >= 100) return null;

  // Real progress
  const pctReal = useMemo(() => {
    const g = phases.overallPct || pctGlobal;
    return Math.min(100, Math.max(0, Math.round(g)));
  }, [phases.overallPct, pctGlobal]);

  /* -------------------------------------------
     DISPLAY PROGRESS (smooth + anti-flash)
     - monte vite au début
     - ralentit dans la zone lente (70-95)
     - ne fait jamais marche arrière
  -------------------------------------------- */
  const [pctDisplay, setPctDisplay] = useState(0);
  const lastRealRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setPctDisplay(0);
      lastRealRef.current = 0;
      return;
    }

    // target = pctReal, mais on limite la vitesse d'affichage
    const target = pctReal;

    const tick = () => {
      setPctDisplay((cur) => {
        const nextTarget = target;

        // vitesse selon zone
        const zone =
          nextTarget < 55 ? 1.35 :
          nextTarget < 75 ? 0.95 :
          nextTarget < 92 ? 0.45 :
          nextTarget < 98 ? 0.25 :
          0.18;

        // step d'incrément max par tick
        const maxStep = zone * 1.1; // ~1-2% / 250ms au début, plus lent ensuite

        // on ne dépasse jamais target, et jamais en arrière
        const next = Math.min(nextTarget, cur + maxStep);
        return Math.max(cur, next);
      });
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [active, pctReal]);

  /* -------------------------------------------
     SAFE ETA
     Objectif: jamais "2s" qui dure 10s.
     - ETA basée sur le display progress (plus stable)
     - arrondie par tranche de 5s
     - monotone (ne remonte pas)
     - n’affiche pas d’ETA tant qu’elle n’est pas crédible
  -------------------------------------------- */
  const startRef = useRef(0);
  const etaShownRef = useRef(null); // last displayed ETA (monotone)
  const [etaSafeSec, setEtaSafeSec] = useState(null);

  useEffect(() => {
    if (active && !startRef.current) {
      startRef.current = performance.now();
      etaShownRef.current = null;
      setEtaSafeSec(null);
      return;
    }
    if (!active) {
      startRef.current = 0;
      etaShownRef.current = null;
      setEtaSafeSec(null);
    }
  }, [active]);

  useEffect(() => {
    if (!active) return;
    if (pctDisplay >= 99.5) {
      setEtaSafeSec(0);
      return;
    }

    const elapsed = (performance.now() - startRef.current) / 1000;
    if (elapsed < 1.0) {
      setEtaSafeSec(null); // trop tôt
      return;
    }

    // speed en %/sec
    const speed = pctDisplay / Math.max(0.001, elapsed);
    if (speed < 0.15) {
      // trop lent / stall → ETA pas fiable
      setEtaSafeSec(null);
      return;
    }

    const rawEta = (100 - pctDisplay) / Math.max(0.001, speed); // seconds

    // clamp
    let eta = Math.max(5, Math.min(180, rawEta)); // jamais en dessous de 5s, jamais au-delà de 3min
    // round to 5s steps (plus "calme")
    eta = Math.ceil(eta / 5) * 5;

    // monotone: on ne remonte jamais l'ETA affichée
    const prev = etaShownRef.current;
    const next = prev == null ? eta : Math.min(prev, eta);

    // encore une protection: pas d'ETA < 10s tant qu'on n'est pas très proche
    const guarded = pctDisplay < 95 ? Math.max(10, next) : next;

    etaShownRef.current = guarded;
    setEtaSafeSec(guarded);
  }, [active, pctDisplay]);

  /* -------------------------------------------
     Steps (10) mais SAFE:
     - on veut éviter le "5/10 forever"
     - on pousse vite vers 8/10
     - on hold 8/10 ou 9/10 pendant la zone lente
  -------------------------------------------- */
  const stepInfo = useMemo(() => {
    const TOTAL = 10;

    // seuils (à tweaker)
    const HOLD_8_FROM = 55;  // on arrive à 8/10 assez tôt
    const HOLD_9_FROM = 82;  // on passe à 9/10 dans la zone lente
    const FINISH_FROM = 96;  // 10/10 seulement quand on est vraiment proche

    let step;
    if (pctDisplay >= 100) step = 10;
    else if (pctDisplay >= FINISH_FROM) step = 9; // 9/10 jusqu'à quasi fin
    else if (pctDisplay >= HOLD_9_FROM) step = 8; // 8/10 pendant le gros stall
    else if (pctDisplay >= HOLD_8_FROM) step = 7; // monte avant
    else {
      // early: 1..7 répartis sur 0..55
      const p = Math.max(0, Math.min(HOLD_8_FROM, pctDisplay));
      step = Math.max(1, Math.min(7, Math.floor((p / HOLD_8_FROM) * 7) + 1));
    }

    return { step, total: TOTAL };
  }, [pctDisplay]);

  /* -------------------------------------------
     MetaLeft = phases (comme tu avais)
  -------------------------------------------- */
  const metaLeft = useMemo(() => {
    const parts = [
      `SCENE ${Math.round(phases.scenePct || 0)}%`,
      `COLLISION ${Math.round(phases.collisionPct || 0)}%`,
      `PORTALS ${Math.round(phases.portalsPct || 0)}%`,
    ];
    return parts.join(" · ");
  }, [phases.scenePct, phases.collisionPct, phases.portalsPct]);

  /* -------------------------------------------
     MetaRight:
     - si ETA safe dispo => ~XXs
     - sinon => step i/10
  -------------------------------------------- */
  const metaRight = useMemo(() => {
    if (pctDisplay >= 99.5) return t("loader.calibrating");

    if (etaSafeSec != null) {
      return t("loader.eta", { seconds: etaSafeSec });
    }

    // fallback steps
    return `${stepInfo.step}/${stepInfo.total}`;
  }, [pctDisplay, etaSafeSec, stepInfo, t]);

  /* -------------------------------------------
     pctBar = pctDisplay (visuel)
  -------------------------------------------- */
  const pctBar = Math.min(100, Math.max(0, Math.round(pctDisplay)));

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
      </div>
    </div>
  );
}

