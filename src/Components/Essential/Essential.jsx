// src/Components/Essential/Essential.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import "./Essential.css";
import gsap from "gsap";

const ASSETS_PREFIX = "/assets/";

function safeBootEssential() {
  try {
    return Array.isArray(window?.__AG_BOOT__?.essential) ? window.__AG_BOOT__.essential : [];
  } catch {
    return [];
  }
}

const raf = () => new Promise((r) => requestAnimationFrame(r));
const rafN = async (n = 2) => {
  for (let i = 0; i < n; i++) await raf();
};

export default function Essential({ initialItems }) {
  // source of truth: props (quand Home est prêt) sinon fallback window
  const bootItems = useMemo(() => {
    const fromProps = Array.isArray(initialItems) ? initialItems : null;
    return fromProps ?? safeBootEssential();
  }, [initialItems]);

  // ✅ state réactif (dev timing safe)
  const [items, setItems] = useState(() => bootItems || []);
  useEffect(() => {
    if (Array.isArray(bootItems) && bootItems.length) setItems(bootItems);
  }, [bootItems]);
  
  const didReady = useRef(false);

  useEffect(() => {
    if (didReady.current) return;
    if (!items?.length) return;
    didReady.current = true;
  
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("ag:essentialReady"));
      });
    });
  }, [items?.length]);
  
  const [visibleDiv, setVisibleDiv] = useState(null);
  const rootRef = useRef(null);

  // ✅ GSAP: never on first reveal, never rerun
  const didAnimRef = useRef(false);

  // ✅ READY signal (once)
  const didReadyRef = useRef(false);

  useEffect(() => {
    if (didReadyRef.current) return;
    if (!items?.length) return;
    if (!rootRef.current) return;

    didReadyRef.current = true;

    (async () => {
      // let DOM commit + paint
      await rafN(2);

      // global guard (optional but nice)
      try {
        if (!window.__AG_ESS_READY__) {
          window.__AG_ESS_READY__ = true;
          window.dispatchEvent(new Event("ag:essentialReady"));
        }
      } catch {}
    })();
  }, [items?.length]);

  const handleToggle = useCallback((id) => {
    setVisibleDiv((prev) => (prev === id ? null : id));
  }, []);

  const handleMouseLeave = useCallback(() => setVisibleDiv(null), []);

  useEffect(() => {
    if (!items?.length) return;

    const allowAnim = typeof window !== "undefined" && window.__AG_REVEAL_DONE__ === true;
    if (!allowAnim) return;

    if (didAnimRef.current) return;

    const el = rootRef.current;
    if (!el) return;

    // ✅ only animate if already near viewport (prevents “build under my eyes”)
    const rect = el.getBoundingClientRect();
    const inViewNow = rect.top < window.innerHeight * 0.85;
    if (!inViewNow) return;

    didAnimRef.current = true;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".service-card",
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          duration: 0.45,
          clearProps: "transform",
        }
      );

      gsap.fromTo(
        ".expertise-title span",
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.03,
          duration: 0.35,
          clearProps: "transform",
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, [items?.length]);

  const titleLetters = useMemo(() => "Our Expertise".split(""), []);

  if (!items?.length) {
    return (
      <div className="expertise-container-all" ref={rootRef}>
        <div className="background-image-expertise" />
        <div className="expertise-container">
          <div className="service-container">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="service-card isSkeleton" />
            ))}
          </div>
        </div>
        <div className="expertise-title">
          <h2>
            {titleLetters.map((letter, index) => (
              <span key={`${letter}-${index}`}>{letter}</span>
            ))}
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="expertise-container-all" ref={rootRef}>
      <div className="background-image-expertise" />

      <div className="expertise-container">
        <div className="service-container">
          {items.map((it, idx) => {
            const id = it?.id ?? idx;
            const isActive = visibleDiv === id;

            const eager = idx < 6;
            const src = it?.image ? `${ASSETS_PREFIX}${it.image}` : "";

            if (import.meta.env.DEV && eager && src) {
              window.__AG_DBG_ESS ??= new Set();
              if (!window.__AG_DBG_ESS.has(src)) {
                window.__AG_DBG_ESS.add(src);
                console.log("[DBG][Essential] render eager img:", src);
              }
            }

            return (
              <div
                key={id}
                className={`service-card ${isActive ? "active" : ""}`}
                onMouseLeave={handleMouseLeave}
              >
                <div className="service-image">
                  {src && (
                    <img
                      src={src}
                      alt={`Essential ${id}`}
                      loading={eager ? "eager" : "lazy"}
                      decoding={eager ? "sync" : "async"}
                      fetchPriority={eager ? "high" : "auto"}
                      draggable={false}
                    />
                  )}
                </div>

                <h3>
                  <button
                    type="button"
                    className="button-hover-effect"
                    onClick={() => handleToggle(id)}
                    aria-expanded={isActive}
                  >
                    {isActive ? "Close" : "Read more"}
                  </button>
                </h3>
              </div>
            );
          })}
        </div>
      </div>

      <div className="expertise-title">
        <h2>
          {titleLetters.map((letter, index) => (
            <span key={`${letter}-${index}`}>{letter}</span>
          ))}
        </h2>
      </div>
    </div>
  );
}
