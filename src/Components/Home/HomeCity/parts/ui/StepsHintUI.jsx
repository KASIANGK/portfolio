// src/Components/Home/HomeCity/parts/ui/AgHintUI.jsx
import React from "react";
import "../../style/StepsHintUI.css";

/**
 * Premium “Command Hints” UI (no GIF, no libs).
 * - Keycap (mono, neon)
 * - ArrowCluster (big, pressable)
 * - MouseTap / TrackpadTap (SVG + CSS pulse)
 */

export function Keycap({ icon, label, sub, active, pressed }) {
  return (
    <span className={`agKey ${active ? "isActive" : ""} ${pressed ? "isPressed" : ""}`}>
      {icon ? <span className="agKey__icon">{icon}</span> : null}
      <span className="agKey__label">{label}</span>
      {sub ? <span className="agKey__sub">{sub}</span> : null}
    </span>
  );
}

export function ArrowCluster({ active, pressedSet }) {
  const isPressed = (k) => !!pressedSet?.has?.(k);
  return (
    <span className="agKeyCluster" aria-label="Arrow keys">
      <span className="agKeyGrid">
        <span className={`agArrowKey up ${active ? "isActive" : ""} ${isPressed("ArrowUp") ? "isPressed" : ""}`}>
          ↑
        </span>
        <span className={`agArrowKey left ${active ? "isActive" : ""} ${isPressed("ArrowLeft") ? "isPressed" : ""}`}>
          ←
        </span>
        <span className={`agArrowKey down ${active ? "isActive" : ""} ${isPressed("ArrowDown") ? "isPressed" : ""}`}>
          ↓
        </span>
        <span className={`agArrowKey right ${active ? "isActive" : ""} ${isPressed("ArrowRight") ? "isPressed" : ""}`}>
          →
        </span>
      </span>
    </span>
  );
}

export function MouseTap({ active, label = "CLICK" }) {
  return (
    <span className={`agIconHint ${active ? "isActive" : ""}`} aria-label={label}>
      <span className="agIconHint__svg" aria-hidden="true">
        <svg viewBox="0 0 64 64" width="34" height="34" fill="none">
          <path
            d="M24 8h16c6 0 10 4 10 10v20c0 10-8 18-18 18S14 48 14 38V18c0-6 4-10 10-10Z"
            stroke="currentColor"
            strokeWidth="2.5"
            opacity="0.9"
          />
          <path d="M32 16v10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
          <path
            className="agIconHint__pulse"
            d="M32 8c10 0 18 8 18 18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.45"
          />
        </svg>
      </span>
      <span className="agIconHint__label">{label}</span>
    </span>
  );
}

export function TrackpadTap({ active, label = "TAP PAD" }) {
  return (
    <span className={`agIconHint ${active ? "isActive" : ""}`} aria-label={label}>
      <span className="agIconHint__svg" aria-hidden="true">
        <svg viewBox="0 0 64 64" width="34" height="34" fill="none">
          <rect x="12" y="10" width="40" height="44" rx="8" stroke="currentColor" strokeWidth="2.5" opacity="0.9" />
          <path d="M12 36h40" stroke="currentColor" strokeWidth="2.5" opacity="0.6" />
          <circle className="agIconHint__tapDot" cx="44" cy="42" r="3.5" fill="currentColor" opacity="0.8" />
        </svg>
      </span>
      <span className="agIconHint__label">{label}</span>
    </span>
  );
}

export function HintRow({ children }) {
  return <div className="agCitySteps__hintRow">{children}</div>;
}
