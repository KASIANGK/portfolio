// src/Components/Home/Home.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";

import HomeOverlay from "./HomeOverlay/HomeOverlay";
import useOnboarding from "../../hooks/useOnboarding";
import useBoot from "../../hooks/useBoot";
import "./Home.css";

import Contact from "../Contact/Contact";
import Essential from "../Essential/Essential";
import About from "../About";

import NavbarScrollHomePage from "./NavbarScrollHomePage/NavbarScrollHomePage";

/* ---------------------------------------
   RAF helpers
--------------------------------------- */
const raf = () => new Promise((r) => requestAnimationFrame(r));
const rafN = async (n = 2) => {
  for (let i = 0; i < n; i++) await raf();
};

function waitEventOnce(name, timeoutMs = 2600) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };

    try {
      window.addEventListener(name, finish, { once: true });
    } catch {}

    window.setTimeout(finish, timeoutMs);
  });
}

/* ---------------------------------------
   Home
--------------------------------------- */
export default function Home() {
  const headerRef = useRef(null); // Welcome (header)
  const aboutRef = useRef(null);
  const projectsRef = useRef(null);
  const contactRef = useRef(null);

  const location = useLocation();
  const { shouldShowLanguageStep } = useOnboarding();
  const boot = useBoot();

  /* ---------------------------------------
     Boot data (stable)
  --------------------------------------- */
  const contactInfoData = useMemo(
    () => boot?.contactInfo ?? { name: "", email: "" },
    [boot?.contactInfo]
  );

  const subjectsData = useMemo(
    () => (Array.isArray(boot?.subjects) ? boot.subjects : []),
    [boot?.subjects]
  );

  const essentialData = useMemo(
    () => (Array.isArray(boot?.essential) ? boot.essential : []),
    [boot?.essential]
  );

  /* ---------------------------------------
     Overlay step (1 = language, 2 = menu)
  --------------------------------------- */
  const [overlayStep, setOverlayStep] = useState(() =>
    shouldShowLanguageStep ? 1 : 2
  );

  /* ---------------------------------------
     HARD GATE: sections do NOT mount
     until boot + step2
  --------------------------------------- */
  const [homeReady, setHomeReady] = useState(() => {
    if (overlayStep !== 2) return true;
    return typeof window !== "undefined" && window.__AG_BOOT_READY__ === true;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (overlayStep !== 2) {
      setHomeReady(true);
      return;
    }

    const settle = () => {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setHomeReady(true))
      );
    };

    if (window.__AG_BOOT_READY__ === true) {
      settle();
      return;
    }

    window.addEventListener("ag:bootReady", settle);
    return () => window.removeEventListener("ag:bootReady", settle);
  }, [overlayStep]);

  /* ---------------------------------------
     Hash scroll (robust)
     - queue if section not mounted yet
  --------------------------------------- */
  const pendingHashRef = useRef(null);

  const scrollToRef = useCallback((ref) => {
    if (!ref?.current) return false;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const y = ref.current.getBoundingClientRect().top + window.scrollY - 60;
        window.scrollTo({ top: y, behavior: "smooth" });
      });
    });

    return true;
  }, []);

  const scrollToSection = useCallback(
    (key) => {
      const map = {
        welcome: headerRef,
        about: aboutRef,
        projects: projectsRef,
        contact: contactRef,
      };
      const ref = map[key];
      return scrollToRef(ref);
    },
    [scrollToRef]
  );

  const scrollToHash = useCallback(
    (hash) => {
      const key = (hash || "").replace("#", "");
      return scrollToSection(key);
    },
    [scrollToSection]
  );

  useEffect(() => {
    const key = (location.hash || "").replace("#", "");
    if (!key) return;

    const ok = scrollToHash(`#${key}`);
    if (!ok) pendingHashRef.current = `#${key}`;
  }, [location.hash, scrollToHash]);

  useEffect(() => {
    if (!homeReady) return;
    if (!pendingHashRef.current) return;

    const h = pendingHashRef.current;
    pendingHashRef.current = null;

    scrollToHash(h);
  }, [homeReady, scrollToHash]);

  /* ---------------------------------------
     GLOBAL STAGE GATE (anti "sautilles")
  --------------------------------------- */
  const [stageVisible, setStageVisible] = useState(false);
  const didStage = useRef(false);

  useEffect(() => {
    if (overlayStep === 2) return;
    didStage.current = false;
    setStageVisible(false);
  }, [overlayStep]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (didStage.current) return;
    if (!(overlayStep === 2 && homeReady)) return;

    didStage.current = true;

    (async () => {
      await Promise.all([
        waitEventOnce("ag:essentialReady", 2800),
        waitEventOnce("ag:contactReady", 2800),
      ]);

      await rafN(2);
      setStageVisible(true);

      // useful for main.jsx splash
      await rafN(2);
      window.dispatchEvent(new Event("ag:homeFirstPaint"));
    })();
  }, [overlayStep, homeReady]);

  /* ---------------------------------------
     goTop (used by navbar)
  --------------------------------------- */
  const goTop = useCallback(() => {
    try {
      window.history.pushState({}, "", "/");
    } catch {}
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /* ---------------------------------------
     Render
  --------------------------------------- */
  return (
    <div className="homePage" data-stage={stageVisible ? "1" : "0"}>
      {/* fixed backplate behind everything */}
      {/* Navbar scroll (only when step2 + ready) */}
      {/* {overlayStep === 2 && homeReady && (
        <NavbarScrollHomePage
          enabled={overlayStep === 2}
          onGo={(key) => scrollToSection(key)}
          onGoTop={goTop}
          refs={{
            welcome: headerRef,
            about: aboutRef,
            projects: projectsRef,
            contact: contactRef,
          }}
        />
      )} */}
      {overlayStep === 2 && homeReady && (
        <NavbarScrollHomePage
          enabled
          refs={{
            welcome: headerRef,
            about: aboutRef,
            projects: projectsRef,
            contact: contactRef,
          }}
        />
      )}

      <div className="homeBackplate" aria-hidden="true" />
      
      {/* Welcome (header 100vh) */}
      <div ref={headerRef}>
        <HomeOverlay
          onStepChange={setOverlayStep}
          onGoProjects={() => scrollToSection("projects")}
          onGoContact={() => scrollToSection("contact")}
        />
      </div>

      {overlayStep === 2 && <div className="homePage__afterHeader" />}

      {overlayStep === 2 && homeReady && (
        <div className="homeStage">
          <section ref={aboutRef} className="homeSection" id="about">
            <div className="homeSection__card isReady">
              <About />
            </div>
          </section>

          <section ref={projectsRef} className="homeSection" id="projects">
            <div className="homeSection__card isReady">
              <Essential initialItems={essentialData} />
            </div>
          </section>

          <section ref={contactRef} className="homeSection" id="contact">
            <div className="homeSection__card isReady">
              <Contact
                initialContactInfo={contactInfoData}
                initialSubjects={subjectsData}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

