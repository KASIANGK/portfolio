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
const LS_POS = "ag_navscrollhp_pos_v1";

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export default function NavbarScrollHomePage({
  enabled = true,
  refs,
  showAfterY = 5,
}) {
  const { t } = useTranslation("nav");

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeKey, setActiveKey] = useState("welcome");

  const visibleRef = useRef(false);
  const activeRef = useRef("welcome");

  const navRef = useRef(null);
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
  const [dragXY, setDragXY] = useState({ x: 0, y: 0 });

  useEffect(() => setMounted(true), []);

  // restore saved position
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_POS);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const x = Number(parsed?.x ?? 0);
      const y = Number(parsed?.y ?? 0);
      dragRef.current.x = x;
      dragRef.current.y = y;
      setDragXY({ x, y });
    } catch {}
  }, []);

  // resolve section elements (refs -> fallback by id)
  const sectionEls = useMemo(() => {
    return SECTIONS.map((s) => ({
      ...s,
      el: refs?.[s.key]?.current ?? document.getElementById(s.key),
    })).filter((x) => x.el);
  }, [refs]);

  /* ---------------------------------------
     Visible toggle
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

    update();
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

    pickBest();
    return () => io.disconnect();
  }, [enabled, sectionEls]);

  /* ---------------------------------------
     Scroll to section (START)
     - smooth
     - set hash softly
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

      // ✅ start of section (stable)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
        });
      });
    },
    [refs, setHashSoft]
  );

  /* ---------------------------------------
     Draggable (handle only)
  --------------------------------------- */
  const clampToViewport = useCallback((x, y) => {
    const nav = navRef.current;
    if (!nav) return { x, y };

    const rect = nav.getBoundingClientRect();
    const pad = 10;

    const maxRight = window.innerWidth - pad - rect.width;
    const maxBottom = window.innerHeight - pad - rect.height;

    const dxMin = -rect.left + pad;
    const dxMax = maxRight - rect.left;
    const dyMin = -rect.top + pad;
    const dyMax = maxBottom - rect.top;

    return {
      x: clamp(x, x + dxMin, x + dxMax),
      y: clamp(y, y + dyMin, y + dyMax),
    };
  }, []);

  const commitDrag = useCallback((x, y) => {
    dragRef.current.x = x;
    dragRef.current.y = y;
    setDragXY({ x, y });
    try {
      localStorage.setItem(LS_POS, JSON.stringify({ x, y }));
    } catch {}
  }, []);

  const scheduleDragPaint = useCallback(() => {
    const st = dragRef.current;
    if (st.rafId) return;
    st.rafId = requestAnimationFrame(() => {
      st.rafId = 0;
      commitDrag(st.nextX, st.nextY);
    });
  }, [commitDrag]);

  const onHandlePointerDown = useCallback(
    (e) => {
      if (!visible) return;
      const nav = navRef.current;
      if (!nav) return;

      const st = dragRef.current;
      st.dragging = true;
      st.pid = e.pointerId;
      st.startX = e.clientX;
      st.startY = e.clientY;
      st.baseX = st.x;
      st.baseY = st.y;

      try {
        e.currentTarget.setPointerCapture?.(e.pointerId);
      } catch {}

      nav.classList.add("isDragging");
      e.preventDefault();
    },
    [visible]
  );

  const onHandlePointerMove = useCallback(
    (e) => {
      const st = dragRef.current;
      if (!st.dragging) return;

      const dx = e.clientX - st.startX;
      const dy = e.clientY - st.startY;

      let nx = st.baseX + dx;
      let ny = st.baseY + dy;

      const clamped = clampToViewport(nx, ny);
      st.nextX = clamped.x;
      st.nextY = clamped.y;

      scheduleDragPaint();
    },
    [clampToViewport, scheduleDragPaint]
  );

  const onHandlePointerUp = useCallback((e) => {
    const st = dragRef.current;
    if (!st.dragging) return;

    st.dragging = false;
    st.pid = null;

    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {}

    navRef.current?.classList.remove("isDragging");

    try {
      localStorage.setItem(LS_POS, JSON.stringify({ x: dragRef.current.x, y: dragRef.current.y }));
    } catch {}
  }, []);

  useEffect(() => {
    const onBlur = () => {
      dragRef.current.dragging = false;
      navRef.current?.classList.remove("isDragging");
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  if (!enabled || !mounted) return null;

  const ui = (
    <nav
      ref={navRef}
      className={`navbar__scroll__hp ${visible ? "isVisible" : ""}`}
      aria-label="Scroll navigation"
      style={{
        "--dx": `${dragXY.x}px`,
        "--dy": `${dragXY.y}px`,
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
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerUp}
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

