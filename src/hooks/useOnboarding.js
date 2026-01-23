import { useEffect, useMemo, useState, useCallback } from "react";
import i18n from "../i18n";

const LS_KEYS = {
  version: "ag_onboarding_version",
  language: "angels_lang",
  languageChosen: "ag_language_chosen",
};

const ONBOARDING_VERSION = "1";

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}
function safeRemove(key) {
  try { localStorage.removeItem(key); } catch {}
}

export default function useOnboarding() {
  const [language, setLanguageState] = useState(
    () => safeGet(LS_KEYS.language) || i18n.language || "en"
  );

  const [languageChosen, setLanguageChosen] = useState(
    () => safeGet(LS_KEYS.languageChosen) === "1"
  );

  // Migration/version
  useEffect(() => {
    const v = safeGet(LS_KEYS.version);
    if (v !== ONBOARDING_VERSION) {
      safeSet(LS_KEYS.version, ONBOARDING_VERSION);
    }
  }, []);

  // Appliquer langue si stockée
  useEffect(() => {
    if (!language) return;
    if (i18n.language !== language) {
      i18n.changeLanguage(language).catch(() => {});
    }
  }, [language]);

  const setLanguage = useCallback(async (lng) => {
    setLanguageState(lng);
    safeSet(LS_KEYS.language, lng);
    try { await i18n.changeLanguage(lng); } catch {}
  }, []);

  const completeLanguageStep = useCallback((lng) => {
    if (lng) safeSet(LS_KEYS.language, lng);
    safeSet(LS_KEYS.languageChosen, "1");
    setLanguageChosen(true);
  }, []);

  // ✅ reset seulement Step1 (rejouer choix langue)
  const resetLanguageStep = useCallback(() => {
    safeRemove(LS_KEYS.languageChosen);
    setLanguageChosen(false);
  }, []);

  // ✅ reset total debug
  const resetOnboarding = useCallback(() => {
    safeRemove(LS_KEYS.language);
    safeRemove(LS_KEYS.languageChosen);
    safeRemove(LS_KEYS.version);
    setLanguageState("en");
    setLanguageChosen(false);
    i18n.changeLanguage("en").catch(() => {});
  }, []);

  const shouldShowLanguageStep = useMemo(() => !languageChosen, [languageChosen]);

  return {
    language,
    languageChosen,
    shouldShowLanguageStep,
    setLanguage,
    completeLanguageStep,
    resetLanguageStep, // ✅ maintenant HomeOverlay peut l’appeler
    resetOnboarding,   // garde aussi
  };
}


