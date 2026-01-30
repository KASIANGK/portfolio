// src/Components/Home/HomeOverlay/parts/OverlayBackground.jsx
import React from "react";

export default function OverlayBackground({ slideIndex, noAnimOnce, bgTrackRef }) {
  return (
    <>
      <div className="homeOverlay__bgViewport" aria-hidden="true">
        <div
          className={`homeOverlay__bgTrack ${noAnimOnce ? "isInstant" : ""}`}
          style={{ transform: `translateX(-${slideIndex * 100}vw)` }}
          ref={bgTrackRef}
        >
          <div className="homeOverlay__bgFrame homeOverlay__bgFrame--step1" />
          <div className="homeOverlay__bgFrame homeOverlay__bgFrame--step2" />
        </div>
      </div>

      {/* <div className="homeOverlay__noise" aria-hidden="true" />
      <div className="homeOverlay__screenFx" aria-hidden="true" /> */}
    </>
  );
}
