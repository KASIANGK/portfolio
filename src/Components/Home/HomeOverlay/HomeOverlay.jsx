// src/Components/Home/HomeOverlay/HomeOverlay.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useOnboarding from "../../../hooks/useOnboarding";
import useMountLog from "../../../utils/useMountLog";

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

const FIRST_VISIT_KEY = "ag_home_first_visit_done_v1";
const KB_HINT_KEY = "ag_step1_kb_hint_seen_v2";
const FORCE_STEP_KEY = "ag_home_step_once";
const CITY_TUTO_KEY = "ag_city_tutorial_done_v1";
const NAVHELP_SEEN_KEY = "ag_navhelp_hint_seen_v1";
const GAMENAV_TOAST_SEEN_KEY = "ag_gamenav_toast_seen_v1";

const raf2 = () =>
  new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

function unlockScrollHard() {
  document.body.style.overflow = "";
  document.body.style.overscrollBehaviorY = "";
  document.documentElement.style.overflow = "";
}

function lockScrollHard() {
  document.body.style.overflow = "hidden";
  document.body.style.overscrollBehaviorY = "none";
  document.documentElement.style.overflow = "hidden";
}

function safeGetLS(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSetLS(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}
function safeRemoveLS(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}
function safeGetSS(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeRemoveSS(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {}
}

export default function HomeOverlay({
  onGoAbout,
  onGoProjects,
  onGoContact,
  onStepChange,
}) {
  useMountLog("HomeOverlay");

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

  /* ---------------------------------
     Hash navigation helper
  --------------------------------- */
  const goHash = useCallback(
    (hash) => {
      const targetHash = hash.startsWith("#") ? hash : `#${hash}`;
      const targetUrl = `/${targetHash}`;
      const alreadyHome = window.location?.pathname === "/";

      if (alreadyHome) {
        if (window.location.hash !== targetHash) {
          window.history.pushState({}, "", targetUrl);
        }
      } else {
        navigate(targetUrl);
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = document.querySelector(targetHash);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    },
    [navigate]
  );

  /* ---------------------------------
     Flags
  --------------------------------- */
  const hasDoneFirstVisit = useMemo(
    () => safeGetLS(FIRST_VISIT_KEY) === "1",
    []
  );
  const forcedStepOnce = useMemo(() => safeGetSS(FORCE_STEP_KEY), []);

  const forcedStepInitial = forcedStepOnce === "2" ? 2 : null;
  const forcedStepRef = useRef(forcedStepInitial);

  /* ---------------------------------
     Initial slide
  --------------------------------- */
  const [slideIndex, setSlideIndex] = useState(() => {
    if (forcedStepInitial === 2) return 1;
    if (!hasDoneFirstVisit) return 0;
    return shouldShowLanguageStep ? 0 : 1;
  });

  const [noAnimOnce, setNoAnimOnce] = useState(() => forcedStepInitial === 2);
  const continueBtnRef = useRef(null);

  // keep latest slideIndex in ref (for watchdog)
  const slideRef = useRef(slideIndex);
  useEffect(() => {
    slideRef.current = slideIndex;
  }, [slideIndex]);

  useEffect(() => {
    onStepChange?.(slideIndex === 0 ? 1 : 2);
  }, [slideIndex, onStepChange]);

  /* ---------------------------------
     OPTION A — Warm i18n more aggressively
     - intro + step2 related namespaces
  --------------------------------- */
  useEffect(() => {
    i18n.loadLanguages(LANGS);
    i18n.loadNamespaces(["intro", "about", "projects", "contact"]);
  }, [i18n]);

  /* ---------------------------------
     Consume forced flag AFTER mount
  --------------------------------- */
  useEffect(() => {
    if (forcedStepOnce !== "2") return;

    safeRemoveSS(FORCE_STEP_KEY);

    window.setTimeout(() => {
      document.querySelector(".homeOverlay__menuBtn")?.focus?.();
    }, 80);

    requestAnimationFrame(() =>
      requestAnimationFrame(() => setNoAnimOnce(false))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------------
     If onboarding wants step1 (unless forced step2)
  --------------------------------- */
  useEffect(() => {
    if (forcedStepRef.current === 2) return;
    if (shouldShowLanguageStep) setSlideIndex(0);
  }, [shouldShowLanguageStep]);

  /* ---------------------------------
     Scroll lock bulletproof
  --------------------------------- */
  useEffect(() => {
    if (slideIndex === 0) {
      lockScrollHard();
      return () => unlockScrollHard();
    }

    unlockScrollHard();
    requestAnimationFrame(() => unlockScrollHard());
    return undefined;
  }, [slideIndex]);

  useEffect(() => {
    return () => unlockScrollHard();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (slideRef.current !== 1) return;
      const b = document.body.style.overflow;
      const h = document.documentElement.style.overflow;
      if (b === "hidden" || h === "hidden") unlockScrollHard();
    }, 350);

    return () => window.clearInterval(id);
  }, []);

  /* ---------------------------------
     go step1 instantly
  --------------------------------- */
  const goToStep1Instant = useCallback(() => {
    forcedStepRef.current = null;
    setNoAnimOnce(true);
    setSlideIndex(0);

    requestAnimationFrame(() =>
      requestAnimationFrame(() => setNoAnimOnce(false))
    );
    window.setTimeout(() => continueBtnRef.current?.focus?.(), 80);
  }, []);

  /* ---------------------------------
     From /city reset tutorial -> go step1
  --------------------------------- */
  useEffect(() => {
    if (!location.state?.resetCityTutorial) return;

    safeRemoveLS(FIRST_VISIT_KEY);
    safeRemoveLS(KB_HINT_KEY);
    safeRemoveLS("ag_language_chosen");

    goToStep1Instant();
    window.history.replaceState({}, document.title);
  }, [location.state, goToStep1Instant]);

  /* ---------------------------------
     From /city -> force step2 instantly
  --------------------------------- */
  useEffect(() => {
    const s = location.state?.goHomeStep;
    if (s !== 2) return;

    forcedStepRef.current = 2;
    setNoAnimOnce(true);
    setSlideIndex(1);

    unlockScrollHard();
    requestAnimationFrame(() => unlockScrollHard());

    requestAnimationFrame(() =>
      requestAnimationFrame(() => setNoAnimOnce(false))
    );
    window.setTimeout(() => {
      document.querySelector(".homeOverlay__menuBtn")?.focus?.();
    }, 80);

    window.history.replaceState({}, document.title);
  }, [location.state]);

  /* ---------------------------------
     Language init
  --------------------------------- */
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

  /* ---------------------------------
     Sync selector if language changes outside
  --------------------------------- */
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

  useEffect(() => {
    if (slideIndex !== 0) return;
    requestAnimationFrame(() => continueBtnRef.current?.focus?.());
  }, [slideIndex]);

  /* ---------------------------------
     KB hint
  --------------------------------- */
  const [showKbHint, setShowKbHint] = useState(
    () => safeGetLS(KB_HINT_KEY) !== "1"
  );
  const [kbHintPhase, setKbHintPhase] = useState("hidden");

  useEffect(() => {
    if (slideIndex !== 0) return;
    if (showKbHint) requestAnimationFrame(() => setKbHintPhase("visible"));
    else setKbHintPhase("hidden");
  }, [slideIndex, showKbHint]);

  const consumeKbHint = useCallback(() => {
    if (!showKbHint) return;

    setKbHintPhase("hiding");
    safeSetLS(KB_HINT_KEY, "1");

    window.setTimeout(() => {
      setShowKbHint(false);
      setKbHintPhase("hidden");
    }, 320);
  }, [showKbHint]);

  /* ---------------------------------
     Step1 actions
  --------------------------------- */
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

    // ✅ do not re-await setLanguage if we already are on that language
    const current = (i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);
    if (current !== selectedLang) {
      setIsSwitchingLang(true);
      try {
        await setLanguage(selectedLang);
      } finally {
        setIsSwitchingLang(false);
      }
    }

    await raf2();

    safeSetLS(FIRST_VISIT_KEY, "1");
    completeLanguageStep(selectedLang);

    // unlockScrollHard();
    // requestAnimationFrame(() => unlockScrollHard());

    // setSlideIndex(1);
    unlockScrollHard();
    requestAnimationFrame(() => unlockScrollHard());
    
    // 🧠 clé : laisser une frame respirer AVANT le slide
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setSlideIndex(1);
      });
    });
    
    window.setTimeout(() => {
      document.querySelector(".homeOverlay__menuBtn")?.focus?.();
    }, 420);
  }, [selectedLang, i18n, setLanguage, completeLanguageStep, consumeKbHint]);

  // step1 keyboard
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
  }, [slideIndex, langActiveIndex, canContinue, handlePickLanguage, goToStep2, consumeKbHint]);

  /* ---------------------------------
     Step2 menu
  --------------------------------- */
  const [menuActiveIndex, setMenuActiveIndex] = useState(0);

  const runMenuAction = useCallback(
    (item) => {
      if (!item) return;

      if (item.key === "explore") {
        navigate("/city", { state: { autoEnterCity: true } });
        return;
      }
      if (item.key === "about") return goHash("#about");
      if (item.key === "projects") return goHash("#projects");
      if (item.key === "contact") return goHash("#contact");
    },
    [navigate, goHash]
  );

  // step2 keyboard
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

  /* ---------------------------------
     Reset buttons
  --------------------------------- */
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
  }, [resetLanguageStep, i18n, setLanguage]);

  const handleResetHint = useCallback(() => {
    safeRemoveLS(KB_HINT_KEY);
    setShowKbHint(true);
    setKbHintPhase("hidden");
  }, []);

  const handleResetFirstStep = useCallback(() => {
    safeRemoveLS(FIRST_VISIT_KEY);
    safeRemoveLS("ag_language_chosen");
    safeRemoveLS(KB_HINT_KEY);

    unlockScrollHard();
    requestAnimationFrame(() => unlockScrollHard());

    goToStep1Instant();
  }, [goToStep1Instant]);

  // global flag (css hooks)
  useEffect(() => {
    document.documentElement.dataset.agOnboarding = slideIndex === 0 ? "1" : "0";
    return () => {
      document.documentElement.dataset.agOnboarding = "0";
    };
  }, [slideIndex]);

  const bgTrackRef = useRef(null);

  const handleResetHomeCitySteps = useCallback(() => {
    // reset des flags city tuto/hints
    safeRemoveLS(CITY_TUTO_KEY);
    safeRemoveLS(NAVHELP_SEEN_KEY);
    safeRemoveLS(GAMENAV_TOAST_SEEN_KEY);
  
    // reset intro skip si tu veux (optionnel)
    safeRemoveLS("angels_city_skip_intro");
  
    // event “reset” (au cas où tu listens ailleurs)
    window.dispatchEvent(new Event("ag:resetHomeCityTutorial"));
  
    // retour step1 (comme tu voulais)
    goToStep1Instant();
  }, [goToStep1Instant]);
  
  return (
    <header className="homeOverlay" data-step={slideIndex === 0 ? "1" : "2"} aria-label="Home onboarding header">
      <OverlayBackground slideIndex={slideIndex} noAnimOnce={noAnimOnce} bgTrackRef={bgTrackRef} />

      {/* <OverlayResetButtons
        t={t}
        onResetLanguage={handleResetLanguage}
        onResetHint={handleResetHint}
        onResetStep={handleResetFirstStep}
        onResetSteps={handleResetHomeCitySteps}
      /> */}

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
            onGoAbout={() => goHash("#about")}
            onGoProjects={() => goHash("#projects")}
            onGoContact={() => goHash("#contact")}
          />
        </div>
      </div>
    </header>
  );
}
