// src/Components/Home/HomeCity/parts/ui/AgHintUI.jsx
import React from "react";
import "../style/StepsHintUI.css";

/**
 * Premium “Command Hints” UI (no GIF, no libs).
 * - Keycap (mono, neon)
 * - ArrowCluster (big, pressable)
 * - MouseTap / TrackpadTap (SVG + CSS pulse)
 */

export function DesktopEtirement({
  active = true,
  label = "SCAN THE SCENE",
  sub = "move your mouse",
  className="",
}) {
  return (
    <div className={`agDesktopStretch ${active ? "isActive" : ""} ${className}`} aria-hidden="true">
      <div className="agDesktopStretch__trail" />
      <div className="agDesktopStretch__cursor">
        <svg viewBox="0 0 64 64" width="34" height="34" fill="none">
          <path
            d="M18 10 L18 42 L28 34 L34 50 L40 47 L34 32 L46 32 Z"
            fill="currentColor"
            opacity="0.95"
          />
        </svg>
        <span className="agDesktopStretch__ping" />
      </div>

      {(label || sub) && (
        <div className="agDesktopStretch__text">
          {label ? <div className="agDesktopStretch__label">{label}</div> : null}
          {sub ? <div className="agDesktopStretch__sub">{sub}</div> : null}
        </div>
      )}
    </div>
  );
}


export function CursorClick({ active, label = "CLICK THE SCENE", sub }) {
  return (
    <span className={`agCursorHint ${active ? "isActive" : ""}`} aria-label={label}>
      <span className="agCursorHint__svg" aria-hidden="true">
        <svg viewBox="0 0 64 64" width="56" height="56" fill="none">
          {/* cursor moves (click) */}
          <g className="agCursorHint__cursor">
            <path
              d="M18 10 L18 42 L28 34 L34 50 L40 47 L34 32 L46 32 Z"
              fill="currentColor"
              opacity="0.95"
            />
            <circle className="agCursorHint__clickDot" cx="22" cy="14" r="2.2" />
          </g>

          {/* ring stays fixed + pulses */}
          <g className="agCursorHint__ring" transform="translate(-11,-13)">
            <circle className="agCursorHint__ring1" cx="30" cy="26" r="6.5" />
            <circle className="agCursorHint__ring2" cx="30" cy="26" r="12" />
          </g>
        </svg>
      </span>

      <span className="agCursorHint__label">
        {label}
        {sub ? <span className="agCursorHint__sub">{sub}</span> : null}
      </span>
    </span>
  );
}



export function Keycap({ icon, label, sub, active, pressed }) {
  return (
    <span className={`agKey ${active ? "isActive" : ""} ${pressed ? "isPressed" : ""}`}>
      {icon ? <span className="agKey__icon">{icon}</span> : null}
      <span className="agKey__label">{label}</span>
      {sub ? <span className="agKey__sub">{sub}</span> : null}
    </span>
  );
}

export function ArrowCluster({ active, pressedSet, demoPulse = false }) {
  const isPressed = (k) => !!pressedSet?.has?.(k);
  return (
    <span className="agKeyCluster" aria-label="Arrow keys">
      <span className="agKeyGrid">
        <span
          className={`agArrowKey up ${active ? "isActive" : ""} ${
            isPressed("ArrowUp") ? "isPressed" : demoPulse ? "isDemo" : ""
          }`}
        >
          ↑
        </span>
        <span className={`agArrowKey left ${active ? "isActive" : ""} ${isPressed("ArrowLeft") ? "isPressed" : ""}`}>←</span>
        <span className={`agArrowKey down ${active ? "isActive" : ""} ${isPressed("ArrowDown") ? "isPressed" : ""}`}>↓</span>
        <span className={`agArrowKey right ${active ? "isActive" : ""} ${isPressed("ArrowRight") ? "isPressed" : ""}`}>→</span>
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
