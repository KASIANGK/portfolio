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
    if (shouldShowLanguageStep) {
      setSlideIndex(0);
    }
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
  const KB_HINT_KEY = "ag_step1_kb_hint_seen";

  const [showKbHint, setShowKbHint] = useState(() => {
    try { return localStorage.getItem(KB_HINT_KEY) !== "1"; }
    catch { return true; }
  });

  const [kbHintPhase, setKbHintPhase] = useState("hidden"); 
  // "hidden" | "visible" | "hiding"

  useEffect(() => {
    if (slideIndex !== 0) return;

    // recalage au retour step1
    const fallback = i18n.resolvedLanguage || i18n.language || "en";
    const safe = LANGS.includes(fallback) ? fallback : "en";
    const base = selectedLang || safe;
    setLangActiveIndex(Math.max(0, LANGS.indexOf(base)));

    requestAnimationFrame(() => continueBtnRef.current?.focus?.());
  }, [slideIndex, i18n, selectedLang]);

  useEffect(() => {
    if (slideIndex !== 0) return;
  
    if (showKbHint) {
      requestAnimationFrame(() => setKbHintPhase("visible"));
    } else {
      setKbHintPhase("hidden");
    }
  }, [slideIndex, showKbHint]);

  const consumeKbHint = useCallback(() => {
    if (!showKbHint) return;
  
    setKbHintPhase("hiding");
  
    try { localStorage.setItem(KB_HINT_KEY, "1"); } catch {}
  
    window.setTimeout(() => {
      setShowKbHint(false);
      setKbHintPhase("hidden");
    }, 320);
  }, [showKbHint]);
  
  

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

    completeLanguageStep(selectedLang);

    // animated slide to step2
    setSlideIndex(1);

    window.setTimeout(() => {
      const first = document.querySelector(".homeOverlay__menuBtn");
      first?.focus?.();
    }, 420);
  }, [selectedLang, setLanguage, completeLanguageStep, consumeKbHint]);

  // keyboard Step1: arrows select, enter/space continue
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

  const [showScrollHint, setShowScrollHint] = useState(false);
  
  useEffect(() => {
    if (slideIndex !== 1) return;
  
    setShowScrollHint(true);
  
    const t = setTimeout(() => {
      setShowScrollHint(false);
    }, 4000); // 4 secondes
  
    return () => clearTimeout(t);
  }, [slideIndex]);
  
  /* -----------------------
     Reset -> Step1 instant
  ------------------------ */
  const handleResetLanguage = useCallback(() => {
    if (typeof resetLanguageStep === "function") resetLanguageStep();
    goToStep1Instant();
  }, [resetLanguageStep, goToStep1Instant]);

  const handleResetHint = useCallback(() => {
    try { localStorage.removeItem(KB_HINT_KEY); } catch {}
    setShowKbHint(true);
    setKbHintPhase("hidden");
  }, []);

  useEffect(() => {
    // Step1 visible => on suppress le toast global
    document.documentElement.dataset.agOnboarding = slideIndex === 0 ? "1" : "0";
    return () => {
      // clean si jamais HomeOverlay unmount
      document.documentElement.dataset.agOnboarding = "0";
    };
  }, [slideIndex]);
  console.log("intro bundle:", i18n.getResourceBundle(i18n.language, "intro"));


  return (
    <header
      className="homeOverlay"
      data-step={slideIndex === 0 ? "1" : "2"}
      aria-label="Home onboarding header"
    >
      {/* Background layers */}
      {/* Background track (slides like the panels) */}
      <div className="homeOverlay__bgViewport" aria-hidden="true">
        <div
          className={`homeOverlay__bgTrack ${noAnimOnce ? "isInstant" : ""}`}
          style={{ transform: `translateX(-${slideIndex * 100}vw)` }}
        >
          <div className="homeOverlay__bgFrame homeOverlay__bgFrame--step1" />
          <div className="homeOverlay__bgFrame homeOverlay__bgFrame--step2" />
        </div>
      </div>

      <div className="homeOverlay__noise" aria-hidden="true" />
      <div className="homeOverlay__screenFx" aria-hidden="true" />

      {/* Reset button fixed bottom-right */}
      <button type="button" className="homeOverlay__resetBtn" onClick={handleResetLanguage}>
        <span className="homeOverlay__resetIcon" aria-hidden="true">
          ↺
        </span>
        <span className="homeOverlay__resetText">{t("language.reset")}</span>
      </button>
      {/* Reset button fixed bottom-right */}
      <button type="button" className="homeOverlay__resetBtn__Hint" onClick={handleResetHint}>
        <span className="homeOverlay__resetIcon" aria-hidden="true">
          ↺
        </span>
        <span className="homeOverlay__resetText">RESET HINT</span>
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
              <div className="homeOverlay__shine" aria-hidden="true" />

              <div className="homeOverlay__badge">KASIA NAGORKA://CREATIVE_TECH</div>

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

              {slideIndex === 0 && showKbHint && (
                <div
                  className={`homeOverlay__kbdHint ${
                    kbHintPhase === "visible" ? "isVisible" : ""
                  } ${kbHintPhase === "hiding" ? "isHiding" : ""}`}
                  aria-hidden={!showKbHint}
                >
                  <span className="homeOverlay__kbdPill">
                  <p className="homeOverlay__hint">{t("menu.hint")}</p>

                    <span className="homeOverlay__kbdKey">↑</span>
                    <span className="homeOverlay__kbdKey">↓</span>
                    <span className="homeOverlay__kbdKey">←</span>
                    <span className="homeOverlay__kbdKey">→</span>
                    <span>to navigate</span>
                  </span>

                  <span className="homeOverlay__kbdPill">
                    <span className="homeOverlay__kbdKey">Enter</span>
                    <span className="homeOverlay__kbdKey">Space</span>
                    <span>to continue</span>
                  </span>
                </div>
              )}


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
              <div className="homeOverlay__shine" aria-hidden="true" />

              <div className="homeOverlay__badge">HOME://PORTAL</div>

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
            </div>
            
            {/* Scroll hint */}
            <div className={`homeOverlay__scrollHint ${showScrollHint ? "isVisible" : ""}`}>
              <div className="homeOverlay__scrollCircle">
                <span className="homeOverlay__scrollArrow">↓</span>
              </div>
            </div>

          </section>
        </div>
      </div>
    </header>
  );
}

