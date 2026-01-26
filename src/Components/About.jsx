// src/Components/About/About.jsx
import React, { useMemo, useState, useCallback } from "react";
import "./About.css";

const TABS = [
  { key: "web", label: "Web Dev", icon: "⌘" },
  { key: "3d", label: "3D Artist", icon: "⬡" },
  { key: "events", label: "Events", icon: "◌" },
  { key: "all", label: "All", icon: "★" },
];

export default function About() {
  const [activeTab, setActiveTab] = useState("web");
  const [hoverTab, setHoverTab] = useState(null);

  const displayKey = hoverTab ?? activeTab;

  const content = useMemo(() => {
    switch (displayKey) {
      case "web":
        return {
          title: "Web Developer",
          bullets: [
            "React / Vite / Three.js – interfaces interactives et perf.",
            "Design systems, i18n, preload & UX “no pop”.",
            "Backend & data: APIs, JSON, DB (selon tes projets).",
          ],
          chips: ["React", "Vite", "R3F", "i18n", "Perf"],
        };

      case "3d":
        return {
          title: "3D Artist",
          bullets: [
            "Blender: modélisation, shading, rendu, optimisation.",
            "Assets pensés pour le temps réel (web / game-like).",
            "Direction artistique: cohérence, storytelling visuel.",
          ],
          chips: ["Blender", "Real-time", "DA", "Assets"],
        };

      case "events":
        return {
          title: "Events / Production",
          bullets: [
            "Expérience terrain: coordination, timing, contraintes réelles.",
            "Sens du public: flow, rythme, impact visuel.",
            "Organisation & communication (stakeholders).",
          ],
          chips: ["Coordination", "Flow", "Production"],
        };

      case "all":
      default:
        return {
          title: "Full Profile",
          bullets: [
            "Je combine dev + 3D + expérience terrain pour créer des expériences.",
            "Mon style: UI premium, interactions fun, perf solide.",
            "Objectif: projets immersifs & brand universe (Angels vibe).",
          ],
          chips: ["Creative Dev", "3D", "Product UX", "Story"],
        };
    }
  }, [displayKey]);

  const onPick = useCallback((key) => {
    setActiveTab(key);
  }, []);

  const onKeyDown = useCallback(
    (e) => {
      const idx = TABS.findIndex((t) => t.key === activeTab);
      if (idx < 0) return;

      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const dir = e.key === "ArrowRight" ? 1 : -1;
        const next = (idx + dir + TABS.length) % TABS.length;
        setActiveTab(TABS[next].key);
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        // déjà sélectionné, rien à faire (mais garde la cohérence)
      }
    },
    [activeTab]
  );

  return (
    <section className="aboutSection" id="about" aria-label="About / CV">
      <h1 className="aboutTitle">About</h1>

      <div className="essentials__about">
        <div
          className="essentials__about__nav"
          role="tablist"
          aria-label="About categories"
          onMouseLeave={() => setHoverTab(null)}
          onKeyDown={onKeyDown}
        >
          {TABS.map((t) => {
            const isActive = activeTab === t.key;
            const isHovered = hoverTab === t.key;
            const isShown = displayKey === t.key;

            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`about-panel-${t.key}`}
                className={`aboutTab ${isActive ? "isActive" : ""} ${isShown ? "isShown" : ""}`}
                onClick={() => onPick(t.key)}
                onMouseEnter={() => setHoverTab(t.key)}
                onFocus={() => setHoverTab(t.key)}
                onBlur={() => setHoverTab(null)}
              >
                <span className="aboutTab__icon" aria-hidden="true">{t.icon}</span>
                <span className="aboutTab__label">{t.label}</span>
                <span className="aboutTab__dot" aria-hidden="true" />
              </button>
            );
          })}
        </div>

        <div
          className="essentials__about__content"
          role="tabpanel"
          id={`about-panel-${displayKey}`}
          aria-live="polite"
        >
          <div className="aboutCard">
            <div className="aboutCard__head">
              <div className="aboutCard__title">{content.title}</div>
              <div className="aboutCard__chips">
                {content.chips.map((c) => (
                  <span key={c} className="aboutChip">{c}</span>
                ))}
              </div>
            </div>

            <ul className="aboutCard__list">
              {content.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>

            {/* optionnel : CTA */}
            <div className="aboutCard__foot">
              <span className="aboutHint">Tip: survole pour preview, clique pour verrouiller.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
