// src/Components/Home/HomeOverlay/parts/ScrollHint.jsx
import React from "react";

export default function ScrollHint({ visible = true, onClick }) {
  const handleKeyDown = (e) => {
    if (!onClick) return;
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div className={`homeOverlay__scrollHint ${visible ? "isVisible" : ""}`}>
      <button
        type="button"
        className="homeOverlay__scrollCircle"
        onClick={onClick}
        onKeyDown={handleKeyDown}
        aria-label="Scroll to About section"
      >
        <span className="homeOverlay__scrollArrow">↓</span>
      </button>
    </div>
  );
}
