// // src/Components/About/About.jsx
import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import { useTranslation } from "react-i18next";
import "./About.css";
import useMountLog from "../../utils/useMountLog";
import LegacyModel from "./Model/LegacyModel";
import useMediaQuery from "../../utils/useMediaQuery";

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

const TABS = [
  { key: "web", labelFallback: "Web", angleDeg: -90, iconSrc: "/icons/web.svg" },
  { key: "threeD", labelFallback: "3D", angleDeg: 0, iconSrc: "/icons/threed.svg" },
  { key: "angels", labelFallback: "Events", angleDeg: 90 },
  { key: "all", labelFallback: "All", angleDeg: 180, iconSrc: "/icons/all.svg" },
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mod = (n, m) => ((n % m) + m) % m;

function angleFromPointer(cx, cy, x, y) {
  const a = Math.atan2(y - cy, x - cx);
  return (a * 180) / Math.PI;
}

function nearestTabFromAngle(deg) {
  let best = TABS[0];
  let bestDist = Infinity;
  for (const t of TABS) {
    const d = Math.abs(((deg - t.angleDeg + 540) % 360) - 180);
    if (d < bestDist) {
      bestDist = d;
      best = t;
    }
  }
  return best;
}

function TabIcon({ tabKey }) {
  const tab = TABS.find((x) => x.key === tabKey);

  if (tab?.iconSrc && (tabKey === "web" || tabKey === "threeD" || tabKey === "all")) {
    return (
      <img
        src={tab.iconSrc}
        alt=""
        draggable="false"
        loading="lazy"
        decoding="async"
        className="aboutX__iconImg"
      />
    );
  }

  const common = { viewBox: "0 0 24 24", fill: "none" };
  if (tabKey === "angels") {
    return (
      <svg {...common} aria-hidden="true">
        <path
          d="M12 6c3.4 0 6.2 1.4 8 3.6-1.8 2.2-4.6 3.6-8 3.6s-6.2-1.4-8-3.6C5.8 7.4 8.6 6 12 6Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M12 9.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Z"
          fill="currentColor"
          opacity=".85"
        />
        <path
          d="M6.2 4.6c.9 1.4 2 2.2 3.4 2.6M17.8 4.6c-.9 1.4-2 2.2-3.4 2.6"
          stroke="currentColor"
          strokeWidth="1.1"
          opacity=".75"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return null;
}

/**
 * frameloop="demand" => on invalide uniquement quand nécessaire
 */
function InvalidateOnActive({ active, mousePosition }) {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    if (!active) return;
    invalidate();
  }, [active, mousePosition, invalidate]);

  return null;
}

function About() {
  useMountLog("About");
  const { t } = useTranslation("about");
  const [isCvOpen, setIsCvOpen] = useState(false);
  const openCv = useCallback(() => setIsCvOpen(true), []);
  const closeCv = useCallback(() => setIsCvOpen(false), []);


  // ---------- hint key ----------
  const LS_HINT_3D = "ag_about_hint_3d_v1";

  const sectionRef = useRef(null);

  // committed (click / wheel)
  const [activeKey, setActiveKey] = useState("web");
  // preview (hover persisted; does NOT reset on leave)
  const [previewKey, setPreviewKey] = useState(null);

  // dropdowns
  // breakpoints 
  const isLE771 = useMediaQuery("(max-width: 771px)");
  const is981_1244 = useMediaQuery("(min-width: 981px) and (max-width: 1244px)");
  const isGE1245 = useMediaQuery("(min-width: 1245px)");
  
  // Visual open/close (GPU friendly)
  const [visualOpen, setVisualOpen] = useState(false);
  const userClosedRef = useRef(false);

  // hover/preview wins over active
  const displayKey = previewKey ?? activeKey;

  // Wheel hover (for hole rim highlight)
  const [isWheelHover, setIsWheelHover] = useState(false);

  // R3F pointer tracking
  const [isCanvasHover, setIsCanvasHover] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const canvasWrapRef = useRef(null);

  // Cursor orb (local px)
  const [cursorXY, setCursorXY] = useState({ x: 0, y: 0 });
  const rafCursorRef = useRef(0);
  const lastCursorRef = useRef({ x: 0, y: 0 });

  const setCursorSmooth = useCallback((x, y) => {
    lastCursorRef.current = { x, y };
    if (rafCursorRef.current) return;
    rafCursorRef.current = requestAnimationFrame(() => {
      rafCursorRef.current = 0;
      setCursorXY(lastCursorRef.current);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (rafCursorRef.current) cancelAnimationFrame(rafCursorRef.current);
    };
  }, []);

  const handleCanvasPointerMove = useCallback(
    (e) => {
      const el = canvasWrapRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const nx = (x / rect.width) * 2 - 1;
      const ny = -((y / rect.height) * 2 - 1);
      setMousePosition({ x: nx, y: ny });

      setCursorSmooth(x, y);
    },
    [setCursorSmooth]
  );

  // ---- Hint "Play with me" once ----
  // ---- Hint "Play with me" (every time 3D visual appears, 3s) ----
  const [canvasHintOn, setCanvasHintOn] = useState(false);
  const hintTimerRef = useRef(null);

  useEffect(() => {
    const shouldShow =
      visualOpen &&
      displayKey === "threeD"; // ✅ suffisant
  
    if (!shouldShow) {
      setCanvasHintOn(false);
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
        hintTimerRef.current = null;
      }
      return;
    }
  
    setCanvasHintOn(true);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
  
    hintTimerRef.current = setTimeout(() => {
      setCanvasHintOn(false);
      hintTimerRef.current = null;
    }, 3000);
  
    return () => {
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
        hintTimerRef.current = null;
      }
    };
  }, [visualOpen, displayKey]);
  

  // ---- refs / wheel anim ----
  const coreRef = useRef(null);
  const xpPanelRef = useRef(null);
  const timelineRef = useRef(null);

  // (on garde les noms, mais maintenant c’est l’aiguille)
  const needleAngleRef = useRef(TABS.find((x) => x.key === activeKey)?.angleDeg ?? -90);
  const needleAngleTargetRef = useRef(needleAngleRef.current);

  const glowRef = useRef(0.18);
  const glowTargetRef = useRef(0.18);

  const parXRef = useRef(0);
  const parYRef = useRef(0);

  const timelineProgRef = useRef(0);
  const timelineProgTargetRef = useRef(0);

  const wheelCooldownRef = useRef(0);

  const bioKicker = t("bio.kicker", { defaultValue: "Profile" });
  const bioTitle = t("bio.title", { defaultValue: "KASIA — FULLSTACK WEB DEV & 3D CREATOR" });
  const bioLead = t("bio.lead", {
    defaultValue:
      "I build interactive experiences that feel like a universe: clean engineering with a cinematic skin — UI systems, animations, and 3D worlds.",
  });

  const expTitle = t("sections.exp.title", { defaultValue: "Experience" });

  const expItems = useMemo(() => {
    const obj = t("sections.exp.items", { returnObjects: true });
    if (!obj || typeof obj !== "object") return [];
    const entries = Object.keys(obj).map((k) => ({ key: k, ...(obj[k] || {}) }));

    const seen = new Set();
    const cleaned = [];
    for (const it of entries) {
      const bold = it?.bold ?? "";
      const text = it?.text ?? "";
      const sig = `${bold}__${text}`;
      if (!bold && !text) continue;
      if (seen.has(sig)) continue;
      seen.add(sig);
      cleaned.push({ bold, text, key: it.key });
    }
    return cleaned;
  }, [t]);

  const tabLabel = useCallback(
    (key) => {
      const fallback = TABS.find((x) => x.key === key)?.labelFallback ?? key;
      return t(`tabs.${key}`, { defaultValue: fallback });
    },
    [t]
  );

  const taglines = useMemo(() => {
    return {
      web: t("tabTaglines.web", { defaultValue: "UI systems • Performance • Clean React architecture" }),
      threeD: t("tabTaglines.threeD", { defaultValue: "Blender • Real-time 3D • Cinematic UX" }),
      angels: t("tabTaglines.angels", { defaultValue: "Angels Gang • Cyberpunk product universe • Lightwear" }),
      all: t("tabTaglines.all", { defaultValue: "Full-stack • 3D • Creative engineering" }),
    };
  }, [t]);

  const skillsByTab = useMemo(() => {
    const fromJson = (k) => t(`skills.${k}`, { returnObjects: true });
    const pick = (k, fallback) => (Array.isArray(fromJson(k)) ? fromJson(k) : fallback);
    return {
      web: pick("web", ["React", "Vite", "i18n", "Perf", "UI Systems", "GSAP/Framer"]),
      threeD: pick("threeD", ["Blender", "Shading", "Optimization", "Three.js", "R3F", "PostFX"]),
      angels: pick("angels", ["Brand system", "Interactive UX", "Hardware vibes", "Visual identity", "Story"]),
      all: pick("all", ["Creative Dev", "3D", "Product UX", "Systems", "Motion", "Design"]),
    };
  }, [t]);

  const pdfHref = t("pdfHref", { defaultValue: "/pdf/kasia_cv.pdf" });

  const visualByTab = useMemo(() => {
    return {
      web: { type: "image", src: "/about/web_preview.png", alt: "Web preview" },
      all: { type: "image", src: "/about/all_preview.png", alt: "All preview" },
      angels: { type: "video", src: "/assets/about/video-emotion.mov" },
      threeD: { type: "canvas" },
    };
  }, []);

  const visual = visualByTab[displayKey] || { type: "image", src: "/about/all_preview.png" };

  // lock scroll when modal open
  // lock scroll when CV modal open
  useEffect(() => {
    if (!isCvOpen) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [isCvOpen]);


  // snap needle target on active change + glow pulse
  useEffect(() => {
    const tab = TABS.find((x) => x.key === activeKey) || TABS[0];
    needleAngleTargetRef.current = tab.angleDeg;

    glowTargetRef.current = 0.95;
    const to = window.setTimeout(() => {
      glowTargetRef.current = 0.22;
    }, 120);

    return () => window.clearTimeout(to);
  }, [activeKey]);

  const computeTimelineTarget = useCallback(() => {
    const el = timelineRef.current;
    if (!el) return 0;
    const max = el.scrollWidth - el.clientWidth;
    const p = max > 0 ? el.scrollLeft / max : 0;
    timelineProgTargetRef.current = clamp(p, 0, 1);
    return timelineProgTargetRef.current;
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => computeTimelineTarget());
    const onResize = () => computeTimelineTarget();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", onResize);
    };
  }, [computeTimelineTarget, displayKey]);

  // RAF start/stop for wheel visuals
  const reduceMotionRef = useRef(false);
  useEffect(() => {
    reduceMotionRef.current = !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  }, []);

  const rafIdRef = useRef(0);
  const isInViewRef = useRef(true);

  const stop = useCallback(() => {
    if (!rafIdRef.current) return;
    cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = 0;
  }, []);

  const start = useCallback(() => {
    if (reduceMotionRef.current) return;
    if (rafIdRef.current) return;

    const tick = () => {
      rafIdRef.current = 0;
      if (!isInViewRef.current) return;

      const core = coreRef.current;
      if (core) {
        const a = needleAngleRef.current;
        const at = needleAngleTargetRef.current;
        const delta = ((at - a + 540) % 360) - 180;
        needleAngleRef.current = a + delta * 0.12;

        const g = glowRef.current;
        const gt = glowTargetRef.current;
        glowRef.current = g + (gt - g) * 0.10;
        glowTargetRef.current = clamp(glowTargetRef.current * 0.985, 0, 0.35);

        core.style.setProperty("--needleAng", `${needleAngleRef.current}deg`);
        core.style.setProperty("--glow", `${glowRef.current}`);
        core.style.setProperty("--px", `${parXRef.current}`);
        core.style.setProperty("--py", `${parYRef.current}`);
      }

      const cur = timelineProgRef.current;
      const tgt = timelineProgTargetRef.current;
      timelineProgRef.current = cur + (tgt - cur) * 0.18;

      const xp = xpPanelRef.current;
      if (xp) xp.style.setProperty("--p", `${timelineProgRef.current}`);

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, []);

  // Intersection observer:
  // - starts/stops wheel animations
  // - auto open/close visual
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        const inView = !!entry?.isIntersecting;
        isInViewRef.current = inView;

        if (inView) {
          start();
          if (!userClosedRef.current) setVisualOpen(true);
        } else {
          stop();
          setVisualOpen(false);
          setIsCanvasHover(false);
          setMousePosition({ x: 0, y: 0 });
          setIsWheelHover(false);
        }
      },
      { threshold: 0.08 }
    );

    io.observe(el);
    start();

    return () => {
      io.disconnect();
      stop();
    };
  }, [start, stop]);


  const updateFromPointer = useCallback((clientX, clientY) => {
    const el = coreRef.current;
    if (!el) return;
  
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
  
    const deg = angleFromPointer(cx, cy, clientX, clientY);
    const near = nearestTabFromAngle(deg);
  
    // ✅ 1:1 avec la souris
    needleAngleTargetRef.current = deg;
  
    const dist = Math.abs(((deg - near.angleDeg + 540) % 360) - 180);
    const intensity = clamp(1 - dist / 55, 0, 1);
    glowTargetRef.current = Math.max(glowTargetRef.current, 0.18 + intensity * 0.85);
  
    const nx = clamp((clientX - cx) / (r.width / 2), -1, 1);
    const ny = clamp((clientY - cy) / (r.height / 2), -1, 1);
    parXRef.current = nx;
    parYRef.current = ny;
  
    setPreviewKey(near.key);
  }, []);

  
  const onPointerMove = useCallback(
    (e) => {
      if (!coreRef.current) return;
      updateFromPointer(e.clientX, e.clientY);
    },
    [updateFromPointer]
  );

  const onPointerLeave = useCallback(() => {
    glowTargetRef.current = 0.18;
    parXRef.current = 0;
    parYRef.current = 0;
    setIsWheelHover(false);
  }, []);

  const onPointerEnter = useCallback(() => {
    setIsWheelHover(true);
  }, []);

  const onPointerDown = useCallback(
    (e) => {
      coreRef.current?.setPointerCapture?.(e.pointerId);
      updateFromPointer(e.clientX, e.clientY);

      const el = coreRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const deg = angleFromPointer(cx, cy, e.clientX, e.clientY);
      const near = nearestTabFromAngle(deg);

      setActiveKey(near.key);
      setPreviewKey(null);
    },
    [updateFromPointer]
  );

  const onPointerUp = useCallback((e) => {
    try {
      coreRef.current?.releasePointerCapture?.(e.pointerId);
    } catch {}
  }, []);

  const onWheel = useCallback(
    (e) => {
      const now = Date.now();
      if (now - wheelCooldownRef.current < 250) return;
      wheelCooldownRef.current = now;

      const dir = e.deltaY > 0 ? 1 : -1;
      const idx = TABS.findIndex((x) => x.key === activeKey);
      const next = TABS[mod(idx + dir, TABS.length)];
      setActiveKey(next.key);
      setPreviewKey(null);
    },
    [activeKey]
  );

  const onNodeEnter = useCallback((key) => {
    setPreviewKey(key);
    const tab = TABS.find((x) => x.key === key) || TABS[0];
    needleAngleTargetRef.current = tab.angleDeg;
    glowTargetRef.current = Math.max(glowTargetRef.current, 0.85);
  }, []);

  const onNodeClick = useCallback((key) => {
    setActiveKey(key);
    setPreviewKey(null);
    const tab = TABS.find((x) => x.key === key) || TABS[0];
    needleAngleTargetRef.current = tab.angleDeg;
    glowTargetRef.current = 0.9;
  }, []);

  const onTimelineScroll = useCallback(() => {
    computeTimelineTarget();
  }, [computeTimelineTarget]);

  const ctaDownload = t("downloadPdf", { defaultValue: "Download PDF" });

  // Skills logic
  const skillsFull = skillsByTab[displayKey] || [];
  const skillsMax4 = skillsFull.slice(0, 4);
  const previewSkills = isGE1245 ? [] : skillsMax4;

  const toggleVisual = useCallback(() => {
    setVisualOpen((v) => {
      const next = !v;
      userClosedRef.current = !next;
      return next;
    });

    setIsCanvasHover(false);
    setMousePosition({ x: 0, y: 0 });
  }, []);

  
  return (
    <section className="aboutX" id="about" ref={sectionRef} aria-label={t("title", { defaultValue: "ABOUT" })}>
      <header className="aboutX__header">
        <h2 className="aboutX__title">{t("title", { defaultValue: "About" })}</h2>
        <p className="aboutX__lead">{bioLead}</p>
      </header>

      <div className="aboutX__layout">
        {/* LEFT */}
        <div className="aboutX__leftZone">
          <div className="holoPanel holoPanel--cornerCyber aboutX__bioPanel">
            <div className="aboutX__bioTop">
              <div className="aboutX__bioTitle">{bioTitle}</div>
              <div className="aboutX__bioSub">{taglines?.[displayKey] ?? ""}</div>
            </div>
            <p className="aboutX__bioText">{bioLead}</p>
          </div>

          <div className="aboutX__xpSkillsPanel">
            <div className="holoPanel aboutX__xpPanel" ref={xpPanelRef}
            >
              <div className="aboutX__xpHeader">
                <div className="aboutX__xpTitle">{expTitle}</div>
              </div>

              <div className="aboutX__timelineArea">
                <div className="aboutX__timelineRail" aria-hidden="true">
                  <div className="aboutX__timelineProg" aria-hidden="true" />
                </div>

                <div
                  className="aboutX__timelineH"
                  ref={timelineRef}
                  onScroll={onTimelineScroll}
                  role="list"
                  aria-label="Experience timeline"
                >
                  {expItems.map((it, i) => (
                    <div className="aboutX__timeCard" key={`${it.key}-${i}`} role="listitem">
                      <div className="aboutX__timeDot" aria-hidden="true" />
                      <div className="aboutX__timeText">
                        <span className="aboutX__bold">{it.bold}</span>{" "}
                        <span className="aboutX__muted">{it.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="holoPanel aboutX__skillsPanel">
              <div className="aboutX__skillsTop">
                <div className="aboutX__skillsHeader">
                  <div className="aboutX__skillsTitle">
                    {t("skills.title", { defaultValue: "Skills" })}
                  </div>
                  <div className="aboutX__skillsSub">{tabLabel(displayKey)}</div>
                </div>
              </div>

                <div className="aboutX__skillsList aboutX__skillsList--inPanel" role="list">
                  {skillsFull.map((skill) => (
                    <div key={skill} className="aboutX__skillItem" role="listitem">
                      {skill}
                    </div>
                  ))}
                </div>
            </div>


          </div>
        </div>

        {/* CENTER + RIGHT */}
        <div className="aboutX__center">
          <div className="aboutX__wheelStage">
            <div
              className={`aboutX__core ${isWheelHover ? "isHover" : ""}`}
              ref={coreRef}
              role="application"
              aria-label="About wheel"
              onPointerEnter={onPointerEnter}
              onPointerMove={onPointerMove}
              onPointerLeave={onPointerLeave}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onWheel={onWheel}
            >
              {/* 3 contours + distortion (photo 1 vibe) */}
              <div className="aboutX__ringOuter" aria-hidden="true" />
              <div className="aboutX__ringOuter" aria-hidden="true" />
              <div className="aboutX__ticks" aria-hidden="true" />     {/* ✅ ticks overlay */}
              <div className="aboutX__ringWide" aria-hidden="true" />  {/* ✅ ring large (2e contour) */}

              <div className="aboutX__ringMid" aria-hidden="true" />   {/* tu peux le garder mais on va le repenser */}
              <div className="aboutX__ringInner" aria-hidden="true" /> {/* ✅ 3e contour sombre -> blanc au scar */}
              <div className="aboutX__distort" aria-hidden="true" />
              <div className="aboutX__hole" aria-hidden="true" />

              {/* Needle */}
              <div className="aboutX__needle" aria-hidden="true" />

              {TABS.map((tab) => {
                const isActive = tab.key === activeKey;
                const isDisplay = tab.key === displayKey;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    className={`aboutX__node ${isActive ? "isActive" : ""} ${isDisplay ? "isDisplay" : ""}`}
                    style={{ "--a": `${tab.angleDeg}deg` }}
                    onMouseEnter={() => onNodeEnter(tab.key)}
                    onFocus={() => onNodeEnter(tab.key)}
                    onClick={() => onNodeClick(tab.key)}
                    aria-label={tabLabel(tab.key)}
                  >
                    <span className="aboutX__nodeGlow" aria-hidden="true" />
                    <span className="aboutX__icon" aria-hidden="true">
                      <TabIcon tabKey={tab.key} />
                    </span>
                    <span className="aboutX__nodeLabel">{tabLabel(tab.key)}</span>
                  </button>
                );
              })}
              <div className="aboutX__scar" aria-hidden="true" />

              <div className="aboutX__centerLabel" aria-hidden="true">
                <div className="aboutX__centerTop">{t("title", { defaultValue: "ABOUT" })}</div>
                <div className="aboutX__centerSub">{tabLabel(displayKey)}</div>
              </div>
            </div>

            {/* <div className="aboutX__hint">{t("playHint", { defaultValue: "Play with me" })}</div> */}
          </div>

          <div className="aboutX__rightZone">
            <div className="aboutX__actions">
              <a className="aboutX__btn" href="/#projects">
                {t("buttons.portfolio", { defaultValue: "View portfolio" })}
              </a>
              <button type="button" className="aboutX__btn isGhost" onClick={openCv}>
                {t("buttons.cv", { defaultValue: "View full CV" })}
              </button>

              <a className="aboutX__btn isGhost" href={pdfHref} download>
                {ctaDownload}
              </a>
            </div>

            <div className="holoPanel holoPanel--cornerCyber aboutX__visualPanel">
              <div className="aboutX__visualTop">
                <div className="aboutX__visualHeader">
                  <div className="aboutX__visualTitle">{t("visual.title", { defaultValue: "Visual" })}</div>
                  <div className="aboutX__visualSub">{tabLabel(displayKey)}</div>
                </div>

                <button
                  type="button"
                  className="aboutX__btn isSmall"
                  aria-pressed={visualOpen}
                  onClick={toggleVisual}
                >
                  {visualOpen ? t("visual.close", { defaultValue: "Close" }) : t("visual.open", { defaultValue: "Open" })}
                </button>
              </div>

              {visualOpen && (
                <div className="aboutX__visualBody">
                  {visual.type === "canvas" && displayKey === "threeD" && (
                    <div
                      className="aboutX__canvasWrap aboutX__visualFxBR"
                      ref={canvasWrapRef}
                      onPointerEnter={(e) => {
                        setIsCanvasHover(true);
                        handleCanvasPointerMove(e);
                      }}
                      onPointerLeave={() => {
                        setIsCanvasHover(false);
                        setMousePosition({ x: 0, y: 0 });
                      }}
                      onPointerMove={(e) => {
                        if (!isCanvasHover) return;
                        handleCanvasPointerMove(e);
                      }}
                    >
                      {isCanvasHover && (
                        <div
                          className="aboutX__cursorOrb"
                          style={{ left: `${cursorXY.x}px`, top: `${cursorXY.y}px` }}
                          aria-hidden="true"
                        />
                      )}

                      {canvasHintOn && (
                        <div className={`aboutX__canvasHint ${canvasHintOn ? "isOn" : ""}`}>
                          {t("playHint", { defaultValue: "Play with me" })}
                        </div>
                      )}

                      <Canvas
                        frameloop={isCanvasHover ? "always" : "demand"}
                        dpr={isCanvasHover ? [1, 2] : 1}
                        camera={{ position: [0, 0.2, 5.2], fov: 45 }}
                        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
                      >
                        <InvalidateOnActive active={isCanvasHover} mousePosition={mousePosition} />

                        <ambientLight intensity={0.8} />
                        <directionalLight position={[3, 4, 6]} intensity={1.0} />
                        <pointLight position={[2.2, 0.8, 2.5]} intensity={0.55} color="#ff00aa" />
                        <pointLight position={[-2.2, -0.4, 2.8]} intensity={0.35} color="#7c3aed" />

                        <LegacyModel mousePosition={mousePosition} isActive={isCanvasHover} />
                        <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.6} />
                      </Canvas>
                    </div>
                  )}

                  {visual.type === "image" && (
                    <div className="aboutX__mediaWrap aboutX__visualFxBR">
                      <img
                        className="aboutX__media"
                        src={visual.src}
                        alt={visual.alt || ""}
                        loading="lazy"
                        decoding="async"
                        draggable="false"
                      />
                    </div>
                  )}

                  {visual.type === "video" && (
                    <div className="aboutX__mediaWrap aboutX__visualFxBR">
                      <video
                        className="aboutX__media"
                        src={visual.src}
                        muted
                        loop
                        playsInline
                        autoPlay
                        preload="metadata"
                        controls={false}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal (kept) */}
      {isCvOpen && (
        <div
          className="aboutX__modalOverlay"
          role="dialog"
          aria-modal="true"
          aria-label="Full CV"
          onPointerDown={(e) => {
            // click "outside" (anywhere not inside modal) closes
            if (e.target === e.currentTarget) closeCv();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") closeCv();
          }}
          tabIndex={-1}
        >
          <div className="aboutX__modal" onPointerDown={(e) => e.stopPropagation()}>
            <div className="aboutX__modalTop">
              <div className="aboutX__modalTitle">CURRICULUM VITAE — ATS</div>

              <button type="button" className="aboutX__btn isGhost" onClick={closeCv}>
                {t("close", { defaultValue: "Close" })}
              </button>
            </div>

            <div className="aboutX__modalBody">
              <section className="aboutX__modalBlock">
                <div className="aboutX__modalKicker">SUMMARY</div>
                <p className="aboutX__modalLead">
                  Fullstack developer with a strong creative/3D background. Builds performant UI systems,
                  interactive experiences, and real-time visuals (React, Vite, Three.js/R3F, Blender).
                </p>
              </section>

              <section className="aboutX__modalBlock">
                <div className="aboutX__modalKicker">CORE SKILLS</div>
                <ul className="aboutX__modalList">
                  <li>React, Vite, JavaScript, CSS, UI architecture, i18n</li>
                  <li>Three.js / React Three Fiber, real-time 3D, optimization</li>
                  <li>Blender, 3D pipeline, shading, asset workflows</li>
                  <li>API integration, Git, clean code, performance mindset</li>
                </ul>
              </section>

              <section className="aboutX__modalBlock">
                <div className="aboutX__modalKicker">EXPERIENCE</div>
                <ul className="aboutX__modalList">
                  {expItems.map((it, i) => (
                    <li key={`${it.key}-${i}`}>
                      <strong>{it.bold}</strong> {it.text}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="aboutX__modalBlock">
                <div className="aboutX__modalKicker">PROJECT HIGHLIGHTS</div>
                <ul className="aboutX__modalList">
                  <li>Interactive 3D portfolio (R3F): onboarding, markers, performance tuning</li>
                  <li>Design systems: hover/glow, glass panels, smooth loading flow</li>
                  <li>Creative tech product universe: Angels Gang (visual identity + UX)</li>
                </ul>
              </section>
            </div>

            <div className="aboutX__modalFooter">
              {/* ✅ 2 buttons only, as requested */}
              <a className="aboutX__btn" href={pdfHref} download>
                {t("downloadPdf", { defaultValue: "Download PDF" })}
              </a>

              <button type="button" className="aboutX__btn isGhost" onClick={closeCv}>
                {t("close", { defaultValue: "Close" })}
              </button>
            </div>
          </div>
        </div>


      )}
    </section>
  );
}

export default memo(About);
