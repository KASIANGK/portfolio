// src/Components/Home/Home.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";

import HomeOverlay from "./HomeOverlay/HomeOverlay";
import useOnboarding from "../../hooks/useOnboarding";
import useBoot from "../../hooks/useBoot";
import "./Home.css";

import Contact from "../Contact/Contact";
import About from "../About/About";
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
   Scroll lock SAFE (fixed body)
--------------------------------------- */
let __lockY = 0;

function lockScrollHard() {
  __lockY = window.scrollY || window.pageYOffset || 0;

  document.documentElement.style.overflow = "hidden";

  document.body.style.position = "fixed";
  document.body.style.top = `-${__lockY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}

/**
 * HARD unlock:
 * - clears ALL inline lock styles
 * - restores scroll position from body.top (or __lockY)
 * - targets scrollingElement
 */
function unlockScrollHard({ restore = true } = {}) {
  const bodyTop = document.body.style.top || "";
  const topNum = Number.parseInt(bodyTop.replace("px", ""), 10);
  const restoreY = Number.isFinite(topNum) ? Math.abs(topNum) : (__lockY || 0);

  // clear locks
  document.documentElement.style.overflow = "";
  document.documentElement.style.height = "";
  document.documentElement.style.position = "";

  document.body.style.overflow = "";
  document.body.style.height = "";
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  document.body.style.touchAction = "";

  // restore scroll (IMPORTANT)
  if (restore) {
    const scroller = document.scrollingElement || document.documentElement;
    // force a sync reflow before scrolling
    // eslint-disable-next-line no-unused-expressions
    scroller.offsetHeight;
    window.scrollTo(0, restoreY);
  }

  document.body.style.webkitOverflowScrolling = "touch";
}
function getScroller() {
  return document.scrollingElement || document.documentElement;
}

function scrollToIdWithOffset(id, { behavior = "smooth", offset = 72 } = {}) {
  const el = document.getElementById(id);
  if (!el) return false;

  const scroller = getScroller();
  const rect = el.getBoundingClientRect();

  // position absolue dans le document
  const y = (window.scrollY || scroller.scrollTop || 0) + rect.top - offset;

  // clamp
  const maxY = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
  const targetY = Math.max(0, Math.min(y, maxY));

  window.scrollTo({ top: targetY, behavior });
  return true;
}

// utile si tu veux une heuristique d’offset (navbar height)
function computeTopOffset() {
  // adapte si tu as une navbar fixed avec une hauteur connue
  const nav = document.querySelector(".navHUD");
  const h = nav?.getBoundingClientRect?.().height;
  return Number.isFinite(h) && h > 20 ? Math.round(h + 12) : 72;
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
   Debug helpers
--------------------------------------- */
function logScrollState(tag) {
  const html = document.documentElement;
  const body = document.body;
  const scroller = document.scrollingElement || html;

  const s = {
    tag,
    hash: window.location.hash,
    htmlOverflow: getComputedStyle(html).overflow,
    bodyOverflow: getComputedStyle(body).overflow,
    bodyPos: getComputedStyle(body).position,
    bodyTopInline: body.style.top || "",
    scrollY: window.scrollY,
    scrollerTag: scroller === document.documentElement ? "documentElement" : "scrollingElement",
    scrollTop: scroller.scrollTop,
    clientH: scroller.clientHeight,
    scrollH: scroller.scrollHeight,
  };

  // console.log("%c[HOME][SCROLL_STATE]", "color:#7df", s);

  // if (s.htmlOverflow === "hidden" || s.bodyPos === "fixed") {
  //   console.warn("[HOME] ⚠️ Scroll still locked (overflow hidden or body fixed).");
  // }
  // if (s.scrollH <= s.clientH + 5) {
  //   console.warn("[HOME] ⚠️ No scrollable height (scrollHeight ~= clientHeight). CSS/layout issue.");
  // }
}

/* ---------------------------------------
   Home
--------------------------------------- */
export default function Home() {
  const headerRef = useRef(null);
  const aboutRef = useRef(null);
  const projectsRef = useRef(null);
  const contactRef = useRef(null);

  const location = useLocation();
  const { shouldShowLanguageStep } = useOnboarding();
  // const forceStep2 = useMemo(() => {
  //   try {
  //     return (
  //       location.state?.goHomeStep === 2 ||
  //       sessionStorage.getItem("ag_home_step_once") === "2"
  //     );
  //   } catch {
  //     return location.state?.goHomeStep === 2;
  //   }
  // }, [location.state]);
  const forceStep2 = useMemo(() => {
    try {
      return (
        location.state?.goHomeStep === 2 ||
        !!location.state?.__scrollIntent || // ✅ IMPORTANT: même logique que navbar
        sessionStorage.getItem("ag_home_step_once") === "2"
      );
    } catch {
      return location.state?.goHomeStep === 2 || !!location.state?.__scrollIntent;
    }
  }, [location.state]);
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
  // const [overlayStep, _setOverlayStep] = useState(() =>
  //   shouldShowLanguageStep ? 1 : 2
  // );
  const [overlayStep, _setOverlayStep] = useState(() => {
    if (forceStep2) return 2;
    return shouldShowLanguageStep ? 1 : 2;
  });
  
  const setOverlayStep = useCallback((next) => {
    _setOverlayStep((prev) => (prev === 2 ? 2 : next));
  }, []);

  /* ---------------------------------------
     Lock scroll in step 1 (SAFE)
  --------------------------------------- */
  useEffect(() => {
    if (overlayStep === 1) {
      lockScrollHard();
      logScrollState("after lock");
      return () => {
        unlockScrollHard({ restore: true });
        logScrollState("after unlock cleanup");
      };
    }
    unlockScrollHard({ restore: true });
    logScrollState("after unlock step2");
  }, [overlayStep]);

  useEffect(() => {
    if (!forceStep2) return;
  
    // ✅ force step2 même si on arrive avec state après le mount
    _setOverlayStep(2);
  
    // ✅ consume pour ne pas bypass le language step plus tard
    try {
      sessionStorage.removeItem("ag_home_step_once");
    } catch {}
  }, [forceStep2]);
  
  /* ---------------------------------------
     READY events
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
     ✅ Hash scroll AFTER homeFirstPaint
     - uses document.scrollingElement
     - hard-unlocks again right before scroll
  --------------------------------------- */
  
  /* ---------------------------------------
     BG BLEND (unchanged)
  --------------------------------------- */
  useEffect(() => {
    if (overlayStep !== 2) return;

    const root = document.documentElement;

    if (!isDesktop) {
      root.style.setProperty("--projectsBlend", "0");
      return () => root.style.removeProperty("--projectsBlend");
    }

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
     Preload bg (unchanged)
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
      } catch {}
    };
    warm();
  }, []);



  // useEffect(() => {
  //   // ✅ si on arrive avec un pending scroll, on doit être en step2 (sinon body lock casse le scroll)
  //   if (overlayStep === 2) return;
  
  //   const pending = sessionStorage.getItem("ag_pending_scroll");
  //   if (!pending) return;
  
  //   _setOverlayStep(2);
  // }, [overlayStep]);
  
  // useEffect(() => {
  //   if (overlayStep !== 2) return;
  
  //   const target = sessionStorage.getItem("ag_pending_scroll");
  //   if (!target) return;
  
  //   unlockScrollHard({ restore: true });
  
  //   requestAnimationFrame(() => {
  //     requestAnimationFrame(() => {
  //       const el = document.getElementById(target);
  //       if (el) {
  //         el.scrollIntoView({ behavior: "smooth", block: "start" });
  //       }
  
  //       sessionStorage.removeItem("ag_pending_scroll");
  //       sessionStorage.removeItem("ag_pending_scroll_at");
  //     });
  //   });
  // }, [location.key, overlayStep]);
  

  useEffect(() => {
    if (overlayStep !== 2) return;
  
    const target = sessionStorage.getItem("ag_pending_scroll");
    if (!target) return;
  
    unlockScrollHard({ restore: true });
  
    const tryScroll = () => {
      const el = document.getElementById(target);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        sessionStorage.removeItem("ag_pending_scroll");
        sessionStorage.removeItem("ag_pending_scroll_at");
        return true;
      }
      return false;
    };
  
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (tryScroll()) return;
  
        // ✅ fallback: 6 essais max (~100ms) au cas où les sections montent un poil après
        let n = 0;
        const iv = setInterval(() => {
          n++;
          if (tryScroll() || n >= 6) clearInterval(iv);
        }, 16);
      });
    });
  }, [location.key, overlayStep]);
  /* ---------------------------------------
     Render (unchanged)
  --------------------------------------- */
  return (
    <div className="homePage">
      <div ref={headerRef} id="welcome">
        <HomeOverlay
          onStepChange={setOverlayStep}
          onGoProjects={() => {
            const el = document.getElementById("projects");
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          onGoContact={() => {
            const el = document.getElementById("contact");
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
      </div>

      {overlayStep === 2 && <div className="homePage__afterHeader" />}

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

