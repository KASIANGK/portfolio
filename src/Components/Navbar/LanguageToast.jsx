// src/Components/LanguageToast/LanguageToast.jsx
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import useOnboarding from "../../hooks/useOnboarding";
import "./LanguageToast.css";

const LANG_LABELS = {
  en: "English",
  fr: "Français",
  nl: "Nederlands",
  pl: "Polski",
};

function isNavbarIntentFresh() {
  if (typeof window === "undefined") return false;
  const intent = window.__AG_LANG_INTENT__;
  if (!intent || intent.src !== "navbar") return false;
  if (typeof intent.at !== "number") return false;
  return Date.now() - intent.at < 1200; // 1.2s
}

function isStep1Visible() {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.agOnboarding === "1";
}

export default function LanguageToast() {
  const { t, i18n } = useTranslation("common");
  const { shouldShowLanguageStep } = useOnboarding();

  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [lang, setLang] = useState(i18n.resolvedLanguage || i18n.language || "en");

  const timerRef = useRef(null);
  const closeRef = useRef(null);
  const suppressRef = useRef(shouldShowLanguageStep);

  useEffect(() => {
    suppressRef.current = shouldShowLanguageStep;
  }, [shouldShowLanguageStep]);

  useEffect(() => {
    const onLang = (lng) => {
      // ✅ jamais pendant Step1 (flag UI fiable)
      if (isStep1Visible()) return;

      // ✅ jamais pendant onboarding (fallback hook)
      if (suppressRef.current) return;

      // ✅ uniquement si l'intention vient de la navbar
      if (!isNavbarIntentFresh()) return;

      // ✅ consume intent pour éviter double-trigger
      window.__AG_LANG_INTENT__ = null;

      const next = lng || i18n.resolvedLanguage || i18n.language || "en";
      setLang(next);

      // open toast
      setClosing(false);
      setOpen(true);

      // clear timers
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (closeRef.current) window.clearTimeout(closeRef.current);

      // visible 2.4s → fade out 0.6s
      timerRef.current = window.setTimeout(() => {
        setClosing(true);
        closeRef.current = window.setTimeout(() => setOpen(false), 600);
      }, 2400);
    };

    i18n.on("languageChanged", onLang);
    return () => {
      i18n.off("languageChanged", onLang);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (closeRef.current) window.clearTimeout(closeRef.current);
    };
  }, [i18n]);

  if (!open) return null;

  const label = LANG_LABELS[lang] || lang;

  return (
    <div className={`agToast ${closing ? "isClosing" : "isOpen"}`} aria-live="polite">
      <div className="agToast__card" role="status">
        <span className="agToast__chev">{">"}</span>
        <span className="agToast__text">
          {t("toast.languageChangedTo", { lang: label })}
        </span>
      </div>
    </div>
  );
}

