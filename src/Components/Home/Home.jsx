// src/Components/Home/Home.jsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useLocation } from "react-router-dom";

import HomeOverlay from "./HomeOverlay/HomeOverlay";
import useOnboarding from "../../hooks/useOnboarding";
import useBoot from "../../hooks/useBoot";
import "./Home.css";

import Contact from "../Contact/Contact";
import Essential from "../Essential/Essential";

/* ---------------------------------------
   Small helpers
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
     Overlay step
  --------------------------------------- */
  const [overlayStep, setOverlayStep] = useState(() =>
    shouldShowLanguageStep ? 1 : 2
  );

  /* ---------------------------------------
     Back-to-top
  --------------------------------------- */
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---------------------------------------
     HARD GATE: DOM not mounted
     until boot + overlay OK
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
     GLOBAL STAGE GATE
     (hide layout construction)
  --------------------------------------- */
  const [stageVisible, setStageVisible] = useState(false);
  const didStage = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (didStage.current) return;
    if (!(overlayStep === 2 && homeReady)) return;

    didStage.current = true;

    (async () => {
      // wait Essential + Contact OR timeout
      await Promise.all([
        waitEventOnce("ag:essentialReady"),
        waitEventOnce("ag:contactReady"),
      ]);

      // let layout / blur / fonts settle
      await rafN(2);

      setStageVisible(true);

      // signal for main.jsx (splash)
      await rafN(2);
      window.dispatchEvent(new Event("ag:homeFirstPaint"));
    })();
  }, [overlayStep, homeReady]);

  /* ---------------------------------------
     Navigation helpers
  --------------------------------------- */
  const scrollTo = useCallback((ref) => {
    if (!ref?.current) return;
    const y = ref.current.getBoundingClientRect().top + window.scrollY - 50;
    window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  const goTop = useCallback(() => {
    window.history.pushState({}, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /* ---------------------------------------
     Hash navigation
  --------------------------------------- */
  useEffect(() => {
    const hash = (location.hash || "").replace("#", "");
    if (!hash) return;

    const map = { projects: projectsRef, contact: contactRef };
    const ref = map[hash];
    if (!ref?.current) return;

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const y =
          ref.current.getBoundingClientRect().top + window.scrollY - 50;
        window.scrollTo({ top: y, behavior: "smooth" });
      })
    );
  }, [location.hash]);

  /* ---------------------------------------
     Render
  --------------------------------------- */
  return (
    <div
      className="homePage"
      data-stage={stageVisible ? "1" : "0"}
    >
      <HomeOverlay
        onStepChange={setOverlayStep}
        onGoProjects={() => scrollTo(projectsRef)}
        onGoContact={() => scrollTo(contactRef)}
      />

      {overlayStep === 2 && <div className="homePage__afterHeader" />}

      {/* DOM exists but is invisible until stageVisible */}
      {overlayStep === 2 && homeReady && (
        <div className="homeStage">
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

      {overlayStep === 2 && (
        <button
          type="button"
          className={`homeBackTop ${showTop ? "isVisible" : ""}`}
          onClick={goTop}
          aria-label="Back to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}
