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

const LS_POS = "ag_navscrollhp_pos_v2_abs";

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export default function NavbarScrollHomePage({
  enabled = true,
  refs,
  showAfterY = 5, // kept for API compatibility (we reveal on any scroll intent)
  disableBelow = 980, // phone/tablet cutoff
}) {
  const { t } = useTranslation("nav");

  // ✅ Hooks ALWAYS called
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeKey, setActiveKey] = useState("welcome");
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isSmall, setIsSmall] = useState(false);

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

  // mount flag (portal safe)
  useEffect(() => setMounted(true), []);

  // detect mobile/tablet
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${disableBelow}px)`);
    const onChange = (e) => setIsSmall(e.matches);

    setIsSmall(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [disableBelow]);

  // decide render (but hooks still run)
  const shouldRender = enabled && mounted && !isSmall;

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

  // init pos (only when shouldRender)
  useEffect(() => {
    if (!shouldRender) return;

    const init = () => {
      let x = window.innerWidth - 50 - 190;
      let y = 470;

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

    requestAnimationFrame(() => requestAnimationFrame(init));
    window.addEventListener("resize", init);
    return () => window.removeEventListener("resize", init);
  }, [shouldRender, clampAbs]);

  /* -----------------------------
     Visible: reveal after any scroll intent
  ----------------------------- */
  useEffect(() => {
    if (!shouldRender) return;

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
      requestAnimationFrame(reveal);
    };

    window.addEventListener("wheel", onAnyScrollIntent, { passive: true });
    window.addEventListener("scroll", onAnyScrollIntent, { passive: true });

    return () => {
      window.removeEventListener("wheel", onAnyScrollIntent);
      window.removeEventListener("scroll", onAnyScrollIntent);
    };
  }, [shouldRender, showAfterY]);

  /* -----------------------------
     Active section: robust scroll-based pick
     (No IntersectionObserver → no "Welcome stuck")
  ----------------------------- */
  useEffect(() => {
    if (!shouldRender) return;
    if (!sectionEls.length) return;

    let rafId = 0;

    const compute = () => {
      rafId = 0;

      const markerY = window.innerHeight * 0.45;
      let bestKey = "welcome";
      let bestDist = Infinity;

      for (const s of sectionEls) {
        const r = s.el.getBoundingClientRect();

        // marker inside section → win
        if (r.top <= markerY && r.bottom >= markerY) {
          bestKey = s.key;
          bestDist = 0;
          break;
        }

        // else closest edge to marker
        const dist = Math.min(Math.abs(r.top - markerY), Math.abs(r.bottom - markerY));
        if (dist < bestDist) {
          bestDist = dist;
          bestKey = s.key;
        }
      }

      if (activeRef.current !== bestKey) {
        activeRef.current = bestKey;
        setActiveKey(bestKey);
      }
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
    };
  }, [shouldRender, sectionEls]);

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

  // ✅ always scrollIntoView (including welcome) so ↑ returns to HomeOverlay reliably
  const scrollToKey = useCallback(
    (key) => {
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
     Drag
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
    if (!shouldRender) return;

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
  }, [shouldRender, onMove, onUp]);

  /* -----------------------------
     Render
  ----------------------------- */
  if (!shouldRender) return null;

  const ui = (
    <nav
      ref={navRef}
      className={`navbar__scroll__hp ${visible ? "isVisible" : ""}`}
      aria-label="Scroll navigation"
      style={{ "--x": `${pos.x}px`, "--y": `${pos.y}px` }}
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
