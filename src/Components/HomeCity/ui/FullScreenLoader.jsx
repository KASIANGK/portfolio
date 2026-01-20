import React from "react";
import { useProgress } from "@react-three/drei";
import { useTranslation } from "react-i18next";

export default function FullScreenLoader({
  label = "Loading...",
  subLabel = "Booting systems…",
  force = false, // ✅ keep it visible even if useProgress is done
}) {
  const { t } = useTranslation("home");
  const { active, progress } = useProgress();

  const pct = Math.min(100, Math.max(0, Math.round(progress)));
  const eta = pct >= 100 ? 0 : Math.ceil((100 - pct) / 18);

  // ✅ only auto-hide if NOT forced
  if (!force && !active && pct >= 100) return null;

  const root = {
    position: "fixed",
    inset: 0,
    display: "grid",
    placeItems: "center",
    background:
      "radial-gradient(1200px 800px at 18% 22%, rgba(255,0,170,0.10), transparent 60%)," +
      "radial-gradient(900px 700px at 78% 28%, rgba(124,58,237,0.16), transparent 55%)," +
      "radial-gradient(1000px 700px at 50% 85%, rgba(96,165,250,0.10), transparent 55%)," +
      "#070916",
    color: "white",
    zIndex: 300,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    padding: 16,
  };

  const card = {
    width: "min(520px, 92vw)",
    padding: 18,
    borderRadius: 20,
    background: "rgba(0,0,0,0.38)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(12px)",
    boxShadow:
      "0 18px 55px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,0,170,0.10), 0 0 60px rgba(124,58,237,0.12)",
    position: "relative",
    overflow: "hidden",
  };

  const scan = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "repeating-linear-gradient(to bottom, rgba(255,255,255,0.04), rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px)",
    opacity: 0.14,
    mixBlendMode: "overlay",
  };

  const hudLine = {
    position: "absolute",
    left: 14,
    right: 14,
    top: 12,
    height: 1,
    background:
      "linear-gradient(90deg, transparent, rgba(255,0,170,0.55), rgba(124,58,237,0.55), transparent)",
    opacity: 0.7,
  };

  return (
    <div style={root}>
      <div style={card}>
        <div style={scan} aria-hidden="true" />
        <div style={hudLine} aria-hidden="true" />

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 999,
              border: "2px solid rgba(255,255,255,0.14)",
              borderTopColor: "rgba(255,0,170,0.95)",
              animation: "spin 0.9s linear infinite",
              boxShadow: "0 0 24px rgba(255,0,170,0.18)",
              flex: "0 0 auto",
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, letterSpacing: 1.2, opacity: 0.75 }}>
              KASIA / LOADER
            </div>
            <div style={{ marginTop: 4, opacity: 0.95, fontSize: 14 }}>{label}</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                opacity: 0.72,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              }}
            >
              {subLabel} <span className="dots">•••</span>
            </div>
          </div>
          <div style={{ marginLeft: "auto", fontWeight: 950, fontSize: 16 }}>
            {pct}%
          </div>
        </div>

        <div
          style={{
            marginTop: 12,
            height: 8,
            borderRadius: 999,
            background: "rgba(255,255,255,0.10)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: "linear-gradient(90deg, rgba(124,58,237,0.85), rgba(255,0,170,0.75))",
              transition: "width 120ms linear",
              boxShadow: "0 0 18px rgba(255,0,170,0.20)",
            }}
          />
        </div>

        <div
          style={{
            marginTop: 10,
            display: "flex",
            justifyContent: "space-between",
            opacity: 0.8,
            fontSize: 12,
          }}
        >
        <span>
          {pct < 100
            ? t("loader.eta", { seconds: eta })
            : t("loader.calibrating")}
        </span>          
        <span
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            }}
          >
            build: neon
          </span>
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes dots { 0%{opacity:.25} 50%{opacity:1} 100%{opacity:.25} }
          .dots { animation: dots 900ms infinite; }
        `}</style>
      </div>
    </div>
  );
}

