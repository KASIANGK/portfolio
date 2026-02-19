// src/Components/HomeCity/ui/FullScreenLoader.jsx
import React, { useEffect, useMemo, useState } from "react";
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

  // progress global (si tu veux garder le % à droite)
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

  // ✅ ce qu’on affiche à la place de l’ETA :
  const phaseLine = useMemo(() => {
    // si on a les phases, on privilégie overallPct comme global
    const g = phases.overallPct || pctGlobal;

    // Mini format : "SCENE 72% · COLLISION 40% · PORTALS 15%"
    const parts = [
      `SCENE ${phases.scenePct}%`,
      `COLLISION ${phases.collisionPct}%`,
      `PORTALS ${phases.portalsPct}%`,
    ];

    // Optionnel: rajouter PLAYER / GATE si tu veux
    // parts.push(`PLAYER ${phases.playerPct}%`);
    // parts.push(`GATE ${phases.gatePct}%`);

    return { parts, global: g };
  }, [phases, pctGlobal]);

  // ✅ on synchronise la barre avec overall (sinon tu peux garder pctGlobal)
  const pctBar = phaseLine.global;

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
          {/* ✅ plus d’ETA : phases */}
          <span className="agLoader__metaLeft">
            {phaseLine.parts.join(" · ")}
          </span>
          <span className="agLoader__metaRight">build: neon</span>
        </div>
      </div>
    </div>
  );
}
