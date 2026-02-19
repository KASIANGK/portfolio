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
      logScrollState("after lock");
      return () => {
        unlockScrollHard({ restore: true });
        logScrollState("after unlock cleanup");
      };
    }
    unlockScrollHard({ restore: true });
    logScrollState("after unlock step2");
  }, [overlayStep]);

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
  // useEffect(() => {
  //   const onReady = async () => {
  //     const hash = window.location.hash.replace("#", "");

  //     // always re-unlock right before trying to scroll
  //     unlockScrollHard({ restore: true });
  //     logScrollState("before hash scroll");

  //     if (!hash) return;

  //     // wait layout settle
  //     await rafN(3);

  //     const el = document.getElementById(hash);

  //     if (!el) return;

  //     const scroller = document.scrollingElement || document.documentElement;

  //     // compute y relative to scroller
  //     const y = el.getBoundingClientRect().top + window.scrollY - 90;

  //     // scroll using the actual scroller
  //     scroller.scrollTo({ top: y, behavior: "smooth" });

  //     await rafN(2);
  //     logScrollState("after hash scroll");
  //   };

  //   window.addEventListener("ag:homeFirstPaint", onReady);
  //   return () => window.removeEventListener("ag:homeFirstPaint", onReady);
  // }, [location.key]);
  // useEffect(() => {
  //   const onReady = async () => {
  //     const hash = window.location.hash.replace("#", "");
  //     const pending = sessionStorage.getItem("ag_pending_scroll");
  //     const targetId = hash || pending;
  
  //     // 🔸 rien à scroller
  //     if (!targetId) return;
  
  //     // ✅ toujours re-unlock juste avant de scroller
  //     unlockScrollHard({ restore: true });
  //     logScrollState("before target scroll");
  
  //     // ✅ attendre que le layout soit stable
  //     await rafN(3);
  
  //     const el = document.getElementById(targetId);
  //     if (!el) return;
  
  //     const scroller = document.scrollingElement || document.documentElement;
  
  //     // y relative à la page (avec offset header)
  //     const y = el.getBoundingClientRect().top + window.scrollY - 90;
  
  //     scroller.scrollTo({ top: y, behavior: "smooth" });
  
  //     // ✅ si on a consommé le pending, on le purge
  //     if (pending && !hash) {
  //       sessionStorage.removeItem("ag_pending_scroll");
  //       sessionStorage.removeItem("ag_pending_scroll_at");
  //     }
  
  //     await rafN(2);
  //     logScrollState("after target scroll");
  //   };
  
  //   window.addEventListener("ag:homeFirstPaint", onReady);
  //   return () => window.removeEventListener("ag:homeFirstPaint", onReady);
  // }, [location.key]);
  
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
  //   const target = sessionStorage.getItem("ag_pending_scroll");
  //   if (!target) return;
  
  //   // petit délai → attendre layout + fonts + sections
  //   requestAnimationFrame(() => {
  //     requestAnimationFrame(() => {
  //       const el = document.getElementById(target);
  //       if (el) {
  //         el.scrollIntoView({
  //           behavior: "smooth",
  //           block: "start",
  //         });
  //       }
  //       sessionStorage.removeItem("ag_pending_scroll");
  //       sessionStorage.removeItem("ag_pending_scroll_at");
  //     });
  //   });
  // }, []);

  // useEffect(() => {
  //   if (overlayStep !== 2) return;
  
  //   const target = sessionStorage.getItem("ag_pending_scroll");
  //   if (!target) return;
  
  //   // ✅ re-unlock juste avant de scroller (au cas où)
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
  
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(target);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
  
        sessionStorage.removeItem("ag_pending_scroll");
        sessionStorage.removeItem("ag_pending_scroll_at");
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

