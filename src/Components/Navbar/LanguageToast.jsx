import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export default function LanguageToast() {
  const { t, i18n } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const onLang = () => {
      setOpen(true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setOpen(false), 1400);
    };

    i18n.on("languageChanged", onLang);
    return () => {
      i18n.off("languageChanged", onLang);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [i18n]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 22,
        transform: "translateX(-50%)",
        zIndex: 5000,
        pointerEvents: "none",
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        style={{
          pointerEvents: "none",
          padding: "10px 14px",
          borderRadius: 14,
          border: "1px solid rgba(255,0,170,0.35)",
          background:
            "radial-gradient(520px 220px at 15% 20%, rgba(255,0,170,0.14), transparent 60%)," +
            "radial-gradient(520px 220px at 85% 30%, rgba(124,58,237,0.14), transparent 60%)," +
            "rgba(0,0,0,0.72)",
          backdropFilter: "blur(10px)",
          color: "rgba(255,255,255,0.92)",
          boxShadow:
            "0 18px 55px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,0,170,0.12), 0 0 40px rgba(124,58,237,0.10)",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          fontWeight: 900,
          letterSpacing: 0.2,
          whiteSpace: "nowrap",
        }}
      >
        {t("toast.languageChanged")}
      </div>
    </div>
  );
}
