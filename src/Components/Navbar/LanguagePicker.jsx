// src/Components/Navbar/LanguagePicker.jsx
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import useOnboarding from "../../hooks/useOnboarding";

export default function LanguagePicker({ compact = false }) {
  const { i18n } = useTranslation();
  const { setLanguage } = useOnboarding();

  // i18n peut renvoyer "en-US" → on garde "en"
  const active = useMemo(() => {
    return String(i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);
  }, [i18n.resolvedLanguage, i18n.language]);

  const applyLang = useCallback(
    async (lng) => {
      try {
        // ✅ source de vérité unique : ton hook (qui doit gérer storage + i18n)
        await setLanguage(lng);
      } catch (e) {
        // fallback safe si jamais ton hook ne change pas i18n (ou plante)
        try {
          await i18n.changeLanguage(lng);
        } catch {}
      }
    },
    [setLanguage, i18n]
  );

  const btnStyle = useCallback(
    (isActive) => ({
      padding: compact ? "8px 10px" : "10px 12px",
      borderRadius: 12,
      border: isActive
        ? "1px solid rgba(255,0,170,0.55)"
        : "1px solid rgba(255,255,255,0.14)",
      background: isActive ? "rgba(255,0,170,0.12)" : "rgba(255,255,255,0.06)",
      color: "rgba(255,255,255,0.92)",
      fontWeight: 900,
      cursor: "pointer",
      userSelect: "none",
      transition: "transform 140ms ease, filter 140ms ease",
    }),
    [compact]
  );

  const btn = (lng, label) => {
    const isActive = active === lng;

    return (
      <button
        key={lng}
        type="button"
        onClick={() => applyLang(lng)}
        aria-pressed={isActive}
        style={btnStyle(isActive)}
        onMouseDown={(e) => e.preventDefault()} // évite focus/selection chelou sur click rapide
      >
        {label}
      </button>
    );
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 8,
        alignItems: "center",
      }}
    >
      {btn("fr", "FR")}
      {btn("nl", "NL")}
      {btn("en", "EN")}
      {btn("pl", "PL")}
    </div>
  );
}
