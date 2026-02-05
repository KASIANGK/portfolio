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
const rafN = async (n = 2) => { for (let i = 0; i < n; i++) await raf(); };
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------------------------------------
   Scroll lock (step 1)
--------------------------------------- */
function lockScrollHard() {
  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";
}
function unlockScrollHard() {
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
}

/* ---------------------------------------
   waitEventOnce
--------------------------------------- */
function waitEventOnce(name, timeoutMs = 2600, already = false) {
  if (already) return Promise.resolve({ name, timedOut: false });
  return new Promise((resolve) => {
    let done = false;
    const finish = (timedOut) => {
      if (done) return;
      done = true;
      resolve({ name, timedOut });
    };
    try { window.addEventListener(name, () => finish(false), { once: true }); } catch {}
    setTimeout(() => finish(true), timeoutMs);
  });
}

/* ---------------------------------------
   Home
--------------------------------------- */
export default function Home() {
  const pageRef = useRef(null);
  const headerRef = useRef(null);
  const overlayWrapRef = useRef(null);
  const aboutRef = useRef(null);
  const projectsRef = useRef(null);
  const contactRef = useRef(null);

  const location = useLocation();
  const { shouldShowLanguageStep } = useOnboarding();
  const boot = useBoot();

  /* Boot data */
  const contactInfoData = useMemo(
    () => boot?.contactInfo ?? { name: "", email: "" },
    [boot?.contactInfo]
  );
  const subjectsData = useMemo(
    () => (Array.isArray(boot?.subjects) ? boot.subjects : []),
    [boot?.subjects]
  );

  /* Overlay step */
  const [overlayStep, _setOverlayStep] = useState(() =>
    shouldShowLanguageStep ? 1 : 2
  );
  const setOverlayStep = useCallback((next) => {
    _setOverlayStep((prev) => (prev === 2 ? 2 : next));
  }, []);

  /* Lock scroll in step 1 */
  useEffect(() => {
    if (overlayStep === 1) {
      lockScrollHard();
      return () => unlockScrollHard();
    }
    unlockScrollHard();
  }, [overlayStep]);

  /* Hash scroll */
  const scrollToRef = useCallback((ref) => {
    if (!ref?.current) return false;
    requestAnimationFrame(() => {
      const y = ref.current.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
    return true;
  }, []);

  const scrollToSection = useCallback(
    (key) =>
      scrollToRef(
        { welcome: headerRef, about: aboutRef, projects: projectsRef, contact: contactRef }[key]
      ),
    [scrollToRef]
  );

  useEffect(() => {
    const key = (location.hash || "").replace("#", "");
    if (!key || overlayStep === 1) return;
    scrollToSection(key);
  }, [location.hash, overlayStep, scrollToSection]);

  /* Section ready */
  const [ready, setReady] = useState({ about: false, projects: false, contact: false });

  useEffect(() => {
    if (overlayStep !== 2) setReady({ about: false, projects: false, contact: false });
  }, [overlayStep]);

  useEffect(() => {
    if (overlayStep !== 2) return;
    let alive = true;
    (async () => {
      await waitEventOnce("ag:aboutReady", 2800);
      alive && setReady((s) => ({ ...s, about: true }));
      await waitEventOnce("ag:projectsReady", 2800);
      alive && setReady((s) => ({ ...s, projects: true }));
      await waitEventOnce("ag:contactReady", 2800);
      alive && setReady((s) => ({ ...s, contact: true }));
      await rafN(2);
      window.dispatchEvent(new Event("ag:homeFirstPaint"));
    })();
    return () => { alive = false; };
  }, [overlayStep]);

  /* Preload BG images */
  useEffect(() => {
    new Image().src = "/assets/about_officee.jpg";
    new Image().src = "/assets/projects_officee.jpg";
  }, []);

  /* ---------------------------------------
     BG SMOOTH SCROLL (LERP)
  --------------------------------------- */
  const releasedRef = useRef(false);
  const releaseYRef = useRef(0);
  const bgMaxTravelRef = useRef(0);

  useEffect(() => {
    if (overlayStep !== 2) return;

    const root = document.documentElement;
    const prj = projectsRef.current;
    const ov = overlayWrapRef.current;
    if (!prj || !ov) return;

    let imgRatio = 2048 / 1332;
    let smoothY = window.scrollY;
    let targetY = window.scrollY;
    let rafId = 0;

    const img = new Image();
    img.onload = () => {
      imgRatio = img.naturalHeight / img.naturalWidth;
      computeBg();
    };
    img.src = "/assets/about_officee.jpg";

    const computeBg = () => {
      const vw = window.innerWidth || 1;
      const vh = window.innerHeight || 1;
      const bgH = Math.round(vw * imgRatio);
      root.style.setProperty("--bgSceneH", `${bgH}px`);
      bgMaxTravelRef.current = Math.max(0, bgH - vh);
    };

    const update = () => {
      smoothY += (targetY - smoothY) * 0.08;
      if (Math.abs(targetY - smoothY) < 0.1) smoothY = targetY;

      let travel = 0;
      if (releasedRef.current) {
        travel = smoothY - releaseYRef.current;
        travel = clamp(travel, 0, bgMaxTravelRef.current);
      }
      root.style.setProperty("--bgTravel", travel.toFixed(2));

      const vh = window.innerHeight || 1;
      const r = prj.getBoundingClientRect();
      const blend = clamp01((vh * 0.55 - r.top) / (vh * 1.4));
      root.style.setProperty("--projectsBlend", blend.toFixed(4));

      rafId = requestAnimationFrame(update);
    };

    const onScroll = () => { targetY = window.scrollY; };

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting && !releasedRef.current) {
          releasedRef.current = true;
          releaseYRef.current = targetY;
        }
        if (e.isIntersecting && targetY < 4) {
          releasedRef.current = false;
          releaseYRef.current = 0;
        }
      },
      { threshold: 0.01 }
    );
    io.observe(ov);

    computeBg();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", computeBg);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", computeBg);
      cancelAnimationFrame(rafId);
      root.style.removeProperty("--bgSceneH");
      root.style.removeProperty("--bgTravel");
      root.style.removeProperty("--projectsBlend");
    };
  }, [overlayStep]);

  /* ---------------------------------------
     Render
  --------------------------------------- */
  return (
    <div ref={pageRef} className="homePage">
      {overlayStep === 2 && (
        <NavbarScrollHomePage
          enabled
          refs={{ welcome: headerRef, about: aboutRef, projects: projectsRef, contact: contactRef }}
        />
      )}

      <div className="bgScene" aria-hidden>
        <img className="bgScene__img bgScene__wire" src="/assets/about_officee.jpg" alt="" />
        <img className="bgScene__img bgScene__tex" src="/assets/projects_officee.jpg" alt="" />
      </div>

      <div ref={headerRef} id="welcome">
        <div ref={overlayWrapRef}>
          <HomeOverlay
            onStepChange={setOverlayStep}
            onGoProjects={() => scrollToSection("projects")}
            onGoContact={() => scrollToSection("contact")}
          />
        </div>
      </div>

      {overlayStep === 2 && <div className="homePage__afterHeader" />}

      <div className="homeStage" data-enabled={overlayStep === 2 ? "1" : "0"}>
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
            <Contact initialContactInfo={contactInfoData} initialSubjects={subjectsData} />
          </div>
        </section>
      </div>
    </div>
  );
}
