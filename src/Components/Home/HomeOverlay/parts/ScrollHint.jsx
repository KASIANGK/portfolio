// src/Components/Home/HomeOverlay/parts/ScrollHint.jsx
import React from "react";

export default function ScrollHint({ visible }) {
  return (
    <div className={`homeOverlay__scrollHint ${visible ? "isVisible" : ""}`}>
      <div className="homeOverlay__scrollCircle">
        <span className="homeOverlay__scrollArrow">↓</span>
      </div>
    </div>
  );
}
