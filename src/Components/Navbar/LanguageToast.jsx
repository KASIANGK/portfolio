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
  const intent = window.__AG_LANG_INTENT__;
  if (!intent || intent.src !== "navbar") return false;
  if (typeof intent.at !== "number") return false;
  return Date.now() - intent.at < 1200;
}

export default function LanguageToast() {
  const { t, i18n } = useTranslation("common");
  const { shouldShowLanguageStep } = useOnboarding();

  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [lang, setLang] = useState(i18n.resolvedLanguage || i18n.language || "en");

  const timerRef = useRef(null);
  const suppressRef = useRef(shouldShowLanguageStep);

  useEffect(() => {
    suppressRef.current = shouldShowLanguageStep;
  }, [shouldShowLanguageStep]);

  useEffect(() => {
    const onLang = (lng) => {
      // ✅ jamais pendant Step1
      if (suppressRef.current) return;

      // ✅ uniquement si ça vient de la navbar
      if (!isNavbarIntentFresh()) return;

      // clean intent pour éviter des triggers doubles
      window.__AG_LANG_INTENT__ = null;

      const next = lng || i18n.resolvedLanguage || i18n.language || "en";
      setLang(next);
      setClosing(false);
      setOpen(true);

      if (timerRef.current) window.clearTimeout(timerRef.current);

      timerRef.current = window.setTimeout(() => {
        setClosing(true);
        setTimeout(() => setOpen(false), 600);
      }, 2400);
    };

    i18n.on("languageChanged", onLang);
    return () => i18n.off("languageChanged", onLang);
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


//ok
// import React, { useEffect, useRef, useState } from "react";
// import { useTranslation } from "react-i18next";
// import useOnboarding from "../../hooks/useOnboarding";
// import "./LanguageToast.css";

// const LANG_LABELS = {
//   en: "English",
//   fr: "Français",
//   nl: "Nederlands",
//   pl: "Polski",
// };

// export default function LanguageToast() {
//   const { t, i18n } = useTranslation("common");
//   const { shouldShowLanguageStep } = useOnboarding();

//   const [open, setOpen] = useState(false);
//   const [closing, setClosing] = useState(false);
//   const [lang, setLang] = useState(i18n.resolvedLanguage || i18n.language || "en");

//   const timerRef = useRef(null);
//   const suppressRef = useRef(shouldShowLanguageStep);

//   useEffect(() => {
//     suppressRef.current = shouldShowLanguageStep;
//   }, [shouldShowLanguageStep]);

//   useEffect(() => {
//     const onLang = (lng) => {
//       if (suppressRef.current) return;

//       const next = lng || i18n.resolvedLanguage || i18n.language || "en";
//       setLang(next);
//       setClosing(false);
//       setOpen(true);

//       if (timerRef.current) window.clearTimeout(timerRef.current);

//       // visible 2.4s → fade out 0.6s
//       timerRef.current = window.setTimeout(() => {
//         setClosing(true);
//         setTimeout(() => setOpen(false), 600);
//       }, 2400);
//     };

//     i18n.on("languageChanged", onLang);
//     return () => i18n.off("languageChanged", onLang);
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
