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
   Utils
--------------------------------------- */
const raf = () => new Promise((r) => requestAnimationFrame(r));
const rafN = async (n = 2) => {
  for (let i = 0; i < n; i++) await raf();
};
const clamp01 = (v) => Math.max(0, Math.min(1, v));

/* ---------------------------------------
   Scroll lock (SAFE MOBILE)
--------------------------------------- */
function lockScrollHard() {
  document.documentElement.style.overflowY = "hidden";
  document.body.style.overflowY = "hidden";
}

function unlockScrollHard() {
  document.documentElement.style.overflowY = "auto";
  document.body.style.overflowY = "auto";
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
    window.addEventListener(name, finish, { once: true });
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
     Detect mobile/tablet
  --------------------------------------- */
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width:1024px)");
    const update = () => setIsSmall(mq.matches);

    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
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
     Scroll lock
  --------------------------------------- */
  useEffect(() => {
    if (overlayStep === 1) {
      lockScrollHard();
      return () => unlockScrollHard();
    }
    unlockScrollHard();
  }, [overlayStep]);

  /* ---------------------------------------
     Hash scroll
  --------------------------------------- */
  const scrollToRef = useCallback((ref) => {
    if (!ref?.current) return;

    requestAnimationFrame(() => {
      const y =
        ref.current.getBoundingClientRect().top +
        window.scrollY -
        90;

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

    return () => (alive = false);
  }, [overlayStep]);

  /* ---------------------------------------
     BG BLEND (🔥 FIX — NO RAF LOOP)
  --------------------------------------- */
  useEffect(() => {
    if (overlayStep !== 2) return;

    const root = document.documentElement;
    const prj = projectsRef.current;
    if (!prj) return;

    let rafId = 0;

    const compute = () => {
      rafId = 0;

      const vh = window.innerHeight || 1;
      const r = prj.getBoundingClientRect();

      const start = vh * 0.6;
      const end = vh * -0.6;

      const blend = clamp01((start - r.top) / (start - end));
      root.style.setProperty("--projectsBlend", blend.toFixed(4));
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(compute);
    };

    compute();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      root.style.removeProperty("--projectsBlend");
    };
  }, [overlayStep]);

  /* ---------------------------------------
     Render
  --------------------------------------- */
  return (
    <div ref={pageRef} className="homePage">

      {/* ✅ DESKTOP ONLY */}
      {overlayStep === 2 && !isSmall && (
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

      {/* Welcome */}
      <div ref={headerRef} id="welcome">
        <HomeOverlay
          onStepChange={setOverlayStep}
          onGoProjects={() => scrollToSection("projects")}
          onGoContact={() => scrollToSection("contact")}
        />
      </div>

      {overlayStep === 2 && <div className="homePage__afterHeader" />}

      <div className="homeStage" data-enabled={overlayStep === 2 ? "1" : "0"}>

        <div className="bgScene" aria-hidden>
          <img className="bgScene__img bgScene__wire" src="/assets/about_officee.jpg" alt="" />
          <img className="bgScene__img bgScene__tex" src="/assets/projects_officee.jpg" alt="" />
        </div>

        <section ref={aboutRef} id="about" className="homeSection">
          <div className={`homeSection__card ${ready.about ? "isReady" : "isLoading"}`}>
            <About />
          </div>
        </section>

        <section ref={projectsRef} id="projects" className="homeSection">
          <div className={`homeSection__card ${ready.projects ? "isReady" : "isLoading"}`}>
            <ProjectsMasonryMessy />
          </div>
        </section>

        <section ref={contactRef} id="contact" className="homeSection">
          <div className={`homeSection__card ${ready.contact ? "isReady" : "isLoading"}`}>
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
