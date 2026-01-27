import React from "react";

export default function ResetStepsHomeCity({ onResetSteps }) {
  return (
    <button
      type="button"
      className="homeOverlay__resetBtn__Step homeOverlay__resetBtn___HomeCity"
      onClick={onResetSteps}
    >
      <span className="homeOverlay__resetIcon" aria-hidden="true">↺</span>
      <span className="homeOverlay__resetText">RESET STEPS</span>
    </button>
  );
}
