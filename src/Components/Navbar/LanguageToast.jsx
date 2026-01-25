// src/Components/LanguageToast/LanguageToast.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import useOnboarding from "../../hooks/useOnboarding";
import "./LanguageToast.css";

const LANG_LABELS = {
  en: "English",
  fr: "Français",
  nl: "Nederlands",
  pl: "Polski",
};

function getNavbarIntent() {
  if (typeof window === "undefined") return null;
  const intent = window.__AG_LANG_INTENT__;
  if (!intent || intent.src !== "navbar") return null;
  if (typeof intent.at !== "number") return null;
  if (Date.now() - intent.at >= 1200) return null;
  return intent;
}

function consumeNavbarIntent() {
  if (typeof window === "undefined") return;
  window.__AG_LANG_INTENT__ = null;
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

  const suppressRef = useRef(shouldShowLanguageStep);
  const lastIntentIdRef = useRef(null);

  const timerRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    suppressRef.current = shouldShowLanguageStep;
  }, [shouldShowLanguageStep]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (closeRef.current) window.clearTimeout(closeRef.current);
    timerRef.current = null;
    closeRef.current = null;
  }, []);

  // ✅ Auto-close attaché à "open/lang" (pas au listener)
  useEffect(() => {
    if (!open) return;

    clearTimers();
    setClosing(false);

    timerRef.current = window.setTimeout(() => {
      setClosing(true);
      closeRef.current = window.setTimeout(() => {
        setOpen(false);
      }, 600);
    }, 3000);

    return () => {
      clearTimers();
    };
  }, [open, lang, clearTimers]);

  useEffect(() => {
    const onLang = (lng) => {
      console.log("[LanguageToast] fired", Date.now(), lng);

      if (isStep1Visible()) return;
      if (suppressRef.current) return;

      const intent = getNavbarIntent();
      if (!intent) return;

      if (intent.id && lastIntentIdRef.current === intent.id) return;
      if (intent.id) lastIntentIdRef.current = intent.id;

      consumeNavbarIntent();

      const next = String(lng || i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);
      setLang(next);
      setOpen(true);
    };

    i18n.on("languageChanged", onLang);
    return () => {
      i18n.off("languageChanged", onLang);
      console.log("[LanguageToast] cleanup", Date.now());
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
