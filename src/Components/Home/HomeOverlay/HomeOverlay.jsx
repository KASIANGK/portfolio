// src/Components/Home/HomeOverlay/HomeOverlay.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useOnboarding from "../../../hooks/useOnboarding";

import "./parts/styles/Base.css";
import "./parts/styles/Background.css";
import "./parts/styles/Reset.css";
import "./parts/styles/Panel.css";
import "./parts/styles/Buttons.css";
import "./parts/styles/StepMenu.css";
import "./parts/styles/PreviewOrgans.css";
import "./parts/styles/ScrollHint.css";
import "./parts/styles/Carousel.css";
import "./parts/styles/Typography.css";
import "./HomeOverlay.css";

import { LANGS, MENU } from "./constants";
import OverlayBackground from "./parts/OverlayBackground";
import OverlayResetButtons from "./parts/OverlayResetButtons";
import StepLanguage from "./parts/StepLanguage";
import StepMenu from "./parts/StepMenu";

export default function HomeOverlay({ onGoAbout, onGoProjects, onGoContact }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation("intro");

  const {
    language,
    shouldShowLanguageStep,
    setLanguage,
    completeLanguageStep,
    resetLanguageStep,
  } = useOnboarding();

  const FIRST_VISIT_KEY = "ag_home_first_visit_done_v1";
  const KB_HINT_KEY = "ag_step1_kb_hint_seen_v2";
  const FORCE_STEP_KEY = "ag_home_step_once"; // sessionStorage

  // -----------------------------
  // First visit (localStorage)
  // -----------------------------
  const firstVisit = useMemo(() => {
    try {
      return localStorage.getItem(FIRST_VISIT_KEY) !== "1";
    } catch {
      return true;
    }
  }, []);

  // -----------------------------
  // ✅ Forced step (sessionStorage) read BEFORE first render
  // -----------------------------
  const forcedStepOnce = useMemo(() => {
    try {
      return sessionStorage.getItem(FORCE_STEP_KEY); // "2" or null
    } catch {
      return null;
    }
  }, []);

  const forcedStepInitial = forcedStepOnce === "2" ? 2 : null;
  const forcedStepRef = useRef(forcedStepInitial);

  // -----------------------------
  // Slide state (0 = step1, 1 = step2)
  // -----------------------------
  const [slideIndex, setSlideIndex] = useState(() => {
    if (forcedStepInitial === 2) return 1; // step2 (menu)
    if (firstVisit) return 0;
    return shouldShowLanguageStep ? 0 : 1;
  });

  // -----------------------------
  // Anim control (disable once on forced)
  // -----------------------------
  const [noAnimOnce, setNoAnimOnce] = useState(() => forcedStepInitial === 2);

  const continueBtnRef = useRef(null);

  // -----------------------------
  // i18n warmup
  // -----------------------------
  useEffect(() => {
    i18n.loadNamespaces(["intro"]);
    i18n.loadLanguages(LANGS);
  }, [i18n]);

  // -----------------------------
  // Consume forced flag AFTER mount (UI was already correct)
  // -----------------------------
  useEffect(() => {
    if (forcedStepOnce !== "2") return;

    try {
      sessionStorage.removeItem(FORCE_STEP_KEY);
    } catch {}

    window.setTimeout(() => {
      const first = document.querySelector(".homeOverlay__menuBtn");
      first?.focus?.();
    }, 80);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => setNoAnimOnce(false));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------
  // If onboarding says “show language step”, do it — unless forced step2
  // -----------------------------
  useEffect(() => {
    if (forcedStepRef.current === 2) return;
    if (shouldShowLanguageStep) setSlideIndex(0);
  }, [shouldShowLanguageStep]);

  // -----------------------------
  // Step1 scroll lock
  // -----------------------------
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

  // -----------------------------
  // Step1 helpers (instant)
  // -----------------------------
  const goToStep1Instant = useCallback(() => {
    forcedStepRef.current = null; // release forced lock
    setNoAnimOnce(true);
    setSlideIndex(0);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => setNoAnimOnce(false));
    });

    window.setTimeout(() => continueBtnRef.current?.focus?.(), 80);
  }, []);

  // -----------------------------
  // ✅ From /city: reset tutorial -> come back to step1
  // -----------------------------
  useEffect(() => {
    if (!location.state?.resetCityTutorial) return;

    try {
      localStorage.removeItem(FIRST_VISIT_KEY);
    } catch {}

    try {
      localStorage.removeItem(KB_HINT_KEY);
    } catch {}

    goToStep1Instant();

    // consume state
    window.history.replaceState({}, document.title);
  }, [location.state, goToStep1Instant]);

  // -----------------------------
  // ✅ From /city: goHomeStep:2 -> force step2 instantly
  // -----------------------------
  useEffect(() => {
    const s = location.state?.goHomeStep;
    if (s !== 2) return;

    forcedStepRef.current = 2;
    setNoAnimOnce(true);
    setSlideIndex(1);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => setNoAnimOnce(false));
    });

    window.setTimeout(() => {
      const first = document.querySelector(".homeOverlay__menuBtn");
      first?.focus?.();
    }, 80);

    window.history.replaceState({}, document.title);
  }, [location.state]);

  // -----------------------------
  // Step1 language init
  // -----------------------------
  const detected = (i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);
  const safeDetected = LANGS.includes(detected) ? detected : "en";

  const initialLang = useMemo(() => {
    if (language && LANGS.includes(language)) return language;
    return safeDetected;
  }, [language, safeDetected]);

  const [langActiveIndex, setLangActiveIndex] = useState(() =>
    Math.max(0, LANGS.indexOf(initialLang))
  );

  const [selectedLang, setSelectedLang] = useState(initialLang);
  const [isSwitchingLang, setIsSwitchingLang] = useState(false);

  // keep selector synced if language changes from outside
  useEffect(() => {
    if (slideIndex !== 0) return;

    const lng = (i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);
    const safe = LANGS.includes(lng) ? lng : "en";

    setSelectedLang((prev) => (prev === safe ? prev : safe));
    setLangActiveIndex((prev) => {
      const next = Math.max(0, LANGS.indexOf(safe));
      return prev === next ? prev : next;
    });
  }, [i18n.resolvedLanguage, i18n.language, slideIndex]);

  // focus continue on step1 entry
  useEffect(() => {
    if (slideIndex !== 0) return;

    const fallback = (i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);
    const safe = LANGS.includes(fallback) ? fallback : "en";
    const base = selectedLang || safe;

    setLangActiveIndex(Math.max(0, LANGS.indexOf(base)));
    requestAnimationFrame(() => continueBtnRef.current?.focus?.());
  }, [slideIndex, i18n, selectedLang]);

  // -----------------------------
  // KB hint state
  // -----------------------------
  const [showKbHint, setShowKbHint] = useState(() => {
    try {
      return localStorage.getItem(KB_HINT_KEY) !== "1";
    } catch {
      return true;
    }
  });

  const [kbHintPhase, setKbHintPhase] = useState("hidden"); // hidden | visible | hiding

  useEffect(() => {
    if (slideIndex !== 0) return;
    if (showKbHint) requestAnimationFrame(() => setKbHintPhase("visible"));
    else setKbHintPhase("hidden");
  }, [slideIndex, showKbHint]);

  const consumeKbHint = useCallback(() => {
    if (!showKbHint) return;

    setKbHintPhase("hiding");
    try {
      localStorage.setItem(KB_HINT_KEY, "1");
    } catch {}

    window.setTimeout(() => {
      setShowKbHint(false);
      setKbHintPhase("hidden");
    }, 320);
  }, [showKbHint]);

  // -----------------------------
  // Step1 actions
  // -----------------------------
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

    consumeKbHint();

    setIsSwitchingLang(true);
    try {
      await setLanguage(selectedLang);
    } finally {
      setIsSwitchingLang(false);
    }

    try {
      localStorage.setItem(FIRST_VISIT_KEY, "1");
    } catch {}

    completeLanguageStep(selectedLang);
    setSlideIndex(1);

    window.setTimeout(() => {
      const first = document.querySelector(".homeOverlay__menuBtn");
      first?.focus?.();
    }, 420);
  }, [selectedLang, setLanguage, completeLanguageStep, consumeKbHint]);

  // Step1 keyboard
  useEffect(() => {
    if (slideIndex !== 0) return;

    const onKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        consumeKbHint();
        e.preventDefault();
        const dir = e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 1;
        const nextIdx = (langActiveIndex + dir + LANGS.length) % LANGS.length;
        handlePickLanguage(LANGS[nextIdx], nextIdx);
        return;
      }

      if (e.key === "Enter" || e.key === " ") {
        if (!canContinue) return;
        consumeKbHint();
        e.preventDefault();
        goToStep2();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    slideIndex,
    langActiveIndex,
    canContinue,
    handlePickLanguage,
    goToStep2,
    consumeKbHint,
  ]);

  // -----------------------------
  // Step2 menu
  // -----------------------------
  const [menuActiveIndex, setMenuActiveIndex] = useState(0);

  const runMenuAction = useCallback(
    (item) => {
      if (!item) return;

      if (item.key === "explore") return navigate("/city", { state: { autoEnterCity: true } });
      if (item.key === "about") return onGoAbout?.();
      if (item.key === "projects") return onGoProjects?.();
      if (item.key === "contact") return onGoContact?.();
    },
    [navigate, onGoAbout, onGoProjects, onGoContact]
  );

  // Step2 keyboard
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

  // -----------------------------
  // Reset buttons
  // -----------------------------
  const handleResetLanguage = useCallback(async () => {
    if (typeof resetLanguageStep === "function") resetLanguageStep();

    const fallback = (i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);
    const safe = LANGS.includes(fallback) ? fallback : "en";

    setSelectedLang(safe);
    setLangActiveIndex(Math.max(0, LANGS.indexOf(safe)));

    try {
      await setLanguage(safe);
      await i18n.changeLanguage(safe);
    } catch {}

    try {
      localStorage.removeItem(FIRST_VISIT_KEY);
    } catch {}

    goToStep1Instant();
  }, [resetLanguageStep, i18n, setLanguage, goToStep1Instant]);

  const handleResetHint = useCallback(() => {
    try {
      localStorage.removeItem(KB_HINT_KEY);
    } catch {}
    setShowKbHint(true);
    setKbHintPhase("hidden");
  }, []);

  const handleResetFirstStep = useCallback(() => {
    try {
      localStorage.removeItem(FIRST_VISIT_KEY);
    } catch {}
    goToStep1Instant();
  }, [goToStep1Instant]);

  // global flag
  useEffect(() => {
    document.documentElement.dataset.agOnboarding = slideIndex === 0 ? "1" : "0";
    return () => {
      document.documentElement.dataset.agOnboarding = "0";
    };
  }, [slideIndex]);

  return (
    <header
      className="homeOverlay"
      data-step={slideIndex === 0 ? "1" : "2"}
      aria-label="Home onboarding header"
    >
      <OverlayBackground slideIndex={slideIndex} noAnimOnce={noAnimOnce} />

      <OverlayResetButtons
        t={t}
        onResetLanguage={handleResetLanguage}
        onResetHint={handleResetHint}
        onResetStep={handleResetFirstStep}
      />

      <div className="homeOverlay__viewport">
        <div
          className={`homeOverlay__track ${noAnimOnce ? "isInstant" : ""}`}
          style={{ transform: `translateX(-${slideIndex * 100}vw)` }}
        >
          <StepLanguage
            isActive={slideIndex === 0}
            t={t}
            LANGS={LANGS}
            langActiveIndex={langActiveIndex}
            selectedLang={selectedLang}
            onPickLanguage={handlePickLanguage}
            showKbHint={showKbHint}
            kbHintPhase={kbHintPhase}
            continueBtnRef={continueBtnRef}
            onContinue={goToStep2}
            canContinue={canContinue}
            isSwitchingLang={isSwitchingLang}
          />

          <StepMenu
            isActive={slideIndex === 1}
            t={t}
            MENU={MENU}
            menuActiveIndex={menuActiveIndex}
            setMenuActiveIndex={setMenuActiveIndex}
            onRunAction={runMenuAction}
            onGoAbout={onGoAbout}
            onGoProjects={onGoProjects}
            onGoContact={onGoContact}
          />
        </div>
      </div>
    </header>
  );
}







// // src/Components/Home/HomeOverlay/HomeOverlay.jsx
// import React, { useCallback, useEffect, useRef, useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { useTranslation } from "react-i18next";
// import useOnboarding from "../../../hooks/useOnboarding";

// import "./parts/styles/Base.css";
// import "./parts/styles/Background.css";
// import "./parts/styles/Reset.css";
// import "./parts/styles/Panel.css";
// import "./parts/styles/Buttons.css";
// import "./parts/styles/StepMenu.css";
// import "./parts/styles/PreviewOrgans.css";
// import "./parts/styles/ScrollHint.css";
// import "./parts/styles/Carousel.css";
// import "./parts/styles/Typography.css";
// import "./HomeOverlay.css"

// import { LANGS, MENU } from "./constants";
// import OverlayBackground from "./parts/OverlayBackground";
// import OverlayResetButtons from "./parts/OverlayResetButtons";
// import StepLanguage from "./parts/StepLanguage";
// import StepMenu from "./parts/StepMenu";

// export default function HomeOverlay({ onGoAbout, onGoProjects, onGoContact }) {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { t, i18n } = useTranslation("intro");

//   const {
//     language,
//     shouldShowLanguageStep,
//     setLanguage,
//     completeLanguageStep,
//     resetLanguageStep,
//   } = useOnboarding();

//   const FIRST_VISIT_KEY = "ag_home_first_visit_done_v1";
//   const KB_HINT_KEY = "ag_step1_kb_hint_seen_v2";

//   const firstVisit = (() => {
//     try {
//       return localStorage.getItem(FIRST_VISIT_KEY) !== "1";
//     } catch {
//       return true;
//     }
//   })();

//   const [slideIndex, setSlideIndex] = useState(() => {
//     if (firstVisit) return 0;
//     return shouldShowLanguageStep ? 0 : 1;
//   });

//   // useEffect(() => {
//   //   if (shouldShowLanguageStep) setSlideIndex(0);
//   // }, [shouldShowLanguageStep]);
//   useEffect(() => {
//     // ✅ si on a forcé step2, on ignore l'auto retour step1
//     if (forcedStepRef.current === 2) return;
  
//     if (shouldShowLanguageStep) setSlideIndex(0);
//   }, [shouldShowLanguageStep]);
  

//   useEffect(() => {
//     i18n.loadNamespaces(["intro"]);
//     i18n.loadLanguages(LANGS);
//   }, [i18n]);

//   // Step1 scroll lock
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

//     body.style.overflow = "";
//     body.style.overscrollBehaviorY = "";
//   }, [slideIndex]);

//   // Instant switch (no anim once)
//   const [noAnimOnce, setNoAnimOnce] = useState(false);
//   const continueBtnRef = useRef(null);

//   const goToStep1Instant = useCallback(() => {
//     setNoAnimOnce(true);
//     setSlideIndex(0);
//     requestAnimationFrame(() => {
//       requestAnimationFrame(() => setNoAnimOnce(false));
//     });
//     window.setTimeout(() => continueBtnRef.current?.focus?.(), 80);
//   }, []);

//   // ✅ Point 2: consume reset flag from /city
//   useEffect(() => {
//     if (!location.state?.resetCityTutorial) return;

//     // 1) Reset "first visit" => force onboarding step1 visible
//     try {
//       localStorage.removeItem(FIRST_VISIT_KEY);
//     } catch {}

//     // 2) (optionnel mais pratique) réafficher le hint clavier step1
//     try {
//       localStorage.removeItem(KB_HINT_KEY);
//     } catch {}

//     // 3) Revenir step1 instant
//     goToStep1Instant();

//     // 4) Consommer le state (évite re-trigger au refresh)
//     window.history.replaceState({}, document.title);
//   }, [location.state, goToStep1Instant]);

//   // Step1 language
//   const detected = i18n.resolvedLanguage || i18n.language || "en";
//   const safeDetected = LANGS.includes(detected) ? detected : "en";

//   const initialLang = (() => {
//     if (language && LANGS.includes(language)) return language;
//     return safeDetected;
//   })();

//   const [langActiveIndex, setLangActiveIndex] = useState(() =>
//     Math.max(0, LANGS.indexOf(initialLang))
//   );

//   const [selectedLang, setSelectedLang] = useState(initialLang);
//   const [isSwitchingLang, setIsSwitchingLang] = useState(false);

//   // ✅ Sync Step1 selector when language changes from outside (Navbar, etc.)
//   useEffect(() => {
//     if (slideIndex !== 0) return;

//     const lng = (i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);
//     const safe = LANGS.includes(lng) ? lng : "en";

//     setSelectedLang((prev) => (prev === safe ? prev : safe));
//     setLangActiveIndex((prev) => {
//       const next = Math.max(0, LANGS.indexOf(safe));
//       return prev === next ? prev : next;
//     });
//   }, [i18n.resolvedLanguage, i18n.language, slideIndex]);

//   const [showKbHint, setShowKbHint] = useState(() => {
//     try {
//       return localStorage.getItem(KB_HINT_KEY) !== "1";
//     } catch {
//       return true;
//     }
//   });
//   const [kbHintPhase, setKbHintPhase] = useState("hidden"); // hidden | visible | hiding
//   const forcedStepRef = useRef(null);

//   useEffect(() => {
//     let forced = null;
//     try {
//       forced = sessionStorage.getItem("ag_home_step_once");
//       if (forced) sessionStorage.removeItem("ag_home_step_once");
//     } catch {}
  
//     if (forced === "2") {
//       forcedStepRef.current = 2;
  
//       setNoAnimOnce(true);
//       setSlideIndex(1);
  
//       requestAnimationFrame(() => {
//         requestAnimationFrame(() => setNoAnimOnce(false));
//       });
  
//       window.setTimeout(() => {
//         const first = document.querySelector(".homeOverlay__menuBtn");
//         first?.focus?.();
//       }, 80);
//     }
//   }, []);
  
//   useEffect(() => {
//     if (slideIndex !== 0) return;

//     const fallback = i18n.resolvedLanguage || i18n.language || "en";
//     const safe = LANGS.includes(fallback) ? fallback : "en";
//     const base = selectedLang || safe;
//     setLangActiveIndex(Math.max(0, LANGS.indexOf(base)));

//     requestAnimationFrame(() => continueBtnRef.current?.focus?.());
//   }, [slideIndex, i18n, selectedLang]);

//   useEffect(() => {
//     if (slideIndex !== 0) return;

//     if (showKbHint) requestAnimationFrame(() => setKbHintPhase("visible"));
//     else setKbHintPhase("hidden");
//   }, [slideIndex, showKbHint]);

//   const consumeKbHint = useCallback(() => {
//     if (!showKbHint) return;

//     setKbHintPhase("hiding");
//     try {
//       localStorage.setItem(KB_HINT_KEY, "1");
//     } catch {}

//     window.setTimeout(() => {
//       setShowKbHint(false);
//       setKbHintPhase("hidden");
//     }, 320);
//   }, [showKbHint]);

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

//     consumeKbHint();
//     setIsSwitchingLang(true);
//     try {
//       await setLanguage(selectedLang);
//     } finally {
//       setIsSwitchingLang(false);
//     }

//     try {
//       localStorage.setItem(FIRST_VISIT_KEY, "1");
//     } catch {}

//     completeLanguageStep(selectedLang);
//     setSlideIndex(1);

//     window.setTimeout(() => {
//       const first = document.querySelector(".homeOverlay__menuBtn");
//       first?.focus?.();
//     }, 420);
//   }, [selectedLang, setLanguage, completeLanguageStep, consumeKbHint]);

//   // keyboard Step1
//   useEffect(() => {
//     if (slideIndex !== 0) return;

//     const onKeyDown = (e) => {
//       if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
//         consumeKbHint();
//         e.preventDefault();
//         const dir = e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 1;
//         const nextIdx = (langActiveIndex + dir + LANGS.length) % LANGS.length;
//         handlePickLanguage(LANGS[nextIdx], nextIdx);
//         return;
//       }

//       if (e.key === "Enter" || e.key === " ") {
//         if (!canContinue) return;
//         consumeKbHint();
//         e.preventDefault();
//         goToStep2();
//       }
//     };

//     window.addEventListener("keydown", onKeyDown);
//     return () => window.removeEventListener("keydown", onKeyDown);
//   }, [slideIndex, langActiveIndex, canContinue, handlePickLanguage, goToStep2, consumeKbHint]);

//   // Step2 menu
//   const [menuActiveIndex, setMenuActiveIndex] = useState(0);

//   const runMenuAction = useCallback(
//     (item) => {
//       if (!item) return;

//       if (item.key === "explore") {
//         return navigate("/city", { state: { autoEnterCity: true } });
//       }

//       if (item.key === "about") return onGoAbout?.();
//       if (item.key === "projects") return onGoProjects?.();
//       if (item.key === "contact") return onGoContact?.();
//     },
//     [navigate, onGoAbout, onGoProjects, onGoContact]
//   );

//   // keyboard Step2
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

//   const handleResetLanguage = useCallback(async () => {
//     if (typeof resetLanguageStep === "function") resetLanguageStep();

//     const fallback = i18n.resolvedLanguage || i18n.language || "en";
//     const safe = LANGS.includes(fallback) ? fallback : "en";

//     setSelectedLang(safe);
//     setLangActiveIndex(Math.max(0, LANGS.indexOf(safe)));

//     try {
//       await setLanguage(safe);
//       await i18n.changeLanguage(safe);
//     } catch {}

//     try {
//       localStorage.removeItem(FIRST_VISIT_KEY);
//     } catch {}

//     goToStep1Instant();
//   }, [resetLanguageStep, i18n, setLanguage, goToStep1Instant]);

//   const handleResetHint = useCallback(() => {
//     try {
//       localStorage.removeItem(KB_HINT_KEY);
//     } catch {}
//     setShowKbHint(true);
//     setKbHintPhase("hidden");
//   }, []);

//   const handleResetFirstStep = useCallback(() => {
//     try {
//       localStorage.removeItem(FIRST_VISIT_KEY);
//     } catch {}
//     goToStep1Instant();
//   }, [goToStep1Instant]);

//   // global flag
//   useEffect(() => {
//     document.documentElement.dataset.agOnboarding = slideIndex === 0 ? "1" : "0";
//     return () => {
//       document.documentElement.dataset.agOnboarding = "0";
//     };
//   }, [slideIndex]);

//   // useEffect(() => {
//   //   if (!location.state?.resetCityTutorial) return;
  
//   //   // ✅ go direct Step2 (menu) pour dev
//   //   setNoAnimOnce(true);
//   //   setSlideIndex(1);
  
//   //   requestAnimationFrame(() => {
//   //     requestAnimationFrame(() => setNoAnimOnce(false));
//   //   });
  
//   //   window.setTimeout(() => {
//   //     const first = document.querySelector(".homeOverlay__menuBtn");
//   //     first?.focus?.();
//   //   }, 80);
  
//   //   // ✅ consomme le state pour éviter re-trigger au refresh/back
//   //   window.history.replaceState({}, document.title);
//   // }, [location.state]);
  

//   useEffect(() => {
//     const s = location.state?.goHomeStep;
//     if (s !== 2) return;
  
//     // force step2
//     setNoAnimOnce(true);
//     setSlideIndex(1);
//     requestAnimationFrame(() => {
//       requestAnimationFrame(() => setNoAnimOnce(false));
//     });
  
//     // consomme le state
//     window.history.replaceState({}, document.title);
//   }, [location.state]);
  
//   return (
//     <header
//       className="homeOverlay"
//       data-step={slideIndex === 0 ? "1" : "2"}
//       aria-label="Home onboarding header"
//     >
//       <OverlayBackground slideIndex={slideIndex} noAnimOnce={noAnimOnce} />

//       <OverlayResetButtons
//         t={t}
//         onResetLanguage={handleResetLanguage}
//         onResetHint={handleResetHint}
//         onResetStep={handleResetFirstStep}
//       />

//       <div className="homeOverlay__viewport">
//         <div
//           className={`homeOverlay__track ${noAnimOnce ? "isInstant" : ""}`}
//           style={{ transform: `translateX(-${slideIndex * 100}vw)` }}
//         >
//           <StepLanguage
//             isActive={slideIndex === 0}
//             t={t}
//             LANGS={LANGS}
//             langActiveIndex={langActiveIndex}
//             selectedLang={selectedLang}
//             onPickLanguage={handlePickLanguage}
//             showKbHint={showKbHint}
//             kbHintPhase={kbHintPhase}
//             continueBtnRef={continueBtnRef}
//             onContinue={goToStep2}
//             canContinue={canContinue}
//             isSwitchingLang={isSwitchingLang}
//           />

//           <StepMenu
//             isActive={slideIndex === 1}
//             t={t}
//             MENU={MENU}
//             menuActiveIndex={menuActiveIndex}
//             setMenuActiveIndex={setMenuActiveIndex}
//             onRunAction={runMenuAction}
//             onGoAbout={onGoAbout}
//           />
//         </div>
//       </div>
//     </header>
//   );
// }
