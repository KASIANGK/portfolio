// src/Components/Projects/ProjectsMasonryMessy.jsx
import { useEffect, useMemo, useState, useCallback, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./ProjectsMasonryMessy.css";
import useBoot from "../../hooks/useBoot";
import useMountLog from "../../utils/useMountLog";

const TABS = [
  { key: "all", i18nKey: "tabs.all", iconSrc: "/icons/all.svg" },
  { key: "web", i18nKey: "tabs.web", iconSrc: "/icons/web.svg" },
  { key: "3d", i18nKey: "tabs.threeD", iconSrc: "/icons/threed.svg" },
];

/* 6 cards layout (was FAN7) */
const FAN6 = [
  { x: -290, y: 22, r: -9, s: 0.95, rx: 1.1, ry: -3.4, tz: -22 },
  { x: -175, y: 16, r: -4, s: 0.98, rx: 0.8, ry: -2.2, tz: -12 },
  { x: -40, y: 10, r: -1, s: 1.0, rx: 0.6, ry: -0.9, tz: 6 },
  { x: 110, y: 10, r: 2, s: 1.02, rx: 0.6, ry: 1.2, tz: 14 },
  { x: 235, y: 18, r: 6, s: 0.98, rx: 0.9, ry: 2.8, tz: -4 },
  { x: 330, y: 26, r: 10, s: 0.95, rx: 1.2, ry: 4.2, tz: -16 },
];

const EMPTY = Object.freeze({ web: [], threeD: [], all: [] });

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
  // if (v.includes("event")) return "events";
  return "web";
}

/* ------------------------------
   NEW: supports web images object {laptop, tablet, mobile}
-------------------------------- */
function isImagesObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}
function pickFirst(arr) {
  return Array.isArray(arr) && arr.length ? arr[0] : "";
}
function pickCoverImage(p, categoryHint) {
  const img = p?.images;

  // ✅ new format object
  if (isImagesObject(img)) {
    // if you want to be strict:
    // if (categoryHint && categoryHint !== "web") return "";
    return (
      pickFirst(img.laptop) ||
      pickFirst(img.tablet) ||
      pickFirst(img.mobile) ||
      ""
    );
  }

  // ✅ old format array
  if (Array.isArray(img)) return pickFirst(img);

  return "";
}

function normalizeBucket(bucket, activeTab) {
  const arr = Array.isArray(bucket) ? bucket : [];
  return arr.map((p) => {
    const inferred = inferCategory(p);
    const category = activeTab === "all" ? inferred : activeTab;

    return {
      id: p.id,
      title: p.title,
      subtitle: p.description,
      category,
      href: p.link,
      // ✅ web now uses laptop[0] if object format exists
      image: pickCoverImage(p, category),
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

function useIsMobile(breakpoint = 742) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}

function ProjectsMasonryMessy({
  title,
  subtitle,
  jsonUrl,
  onItemClick,
}) {
  useMountLog("ProjectsMasonryMessy");

  const { t, i18n } = useTranslation("projects");
  const navigate = useNavigate();

  const lang = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];
  const base = import.meta.env.BASE_URL || "/";
  const effectiveJsonUrl = jsonUrl || `${base}locales/${lang}/projects_home.json`;

  const uiTitle = title ?? t("title");
  const uiSubtitle = subtitle ?? t("subtitle");

  const boot = useBoot();

  const [active, setActive] = useState("all");
  const [hoverTab, setHoverTab] = useState(null);
  const effectiveTab = hoverTab ?? active;
  const lastHoverTabRef = useRef(null);
  const [data, setData] = useState(EMPTY);
  const sectionRef = useRef(null);

  // loaded = "pixels stable" (decode done)
  const [loaded, setLoaded] = useState(false);

  // hover vs lock (premium behavior)
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [lockedIdx, setLockedIdx] = useState(null);
  const [pinnedIdx, setPinnedIdx] = useState(null);
  const isCompact = useIsMobile(742);

  // reset lock when tab changes
  useEffect(() => {
    setHoveredIdx(null);
    setPinnedIdx(null);
    setLockedIdx(null);
  }, [active]);

  // priority: locked > pinned > hovered
  const topIdx = lockedIdx ?? pinnedIdx ?? hoveredIdx;

  const OVERLAP = useMemo(() => new Set([2, 3]), []);

  // bootHasProjects = stable boolean
  const bootHasProjects = useMemo(() => {
    const b = boot?.projectsHome;
    if (!b) return false;
    const total =
      (b.web?.length || 0) + (b.threeD?.length || 0) + (b.all?.length || 0);
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
        all: Array.isArray(b.all) ? b.all : [],
      });
      return;
    }

    let alive = true;
    const ac = new AbortController();

    (async () => {
      try {
        const res = await fetch(effectiveJsonUrl, {
          signal: ac.signal,
          cache: "no-store", // dev safe
        });
        if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${effectiveJsonUrl}`);
        const json = await res.json();
        if (!alive) return;

        sourceSetRef.current = true;
        setData({
          web: Array.isArray(json?.web) ? json.web : [],
          threeD: Array.isArray(json?.threeD) ? json.threeD : [],
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
  }, [bootHasProjects, boot, effectiveJsonUrl]);

  /* ------------------------------
     2) Current stack
  ------------------------------ */
  const currentList = useMemo(() => {
    const key = tabToJsonKey(effectiveTab);
    return Array.isArray(data?.[key]) ? data[key] : [];
  }, [data, effectiveTab]);
  

  const normalized = useMemo(
    () => normalizeBucket(currentList, effectiveTab),
    [currentList, effectiveTab]
  );
  
  // ✅ 6 cards on desktop (was 7)
  const stack = useMemo(
    () => normalized.slice(0, isCompact ? 4 : 6),
    [normalized, isCompact]
  );
  const goToPortfolio = useCallback(
    (tabKey) => {
      const map = { all: "all", web: "web", "3d": "3d" };
      const filter = map[tabKey] || "all";
      navigate(`/portfolio?filter=${filter}`);
    },
    [navigate]
  );
  
  /* ------------------------------
     3) Decode ONCE before loaded=true
     - decode 6 covers from ALL bucket
     - supports new web images format
  ------------------------------ */
  const didDecodeOnceRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (didDecodeOnceRef.current) return;

    const total =
      (data?.all?.length || 0) +
      (data?.web?.length || 0) +
      (data?.threeD?.length || 0);
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

    // ✅ 6 items (was 7)
    const first = (Array.isArray(data?.all) ? data.all : []).slice(0, 6);

    // ✅ uses laptop[0] when needed
    const imgs = first
      .map((p) => pickCoverImage(p, inferCategory(p)))
      .filter(Boolean)
      .slice(0, 6);

    didDecodeOnceRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        await Promise.all(
          imgs.map((src, i) => decodeImage(src, i < 2 ? "high" : "auto"))
        );
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
      if (onItemClick) return onItemClick(it);
      if (it?.href) window.open(it.href, "_blank", "noopener,noreferrer");
    },
    [onItemClick]
  );
  useEffect(() => {
    if (isCompact) return;
    const el = sectionRef.current;
    if (!el) return;
  
    const onLeave = () => {
      setHoverTab(null);
      lastHoverTabRef.current = null;
      setActive("all"); // ✅ reset only when leaving the whole section
    };
  
    el.addEventListener("mouseleave", onLeave);
    return () => el.removeEventListener("mouseleave", onLeave);
  }, [isCompact]);
  
  return (
    <section ref={sectionRef} className="pm2" aria-label="Projects section">
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
              const p = FAN6[idx] || FAN6[FAN6.length - 1];

              const seed = hash01(it.id || it.title || idx);
              const seed2 = hash01((it.title || "") + "_b");

              let x = p.x + (seed - 0.5) * 22;
              let y = p.y + (seed2 - 0.5) * 16;
              let rot = p.r + (seed - 0.5) * 4.2;
              let scale = Math.max(
                0.88,
                Math.min(1.06, p.s + (seed2 - 0.5) * 0.03)
              );

              if (isCompact) {
                if (idx === 0) x += 220;
                if (idx === 1) x += 180;
                if (idx === 2) x += 190;
                if (idx === 3) {
                  x += 180;
                  y += 40;
                }
                y -= 6;
                rot *= 0.92;
              }

              let z = 100 - Math.round(Math.abs(p.x) / 6);

              if (!OVERLAP.has(idx)) {
                x *= 1.06;
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

              if (idx === 1) y += 10;
              if (idx === 2) {
                y += 10;
                x -= 45;
                rot += 4;
              }
              if (idx === 3) {
                y -= 4;
                x -= 20;
              }
              if (idx === 4) {
                x -= 20;
              }
              if (idx === 5) rot -= 6;

              const isTop = topIdx === idx;
              const isLocked = lockedIdx === idx; // kept if you re-add locking later
              const isPinned = pinnedIdx === idx;

              return (
                <button
                  key={it.id || it.title || idx}
                  className={`pm2__card pm2__card--poster
                    ${isTop ? "isTop" : ""}
                    ${isPinned ? "isPinned" : ""}
                    ${isLocked ? "isLocked" : ""}`}
                  type="button"
                  onMouseEnter={() => {
                    setHoveredIdx(idx);
                    setPinnedIdx(idx); 
                  }}
                  onMouseLeave={() => {
                    setHoveredIdx(null); 
                  }}
                  onFocus={() => {
                    setHoveredIdx(idx);
                    setPinnedIdx(idx);
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
                  onClick={() => handleCardClick(it)}
                  style={{
                    "--x": `${x}px`,
                    "--y": `${y}px`,
                    "--rot": `${rot}deg`,
                    "--s": scale,
                    "--z": z,
                    "--rx": `${rx}deg`,
                    "--ry": `${ry}deg`,
                    "--tz": `${tz}px`,
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
                <div className="pm2__emptyTitle">{t("emptyTitle")}</div>
                <div className="pm2__emptySub">{t("emptySub")}</div>
              </div>
            ) : null}
          </div>

          {/* RIGHT : title + tabs */}
          <aside className="pm2__right" aria-label="Projects controls">
            <div className="pm2__panel">
              <h2 className="pm2__title">{uiTitle}</h2>
              <div className="pm2__optionCard">
                {/* <p className="pm2__subtitle">{uiSubtitle}</p> */}

                <div className="pm2__tabs" role="tablist" aria-label="Project categories">
                  {TABS.map((tab) => {
                    const isOn = active === tab.key;
                    return (
                      <button
                        key={tab.key}
                        role="tab"
                        aria-selected={active === tab.key}
                        className={`pm2__tab ${active === tab.key ? "isActive" : ""} ${hoverTab === tab.key ? "isHover" : ""}`}
                        type="button"
                        onMouseEnter={() => {
                          if (isCompact) return;
                          setHoverTab(tab.key);
                          lastHoverTabRef.current = tab.key;
                        }}
                        onMouseLeave={() => {
                          if (isCompact) return;

                          // ✅ commit la sélection au "release" du hover
                          const last = lastHoverTabRef.current;
                          if (last) setActive(last);

                          setHoverTab(null);
                          lastHoverTabRef.current = null;
                        }}
                        onFocus={() => {
                          if (isCompact) return;
                          setHoverTab(tab.key);
                          lastHoverTabRef.current = tab.key;
                        }}
                        onBlur={() => {
                          if (isCompact) return;
                          const last = lastHoverTabRef.current;
                          if (last) setActive(last);
                          setHoverTab(null);
                          lastHoverTabRef.current = null;
                        }}
                        onClick={() => {
                          // ✅ click = navigation (comme maintenant)
                          goToPortfolio(tab.key);
                        }}
                      >
                        <span className="pm2__tabIcon" aria-hidden="true">
                          <img
                            className="pm2__tabIconImg"
                            src={tab.iconSrc}
                            alt=""
                            draggable="false"
                          />
                        </span>
                        <span className="pm2__tabLabel">{t(tab.i18nKey)}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="pm2__subtitle">{uiSubtitle}</p>

              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default memo(ProjectsMasonryMessy);
