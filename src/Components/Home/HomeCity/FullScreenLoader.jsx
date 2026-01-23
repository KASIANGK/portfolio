// src/Components/HomeCity/ui/FullScreenLoader.jsx
import React, { useMemo } from "react";
import { useProgress } from "@react-three/drei";
import { useTranslation } from "react-i18next";
import "./FullScreenLoader.css";

export default function FullScreenLoader({
  label = "Loading…",
  subLabel = "Booting systems…",
  force = false,
}) {
  const { t } = useTranslation("home");
  const { active, progress } = useProgress();

  const pct = Math.min(100, Math.max(0, Math.round(progress)));
  const eta = pct >= 100 ? 0 : Math.ceil((100 - pct) / 18);

  // Auto-hide only if NOT forced
  if (!force && !active && pct >= 100) return null;

  const statusLine = useMemo(() => {
    if (pct < 100) return t("loader.eta", { seconds: eta });
    return t("loader.calibrating");
  }, [pct, eta, t]);

  return (
    <div className="agLoader" role="status" aria-live="polite" aria-label="Loading">
      {/* background FX */}
      <div className="agLoader__darkbg" aria-hidden="true"></div>
      <div className="agLoader__bg" aria-hidden="true" />
      <div className="agLoader__noise" aria-hidden="true" />
      <div className="agLoader__scan" aria-hidden="true" />

      <div className="agLoader__card">

        <div className="agLoader__sheen" aria-hidden="true"></div>
        <div className="agLoader__edge" aria-hidden="true"></div>

        {/* corners */}
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
          {/* ring */}
          <div className="agLoader__ring" aria-hidden="true">
            <div className="agLoader__ringGlow" />
            <div className="agLoader__ringSpin" />
            <div className="agLoader__ringCore" />
          </div>

          <div className="agLoader__text">
            <div className="agLoader__label">{label}</div>
            <div className="agLoader__sub">
              {subLabel} <span className="agLoader__dots">•••</span>
            </div>
          </div>

          <div className="agLoader__pct">{pct}%</div>
        </div>

        {/* progress bar */}
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

