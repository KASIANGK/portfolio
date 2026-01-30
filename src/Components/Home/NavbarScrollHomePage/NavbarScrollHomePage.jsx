// src/Components/Home/NavbarScrollHomePage/NavbarScrollHomePage.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./NavbarScrollHomePage.css";

const SECTIONS = [
  { key: "welcome", label: "Welcome" },
  { key: "about", label: "About" },
  { key: "projects", label: "Projects" },
  { key: "contact", label: "Contact" },
];

// small helper
const raf = (fn) => requestAnimationFrame(fn);

export default function NavbarScrollHomePage({
  enabled = true,
  refs,
  showAfterY = 5,
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeKey, setActiveKey] = useState("welcome");

  // avoid setState spam
  const visibleRef = useRef(false);
  const activeRef = useRef("welcome");

  // mount (portal safe)
  useEffect(() => setMounted(true), []);

  // resolve section elements (refs -> fallback by id)
  const sectionEls = useMemo(() => {
    return SECTIONS.map((s) => ({
      ...s,
      el: refs?.[s.key]?.current ?? document.getElementById(s.key),
    })).filter((x) => x.el);
  }, [refs]);

  /* ---------------------------------------
     Visible toggle (NO infinite RAF)
     - updates only on scroll/resize
  --------------------------------------- */
  useEffect(() => {
    if (!enabled) return;

    let ticking = false;

    const update = () => {
      ticking = false;
      const y = window.scrollY || 0;
      const next = y > showAfterY;

      if (visibleRef.current !== next) {
        visibleRef.current = next;
        setVisible(next);
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      raf(update);
    };

    update(); // initial
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [enabled, showAfterY]);

  /* ---------------------------------------
     Active section observer
  --------------------------------------- */
  useEffect(() => {
    if (!enabled) return;
    if (!sectionEls.length) return;

    const ratios = new Map();

    const commitActive = (nextKey) => {
      if (!nextKey) return;
      if (activeRef.current === nextKey) return;
      activeRef.current = nextKey;
      setActiveKey(nextKey);
    };

    const pickBest = () => {
      const y = window.scrollY || 0;
      if (y < 40) return commitActive("welcome");

      let bestKey = "welcome";
      let bestScore = -1;

      for (const [k, v] of ratios.entries()) {
        if (v > bestScore) {
          bestScore = v;
          bestKey = k;
        }
      }
      if (bestScore >= 0) commitActive(bestKey);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const key = e.target?.dataset?.navkey;
          if (!key) continue;
          ratios.set(key, e.intersectionRatio || 0);
        }
        pickBest();
      },
      {
        root: null,
        rootMargin: "-35% 0px -45% 0px",
        threshold: [0, 0.08, 0.16, 0.25, 0.4, 0.6, 0.8, 1],
      }
    );

    sectionEls.forEach(({ key, el }) => {
      el.dataset.navkey = key;
      io.observe(el);
    });

    // initial compute (in case observer hasn’t fired yet)
    pickBest();

    return () => io.disconnect();
  }, [enabled, sectionEls]);

  /* ---------------------------------------
     Scroll to section (hash is OPTIONAL)
     - Use replaceState (no history spam)
     - Only change hash if different
  --------------------------------------- */
  const setHashSoft = useCallback((key) => {
    try {
      const next = key === "welcome" ? "/" : `/#${key}`;
      const cur = `${window.location.pathname}${window.location.hash}`;
      if (cur === next) return;
      window.history.replaceState({}, "", next);
    } catch {}
  }, []);

  const scrollToKey = useCallback(
    (key) => {
      if (key === "welcome") {
        setHashSoft("welcome");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const el = refs?.[key]?.current ?? document.getElementById(key);
      if (!el) return;

      setHashSoft(key);

      // stable (and you already use scroll-margin-top in CSS)
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [refs, setHashSoft]
  );

  if (!enabled || !mounted) return null;

  const ui = (
    <nav
      className={`navbar__scroll__hp ${visible ? "isVisible" : ""}`}
      aria-label="Scroll navigation"
    >
      <div className="navbar__scroll__hp__card">
        <div className="navbar__scroll__hp__list">
          {SECTIONS.map((s) => {
            const isActive = activeKey === s.key;
            return (
              <button
                key={s.key}
                type="button"
                className={`navbar__scroll__hp__item ${isActive ? "isActive" : ""}`}
                onClick={() => scrollToKey(s.key)}
              >
                <span className="navbar__scroll__hp__dot" aria-hidden="true" />
                <span className="navbar__scroll__hp__txt">{s.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="navbar__scroll__hp__topBtn"
          onClick={() => scrollToKey("welcome")}
          aria-label="Back to top"
          title="Back to top"
        >
          ↑
        </button>
      </div>
    </nav>
  );

  return createPortal(ui, document.body);
}




// // src/Components/Home/NavbarScrollHomePage/NavbarScrollHomePage.jsx
// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { createPortal } from "react-dom";
// import "./NavbarScrollHomePage.css";

// const SECTIONS = [
//   { key: "welcome", label: "Welcome" },
//   { key: "about", label: "About" },
//   { key: "projects", label: "Projects" },
//   { key: "contact", label: "Contact" },
// ];

// export default function NavbarScrollHomePage({
//   enabled = true,
//   refs,
//   showAfterY = 5,
// }) {
//   const [mounted, setMounted] = useState(false);
//   const [visible, setVisible] = useState(false);
//   const [activeKey, setActiveKey] = useState("welcome");

//   // mount (portal safe)
//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   // show after y > 5 (global appear)
//   useEffect(() => {
//     if (!enabled) return;

//     let raf = 0;
//     const tick = () => {
//       const y = window.scrollY || 0;
//       setVisible(y > showAfterY);
//       raf = requestAnimationFrame(tick);
//     };
//     raf = requestAnimationFrame(tick);
//     return () => cancelAnimationFrame(raf);
//   }, [enabled, showAfterY]);

//   // resolve section elements (refs -> fallback by id)
//   const sectionEls = useMemo(() => {
//     return SECTIONS.map((s) => ({
//       ...s,
//       el: refs?.[s.key]?.current ?? document.getElementById(s.key),
//     })).filter((x) => x.el);
//   }, [refs]);

//   // IntersectionObserver stable (no “sautille”)
//   useEffect(() => {
//     if (!enabled) return;
//     if (!sectionEls.length) return;

//     const ratios = new Map();

//     const pickBest = () => {
//       const y = window.scrollY || 0;
//       if (y < 40) {
//         setActiveKey("welcome");
//         return;
//       }
//       let bestKey = "welcome";
//       let bestScore = -1;
//       for (const [k, v] of ratios.entries()) {
//         if (v > bestScore) {
//           bestScore = v;
//           bestKey = k;
//         }
//       }
//       if (bestScore >= 0) setActiveKey(bestKey);
//     };

//     const io = new IntersectionObserver(
//       (entries) => {
//         for (const e of entries) {
//           const key = e.target?.dataset?.navkey;
//           if (!key) continue;
//           ratios.set(key, e.intersectionRatio || 0);
//         }
//         pickBest();
//       },
//       {
//         root: null,
//         rootMargin: "-35% 0px -45% 0px",
//         threshold: [0, 0.08, 0.16, 0.25, 0.4, 0.6, 0.8, 1],
//       }
//     );

//     sectionEls.forEach(({ key, el }) => {
//       el.dataset.navkey = key;
//       io.observe(el);
//     });

//     return () => io.disconnect();
//   }, [enabled, sectionEls]);

//   const scrollToKey = useCallback(
//     (key) => {
//       if (key === "welcome") {
//         try {
//           window.history.pushState({}, "", "/");
//         } catch {}
//         window.scrollTo({ top: 0, behavior: "smooth" });
//         setActiveKey("welcome");
//         return;
//       }

//       const el = refs?.[key]?.current ?? document.getElementById(key);
//       if (!el) return;

//       try {
//         window.history.pushState({}, "", `/#${key}`);
//       } catch {}

//       // ✅ le plus stable (et tu as scroll-margin-top)
//       el.scrollIntoView({ behavior: "smooth", block: "start" });
//       setActiveKey(key);
//     },
//     [refs]
//   );

//   if (!enabled || !mounted) return null;

//   const ui = (
//     <nav
//       className={`navbar__scroll__hp ${visible ? "isVisible" : ""}`}
//       aria-label="Scroll navigation"
//     >
//       <div className="navbar__scroll__hp__card">
//         <div className="navbar__scroll__hp__list">
//           {SECTIONS.map((s) => {
//             const isActive = activeKey === s.key;
//             return (
//               <button
//                 key={s.key}
//                 type="button"
//                 className={`navbar__scroll__hp__item ${isActive ? "isActive" : ""}`}
//                 onClick={() => scrollToKey(s.key)}
//               >
//                 <span className="navbar__scroll__hp__dot" aria-hidden="true" />
//                 <span className="navbar__scroll__hp__txt">{s.label}</span>
//               </button>
//             );
//           })}
//         </div>

//         <button
//           type="button"
//           className="navbar__scroll__hp__topBtn"
//           onClick={() => scrollToKey("welcome")}
//           aria-label="Back to top"
//           title="Back to top"
//         >
//           ↑
//         </button>
//       </div>
//     </nav>
//   );

//   // ✅ sort de Home/HomeOverlay/etc.
//   return createPortal(ui, document.body);
// }


