// src/Components/Home/HomeOverlay/parts/ScrollHint.jsx
import React, { useCallback } from "react";

export default function ScrollHint({ visible = true }) {
  const scrollToAboutStart = useCallback(() => {
    const el = document.getElementById("about");
    if (!el) return;

    try {
      window.history.replaceState({}, "", "/#about");
    } catch {}

    // ✅ stable: wait 2 frames then scroll
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
      });
    });
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      scrollToAboutStart();
    }
  };

  return (
    <div className={`homeOverlay__scrollHint ${visible ? "isVisible" : ""}`}>
      <button
        type="button"
        className="homeOverlay__scrollCircle"
        onClick={scrollToAboutStart}
        onKeyDown={handleKeyDown}
        aria-label="Scroll to About section"
      >
        <span className="homeOverlay__scrollIcon" aria-hidden="true">
          <svg
            className="homeOverlay__scrollChevronSvg"
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="agChevronGrad"
                x1="6"
                y1="8"
                x2="58"
                y2="56"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#00F5FF" />
                <stop offset="35%" stopColor="#7C3AED" />
                <stop offset="70%" stopColor="#5B8CFF" />
                <stop offset="100%" stopColor="#FF00AA" />
              </linearGradient>

              <filter id="agChevronGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="2.4" result="b" />
                <feColorMatrix
                  in="b"
                  type="matrix"
                  values="
                    1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 0.85 0"
                  result="g"
                />
                <feMerge>
                  <feMergeNode in="g" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g
              fill="none"
              stroke="url(#agChevronGrad)"
              strokeWidth="4.5"
              strokeLinecap="butt"
              strokeLinejoin="miter"
              filter="url(#agChevronGlow)"
              opacity="0.95"
            >
              <path d="M16 18 L32 34 L48 18" />
              <path d="M16 42 L32 58 L48 42" />
            </g>
          </svg>
        </span>
      </button>
    </div>
  );
}
