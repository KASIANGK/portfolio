// src/Components/Home/Home.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";

import HomeOverlay from "./HomeOverlay/HomeOverlay";
import useOnboarding from "../../hooks/useOnboarding";
import useBoot from "../../hooks/useBoot";
import "./Home.css";

import Contact from "../Contact/Contact";
import About from "../About/About";
// import NavbarScrollHomePage from "./NavbarScrollHomePage/NavbarScrollHomePage";
import ProjectsMasonryMessy from "../Projects/ProjectsMasonryMessy";

/* ---------------------------------------
   Utils
--------------------------------------- */
const raf = () => new Promise((r) => requestAnimationFrame(r));
const rafN = async (n = 2) => {
  for (let i = 0; i < n; i++) await raf();
};
const clamp01 = (v) => Math.max(0, Math.min(1, v));

/* ---------------------------------------
   Scroll lock (iOS/Safari SAFE)
   - Avoid overflow hidden lock (can freeze scroll on mobile)
--------------------------------------- */
let __lockY = 0;

function lockScrollHard() {
  __lockY = window.scrollY || window.pageYOffset || 0;

  // lock root
  document.documentElement.style.overflow = "hidden";

  // lock body in a way Safari understands
  document.body.style.position = "fixed";
  document.body.style.top = `-${__lockY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}

function unlockScrollHard() {
  // unlock root
  document.documentElement.style.overflow = "";

  // unlock body
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";

  // restore scroll
  window.scrollTo(0, __lockY);

  // nice-to-have for iOS momentum
  document.body.style.webkitOverflowScrolling = "touch";
}

/* ---------------------------------------
   waitEventOnce
--------------------------------------- */
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
    setTimeout(finish, timeoutMs);
  });
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
     Desktop / Mobile gating
  --------------------------------------- */
  const [isDesktop, setIsDesktop] = useState(() => {
    try {
      return window.matchMedia("(min-width:1025px)").matches;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    let mq;
    try {
      mq = window.matchMedia("(min-width:1025px)");
    } catch {
      return;
    }

    const onChange = () => setIsDesktop(mq.matches);
    onChange();

    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  /* ---------------------------------------
     Boot data
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
     Overlay step
  --------------------------------------- */
  const [overlayStep, _setOverlayStep] = useState(() =>
    shouldShowLanguageStep ? 1 : 2
  );

  const setOverlayStep = useCallback((next) => {
    _setOverlayStep((prev) => (prev === 2 ? 2 : next));
  }, []);

  /* ---------------------------------------
     Lock scroll in step 1 (SAFE)
  --------------------------------------- */
  useEffect(() => {
    if (overlayStep === 1) {
      lockScrollHard();
      return () => unlockScrollHard();
    }
    // step 2 => ensure unlocked (in case of weird transitions)
    unlockScrollHard();
  }, [overlayStep]);

  /* ---------------------------------------
     Hash scroll (avoid fighting scroll-lock)
  --------------------------------------- */
  const scrollToRef = useCallback((ref) => {
    if (!ref?.current) return;

    requestAnimationFrame(() => {
      // If something left the body fixed (edge case), unlock before scrolling
      if (getComputedStyle(document.body).position === "fixed") {
        unlockScrollHard();
      }

      const y = ref.current.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
  }, []);

  const scrollToSection = useCallback(
    (key) =>
      scrollToRef(
        {
          welcome: headerRef,
          about: aboutRef,
          projects: projectsRef,
          contact: contactRef,
        }[key]
      ),
    [scrollToRef]
  );

  useEffect(() => {
    const key = (location.hash || "").replace("#", "");
    if (!key || overlayStep === 1) return;
    scrollToSection(key);
  }, [location.hash, overlayStep, scrollToSection]);

  /* ---------------------------------------
     Section ready
  --------------------------------------- */
  const [ready, setReady] = useState({
    about: false,
    projects: false,
    contact: false,
  });

  useEffect(() => {
    if (overlayStep !== 2) {
      setReady({ about: false, projects: false, contact: false });
      return;
    }

    let alive = true;

    (async () => {
      await waitEventOnce("ag:aboutReady");
      alive && setReady((s) => ({ ...s, about: true }));

      await waitEventOnce("ag:projectsReady");
      alive && setReady((s) => ({ ...s, projects: true }));

      await waitEventOnce("ag:contactReady");
      alive && setReady((s) => ({ ...s, contact: true }));

      await rafN(2);
      window.dispatchEvent(new Event("ag:homeFirstPaint"));
    })();

    return () => {
      alive = false;
    };
  }, [overlayStep]);

  /* ---------------------------------------
     BG BLEND
     - Desktop: keep your RAF blend behavior
     - <1025px: force BG1 only (blend=0)
  --------------------------------------- */
  useEffect(() => {
    if (overlayStep !== 2) return;

    const root = document.documentElement;

    // ✅ Mobile / Tablet: BG1 only
    if (!isDesktop) {
      root.style.setProperty("--projectsBlend", "0");
      return () => {
        root.style.removeProperty("--projectsBlend");
      };
    }

    // ✅ Desktop: your current behavior (RAF loop)
    const prj = projectsRef.current;
    if (!prj) return;

    let rafId = 0;

    const update = () => {
      const vh = window.innerHeight || 1;
      const r = prj.getBoundingClientRect();

      const start = vh * 0.6;
      const end = vh * -0.6;

      const blend = clamp01((start - r.top) / (start - end));
      root.style.setProperty("--projectsBlend", blend.toFixed(4));

      rafId = requestAnimationFrame(update);
    };

    update();

    return () => {
      cancelAnimationFrame(rafId);
      root.style.removeProperty("--projectsBlend");
    };
  }, [overlayStep, isDesktop]);

  /* ---------------------------------------
     Preload + GPU decode BG images (ONCE)
  --------------------------------------- */
  useEffect(() => {
    const warm = async () => {
      try {
        const imgA = new Image();
        imgA.src = "/assets/about_officee.jpg";
        await imgA.decode?.();

        const imgP = new Image();
        imgP.src = "/assets/projects_officee.jpg";
        await imgP.decode?.();
      } catch {
        // never block
      }
    };

    warm();
  }, []);

  /* ---------------------------------------
     Render
  --------------------------------------- */
  return (
    <div ref={pageRef} className="homePage">
      {/* {overlayStep === 2 && (
        <NavbarScrollHomePage
          enabled
          refs={{
            welcome: headerRef,
            about: aboutRef,
            projects: projectsRef,
            contact: contactRef,
          }}
        />
      )} */}

      {/* Welcome */}
      <div ref={headerRef} id="welcome">
        <HomeOverlay
          onStepChange={setOverlayStep}
          onGoProjects={() => scrollToSection("projects")}
          onGoContact={() => scrollToSection("contact")}
        />
      </div>

      {overlayStep === 2 && <div className="homePage__afterHeader" />}

      {/* ===== BG + SECTIONS ===== */}
      <div className="homeStage" data-enabled={overlayStep === 2 ? "1" : "0"}>
        <div className="bgScene" aria-hidden>
          <img
            className="bgScene__img bgScene__wire"
            src="/assets/about_officee.jpg"
            alt=""
            draggable="false"
          />
          <img
            className="bgScene__img bgScene__tex"
            src="/assets/projects_officee.jpg"
            alt=""
            draggable="false"
          />
        </div>

        <section ref={aboutRef} id="about" className="homeSection">
          <div
            className={`homeSection__card ${
              ready.about ? "isReady" : "isLoading"
            }`}
          >
            <About />
          </div>
        </section>

        <section ref={projectsRef} id="projects" className="homeSection">
          <div
            className={`homeSection__card ${
              ready.projects ? "isReady" : "isLoading"
            }`}
          >
            <ProjectsMasonryMessy />
          </div>
        </section>

        <section ref={contactRef} id="contact" className="homeSection">
          <div
            className={`homeSection__card ${
              ready.contact ? "isReady" : "isLoading"
            }`}
          >
            <Contact
              initialContactInfo={contactInfoData}
              initialSubjects={subjectsData}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
