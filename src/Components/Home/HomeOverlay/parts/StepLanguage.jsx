// src/Components/Home/HomeOverlay/parts/StepLanguage.jsx
import React from "react";

export default function StepLanguage({
  isActive,
  t,
  LANGS,
  langActiveIndex,
  selectedLang,
  onPickLanguage,
  showKbHint,
  kbHintPhase,
  continueBtnRef,
  onContinue,
  canContinue,
  isSwitchingLang,
}) {
  return (
    <section className={`homeOverlay__slide ${isActive ? "isActive" : ""}`} aria-hidden={!isActive}>
      <div className="homeOverlay__panel">
        <div className="homeOverlay__fx" aria-hidden="true">
          <div className="homeOverlay__orb" />
          <div className="homeOverlay__grid" />
        </div>
        <div className="homeOverlay__shine" aria-hidden="true" />

        <div className="homeOverlay__badge">KASIA NAGORKA://CREATIVE_TECH</div>

        <h1 className="homeOverlay__title">{t("language.title")}</h1>
        <p className="homeOverlay__subtitle">{t("language.subtitle")}</p>

        <div className="homeOverlay__langGrid" role="radiogroup" aria-label={t("a11y.languageSelector")}>
          {LANGS.map((code, idx) => {
            const isActiveBtn = idx === langActiveIndex;
            const isSelected = selectedLang === code;

            return (
              <button
                key={code}
                type="button"
                className={`homeOverlay__langBtn ${isActiveBtn ? "isActive" : ""}`}
                role="radio"
                aria-checked={isSelected}
                onClick={() => onPickLanguage(code, idx)}
              >
                <span className={`homeOverlay__chev ${isActiveBtn ? "isOn" : ""}`} aria-hidden="true">
                  &gt;
                </span>
                <span className="homeOverlay__langLabel">{t(`language.languages.${code}`)}</span>
              </button>
            );
          })}
        </div>

        <div className="homeOverlay__footer">
          <div className="homeOverlay__hintSlot">
            {isActive && showKbHint && (
              <div
                className={`homeOverlay__kbdHint ${kbHintPhase === "visible" ? "isVisible" : ""} ${
                  kbHintPhase === "hiding" ? "isHiding" : ""
                }`}
                aria-hidden={!showKbHint}
              >
                <span className="homeOverlay__kbdPill">
                  <span className="homeOverlay__kbdKey">↑</span>
                  <span className="homeOverlay__kbdKey">↓</span>
                  <span className="homeOverlay__kbdKey">←</span>
                  <span className="homeOverlay__kbdKey">→</span>
                  <span>to navigate</span>
                </span>

                <span className="homeOverlay__kbdPill">
                  <span className="homeOverlay__kbdKey">Enter</span>
                  <span className="homeOverlay__kbdKey">Space</span>
                  <span>to continue</span>
                </span>
              </div>
            )}
          </div>

          <button
            ref={continueBtnRef}
            type="button"
            className="homeOverlay__primaryBtn homeOverlay__continueBtn"
            onClick={onContinue}
            disabled={!canContinue}
          >
            {isSwitchingLang ? "..." : t("language.continue")}
          </button>
        </div>
      </div>
    </section>
  );
}
