// src/Components/Projects/ProjectsMasonryMessy.jsx
import { useEffect, useMemo, useState, useCallback, useRef, memo } from "react";
import "./ProjectsMasonryMessy.css";
import useBoot from "../../hooks/useBoot";
import useMountLog from "../../utils/useMountLog";

const TABS = [
  { key: "all", label: "All", icon: "✦" },
  { key: "web", label: "Web", icon: "⌬" },
  { key: "3d", label: "3D", icon: "⬡" },
  { key: "events", label: "Events", icon: "⟡" },
];

const FAN7 = [
  { x: -310, y: 140, r: -14, s: 0.92, rx: 2.0, ry: -6.0, tz: -30 },
  { x: -190, y: 80, r: -7, s: 0.96, rx: 1.5, ry: -4.0, tz: -18 },
  { x: -55, y: 40, r: -2, s: 1.0, rx: 1.0, ry: -2.0, tz: 5 },
  { x: 35, y: 30, r: 3, s: 1.02, rx: 0.8, ry: 1.8, tz: 18 },
  { x: 130, y: 55, r: 7, s: 1.0, rx: 1.2, ry: 3.6, tz: 8 },
  { x: 230, y: 95, r: 12, s: 0.96, rx: 1.8, ry: 5.0, tz: -10 },
  { x: 340, y: 150, r: 18, s: 0.92, rx: 2.2, ry: 6.4, tz: -26 },
];

const EMPTY = Object.freeze({ web: [], threeD: [], events: [], all: [] });

function hash01(str) {
  let h = 2166136261;
  const s = String(str ?? "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function tabToJsonKey(tab) {
  if (tab === "3d") return "threeD";
  return tab;
}

function inferCategory(p) {
  const v = String(p?.function || "").toLowerCase();
  if (v.includes("3d")) return "3d";
  if (v.includes("event")) return "events";
  return "web";
}

function normalizeBucket(bucket, activeTab) {
  const arr = Array.isArray(bucket) ? bucket : [];
  return arr.map((p) => {
    const imgs = Array.isArray(p.images) ? p.images : [];
    return {
      id: p.id,
      title: p.title,
      subtitle: p.description,
      category: activeTab === "all" ? inferCategory(p) : activeTab,
      href: p.link,
      image: imgs[0] || "",
    };
  });
}

/** Decode best-effort (resolves even on error). */
function decodeImage(src, fetchPriority = "auto") {
  return new Promise((resolve) => {
    if (!src) return resolve(false);

    const img = new Image();
    img.decoding = "async";
    try {
      img.fetchPriority = fetchPriority; // may be ignored by some browsers
    } catch {}

    const done = () => resolve(true);

    img.onload = () => {
      if (img.decode) img.decode().then(done).catch(done);
      else done();
    };
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

function ProjectsMasonryMessy({
  title = "Projects",
  subtitle = "Pick a lane. Or pick them all.",
  jsonUrl = "/projects_home.json",
  onItemClick,
}) {
  useMountLog("ProjectsMasonryMessy");

  const boot = useBoot();

  const [active, setActive] = useState("all");
  const [data, setData] = useState(EMPTY);

  // loaded = "pixels stable" (decode done)
  const [loaded, setLoaded] = useState(false);

  // hover vs lock (premium behavior)
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [lockedIdx, setLockedIdx] = useState(null);
  const [pinnedIdx, setPinnedIdx] = useState(null); 

  // reset lock when tab changes
  useEffect(() => {
    setHoveredIdx(null);
    setPinnedIdx(null);
    setLockedIdx(null);
  }, [active]);

  // priority: locked > pinned > hovered
  const topIdx = lockedIdx ?? pinnedIdx ?? hoveredIdx;

  const OVERLAP = useMemo(() => new Set([2, 3, 4]), []);

  // bootHasProjects = stable boolean
  const bootHasProjects = useMemo(() => {
    const b = boot?.projectsHome;
    if (!b) return false;
    const total =
      (b.web?.length || 0) +
      (b.threeD?.length || 0) +
      (b.events?.length || 0) +
      (b.all?.length || 0);
    return total > 0;
  }, [boot]);

  /* ------------------------------
     1) Choose source ONCE
  ------------------------------ */
  const sourceSetRef = useRef(false);

  useEffect(() => {
    if (sourceSetRef.current) return;

    if (bootHasProjects) {
      sourceSetRef.current = true;
      const b = boot.projectsHome;

      setData({
        web: Array.isArray(b.web) ? b.web : [],
        threeD: Array.isArray(b.threeD) ? b.threeD : [],
        events: Array.isArray(b.events) ? b.events : [],
        all: Array.isArray(b.all) ? b.all : [],
      });
      return;
    }

    let alive = true;
    const ac = new AbortController();

    (async () => {
      try {
        const res = await fetch(jsonUrl, { signal: ac.signal, cache: "force-cache" });
        const json = await res.json();
        if (!alive) return;

        sourceSetRef.current = true;
        setData({
          web: Array.isArray(json?.web) ? json.web : [],
          threeD: Array.isArray(json?.threeD) ? json.threeD : [],
          events: Array.isArray(json?.events) ? json.events : [],
          all: Array.isArray(json?.all) ? json.all : [],
        });
      } catch (e) {
        if (!alive) return;
        if (e?.name === "AbortError") return;
        sourceSetRef.current = true;
        setData(EMPTY);
      }
    })();

    return () => {
      alive = false;
      ac.abort();
    };
  }, [bootHasProjects, boot, jsonUrl]);

  /* ------------------------------
     2) Current stack
  ------------------------------ */
  const currentList = useMemo(() => {
    const key = tabToJsonKey(active);
    return Array.isArray(data?.[key]) ? data[key] : [];
  }, [data, active]);

  const normalized = useMemo(() => normalizeBucket(currentList, active), [currentList, active]);
  const stack = useMemo(() => normalized.slice(0, 7), [normalized]);

  /* ------------------------------
     3) Decode ONCE before loaded=true
     - decode 7 covers from ALL bucket
     - avoids "image build" on first paint
  ------------------------------ */
  const didDecodeOnceRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (didDecodeOnceRef.current) return;

    const total =
      (data?.all?.length || 0) +
      (data?.web?.length || 0) +
      (data?.threeD?.length || 0) +
      (data?.events?.length || 0);

    if (!total) {
      didDecodeOnceRef.current = true;
      setLoaded(true);
      try {
        if (!window.__AG_PRJ_READY__) {
          window.__AG_PRJ_READY__ = true;
          window.dispatchEvent(new Event("ag:projectsReady"));
        }
      } catch {}
      return;
    }

    const first = (Array.isArray(data?.all) ? data.all : []).slice(0, 7);
    const imgs = first
      .map((p) => (Array.isArray(p?.images) ? p.images[0] : ""))
      .filter(Boolean)
      .slice(0, 7);

    didDecodeOnceRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        await Promise.all(imgs.map((src, i) => decodeImage(src, i < 2 ? "high" : "auto")));
      } catch {
        // best effort
      }
      if (cancelled) return;

      setLoaded(true);
      try {
        if (!window.__AG_PRJ_READY__) {
          window.__AG_PRJ_READY__ = true;
          window.dispatchEvent(new Event("ag:projectsReady"));
        }
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [data]);

  /* ------------------------------
     Actions
  ------------------------------ */
  const handleCardClick = useCallback(
    (it) => {
      // click toggles lock first (premium behavior)
      // if you want click to OPEN instead, move lock to separate UI
      if (onItemClick) return onItemClick(it);
      if (it?.href) window.open(it.href, "_blank", "noopener,noreferrer");
    },
    [onItemClick]
  );

  const toggleLock = useCallback((idx) => {
    setLockedIdx((prev) => (prev === idx ? null : idx));
  }, []);

  return (
    <section className="pm2" aria-label="Projects section">
      <div className="pm2__row">
        {/* LEFT : stacked posters */}
        <div className="pm2__left" aria-label="Project previews">
          <div className={`pm2__stack ${loaded ? "isLoaded" : ""}`}>
            {!loaded && (
              <div className="pm2__veil" aria-hidden="true">
                <div className="pm2__veilScan" />
                <div className="pm2__veilShine" />
              </div>
            )}
            {stack.map((it, idx) => {
              const p = FAN7[idx] || FAN7[FAN7.length - 1];

              const seed = hash01(it.id || it.title || idx);
              const seed2 = hash01((it.title || "") + "_b");

              let x = p.x + (seed - 0.5) * 22;
              let y = p.y + (seed2 - 0.5) * 16;
              let rot = p.r + (seed - 0.5) * 4.2;
              let scale = Math.max(0.88, Math.min(1.06, p.s + (seed2 - 0.5) * 0.03));

              let z = 100 - Math.round(Math.abs(p.x) / 6);

              if (!OVERLAP.has(idx)) {
                x *= 1.18;
                y += 18;
                z -= 25;
              } else {
                x *= 0.78;
                y -= 10;
                z += 40;
              }

              const rx = p.rx + (seed2 - 0.5) * 1.0;
              const ry = p.ry + (seed - 0.5) * 1.3;
              const tz = p.tz + (seed2 - 0.5) * 10;

              const isTop = topIdx === idx;
              const isLocked = lockedIdx === idx;
              const isPinned = pinnedIdx === idx;

              return (
                <button
                  key={it.id || it.title || idx}
                  className={`pm2__card pm2__card--poster
                    ${isTop ? "isTop" : ""}
                    ${isPinned ? "isPinned" : ""}
                    ${isLocked ? "isLocked" : ""}`}
                  type="button"
                  // onMouseEnter={() => setHoveredIdx(idx)}
                  // onMouseLeave={() => setHoveredIdx(null)}
                  // onFocus={() => setHoveredIdx(idx)}
                  // onBlur={() => setHoveredIdx(null)}
                  onMouseEnter={() => {
                    setHoveredIdx(idx);
                    setPinnedIdx(idx);     // ✅ reste top après sortie
                  }}
                  onMouseLeave={() => {
                    setHoveredIdx(null);   // ✅ mais ne retire PAS pinned
                  }}
                  onFocus={() => {
                    setHoveredIdx(idx);
                    setPinnedIdx(idx);     // ✅ clavier = pareil
                  }}
                  onBlur={() => {
                    setHoveredIdx(null);
                  }}
                  
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setPinnedIdx(null);
                      setLockedIdx(null);
                    }
                  }}
                  onClick={() => {
                    handleCardClick(it);
                  }}
                  style={{
                    "--x": `${x}px`,
                    "--y": `${y}px`,
                    "--rot": `${rot}deg`,
                    "--s": scale,
                    "--z": z,                 // ✅ z de base
                    "--rx": `${rx}deg`,
                    "--ry": `${ry}deg`,
                    "--tz": `${tz}px`,
                    // "--liftY": isLocked ? "-10px" : isTop ? "-6px" : "0px",
                    // "--liftZ": isLocked ? "70px" : isTop ? "40px" : "0px",
                    // "--liftS": isLocked ? "1.06" : isTop ? "1.03" : "1",
                    "--liftY": isLocked ? "-12px" : isTop ? "-10px" : "0px",
                    "--liftZ": isLocked ? "90px" : isTop ? "70px" : "0px",
                    "--liftS": isLocked ? "1.07" : isTop ? "1.05" : "1",

                  }}
                >
                  <div className="pm2__imgWrap" aria-hidden="true">
                    {it.image ? (
                      <img
                        src={it.image}
                        alt=""
                        draggable="false"
                        decoding="async"
                        loading={idx < 2 ? "eager" : "lazy"}
                        width="140"
                        height="150"
                        fetchPriority={idx < 2 ? "high" : "auto"}
                      />
                    ) : (
                      <div className="pm2__imgFallback" />
                    )}
                  </div>
                </button>
              );
            })}

            {!stack.length && loaded ? (
              <div className="pm2__empty">
                <div className="pm2__emptyTitle">No items here</div>
                <div className="pm2__emptySub">Try another tab ✦</div>
              </div>
            ) : null}
          </div>
        </div>

        {/* RIGHT : title + tabs */}
        <aside className="pm2__right" aria-label="Projects controls">
          <div className="pm2__panel">
            <div className="pm2__panelFx" aria-hidden="true" />
            <h2 className="pm2__title">{title}</h2>
            <p className="pm2__subtitle">{subtitle}</p>

            <div className="pm2__tabs" role="tablist" aria-label="Project categories">
              {TABS.map((t) => {
                const isOn = active === t.key;
                return (
                  <button
                    key={t.key}
                    role="tab"
                    aria-selected={isOn}
                    className={`pm2__tab ${isOn ? "isActive" : ""}`}
                    type="button"
                    onClick={() => setActive(t.key)}
                  >
                    <span className="pm2__tabIcon" aria-hidden="true">
                      {t.icon}
                    </span>
                    <span className="pm2__tabLabel">{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pm2__hint">
              <span className="pm2__hintDot" aria-hidden="true" />
              {active === "all" ? (
                <span>Showing everything.</span>
              ) : (
                <span>
                  Filtered: <b>{active}</b>
                </span>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default memo(ProjectsMasonryMessy);

