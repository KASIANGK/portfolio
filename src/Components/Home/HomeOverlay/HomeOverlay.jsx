// src/Components/Home/HomeOverlay/HomeOverlay.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useOnboarding from "../../../hooks/useOnboarding";
import "./parts/styles/Base.css";
import "./parts/styles/Background.css";
import "./parts/styles/Reset.css";
import "./parts/styles/Panel.css";
import "./parts/styles/Buttons.css";
import "./parts/styles/StepSecondMenu.css";
import "./parts/styles/PreviewOrgans.css";
import "./parts/styles/ScrollHint.css";
import "./parts/styles/Carousel.css";
import "./parts/styles/Typography.css";


import { LANGS, MENU } from "./constants";
import OverlayBackground from "./parts/OverlayBackground";
import OverlayResetButtons from "./parts/OverlayResetButtons";
import StepLanguage from "./parts/StepLanguage";
import StepMenu from "./parts/StepMenu";
// import ScrollHint from "./parts/ScrollHint";

export default function HomeOverlay({ onGoAbout, onGoProjects, onGoContact }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("intro");

  const {
    language,
    shouldShowLanguageStep,
    setLanguage,
    completeLanguageStep,
    resetLanguageStep,
  } = useOnboarding();

  const FIRST_VISIT_KEY = "ag_home_first_visit_done_v1";

  const firstVisit = (() => {
    try { return localStorage.getItem(FIRST_VISIT_KEY) !== "1"; }
    catch { return true; }
  })();
  
  const [slideIndex, setSlideIndex] = useState(() => {
    if (firstVisit) return 0;
    return shouldShowLanguageStep ? 0 : 1;
  });
  
  
  useEffect(() => {
    if (shouldShowLanguageStep) setSlideIndex(0);
  }, [shouldShowLanguageStep]);

  useEffect(() => {
    i18n.loadNamespaces(["intro"]);
    i18n.loadLanguages(LANGS);
  }, [i18n]);

  // Step1 scroll lock
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

  // Instant switch (no anim once)
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

  // Step1 language
  const detected = i18n.resolvedLanguage || i18n.language || "en";
  const safeDetected = LANGS.includes(detected) ? detected : "en";

  const initialLang = (() => {
    if (language && LANGS.includes(language)) return language;
    return safeDetected;
  })();

  const [langActiveIndex, setLangActiveIndex] = useState(() =>
    Math.max(0, LANGS.indexOf(initialLang))
  );

  // ✅ Sync Step1 selector when language changes from outside (Navbar, etc.)
  useEffect(() => {
    if (slideIndex !== 0) return; // only while in Step1

    const lng = (i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);
    const safe = LANGS.includes(lng) ? lng : "en";

    // Avoid useless re-renders
    setSelectedLang((prev) => (prev === safe ? prev : safe));
    setLangActiveIndex((prev) => {
      const next = Math.max(0, LANGS.indexOf(safe));
      return prev === next ? prev : next;
    });
  }, [i18n.resolvedLanguage, i18n.language, slideIndex]);


  const [selectedLang, setSelectedLang] = useState(initialLang);
  const [isSwitchingLang, setIsSwitchingLang] = useState(false);

  const KB_HINT_KEY = "ag_step1_kb_hint_seen_v2";
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

    const fallback = i18n.resolvedLanguage || i18n.language || "en";
    const safe = LANGS.includes(fallback) ? fallback : "en";
    const base = selectedLang || safe;
    setLangActiveIndex(Math.max(0, LANGS.indexOf(base)));

    requestAnimationFrame(() => continueBtnRef.current?.focus?.());
  }, [slideIndex, i18n, selectedLang]);

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

  // keyboard Step1
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

  // Step2 menu
  const [menuActiveIndex, setMenuActiveIndex] = useState(0);

  // const runMenuAction = useCallback(
  //   (item) => {
  //     if (!item) return;

  //     if (item.key === "explore") return navigate(item.to);
  //     if (item.key === "about") return onGoAbout?.();
  //     if (item.key === "projects") return onGoProjects?.();
  //     if (item.key === "contact") return onGoContact?.();
  //   },
  //   [navigate, onGoAbout, onGoProjects, onGoContact]
  // );
  const runMenuAction = useCallback(
    (item) => {
      if (!item) return;
  
      // if (item.key === "explore") {
      //   return navigate(item.to, { state: { autoEnterCity: true } }); // ✅
      // }
      if (item.key === "explore") {
        return navigate("/city", { state: { autoEnterCity: true } });
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

  const handleResetLanguage = useCallback(async () => {
    if (typeof resetLanguageStep === "function") resetLanguageStep();
  
    // Option: remettre la langue auto (ou 'en')
    const fallback = i18n.resolvedLanguage || i18n.language || "en";
    const safe = LANGS.includes(fallback) ? fallback : "en";
  
    setSelectedLang(safe);
    setLangActiveIndex(Math.max(0, LANGS.indexOf(safe)));
  
    // Très important: appliquer la langue réellement
    try {
      await setLanguage(safe);          // ton hook
      await i18n.changeLanguage(safe);  // i18next (au cas où)
    } catch {}
  
    // Reset "first visit" si tu veux vraiment refaire le flow complet
    try {
      localStorage.removeItem(FIRST_VISIT_KEY);
    } catch {}
  
    goToStep1Instant();
  }, [
    resetLanguageStep,
    i18n,
    setLanguage,
    goToStep1Instant,
    setSelectedLang,
    setLangActiveIndex,
  ]);
  

  const handleResetHint = useCallback(() => {
    try {
      localStorage.removeItem(KB_HINT_KEY);
    } catch {}
    setShowKbHint(true);
    setKbHintPhase("hidden");
  }, []);

  const handleResetFirstStep = () => {
    try { localStorage.removeItem(FIRST_VISIT_KEY); } catch {}
    setSlideIndex(0);
  };
  

  // global flag
  useEffect(() => {
    document.documentElement.dataset.agOnboarding = slideIndex === 0 ? "1" : "0";
    return () => {
      document.documentElement.dataset.agOnboarding = "0";
    };
  }, [slideIndex]);

  return (
    <header className="homeOverlay" data-step={slideIndex === 0 ? "1" : "2"} aria-label="Home onboarding header">
      <OverlayBackground slideIndex={slideIndex} noAnimOnce={noAnimOnce} />

      <OverlayResetButtons t={t} onResetLanguage={handleResetLanguage} onResetHint={handleResetHint} onResetStep={handleResetFirstStep} />

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
          />
        </div>
      </div>

      {/* <ScrollHint visible={showScrollHint && slideIndex === 1} /> */}
    </header>
  );
}
