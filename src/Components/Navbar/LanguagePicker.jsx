import React from "react";
import { useTranslation } from "react-i18next";

export default function LanguagePicker({ compact = false }) {
  const { i18n } = useTranslation();
  const active = (i18n.language || "en").slice(0, 2);

  const setLang = async (lng) => {
    await i18n.changeLanguage(lng);
    localStorage.setItem("angels_lang", lng);
  };

  const btn = (lng, label) => {
    const isActive = active === lng;
    return (
      <button
        key={lng}
        onClick={() => setLang(lng)}
        style={{
          padding: compact ? "8px 10px" : "10px 12px",
          borderRadius: 12,
          border: isActive ? "1px solid rgba(255,0,170,0.55)" : "1px solid rgba(255,255,255,0.14)",
          background: isActive ? "rgba(255,0,170,0.12)" : "rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.92)",
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
      {btn("fr", "FR")}
      {btn("nl", "NL")}
      {btn("en", "EN")}
      {btn("pl", "PL")}
    </div>
  );
}
