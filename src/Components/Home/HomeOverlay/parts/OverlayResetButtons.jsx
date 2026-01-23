// src/Components/Home/HomeOverlay/parts/OverlayResetButtons.jsx
import React from "react";

export default function OverlayResetButtons({ t, onResetLanguage, onResetHint, onResetStep }) {
  return (
    <>
      <button type="button" className="homeOverlay__resetBtn" onClick={onResetLanguage}>
        <span className="homeOverlay__resetIcon" aria-hidden="true">↺</span>
        <span className="homeOverlay__resetText">RESET LANGUAGE</span>
      </button>

      <button type="button" className="homeOverlay__resetBtn__Hint" onClick={onResetHint}>
        <span className="homeOverlay__resetIcon" aria-hidden="true">↺</span>
        <span className="homeOverlay__resetText">RESET HINT</span>
      </button>

      <button type="button" className="homeOverlay__resetBtn__Step" onClick={onResetStep}>
        <span className="homeOverlay__resetIcon" aria-hidden="true">↺</span>
        <span className="homeOverlay__resetText">RESET STEP1</span>
      </button>
    </>
  );
}
