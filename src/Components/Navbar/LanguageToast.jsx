// src/Components/LanguageToast/LanguageToast.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import "./LanguageToast.css";

const LANG_LABELS = {
  en: "English",
  fr: "Français",
  nl: "Nederlands",
  pl: "Polski",
};

function isStep1Visible() {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.agOnboarding === "1";
}

export default function LanguageToast() {
  const { t, i18n } = useTranslation("common");

  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [lang, setLang] = useState(i18n.resolvedLanguage || i18n.language || "en");

  const timerRef = useRef(null);
  const closeRef = useRef(null);

  // ✅ "armed" window when navbar was interacted with
  const armedUntilRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (closeRef.current) window.clearTimeout(closeRef.current);
    timerRef.current = null;
    closeRef.current = null;
  }, []);

  // ✅ Arm the toast when navbar says "user intended to change lang"
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onIntent = () => {
      // 2.5s window is comfy even if i18n loads async
      armedUntilRef.current = Date.now() + 2500;
    };

    window.addEventListener("ag:langIntent", onIntent);
    return () => window.removeEventListener("ag:langIntent", onIntent);
  }, []);

  // ✅ Auto-close when opened
  useEffect(() => {
    if (!open) return;

    clearTimers();
    setClosing(false);

    timerRef.current = window.setTimeout(() => {
      setClosing(true);
      closeRef.current = window.setTimeout(() => setOpen(false), 600);
    }, 3000);

    return () => clearTimers();
  }, [open, lang, clearTimers]);

  // ✅ Show toast on language change ONLY if:
  // - not step1
  // - navbar intent happened recently (armed)
  useEffect(() => {
    const onLangChanged = (lng) => {
      if (isStep1Visible()) return;

      const now = Date.now();
      if (now > armedUntilRef.current) return; // not from navbar

      const next = String(lng || i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);
      setLang(next);
      setOpen(true);

      // consume arm (one toast)
      armedUntilRef.current = 0;
    };

    i18n.on("languageChanged", onLangChanged);
    return () => i18n.off("languageChanged", onLangChanged);
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

// src/Components/LanguageToast/LanguageToast.jsx
// import React, { useEffect, useRef, useState, useCallback } from "react";
// import { useTranslation } from "react-i18next";
// import useOnboarding from "../../hooks/useOnboarding";
// import "./LanguageToast.css";

// const LANG_LABELS = {
//   en: "English",
//   fr: "Français",
//   nl: "Nederlands",
//   pl: "Polski",
// };

// function getNavbarIntent() {
//   if (typeof window === "undefined") return null;
//   const intent = window.__AG_LANG_INTENT__;
//   if (!intent || intent.src !== "navbar") return null;
//   if (typeof intent.at !== "number") return null;
//   if (Date.now() - intent.at >= 1200) return null;
//   return intent;
// }

// function consumeNavbarIntent() {
//   if (typeof window === "undefined") return;
//   window.__AG_LANG_INTENT__ = null;
// }

// function isStep1Visible() {
//   if (typeof document === "undefined") return false;
//   return document.documentElement.dataset.agOnboarding === "1";
// }

// export default function LanguageToast() {
//   const { t, i18n } = useTranslation("common");
//   const { shouldShowLanguageStep } = useOnboarding();

//   const [open, setOpen] = useState(false);
//   const [closing, setClosing] = useState(false);
//   const [lang, setLang] = useState(i18n.resolvedLanguage || i18n.language || "en");

//   const suppressRef = useRef(shouldShowLanguageStep);
//   const lastIntentIdRef = useRef(null);

//   const timerRef = useRef(null);
//   const closeRef = useRef(null);

//   useEffect(() => {
//     suppressRef.current = shouldShowLanguageStep;
//   }, [shouldShowLanguageStep]);

//   const clearTimers = useCallback(() => {
//     if (timerRef.current) window.clearTimeout(timerRef.current);
//     if (closeRef.current) window.clearTimeout(closeRef.current);
//     timerRef.current = null;
//     closeRef.current = null;
//   }, []);

//   // ✅ Auto-close attaché à "open/lang" (pas au listener)
//   useEffect(() => {
//     if (!open) return;

//     clearTimers();
//     setClosing(false);

//     timerRef.current = window.setTimeout(() => {
//       setClosing(true);
//       closeRef.current = window.setTimeout(() => {
//         setOpen(false);
//       }, 600);
//     }, 3000);

//     return () => {
//       clearTimers();
//     };
//   }, [open, lang, clearTimers]);

//   useEffect(() => {
//     const onLang = (lng) => {
//       console.log("[LanguageToast] fired", Date.now(), lng);

//       if (isStep1Visible()) return;
//       if (suppressRef.current) return;

//       const intent = getNavbarIntent();
//       if (!intent) return;

//       if (intent.id && lastIntentIdRef.current === intent.id) return;
//       if (intent.id) lastIntentIdRef.current = intent.id;

//       consumeNavbarIntent();

//       const next = String(lng || i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);
//       setLang(next);
//       setOpen(true);
//     };

//     i18n.on("languageChanged", onLang);
//     return () => {
//       i18n.off("languageChanged", onLang);
//       console.log("[LanguageToast] cleanup", Date.now());
//     };
//   }, [i18n]);

//   if (!open) return null;

//   const label = LANG_LABELS[lang] || lang;

//   return (
//     <div className={`agToast ${closing ? "isClosing" : "isOpen"}`} aria-live="polite">
//       <div className="agToast__card" role="status">
//         <span className="agToast__chev">{">"}</span>
//         <span className="agToast__text">
//           {t("toast.languageChangedTo", { lang: label })}
//         </span>
//       </div>
//     </div>
//   );
// }
