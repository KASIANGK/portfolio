// src/hooks/useOnboarding.js
import { useEffect, useMemo, useState, useCallback } from "react";
import i18n from "../i18n"; // adapte le path si ton i18n est ailleurs

const LS_KEYS = {
  version: "ag_onboarding_version",
  language: "angels_lang",
  languageChosen: "ag_language_chosen", // "1" quand Step 1 terminé
};

const ONBOARDING_VERSION = "1";

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore (private mode, storage full, etc.)
  }
}

export default function useOnboarding() {
  const [language, setLanguageState] = useState(() => safeGet(LS_KEYS.language) || i18n.language || "en");
  const [languageChosen, setLanguageChosen] = useState(() => safeGet(LS_KEYS.languageChosen) === "1");

  // 1) Migration / versioning (si tu as d’anciens keys, tu peux les cleanup ici)
  useEffect(() => {
    const v = safeGet(LS_KEYS.version);
    if (v !== ONBOARDING_VERSION) {
      // Ici tu peux supprimer d’anciens flags si tu en avais (IntroOverlay3Steps etc.)
      // Exemple:
      // localStorage.removeItem("intro_overlay_done");
      safeSet(LS_KEYS.version, ONBOARDING_VERSION);
    }
  }, []);

  // 2) Appliquer langue au boot (si déjà stockée)
  useEffect(() => {
    if (!language) return;
    if (i18n.language !== language) {
      i18n.changeLanguage(language).catch(() => {});
    }
  }, [language]);

  const setLanguage = useCallback(async (lng) => {
    setLanguageState(lng);
    safeSet(LS_KEYS.language, lng);
    try {
      await i18n.changeLanguage(lng);
    } catch {
      // ignore
    }
  }, []);

  const completeLanguageStep = useCallback((lng) => {
    // on valide définitivement Step 1
    if (lng) {
      safeSet(LS_KEYS.language, lng);
    }
    safeSet(LS_KEYS.languageChosen, "1");
    setLanguageChosen(true);
  }, []);

  const resetOnboarding = useCallback(() => {
    // utile pour debug
    try {
      localStorage.removeItem(LS_KEYS.language);
      localStorage.removeItem(LS_KEYS.languageChosen);
      localStorage.removeItem(LS_KEYS.version);
    } catch {}
    setLanguageState("en");
    setLanguageChosen(false);
  }, []);

  const shouldShowLanguageStep = useMemo(() => !languageChosen, [languageChosen]);

  return {
    language,
    languageChosen,
    shouldShowLanguageStep, // Step 1
    setLanguage,            // pour navbar + Step 1
    completeLanguageStep,   // à appeler quand user confirme le choix
    resetOnboarding,
  };
}
