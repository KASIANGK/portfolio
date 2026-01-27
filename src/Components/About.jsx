// src/Components/About/About.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./About.css";

/**
 * ABOUT — Holo Hub (Wheel + Snap Ball + Panels)
 * - hover => preview
 * - click => lock
 * - wheel scroll => change tab
 * - pointer move => ball follows (snapped)
 * - panels + image change from displayKey
 */

const TABS = [
  { key: "web", labelFallback: "Web", angleDeg: -90 },
  { key: "threeD", labelFallback: "3D", angleDeg: 0 },
  { key: "angels", labelFallback: "Angels", angleDeg: 90 },
  { key: "all", labelFallback: "All", angleDeg: 180 },
];

// tiny helper
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mod = (n, m) => ((n % m) + m) % m;

function angleFromPointer(cx, cy, x, y) {
  // 0deg = right, 90deg = down (screen coords)
  const a = Math.atan2(y - cy, x - cx);
  let deg = (a * 180) / Math.PI; // -180..180
  return deg;
}

function nearestTabFromAngle(deg) {
  // deg: -180..180
  let best = TABS[0];
  let bestDist = Infinity;
  for (const t of TABS) {
    // distance on circle
    const d = Math.abs(((deg - t.angleDeg + 540) % 360) - 180);
    if (d < bestDist) {
      bestDist = d;
      best = t;
    }
  }
  return best;
}

function safeGet(obj, path, fallback) {
  try {
    const parts = path.split(".");
    let cur = obj;
    for (const p of parts) cur = cur?.[p];
    return cur ?? fallback;
  } catch {
    return fallback;
  }
}

// optional: nicer icons as inline SVG
function TabIcon({ tabKey }) {
  // Keep it minimal (CSS will glow)
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none" };
  switch (tabKey) {
    case "web":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M7 7l2 10" stroke="currentColor" strokeWidth="1.2" opacity=".6" />
        </svg>
      );
    case "threeD":
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M12 3l8 5v8l-8 5-8-5V8l8-5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            opacity=".9"
          />
          <path d="M12 3v18M4 8l8 5 8-5" stroke="currentColor" strokeWidth="1.1" opacity=".6" />
        </svg>
      );
    case "angels":
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M12 6c3.4 0 6.2 1.4 8 3.6-1.8 2.2-4.6 3.6-8 3.6s-6.2-1.4-8-3.6C5.8 7.4 8.6 6 12 6Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M12 9.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Z" fill="currentColor" opacity=".8" />
          <path d="M6.2 4.6c.9 1.4 2 2.2 3.4 2.6M17.8 4.6c-.9 1.4-2 2.2-3.4 2.6" stroke="currentColor" strokeWidth="1.1" opacity=".7" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 2l2.7 6.4 6.9.6-5.2 4.4 1.6 6.7-6-3.6-6 3.6 1.6-6.7L2.4 9l6.9-.6L12 2Z" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
  }
}

export default function About() {
  const { t } = useTranslation("about");

  // lock + preview
  const [activeKey, setActiveKey] = useState("web");
  const [hoverKey, setHoverKey] = useState(null);

  // modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayKey = hoverKey ?? activeKey;

  // refs for wheel interaction
  const coreRef = useRef(null);
  const isPointerDownRef = useRef(false);

  // animated ball angle
  const ballAngleRef = useRef(TABS.find((x) => x.key === activeKey)?.angleDeg ?? -90);
  const ballAngleTargetRef = useRef(ballAngleRef.current);

  // beam intensity (0..1)
  const beamRef = useRef(0);
  const beamTargetRef = useRef(0);

  // micro parallax targets (CSS vars)
  const parXRef = useRef(0);
  const parYRef = useRef(0);

  // wheel scroll switching
  const wheelCooldownRef = useRef(0);

  // ---- content from JSON (fallbacks if missing) ----
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
    // Keep insertion order as best effort
    const entries = Object.keys(obj).map((k) => ({ key: k, ...(obj[k] || {}) }));
    // Filter duplicates weird keys (like urbanTechh etc) by bold+text uniqueness
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
      // If you later add: about.tabs.web, about.tabs.threeD, ...
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
    // Optional JSON structure you can add later:
    // "skills": { "web": [...], "threeD": [...], "angels": [...], "all": [...] }
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

  const imagesByTab = useMemo(() => {
    // Optional JSON later:
    // "images": { "web": "/assets/..", ... }
    const fromJson = (k) => t(`images.${k}`, { defaultValue: "" });
    const web = fromJson("web") || "/assets/about_web.jpg";
    const threeD = fromJson("threeD") || "/assets/about_3d.jpg";
    const angels = fromJson("angels") || "/assets/about_angels.jpg";
    const all = fromJson("all") || "/assets/about_all.jpg";
    return { web, threeD, angels, all };
  }, [t]);

  // ---- modal scroll lock ----
  useEffect(() => {
    if (!isModalOpen) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [isModalOpen]);

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  // ---- apply active tab => snap ball target ----
  useEffect(() => {
    const tab = TABS.find((x) => x.key === activeKey) || TABS[0];
    ballAngleTargetRef.current = tab.angleDeg;
    beamTargetRef.current = 0.8; // small flash on change
    window.setTimeout(() => {
      beamTargetRef.current = 0.25;
    }, 120);
  }, [activeKey]);

  // ---- animation loop (ball easing + beam easing + CSS vars) ----
  useEffect(() => {
    let rafId = 0;

    const tick = () => {
      const core = coreRef.current;
      if (core) {
        // ease angles
        const a = ballAngleRef.current;
        let at = ballAngleTargetRef.current;

        // shortest path around circle
        let delta = ((at - a + 540) % 360) - 180;
        ballAngleRef.current = a + delta * 0.12;

        // ball spin (fake rolling)
        const spin = ((ballAngleRef.current + 360) % 360) * 1.8;

        // beam easing
        const b = beamRef.current;
        const bt = beamTargetRef.current;
        beamRef.current = b + (bt - b) * 0.10;

        // apply vars
        core.style.setProperty("--ballAng", `${ballAngleRef.current}deg`);
        core.style.setProperty("--ballSpin", `${spin}deg`);
        core.style.setProperty("--beam", `${beamRef.current}`);

        // micro parallax vars (from stored refs)
        core.style.setProperty("--px", `${parXRef.current}`);
        core.style.setProperty("--py", `${parYRef.current}`);
      }

      // decay beam target slowly
      beamTargetRef.current = clamp(beamTargetRef.current * 0.985, 0, 0.35);

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // ---- pointer tracking: sets hover + target angle + parallax ----
  const updateFromPointer = useCallback((clientX, clientY, { lockHover = false } = {}) => {
    const el = coreRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    const deg = angleFromPointer(cx, cy, clientX, clientY);
    const near = nearestTabFromAngle(deg);

    // keep ball snapped to nearest tab (premium / controlled)
    ballAngleTargetRef.current = near.angleDeg;

    // beam gets stronger when close to the exact tab direction
    const dist = Math.abs(((deg - near.angleDeg + 540) % 360) - 180); // 0..180
    const intensity = clamp(1 - dist / 55, 0, 1); // 55deg window
    beamTargetRef.current = Math.max(beamTargetRef.current, 0.18 + intensity * 0.85);

    // parallax (small)
    const nx = clamp((clientX - cx) / (r.width / 2), -1, 1);
    const ny = clamp((clientY - cy) / (r.height / 2), -1, 1);
    parXRef.current = nx;
    parYRef.current = ny;

    // hover preview unless locked
    if (!lockHover) setHoverKey(near.key);
  }, []);

  const onPointerMove = useCallback(
    (e) => {
      if (!coreRef.current) return;
      // If not interacting, we still allow hover preview when cursor is over the wheel
      updateFromPointer(e.clientX, e.clientY);
    },
    [updateFromPointer]
  );

  const onPointerLeave = useCallback(() => {
    setHoverKey(null);
    // soften beam when leaving
    beamTargetRef.current = 0.18;
    parXRef.current = 0;
    parYRef.current = 0;
  }, []);

  const onPointerDown = useCallback(
    (e) => {
      isPointerDownRef.current = true;
      coreRef.current?.setPointerCapture?.(e.pointerId);
      updateFromPointer(e.clientX, e.clientY);
      // lock active immediately on down
      const el = coreRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const deg = angleFromPointer(cx, cy, e.clientX, e.clientY);
      const near = nearestTabFromAngle(deg);
      setActiveKey(near.key);
    },
    [updateFromPointer]
  );

  const onPointerUp = useCallback((e) => {
    isPointerDownRef.current = false;
    try {
      coreRef.current?.releasePointerCapture?.(e.pointerId);
    } catch {}
  }, []);

  const onWheel = useCallback(
    (e) => {
      // scroll wheel changes tab (snappy)
      const now = Date.now();
      if (now - wheelCooldownRef.current < 250) return;
      wheelCooldownRef.current = now;

      const dir = e.deltaY > 0 ? 1 : -1;
      const idx = TABS.findIndex((x) => x.key === activeKey);
      const next = TABS[mod(idx + dir, TABS.length)];
      setActiveKey(next.key);
      setHoverKey(null);
    },
    [activeKey]
  );

  const onNodeEnter = useCallback((key) => {
    setHoverKey(key);
    const tab = TABS.find((x) => x.key === key) || TABS[0];
    ballAngleTargetRef.current = tab.angleDeg;
    beamTargetRef.current = Math.max(beamTargetRef.current, 0.85);
  }, []);

  const onNodeClick = useCallback((key) => {
    setActiveKey(key);
    setHoverKey(null);
    const tab = TABS.find((x) => x.key === key) || TABS[0];
    ballAngleTargetRef.current = tab.angleDeg;
    beamTargetRef.current = 0.9;
  }, []);

  const ctaViewAll = t("sections.seeMore", { defaultValue: "View all" });
  const ctaDownload = t("downloadPdf", { defaultValue: "Download PDF" });

  return (
    <section className="aboutX" id="about" aria-label={t("title", { defaultValue: "ABOUT" })}>
      <header className="aboutX__header">
        <div className="aboutX__kicker">{bioKicker}</div>
        <h2 className="aboutX__title">{t("title", { defaultValue: "ABOUT" })}</h2>
        <p className="aboutX__lead">{bioLead}</p>
      </header>

      {/* Row A: stack strip aligned to the right */}
      <div className="aboutX__topRow">
        <div className="aboutX__topSpacer" />
        <div className="holoStrip aboutX__strip">
          <div className="aboutX__stripLabel">{t("stack.title", { defaultValue: "Stack" })}</div>
          <div className="aboutX__stripChips" aria-label="Stack preview">
            {(skillsByTab[displayKey] || []).slice(0, 5).map((s) => (
              <span key={s} className="aboutX__stripChip">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Row B: left panels / center wheel / right image */}
      <div className="aboutX__layout">
        {/* LEFT ZONE (transparent wrapper; panels are separate holo screens) */}
        <div className="aboutX__leftZone">
          {/* Bio panel */}
          <div className="holoPanel aboutX__bioPanel">
            <div className="aboutX__bioTop">
              <div className="aboutX__bioTitle">{bioTitle}</div>
              <div className="aboutX__bioSub">{taglines?.[displayKey] ?? ""}</div>
            </div>
            <p className="aboutX__bioText">{bioLead}</p>
          </div>

          {/* XP panel */}
          <div className="holoPanel aboutX__xpPanel">
            <div className="aboutX__xpHeader">
              <div className="aboutX__xpTitle">{expTitle}</div>

              <div className="aboutX__xpActions">
                <button type="button" className="aboutX__btn" onClick={() => setIsModalOpen(true)}>
                  {ctaViewAll}
                </button>
                <a className="aboutX__btn isGhost" href={pdfHref} download>
                  {ctaDownload}
                </a>
              </div>
            </div>

            {/* Stylish arrow rail (CSS will handle) */}
            <div className="aboutX__timelineArrow" aria-hidden="true" />

            {/* Horizontal scroll timeline */}
            <div className="aboutX__timelineH" role="list" aria-label="Experience timeline">
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

        {/* CENTER: wheel */}
        <div className="aboutX__center">
          <div className="aboutX__wheelStage">
            <div
              className="aboutX__core"
              ref={coreRef}
              role="application"
              aria-label="About wheel"
              onPointerMove={onPointerMove}
              onPointerLeave={onPointerLeave}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onWheel={onWheel}
            >
              <div className="aboutX__ring" aria-hidden="true" />
              <div className="aboutX__beam" aria-hidden="true" />

              {/* nodes */}
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
                    onBlur={() => setHoverKey(null)}
                    onClick={() => onNodeClick(tab.key)}
                    aria-label={tabLabel(tab.key)}
                  >
                    <span className="aboutX__nodeGlow" aria-hidden="true" />
                    <span className="aboutX__icon" aria-hidden="true">
                      <TabIcon tabKey={tab.key} />
                    </span>
                  </button>
                );
              })}

              {/* rolling ball */}
              <div className="aboutX__ball" aria-hidden="true">
                <div className="aboutX__ballSpec" />
              </div>

              {/* center text */}
              <div className="aboutX__centerLabel" aria-hidden="true">
                <div className="aboutX__centerTop">{t("title", { defaultValue: "ABOUT" })}</div>
                <div className="aboutX__centerSub">{tabLabel(displayKey)}</div>
              </div>
            </div>

            <div className="aboutX__hint">{t("playHint", { defaultValue: "Play with me" })}</div>
          </div>
        </div>

        {/* RIGHT: image panel */}
        <div className="aboutX__visual">
          <div className="holoPanel aboutX__visualPanel">
            <div className="aboutX__visualWrap">
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <img
                src={imagesByTab?.[displayKey] || imagesByTab?.web}
                alt={t("aboutVisualAlt", { defaultValue: "About visual" })}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </div>

            {/* Optional small caption */}
            <div className="aboutX__visualCaption">
              <span className="aboutX__visualKicker">{t("bio.pills.location", { defaultValue: "Brussels" })}</span>
              <span className="aboutX__visualDot" aria-hidden="true">
                •
              </span>
              <span className="aboutX__visualKicker">{t("bio.pills.stack", { defaultValue: "React / Three.js" })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: clean “View all” */}
      {isModalOpen && (
        <div
          className="aboutX__modalOverlay"
          role="dialog"
          aria-modal="true"
          onKeyDown={(e) => {
            if (e.key === "Escape") closeModal();
          }}
        >
          <button className="aboutX__modalBackdrop" aria-label="Close" onClick={closeModal} />

          <div className="aboutX__modal">
            <div className="aboutX__modalTop">
              <div className="aboutX__modalTitle">
                {t("title", { defaultValue: "ABOUT" })} — {tabLabel(displayKey)}
              </div>
              <button type="button" className="aboutX__btn isGhost" onClick={closeModal}>
                {t("close", { defaultValue: "Close" })}
              </button>
            </div>

            <div className="aboutX__modalBody">
              <section className="aboutX__modalBlock">
                <div className="aboutX__modalKicker">{bioKicker}</div>
                <div className="aboutX__modalLead">{bioLead}</div>
              </section>

              <section className="aboutX__modalBlock">
                <div className="aboutX__modalKicker">{expTitle}</div>
                <ol className="aboutX__modalList">
                  {expItems.map((it, i) => (
                    <li key={`${it.key}-${i}`}>
                      <strong>{it.bold}</strong> {it.text}
                    </li>
                  ))}
                </ol>
              </section>

              <section className="aboutX__modalBlock">
                <div className="aboutX__modalKicker">{t("stack.title", { defaultValue: "Stack" })}</div>
                <div className="aboutX__modalChips">
                  {(skillsByTab[displayKey] || []).map((s) => (
                    <span className="aboutX__chip" key={s}>
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <div className="aboutX__modalFooter">
              <a className="aboutX__btn" href="/#projects">
                {t("buttons.portfolio", { defaultValue: "View Portfolio" })}
              </a>
              <a className="aboutX__btn isGhost" href={pdfHref} download>
                {ctaDownload}
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
