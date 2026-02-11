// src/Components/Home/NavbarScrollHomePage/NavbarScrollHomePage.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import "./NavbarScrollHomePage.css";

const SECTIONS = [
  { key: "welcome", label: "Welcome" },
  { key: "about", label: "About" },
  { key: "projects", label: "Projects" },
  { key: "contact", label: "Contact" },
];

const raf = (fn) => requestAnimationFrame(fn);
const LS_POS = "ag_navscrollhp_pos_v2_abs"; // ✅ new key to avoid your old broken values

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export default function NavbarScrollHomePage({ enabled = true, refs, showAfterY = 5 }) {
  const { t } = useTranslation("nav");

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeKey, setActiveKey] = useState("welcome");

  // ✅ absolute screen position
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const navRef = useRef(null);
  const activeRef = useRef("welcome");

  const shownOnceRef = useRef(false);
  const visibleRef = useRef(false);

  const dragRef = useRef({
    dragging: false,
    pid: null,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
    x: 0,
    y: 0,
    rafId: 0,
    nextX: 0,
    nextY: 0,
  });

  useEffect(() => setMounted(true), []);

  const sectionEls = useMemo(() => {
    return SECTIONS.map((s) => ({
      ...s,
      el: refs?.[s.key]?.current ?? document.getElementById(s.key),
    })).filter((x) => x.el);
  }, [refs]);

  const clampAbs = useCallback((x, y) => {
    const nav = navRef.current;
    const pad = 10;

    const w = nav?.offsetWidth ?? 190;
    const h = nav?.offsetHeight ?? 234;

    const minX = pad;
    const minY = pad;
    const maxX = window.innerWidth - pad - w;
    const maxY = window.innerHeight - pad - h;

    return { x: clamp(x, minX, maxX), y: clamp(y, minY, maxY) };
  }, []);

  // ✅ init position: restore or default (50px from right, y=470)
  useEffect(() => {
    const init = () => {
      // default
      let x = window.innerWidth - 50 - 190; // 190 = card width (close enough)
      let y = 470;

      // mobile default near bottom-right
      if (window.innerWidth <= 980) {
        x = window.innerWidth - 12 - 190;
        y = window.innerHeight - 14 - 70; // approx pill height
      }

      try {
        const raw = localStorage.getItem(LS_POS);
        if (raw) {
          const parsed = JSON.parse(raw);
          const sx = Number(parsed?.x);
          const sy = Number(parsed?.y);
          if (Number.isFinite(sx) && Number.isFinite(sy)) {
            x = sx;
            y = sy;
          }
        }
      } catch {}

      const clamped = clampAbs(x, y);
      dragRef.current.x = clamped.x;
      dragRef.current.y = clamped.y;
      dragRef.current.nextX = clamped.x;
      dragRef.current.nextY = clamped.y;
      setPos(clamped);
    };

    // after mount so navRef exists
    requestAnimationFrame(() => requestAnimationFrame(init));
    window.addEventListener("resize", init);

    return () => window.removeEventListener("resize", init);
  }, [clampAbs]);

  /* -----------------------------
     Visible: one-way after scroll
  ----------------------------- */
  // useEffect(() => {
  //   if (!enabled) return;

  //   let ticking = false;

  //   const getScrollY = () =>
  //     window.scrollY ||
  //     document.documentElement.scrollTop ||
  //     document.body.scrollTop ||
  //     0;

  //   const commit = () => {
  //     ticking = false;
  //     if (shownOnceRef.current) return;

  //     const y = getScrollY();
  //     if (y > showAfterY) {
  //       shownOnceRef.current = true;
  //       visibleRef.current = true;
  //       setVisible(true);
  //     }
  //   };

  //   const onScroll = () => {
  //     if (ticking) return;
  //     ticking = true;
  //     raf(commit);
  //   };

  //   window.addEventListener("scroll", onScroll, { passive: true });
  //   window.addEventListener("wheel", onScroll, { passive: true });
  //   window.addEventListener("touchmove", onScroll, { passive: true });

  //   return () => {
  //     window.removeEventListener("scroll", onScroll);
  //     window.removeEventListener("wheel", onScroll);
  //     window.removeEventListener("touchmove", onScroll);
  //   };
  // }, [enabled, showAfterY]);
  useEffect(() => {
    if (!enabled) return;
  
    let ticking = false;
  
    const reveal = () => {
      ticking = false;
      if (shownOnceRef.current) return;
  
      shownOnceRef.current = true;
      visibleRef.current = true;
      setVisible(true);
    };
  
    const onAnyScrollIntent = () => {
      if (ticking) return;
      ticking = true;
      raf(reveal);
    };
  
    // ✅ dès que l’utilisateur “touche” au scroll
    window.addEventListener("wheel", onAnyScrollIntent, { passive: true });
    window.addEventListener("touchmove", onAnyScrollIntent, { passive: true });
    window.addEventListener("scroll", onAnyScrollIntent, { passive: true });
  
    // (optionnel) si tu veux aussi : trackpad horizontal / space / arrows
    window.addEventListener("keydown", (e) => {
      const keys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Space", "Home", "End"];
      if (keys.includes(e.code)) onAnyScrollIntent();
    });
  
    return () => {
      window.removeEventListener("wheel", onAnyScrollIntent);
      window.removeEventListener("touchmove", onAnyScrollIntent);
      window.removeEventListener("scroll", onAnyScrollIntent);
      // si tu gardes keydown, mets-le en handler nommé pour pouvoir remove proprement
    };
  }, [enabled]);
  
  /* -----------------------------
     Active section observer
  ----------------------------- */
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

    pickBest();
    return () => io.disconnect();
  }, [enabled, sectionEls]);

  /* -----------------------------
     Scroll to section
  ----------------------------- */
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
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
        });
      });
    },
    [refs, setHashSoft]
  );

  /* -----------------------------
     Drag (absolute)
  ----------------------------- */
  const commitPos = useCallback((x, y) => {
    dragRef.current.x = x;
    dragRef.current.y = y;
    dragRef.current.nextX = x;
    dragRef.current.nextY = y;
    setPos({ x, y });
    try {
      localStorage.setItem(LS_POS, JSON.stringify({ x, y }));
    } catch {}
  }, []);

  const schedulePaint = useCallback(() => {
    const st = dragRef.current;
    if (st.rafId) return;
    st.rafId = requestAnimationFrame(() => {
      st.rafId = 0;
      commitPos(st.nextX, st.nextY);
    });
  }, [commitPos]);

  const onHandlePointerDown = useCallback((e) => {
    if (!visibleRef.current) return;

    const nav = navRef.current;
    if (!nav) return;

    const st = dragRef.current;
    st.dragging = true;
    st.pid = e.pointerId;
    st.startX = e.clientX;
    st.startY = e.clientY;
    st.baseX = st.x;
    st.baseY = st.y;

    nav.classList.add("isDragging");
    e.preventDefault();
  }, []);

  const onMove = useCallback(
    (e) => {
      const st = dragRef.current;
      if (!st.dragging) return;
      if (st.pid != null && e.pointerId != null && e.pointerId !== st.pid) return;

      const dx = e.clientX - st.startX;
      const dy = e.clientY - st.startY;

      const next = clampAbs(st.baseX + dx, st.baseY + dy);
      st.nextX = next.x;
      st.nextY = next.y;
      schedulePaint();
    },
    [clampAbs, schedulePaint]
  );

  const onUp = useCallback((e) => {
    const st = dragRef.current;
    if (!st.dragging) return;
    if (st.pid != null && e.pointerId != null && e.pointerId !== st.pid) return;

    st.dragging = false;
    st.pid = null;
    navRef.current?.classList.remove("isDragging");

    try {
      localStorage.setItem(LS_POS, JSON.stringify({ x: st.x, y: st.y }));
    } catch {}
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    const onBlur = () => {
      dragRef.current.dragging = false;
      dragRef.current.pid = null;
      navRef.current?.classList.remove("isDragging");
    };
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [onMove, onUp]);

  if (!enabled || !mounted) return null;

  const ui = (
    <nav
      ref={navRef}
      className={`navbar__scroll__hp ${visible ? "isVisible" : ""}`}
      aria-label="Scroll navigation"
      style={{
        "--x": `${pos.x}px`,
        "--y": `${pos.y}px`,
      }}
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

        <div className="navbar__scroll__hp__bottomRow">
          <button
            type="button"
            className="navbar__scroll__hp__dragHandle"
            onPointerDown={onHandlePointerDown}
            aria-label={t("navHp.drag", { defaultValue: "drag me" })}
            title={t("navHp.drag", { defaultValue: "drag me" })}
          >
            <span className="navbar__scroll__hp__dragDots" aria-hidden="true" />
            <span className="navbar__scroll__hp__dragTxt">
              {t("navHp.drag", { defaultValue: "drag me" })}
            </span>
          </button>

          <button
            type="button"
            className="navbar__scroll__hp__topBtn"
            onClick={() => scrollToKey("welcome")}
            aria-label={t("navHp.top", { defaultValue: "Back to top" })}
            title={t("navHp.top", { defaultValue: "Back to top" })}
          >
            <span className="navbar__scroll__hp__topIcon" aria-hidden="true">
              ↑
            </span>
          </button>
        </div>
      </div>
    </nav>
  );

  return createPortal(ui, document.body);
}
