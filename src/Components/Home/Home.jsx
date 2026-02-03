// src/Components/Home/Home.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";

import HomeOverlay from "./HomeOverlay/HomeOverlay";
import useOnboarding from "../../hooks/useOnboarding";
import useBoot from "../../hooks/useBoot";
import "./Home.css";

import Contact from "../Contact/Contact";
import About from "../About/About";
import NavbarScrollHomePage from "./NavbarScrollHomePage/NavbarScrollHomePage";
import ProjectsMasonryMessy from "../Projects/ProjectsMasonryMessy";

/* ---------------------------------------
   RAF helpers
--------------------------------------- */
const raf = () => new Promise((r) => requestAnimationFrame(r));
const rafN = async (n = 2) => {
  for (let i = 0; i < n; i++) await raf();
};

function waitEventOnce(name, timeoutMs = 2600, already = false) {
  if (already) return Promise.resolve({ name, timedOut: false, ms: 0 });

  return new Promise((resolve) => {
    const t0 = performance.now();
    let done = false;

    const finish = (timedOut) => {
      if (done) return;
      done = true;
      resolve({ name, timedOut, ms: Math.round(performance.now() - t0) });
    };

    try {
      window.addEventListener(name, () => finish(false), { once: true });
    } catch {}

    window.setTimeout(() => finish(true), timeoutMs);
  });
}

/* ---------------------------------------
   Hard lock (belt & suspenders)
--------------------------------------- */
function lockScrollHard() {
  document.body.style.overflow = "hidden";
  document.body.style.overscrollBehaviorY = "none";
  document.documentElement.style.overflow = "hidden";
}
function unlockScrollHard() {
  document.body.style.overflow = "";
  document.body.style.overscrollBehaviorY = "";
  document.documentElement.style.overflow = "";
}

/* ---------------------------------------
   Home
--------------------------------------- */
export default function Home() {
  const pageRef = useRef(null);

  const headerRef = useRef(null);
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

  /* ---------------------------------------
     Overlay step (1 = language, 2 = menu)
  --------------------------------------- */
  const [overlayStep, _setOverlayStep] = useState(() =>
    shouldShowLanguageStep ? 1 : 2
  );

  // once we are at step2, never go back to step1 (prevents remount cascades)
  const setOverlayStep = useCallback((next) => {
    _setOverlayStep((prev) => {
      if (prev === 2) return 2;
      return next;
    });
  }, []);

  /* ---------------------------------------
     No-scroll in step1 (extra safety)
  --------------------------------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (overlayStep === 1) {
      lockScrollHard();
      return () => unlockScrollHard();
    }
    unlockScrollHard();
    return undefined;
  }, [overlayStep]);

  /* ---------------------------------------
     Local "scrolling mode" (NO html class toggle => no flash)
     - We toggle only on .homePage via data attribute
  --------------------------------------- */
  // useEffect(() => {
  //   if (typeof window === "undefined") return;

  //   const el = pageRef.current;
  //   if (!el) return;

  //   let t = 0;
  //   let isOn = false;

  //   const set = (on) => {
  //     if (isOn === on) return;
  //     isOn = on;
  //     el.dataset.scrolling = on ? "1" : "0";
  //   };

  //   const onScroll = () => {
  //     if (!isOn) set(true);
  //     window.clearTimeout(t);
  //     t = window.setTimeout(() => set(false), 180);
  //   };

  //   window.addEventListener("scroll", onScroll, { passive: true });

  //   // optional: better end signal if available
  //   const onScrollEnd = () => set(false);
  //   try {
  //     window.addEventListener("scrollend", onScrollEnd, { passive: true });
  //   } catch {}

  //   return () => {
  //     window.removeEventListener("scroll", onScroll);
  //     try {
  //       window.removeEventListener("scrollend", onScrollEnd);
  //     } catch {}
  //     window.clearTimeout(t);
  //     set(false);
  //   };
  // }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
  
    let armed = false;
  
    const onScroll = () => {
      if (armed) return;
      armed = true;
      document.documentElement.dataset.agScrolling = "1";
      window.removeEventListener("scroll", onScroll);
    };
  
    window.addEventListener("scroll", onScroll, { passive: true });
  
    return () => {
      window.removeEventListener("scroll", onScroll);
      delete document.documentElement.dataset.agScrolling;
    };
  }, []);
  
  /* ---------------------------------------
     Hash scroll (robust)
  --------------------------------------- */
  const scrollToRef = useCallback((ref) => {
    if (!ref?.current) return false;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const y = ref.current.getBoundingClientRect().top + window.scrollY - 90;
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
      return scrollToRef(map[key]);
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
    if (overlayStep === 1) return; // avoid showing behind overlay
    scrollToHash(`#${key}`);
  }, [location.hash, scrollToHash, overlayStep]);

  /* ---------------------------------------
     Section-ready reveal (no "block")
  --------------------------------------- */
  const [ready, setReady] = useState(() => ({
    about: false,
    projects: false,
    contact: false,
  }));

  // reset when returning to step1
  useEffect(() => {
    if (overlayStep !== 2) {
      setReady({ about: false, projects: false, contact: false });
    }
  }, [overlayStep]);

  // wait events independently, then reveal each section as soon as it's ready
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (overlayStep !== 2) return;

    let alive = true;

    (async () => {
      const a = await waitEventOnce(
        "ag:aboutReady",
        2800,
        window.__AG_ABOUT_READY__ === true
      );
      if (!alive) return;
      setReady((s) => ({ ...s, about: true }));

      const p = await waitEventOnce(
        "ag:projectsReady",
        2800,
        window.__AG_PRJ_READY__ === true
      );
      if (!alive) return;
      setReady((s) => ({ ...s, projects: true }));

      const c = await waitEventOnce(
        "ag:contactReady",
        2800,
        window.__AG_CTC_READY__ === true
      );
      if (!alive) return;
      setReady((s) => ({ ...s, contact: true }));

      await rafN(2);
      window.dispatchEvent(new Event("ag:homeFirstPaint"));

      const timedOut = [a, p, c].filter((r) => r.timedOut);
      if (timedOut.length) console.warn("[Home] section signal timeout(s):", timedOut);
    })();

    return () => {
      alive = false;
    };
  }, [overlayStep]);

  /* ---------------------------------------
     Render
  --------------------------------------- */
  return (
    <div ref={pageRef} className="homePage" data-scrolling="0">
      {/* Navbar scroll (only when step2) */}
      {overlayStep === 2 && (
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

      {/* fixed backplate behind everything */}
      <div className="homeBackplate" aria-hidden="true" />

      {/* Welcome (header) */}
      <div ref={headerRef} id="welcome">
        <HomeOverlay
          onStepChange={setOverlayStep}
          onGoProjects={() => scrollToSection("projects")}
          onGoContact={() => scrollToSection("contact")}
        />
      </div>

      {/* spacer under overlay (step2 only) */}
      {overlayStep === 2 && <div className="homePage__afterHeader" />}

      {/* ALWAYS MOUNT sections to avoid "vide" */}
      <div className="homeStage" data-enabled={overlayStep === 2 ? "1" : "0"}>
        <section ref={aboutRef} className="homeSection" id="about" data-s="about">
          <div className={`homeSection__card ${ready.about ? "isReady" : "isLoading"}`}>
            <About />
          </div>
        </section>

        <section ref={projectsRef} className="homeSection" id="projects" data-s="projects">
          <div className={`homeSection__card ${ready.projects ? "isReady" : "isLoading"}`}>
            <ProjectsMasonryMessy />
          </div>
        </section>

        <section ref={contactRef} className="homeSection" id="contact" data-s="contact">
          <div className={`homeSection__card ${ready.contact ? "isReady" : "isLoading"}`}>
            <Contact initialContactInfo={contactInfoData} initialSubjects={subjectsData} />
          </div>
        </section>
      </div>
    </div>
  );
}
