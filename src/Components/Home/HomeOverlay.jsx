// src/Components/Home/HomeOverlay.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useOnboarding from "../../hooks/useOnboarding";
import "./HomeOverlay.css";

const LANGS = ["en", "fr", "nl", "pl"];

const MENU = [
  { key: "explore", kind: "primary", to: "/city" },
  { key: "about", kind: "secondary", to: "#about" },
  { key: "projects", kind: "secondary", to: "#projects" },
  { key: "contact", kind: "secondary", to: "#contact" },
];

export default function HomeOverlay({ onGoAbout, onGoProjects, onGoContact }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("intro");

  const {
    language,
    shouldShowLanguageStep,
    setLanguage,
    completeLanguageStep,
    resetLanguageStep, // si présent dans ton hook (sinon fallback ok)
  } = useOnboarding();

  // 0 = Step1, 1 = Step2
  const [slideIndex, setSlideIndex] = useState(shouldShowLanguageStep ? 0 : 1);

  useEffect(() => {
    setSlideIndex(shouldShowLanguageStep ? 0 : 1);
  }, [shouldShowLanguageStep]);

  // preload i18n
  useEffect(() => {
    i18n.loadNamespaces(["intro"]);
    i18n.loadLanguages(LANGS);
  }, [i18n]);

  /* -----------------------
     Step1 scroll lock
  ------------------------ */
  useEffect(() => {
    const body = document.body;

    if (slideIndex === 0) {
      const prevOverflow = body.style.overflow;
      const prevOverscroll = body.style.overscrollBehaviorY;

      body.style.overflow = "hidden";
      body.style.overscrollBehaviorY = "none";

      return () => {
        body.style.overflow = prevOverflow;
        body.style.overscrollBehaviorY = prevOverscroll;
      };
    }

    body.style.overflow = "";
    body.style.overscrollBehaviorY = "";
  }, [slideIndex]);

  /* -----------------------
     Instant switch (no anim once)
  ------------------------ */
  const [noAnimOnce, setNoAnimOnce] = useState(false);
  const continueBtnRef = useRef(null);

  const goToStep1Instant = useCallback(() => {
    setNoAnimOnce(true);
    setSlideIndex(0);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setNoAnimOnce(false));
    });
  
    window.setTimeout(() => continueBtnRef.current?.focus?.(), 80);
  }, []);

  /* -----------------------
     Step1 - Language
  ------------------------ */
  const detected = i18n.resolvedLanguage || i18n.language || "en";
  const safeDetected = LANGS.includes(detected) ? detected : "en";

  const initialLang = (() => {
    if (language && LANGS.includes(language)) return language;
    return safeDetected;
  })();

  const [langActiveIndex, setLangActiveIndex] = useState(() =>
    Math.max(0, LANGS.indexOf(initialLang))
  );
  const [selectedLang, setSelectedLang] = useState(initialLang);
  const [isSwitchingLang, setIsSwitchingLang] = useState(false);

  useEffect(() => {
    if (slideIndex !== 0) return;

    // recalage au retour step1
    const fallback = i18n.resolvedLanguage || i18n.language || "en";
    const safe = LANGS.includes(fallback) ? fallback : "en";
    const base = selectedLang || safe;
    setLangActiveIndex(Math.max(0, LANGS.indexOf(base)));

    requestAnimationFrame(() => continueBtnRef.current?.focus?.());
  }, [slideIndex, i18n, selectedLang]);

  const handlePickLanguage = useCallback(
    async (code, idx) => {
      if (!LANGS.includes(code)) return;

      setSelectedLang(code);
      if (typeof idx === "number") setLangActiveIndex(idx);

      setIsSwitchingLang(true);
      try {
        await setLanguage(code);
      } finally {
        setIsSwitchingLang(false);
      }

      requestAnimationFrame(() => continueBtnRef.current?.focus?.());
    },
    [setLanguage]
  );

  const canContinue = !!selectedLang && !isSwitchingLang;

  const goToStep2 = useCallback(async () => {
    if (!selectedLang) return;

    setIsSwitchingLang(true);
    try {
      await setLanguage(selectedLang);
    } finally {
      setIsSwitchingLang(false);
    }

    completeLanguageStep(selectedLang);

    // animated slide to step2
    setSlideIndex(1);

    window.setTimeout(() => {
      const first = document.querySelector(".homeOverlay__menuBtn");
      first?.focus?.();
    }, 420);
  }, [selectedLang, setLanguage, completeLanguageStep]);

  // keyboard Step1: arrows select, enter/space continue
  useEffect(() => {
    if (slideIndex !== 0) return;

    const onKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const dir = e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 1;
        const nextIdx = (langActiveIndex + dir + LANGS.length) % LANGS.length;
        handlePickLanguage(LANGS[nextIdx], nextIdx);
        return;
      }

      if (e.key === "Enter" || e.key === " ") {
        if (!canContinue) return;
        e.preventDefault();
        goToStep2();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [slideIndex, langActiveIndex, canContinue, handlePickLanguage, goToStep2]);

  /* -----------------------
     Step2 - Menu
  ------------------------ */
  const [menuActiveIndex, setMenuActiveIndex] = useState(0);

  const runMenuAction = useCallback(
    (item) => {
      if (!item) return;

      if (item.key === "explore") {
        navigate(item.to);
        return;
      }

      if (item.key === "about") return onGoAbout?.();
      if (item.key === "projects") return onGoProjects?.();
      if (item.key === "contact") return onGoContact?.();
    },
    [navigate, onGoAbout, onGoProjects, onGoContact]
  );

  // keyboard Step2
  useEffect(() => {
    if (slideIndex !== 1) return;

    const onKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const dir = e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 1;
        setMenuActiveIndex((i) => (i + dir + MENU.length) % MENU.length);
        return;
      }

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        runMenuAction(MENU[menuActiveIndex]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [slideIndex, menuActiveIndex, runMenuAction]);

  /* -----------------------
     Reset -> Step1 instant
  ------------------------ */
  const handleReset = useCallback(() => {
    if (typeof resetLanguageStep === "function") resetLanguageStep();
    goToStep1Instant();
  }, [resetLanguageStep, goToStep1Instant]);

  return (
    <header
      className="homeOverlay"
      data-step={slideIndex === 0 ? "1" : "2"}
      aria-label="Home onboarding header"
    >
      {/* Background layers */}
      <div className="homeOverlay__bg homeOverlay__bg--step1" aria-hidden="true" />
      <div className="homeOverlay__bg homeOverlay__bg--step2" aria-hidden="true" />
      <div className="homeOverlay__noise" aria-hidden="true" />
      <div className="homeOverlay__screenFx" aria-hidden="true" />

      {/* Reset button fixed bottom-right */}
      <button type="button" className="homeOverlay__resetBtn" onClick={handleReset}>
        <span className="homeOverlay__resetIcon" aria-hidden="true">
          ↺
        </span>
        <span className="homeOverlay__resetText">{t("language.reset")}</span>
      </button>

      {/* Carousel viewport (no swipe handlers) */}
      <div className="homeOverlay__viewport">
        <div
          className={`homeOverlay__track ${noAnimOnce ? "isInstant" : ""}`}
          style={{ transform: `translateX(-${slideIndex * 100}vw)` }}
        >
          {/* ---------- SLIDE 1 ---------- */}
          <section
            className={`homeOverlay__slide ${slideIndex === 0 ? "isActive" : ""}`}
            aria-hidden={slideIndex !== 0}
          >
            <div className="homeOverlay__panel">
              <div className="homeOverlay__fx" aria-hidden="true">
                <div className="homeOverlay__orb" />
                <div className="homeOverlay__grid" />
              </div>

              <div className="homeOverlay__badge">CREATIVE://TECH</div>

              <h1 className="homeOverlay__title">{t("language.title")}</h1>
              <p className="homeOverlay__subtitle">{t("language.subtitle")}</p>

              <div
                className="homeOverlay__langGrid"
                role="radiogroup"
                aria-label={t("a11y.languageSelector")}
              >
                {LANGS.map((code, idx) => {
                  const isActive = idx === langActiveIndex;
                  const isSelected = selectedLang === code;

                  return (
                    <button
                      key={code}
                      type="button"
                      className={`homeOverlay__langBtn ${isActive ? "isActive" : ""}`}
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handlePickLanguage(code, idx)}
                    >
                      <span
                        className={`homeOverlay__chev ${isActive ? "isOn" : ""}`}
                        aria-hidden="true"
                      >
                        &gt;
                      </span>
                      <span className="homeOverlay__langLabel">
                        {t(`language.languages.${code}`)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="homeOverlay__footer">
                <button
                  ref={continueBtnRef}
                  type="button"
                  className="homeOverlay__primaryBtn homeOverlay__continueBtn"
                  onClick={goToStep2}
                  disabled={!canContinue}
                >
                  {isSwitchingLang ? "..." : t("language.continue")}
                </button>
              </div>
            </div>
          </section>

          {/* ---------- SLIDE 2 ---------- */}
          <section
            className={`homeOverlay__slide ${slideIndex === 1 ? "isActive" : ""}`}
            aria-hidden={slideIndex !== 1}
          >
            <div className="homeOverlay__panel">
              <div className="homeOverlay__fx" aria-hidden="true">
                <div className="homeOverlay__orb" />
                <div className="homeOverlay__grid" />
              </div>

              <div className="homeOverlay__badge">CREATIVE://TECH</div>

              <h1 className="homeOverlay__title">
                {t("menu.titleLine1")}
                <br />
                {t("menu.titleLine2")}
              </h1>

              <p className="homeOverlay__subtitle">{t("menu.subtitle")}</p>

              <div className="homeOverlay__menu" role="menu" aria-label={t("a11y.menu")}>
                {MENU.map((item, idx) => {
                  const isActive = idx === menuActiveIndex;
                  const btnClass =
                    item.kind === "primary"
                      ? "homeOverlay__primaryBtn"
                      : "homeOverlay__secondaryBtn";

                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`${btnClass} homeOverlay__menuBtn ${
                        isActive ? "isActive" : ""
                      }`}
                      onMouseEnter={() => setMenuActiveIndex(idx)}
                      onFocus={() => setMenuActiveIndex(idx)}
                      onClick={() => runMenuAction(item)}
                    >
                      <span
                        className={`homeOverlay__chev ${isActive ? "isOn" : ""}`}
                        aria-hidden="true"
                      >
                        &gt;
                      </span>
                      <span className="homeOverlay__langLabel">
                        {t(`menu.buttons.${item.key}`)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="homeOverlay__hint">{t("menu.hint")}</p>
            </div>
          </section>
        </div>
      </div>
    </header>
  );
}




// import React, { useCallback, useEffect, useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next";
// import useOnboarding from "../../hooks/useOnboarding";
// import "./HomeOverlay.css";

// const LANGS = ["en", "fr", "nl", "pl"];

// const MENU = [
//   { key: "explore", kind: "primary", to: "/city" },
//   { key: "about", kind: "secondary", to: "#about" },
//   { key: "projects", kind: "secondary", to: "#projects" },
//   { key: "contact", kind: "secondary", to: "#contact" },
// ];

// export default function HomeOverlay({ onGoAbout, onGoProjects, onGoContact }) {
//   const navigate = useNavigate();
//   const { t, i18n } = useTranslation("intro");

//   const {
//     language,
//     shouldShowLanguageStep,
//     setLanguage,
//     completeLanguageStep,
//     // optionnel: resetLanguageStep si tu l’as
//     resetLanguageStep,
//   } = useOnboarding();

//   // 0 = Step1, 1 = Step2
//   const [slideIndex, setSlideIndex] = useState(shouldShowLanguageStep ? 0 : 1);

//   useEffect(() => {
//     setSlideIndex(shouldShowLanguageStep ? 0 : 1);
//   }, [shouldShowLanguageStep]);

//   // Preload
//   useEffect(() => {
//     i18n.loadNamespaces(["intro"]);
//     i18n.loadLanguages(LANGS);
//   }, [i18n]);

//   // Lock scroll on Step1 only
//   useEffect(() => {
//     const body = document.body;

//     if (slideIndex === 0) {
//       const prevOverflow = body.style.overflow;
//       const prevOverscroll = body.style.overscrollBehaviorY;

//       body.style.overflow = "hidden";
//       body.style.overscrollBehaviorY = "none";

//       return () => {
//         body.style.overflow = prevOverflow;
//         body.style.overscrollBehaviorY = prevOverscroll;
//       };
//     }

//     // Step2 = normal
//     body.style.overflow = "";
//     body.style.overscrollBehaviorY = "";
//   }, [slideIndex]);

//   /* -----------------------
//      STEP 1 - language
//   ------------------------ */
//   const detected = i18n.resolvedLanguage || i18n.language || "en";
//   const safeDetected = LANGS.includes(detected) ? detected : "en";

//   const [langActiveIndex, setLangActiveIndex] = useState(() =>
//     Math.max(0, LANGS.indexOf(safeDetected))
//   );

//   const [selectedLang, setSelectedLang] = useState(() => {
//     const base = language && LANGS.includes(language) ? language : safeDetected;
//     return base;
//   });

//   const [isSwitchingLang, setIsSwitchingLang] = useState(false);
//   const continueBtnRef = useRef(null);

//   useEffect(() => {
//     if (slideIndex !== 0) return;

//     const fallback = i18n.resolvedLanguage || i18n.language || "en";
//     const safe = LANGS.includes(fallback) ? fallback : "en";
//     const idx = Math.max(0, LANGS.indexOf(safe));

//     setLangActiveIndex(idx);

//     if (!selectedLang) {
//       setSelectedLang(safe);
//       setLanguage(safe);
//     }

//     requestAnimationFrame(() => continueBtnRef.current?.focus?.());
//   }, [slideIndex, i18n, selectedLang, setLanguage]);

//   const handlePickLanguage = useCallback(
//     async (code, idx) => {
//       if (!LANGS.includes(code)) return;

//       setSelectedLang(code);
//       if (typeof idx === "number") setLangActiveIndex(idx);

//       setIsSwitchingLang(true);
//       try {
//         await setLanguage(code);
//       } finally {
//         setIsSwitchingLang(false);
//       }

//       requestAnimationFrame(() => continueBtnRef.current?.focus?.());
//     },
//     [setLanguage]
//   );

//   const canContinue = !!selectedLang && !isSwitchingLang;

//   const goToStep2 = useCallback(async () => {
//     if (!selectedLang) return;

//     setIsSwitchingLang(true);
//     try {
//       await setLanguage(selectedLang);
//     } finally {
//       setIsSwitchingLang(false);
//     }

//     // IMPORTANT: on valide onboarding après avoir set la langue
//     completeLanguageStep(selectedLang);

//     // ✅ slide to step2
//     setSlideIndex(1);

//     window.setTimeout(() => {
//       const first = document.querySelector(".homeOverlay__menuBtn");
//       first?.focus?.();
//     }, 420);
//   }, [selectedLang, setLanguage, completeLanguageStep]);

//   // Keyboard Step1 (arrow to pick, enter/space to continue)
//   useEffect(() => {
//     if (slideIndex !== 0) return;

//     const onKeyDown = (e) => {
//       if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
//         e.preventDefault();
//         const dir = e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 1;
//         const nextIdx = (langActiveIndex + dir + LANGS.length) % LANGS.length;
//         handlePickLanguage(LANGS[nextIdx], nextIdx);
//         return;
//       }

//       if (e.key === "Enter" || e.key === " ") {
//         if (!canContinue) return;
//         e.preventDefault();
//         goToStep2();
//       }
//     };

//     window.addEventListener("keydown", onKeyDown);
//     return () => window.removeEventListener("keydown", onKeyDown);
//   }, [slideIndex, langActiveIndex, canContinue, handlePickLanguage, goToStep2]);

//   /* -----------------------
//      STEP 2 - menu
//   ------------------------ */
//   const [menuActiveIndex, setMenuActiveIndex] = useState(0);

//   const runMenuAction = useCallback(
//     (item) => {
//       if (!item) return;

//       if (item.key === "explore") {
//         navigate(item.to);
//         return;
//       }

//       if (item.key === "about") return onGoAbout?.();
//       if (item.key === "projects") return onGoProjects?.();
//       if (item.key === "contact") return onGoContact?.();
//     },
//     [navigate, onGoAbout, onGoProjects, onGoContact]
//   );

//   // Keyboard Step2
//   useEffect(() => {
//     if (slideIndex !== 1) return;

//     const onKeyDown = (e) => {
//       if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
//         e.preventDefault();
//         const dir = e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 1;
//         setMenuActiveIndex((i) => (i + dir + MENU.length) % MENU.length);
//         return;
//       }

//       if (e.key === "Enter" || e.key === " ") {
//         e.preventDefault();
//         runMenuAction(MENU[menuActiveIndex]);
//       }
//     };

//     window.addEventListener("keydown", onKeyDown);
//     return () => window.removeEventListener("keydown", onKeyDown);
//   }, [slideIndex, menuActiveIndex, runMenuAction]);

//   /* -----------------------
//      Swipe Step2 -> Step1
//      (left OR right)
//   ------------------------ */
//   const swipeRef = useRef({ down: false, x0: 0 });

//   const onPointerDown = useCallback(
//     (e) => {
//       if (slideIndex !== 1) return;
//       swipeRef.current.down = true;
//       swipeRef.current.x0 = e.clientX;
//     },
//     [slideIndex]
//   );

//   const onPointerUp = useCallback(
//     (e) => {
//       if (!swipeRef.current.down) return;
//       swipeRef.current.down = false;

//       const dx = e.clientX - swipeRef.current.x0;
//       if (Math.abs(dx) > 70) {
//         setSlideIndex(0);
//         window.setTimeout(() => continueBtnRef.current?.focus?.(), 420);
//       }
//     },
//     []
//   );

//   /* -----------------------
//      Reset language step (fixed button)
//   ------------------------ */
//   const handleReset = useCallback(() => {
//     // si tu as resetLanguageStep dans hook -> perfect
//     if (typeof resetLanguageStep === "function") {
//       resetLanguageStep();
//       setSlideIndex(0);
//       return;
//     }

//     // fallback: on revient juste au step1 (ton dev reset peut gérer le storage)
//     setSlideIndex(0);
//   }, [resetLanguageStep]);

//   return (
//     <header
//       className="homeOverlay"
//       data-step={slideIndex === 0 ? "1" : "2"}
//       aria-label="Home onboarding header"
//     >
//       {/* Background layers */}
//       <div className="homeOverlay__bg homeOverlay__bg--step1" aria-hidden="true" />
//       <div className="homeOverlay__bg homeOverlay__bg--step2" aria-hidden="true" />
//       <div className="homeOverlay__noise" aria-hidden="true" />
//       <div className="homeOverlay__screenFx" aria-hidden="true" />

//       {/* Reset button fixed bottom-right */}
//       <button
//         type="button"
//         className="homeOverlay__resetBtn"
//         onClick={handleReset}
//       >
//         <span className="homeOverlay__resetIcon" aria-hidden="true">↺</span>
//         <span className="homeOverlay__resetText">{t("language.reset")}</span>
//       </button>

//       {/* Carousel viewport */}
//       <div
//         className="homeOverlay__viewport"
//         onPointerDown={onPointerDown}
//         onPointerUp={onPointerUp}
//       >
//         <div
//           className="homeOverlay__track"
//           style={{ transform: `translateX(-${slideIndex * 100}vw)` }}
//         >
//           {/* ---------- SLIDE 1 ---------- */}
//           <section
//             className={`homeOverlay__slide ${slideIndex === 0 ? "isActive" : ""}`}
//             aria-hidden={slideIndex !== 0}
//           >
//             <div className="homeOverlay__panel">
//               <div className="homeOverlay__fx" aria-hidden="true">
//                 <div className="homeOverlay__orb" />
//                 <div className="homeOverlay__grid" />
//               </div>

//               <div className="homeOverlay__badge">CREATIVE://TECH</div>

//               <h1 className="homeOverlay__title">{t("language.title")}</h1>
//               <p className="homeOverlay__subtitle">{t("language.subtitle")}</p>

//               <div
//                 className="homeOverlay__langGrid"
//                 role="radiogroup"
//                 aria-label={t("a11y.languageSelector")}
//               >
//                 {LANGS.map((code, idx) => {
//                   const isActive = idx === langActiveIndex;
//                   const isSelected = selectedLang === code;

//                   return (
//                     <button
//                       key={code}
//                       type="button"
//                       className={`homeOverlay__langBtn ${isActive ? "isActive" : ""}`}
//                       role="radio"
//                       aria-checked={isSelected}
//                       onClick={() => handlePickLanguage(code, idx)}
//                     >
//                       <span
//                         className={`homeOverlay__chev ${isActive ? "isOn" : ""}`}
//                         aria-hidden="true"
//                       >
//                         &gt;
//                       </span>
//                       <span className="homeOverlay__langLabel">
//                         {t(`language.languages.${code}`)}
//                       </span>
//                     </button>
//                   );
//                 })}
//               </div>

//               <div className="homeOverlay__footer">
//                 <button
//                   ref={continueBtnRef}
//                   type="button"
//                   className="homeOverlay__primaryBtn homeOverlay__continueBtn"
//                   onClick={goToStep2}
//                   disabled={!canContinue}
//                 >
//                   {isSwitchingLang ? "..." : t("language.continue")}
//                 </button>
//               </div>
//             </div>
//           </section>

//           {/* ---------- SLIDE 2 ---------- */}
//           <section
//             className={`homeOverlay__slide ${slideIndex === 1 ? "isActive" : ""}`}
//             aria-hidden={slideIndex !== 1}
//           >
//             <div className="homeOverlay__panel">
//               <div className="homeOverlay__fx" aria-hidden="true">
//                 <div className="homeOverlay__orb" />
//                 <div className="homeOverlay__grid" />
//               </div>

//               <div className="homeOverlay__badge">CREATIVE://TECH</div>

//               <h1 className="homeOverlay__title">
//                 {t("menu.titleLine1")}
//                 <br />
//                 {t("menu.titleLine2")}
//               </h1>

//               <p className="homeOverlay__subtitle">{t("menu.subtitle")}</p>

//               <div className="homeOverlay__menu" role="menu" aria-label={t("a11y.menu")}>
//                 {MENU.map((item, idx) => {
//                   const isActive = idx === menuActiveIndex;
//                   const btnClass =
//                     item.kind === "primary"
//                       ? "homeOverlay__primaryBtn"
//                       : "homeOverlay__secondaryBtn";

//                   return (
//                     <button
//                       key={item.key}
//                       type="button"
//                       className={`${btnClass} homeOverlay__menuBtn ${isActive ? "isActive" : ""}`}
//                       onMouseEnter={() => setMenuActiveIndex(idx)}
//                       onFocus={() => setMenuActiveIndex(idx)}
//                       onClick={() => runMenuAction(item)}
//                     >
//                       <span
//                         className={`homeOverlay__chev ${isActive ? "isOn" : ""}`}
//                         aria-hidden="true"
//                       >
//                         &gt;
//                       </span>
//                       <span className="homeOverlay__langLabel">
//                         {t(`menu.buttons.${item.key}`)}
//                       </span>
//                     </button>
//                   );
//                 })}
//               </div>

//               <p className="homeOverlay__hint">{t("menu.hint")}</p>
//             </div>
//           </section>
//         </div>
//       </div>
//     </header>
//   );
// }




// // src/Components/Home/HomeOverlay.jsx
// import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next";
// import useOnboarding from "../../hooks/useOnboarding";
// import "./HomeOverlay.css";

// const LANGS = ["en", "fr", "nl", "pl"];

// // Step 2 menu items (routes / actions)
// const MENU_ITEMS = [
//   { key: "explore", action: "city" },     // /city
//   { key: "about", action: "scroll:about" },
//   { key: "projects", action: "scroll:projects" },
//   { key: "contact", action: "scroll:contact" },
// ];

// export default function HomeOverlay() {
//   const navigate = useNavigate();
//   const { t, i18n } = useTranslation("intro");

//   const {
//     language,
//     shouldShowLanguageStep,
//     setLanguage,
//     completeLanguageStep,
//   } = useOnboarding();

//   // Step (1 = language, 2 = menu)
//   const [step, setStep] = useState(shouldShowLanguageStep ? 1 : 2);

//   // ----- Step 1: language select state
//   const detected = i18n.resolvedLanguage || i18n.language || "en";
//   const safeDetected = LANGS.includes(detected) ? detected : "en";

//   const [langActiveIndex, setLangActiveIndex] = useState(() =>
//     Math.max(0, LANGS.indexOf(safeDetected))
//   );

//   const [selectedLang, setSelectedLang] = useState(() =>
//     language && LANGS.includes(language) ? language : ""
//   );

//   const [isSwitchingLang, setIsSwitchingLang] = useState(false);
//   const continueBtnRef = useRef(null);

//   // ----- Step 2: menu select state (même logique)
//   const [menuActiveIndex, setMenuActiveIndex] = useState(0);
//   const menuRef = useRef(null);

//   // Préload (http-backend) pour switch instant
//   useEffect(() => {
//     i18n.loadNamespaces(["intro"]);
//     i18n.loadLanguages(LANGS);
//   }, [i18n]);

//   // Sync step
//   useMemo(() => {
//     setStep(shouldShowLanguageStep ? 1 : 2);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [shouldShowLanguageStep]);

//   // Quand on arrive/revient step 1 (reset etc.)
//   useEffect(() => {
//     if (step !== 1) return;

//     const fallback = i18n.resolvedLanguage || i18n.language || "en";
//     const safe = LANGS.includes(fallback) ? fallback : "en";
//     const idx = Math.max(0, LANGS.indexOf(safe));

//     setLangActiveIndex(idx);

//     if (!selectedLang) {
//       setSelectedLang(safe);
//       setLanguage(safe);
//       requestAnimationFrame(() => continueBtnRef.current?.focus());
//     }
//   }, [step, i18n, selectedLang, setLanguage]);

//   // Sync language change from hook
//   useEffect(() => {
//     if (!language || !LANGS.includes(language)) return;
//     const idx = LANGS.indexOf(language);
//     setLangActiveIndex(Math.max(0, idx));
//     setSelectedLang(language);
//   }, [language]);

//   const canContinue = !!selectedLang && !isSwitchingLang;

//   const handlePickLanguage = useCallback(
//     async (code, idx) => {
//       if (!LANGS.includes(code)) return;

//       setSelectedLang(code);
//       if (typeof idx === "number") setLangActiveIndex(idx);

//       setIsSwitchingLang(true);
//       await setLanguage(code);
//       setIsSwitchingLang(false);

//       requestAnimationFrame(() => continueBtnRef.current?.focus());
//     },
//     [setLanguage]
//   );

//   const confirmLanguage = useCallback(async () => {
//     if (!selectedLang) return;

//     setIsSwitchingLang(true);
//     await setLanguage(selectedLang);
//     setIsSwitchingLang(false);

//     completeLanguageStep(selectedLang);
//     setStep(2);

//     // quand on passe step2 -> focus menu et remonter en haut
//     requestAnimationFrame(() => {
//       window.scrollTo({ top: 0, behavior: "smooth" });
//       menuRef.current?.focus?.();
//     });
//   }, [selectedLang, setLanguage, completeLanguageStep]);

//   // helper scroll sections (one-page)
//   const scrollToSection = useCallback((id) => {
//     const el = document.getElementById(id);
//     if (!el) return;
//     el.scrollIntoView({ behavior: "smooth", block: "start" });
//   }, []);

//   const runMenuAction = useCallback(
//     (action) => {
//       if (action === "city") {
//         navigate("/city");
//         return;
//       }
//       if (action.startsWith("scroll:")) {
//         const id = action.split(":")[1];
//         scrollToSection(id);
//       }
//     },
//     [navigate, scrollToSection]
//   );

//   // Keyboard navigation Step 1 + Step 2
//   useEffect(() => {
//     const onKeyDown = (e) => {
//       // STEP 1
//       if (step === 1) {
//         if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
//           e.preventDefault();
//           const dir = e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 1;
//           const nextIdx = (langActiveIndex + dir + LANGS.length) % LANGS.length;
//           handlePickLanguage(LANGS[nextIdx], nextIdx);
//           return;
//         }

//         if (e.key === "Enter" || e.key === " ") {
//           if (!canContinue) return;
//           e.preventDefault();
//           confirmLanguage();
//         }
//       }

//       // STEP 2
//       if (step === 2) {
//         // arrows = move selection
//         if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
//           e.preventDefault();
//           const dir = e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 1;
//           const nextIdx =
//             (menuActiveIndex + dir + MENU_ITEMS.length) % MENU_ITEMS.length;
//           setMenuActiveIndex(nextIdx);
//           return;
//         }

//         // Enter/Space = trigger
//         if (e.key === "Enter" || e.key === " ") {
//           e.preventDefault();
//           const item = MENU_ITEMS[menuActiveIndex];
//           runMenuAction(item.action);
//         }
//       }
//     };

//     window.addEventListener("keydown", onKeyDown);
//     return () => window.removeEventListener("keydown", onKeyDown);
//   }, [
//     step,
//     langActiveIndex,
//     canContinue,
//     confirmLanguage,
//     handlePickLanguage,
//     menuActiveIndex,
//     runMenuAction,
//   ]);

//   return (
//     <div className={`homeOverlay ${step === 2 ? "isStep2" : ""}`}>
//       {/* Background FX */}
//       <div className="homeOverlay__bgFx" aria-hidden="true" />

//       {/* Panel (Step 2 sticky en haut) */}
//       <div className={`homeOverlay__panel ${step === 2 ? "isSticky" : ""}`}>
//         <div className="homeOverlay__fx" aria-hidden="true">
//           <div className="homeOverlay__orb" />
//           <div className="homeOverlay__grid" />
//         </div>

//         <div className="homeOverlay__badge">KASIA NAGORKA://CREATIVE_TECH</div>

//         {step === 1 && (
//           <>
//             <h1 className="homeOverlay__title">{t("language.title")}</h1>
//             <p className="homeOverlay__subtitle">{t("language.subtitle")}</p>

//             <div
//               className="homeOverlay__optionsGrid"
//               role="radiogroup"
//               aria-label={t("a11y.languageSelector")}
//             >
//               {LANGS.map((code, idx) => {
//                 const isActive = idx === langActiveIndex;
//                 const isSelected = selectedLang === code;

//                 return (
//                   <button
//                     key={code}
//                     type="button"
//                     className={`homeOverlay__optionBtn ${isActive ? "isActive" : ""}`}
//                     role="radio"
//                     aria-checked={isSelected}
//                     onMouseEnter={() => setLangActiveIndex(idx)} // hover = active
//                     onFocus={() => setLangActiveIndex(idx)}
//                     onClick={() => handlePickLanguage(code, idx)}
//                   >
//                     <span className={`homeOverlay__chev ${isActive ? "isOn" : ""}`} aria-hidden="true">
//                       &gt;
//                     </span>
//                     <span className="homeOverlay__optionLabel">
//                       {t(`language.languages.${code}`)}
//                     </span>
//                   </button>
//                 );
//               })}
//             </div>

//             <div className="homeOverlay__footer">
//               <button
//                 ref={continueBtnRef}
//                 type="button"
//                 className="homeOverlay__primaryBtn homeOverlay__continueBtn"
//                 onClick={confirmLanguage}
//                 disabled={!canContinue}
//               >
//                 {isSwitchingLang ? "..." : t("language.continue")}
//               </button>
//             </div>
//           </>
//         )}

//         {step === 2 && (
//           <>
//             {/* Title split line (version sans dangerouslySetInnerHTML) */}
//             <h1 className="homeOverlay__title">
//               {t("menu.titleLine1")} <br />
//               {t("menu.titleLine2")}
//             </h1>
//             <p className="homeOverlay__subtitle">{t("menu.subtitle")}</p>

//             <div className="homeOverlay__menu" role="menu" tabIndex={-1} ref={menuRef}>
//               {MENU_ITEMS.map((item, idx) => {
//                 const isActive = idx === menuActiveIndex;

//                 // Primary style for first (Explore), secondary for others
//                 const isPrimary = idx === 0;

//                 return (
//                   <button
//                     key={item.key}
//                     type="button"
//                     className={[
//                       "homeOverlay__optionBtn",
//                       isPrimary ? "isPrimary" : "isSecondary",
//                       isActive ? "isActive" : "",
//                     ].join(" ")}
//                     role="menuitem"
//                     onMouseEnter={() => setMenuActiveIndex(idx)}
//                     onFocus={() => setMenuActiveIndex(idx)}
//                     onClick={() => runMenuAction(item.action)}
//                   >
//                     <span className={`homeOverlay__chev ${isActive ? "isOn" : ""}`} aria-hidden="true">
//                       &gt;
//                     </span>
//                     <span className="homeOverlay__optionLabel">
//                       {t(`menu.items.${item.key}`)}
//                     </span>
//                   </button>
//                 );
//               })}
//             </div>

//             <p className="homeOverlay__hint">{t("menu.hint")}</p>
//           </>
//         )}
//       </div>

//       {/* Sections one-page (visibles seulement Step 2) */}
//       {step === 2 && (
//         <div className="homeOverlay__sections">
//           <section id="about" className="homeOverlay__section">
//             {/* remplace par ton composant About/one-page */}
//             {/* <About /> */}
//             <h2>About</h2>
//             <p>...</p>
//           </section>

//           <section id="projects" className="homeOverlay__section">
//             {/* <Projects /> */}
//             <h2>Projects</h2>
//             <p>...</p>
//           </section>

//           <section id="contact" className="homeOverlay__section">
//             {/* <Contact /> */}
//             <h2>Contact</h2>
//             <p>...</p>
//           </section>
//         </div>
//       )}
//     </div>
//   );
// }
