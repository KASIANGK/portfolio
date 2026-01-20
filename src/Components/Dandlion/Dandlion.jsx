import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./Dandelion.css";

const Dandelion = () => {
  const location = useLocation();

  // hide on these pages
  if (location.pathname === "/" || location.pathname === "/about" || location.pathname === "/portfolio") {
    return null;
  }

  useEffect(() => {
    const proximity = 14;
    const spawnCount = 3; // low = classy HUD
    const maxParticlesOnScreen = 60;

    // Angels / cyberpunk palette
    const palette = [
      "rgba(255, 0, 170, 0.85)",  // pink
      "rgba(124, 58, 237, 0.85)", // violet
      "rgba(255, 122, 0, 0.80)",  // orange
      "rgba(255, 255, 255, 0.55)" // white accent
    ];

    const glyphTypes = ["spark", "bracket", "tick", "chevron"];

    const hasClass = (element, className) => {
      let el = element;
      while (el) {
        if (el.classList && el.classList.contains(className)) return true;
        el = el.parentElement;
      }
      return false;
    };

    const isBlockedTarget = (target) => {
      if (!target) return true;
      const tag = target.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "BUTTON" ||
        tag === "A" ||
        tag === "UL" ||
        tag === "LI" ||
        hasClass(target, "social-icons-navbar")
      );
    };

    // rAF throttle
    let raf = null;
    let lastEvent = null;

    const spawn = (e) => {
      const target = e.target;
      if (!target || isBlockedTarget(target)) return;

      const rect = target.getBoundingClientRect();
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // only near elements (your original “proximity” logic)
      if (
        !(mouseX > rect.left - proximity && mouseX < rect.right + proximity) ||
        !(mouseY > rect.top - proximity && mouseY < rect.bottom + proximity)
      ) {
        return;
      }

      // prevent DOM spam
      const existing = document.querySelectorAll(".hud-glyph");
      if (existing.length > maxParticlesOnScreen) {
        for (let i = 0; i < Math.min(10, existing.length); i++) existing[i].remove();
      }

      for (let i = 0; i < spawnCount; i++) {
        const g = document.createElement("div");
        g.className = "hud-glyph";

        const type = glyphTypes[Math.floor(Math.random() * glyphTypes.length)];
        const color = palette[Math.floor(Math.random() * palette.length)];

        // small + sleek
        const w = 18 + Math.random() * 28;   // 18..46
        const h = 8 + Math.random() * 18;    // 8..26
        const thickness = Math.random() < 0.6 ? 1 : 2;

        const offsetX = (Math.random() - 0.5) * 14;
        const offsetY = (Math.random() - 0.5) * 14;

        // float drift
        const driftX = (Math.random() - 0.5) * 90;
        const driftY = (Math.random() - 0.5) * 90 - 30;

        const rot = (Math.random() - 0.5) * 60; // not too chaotic
        const duration = 650 + Math.random() * 650;

        g.style.left = `${mouseX + offsetX}px`;
        g.style.top = `${mouseY + offsetY}px`;
        g.style.setProperty("--g-w", `${w}px`);
        g.style.setProperty("--g-h", `${h}px`);
        g.style.setProperty("--g-t", `${thickness}px`);
        g.style.setProperty("--g-color", color);
        g.style.setProperty("--g-dx", `${driftX}px`);
        g.style.setProperty("--g-dy", `${driftY}px`);
        g.style.setProperty("--g-rot", `${rot}deg`);
        g.style.setProperty("--g-dur", `${duration}ms`);
        g.dataset.type = type;

        // tiny “scanline” phase offset
        g.style.setProperty("--g-phase", `${Math.random() * 1}s`);

        document.body.appendChild(g);
        requestAnimationFrame(() => g.classList.add("is-on"));

        window.setTimeout(() => g.remove(), duration + 80);
      }
    };

    const onMove = (e) => {
      lastEvent = e;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        if (lastEvent) spawn(lastEvent);
      });
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      document.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div className="dandelion-container" aria-hidden="true" />;
};

export default Dandelion;
