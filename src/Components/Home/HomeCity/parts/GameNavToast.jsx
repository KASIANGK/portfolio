// src/Components/Home/HomeCity/parts/GameNavToast.jsx
import React, { useEffect, useRef, useState } from "react";
import "./style/StepsHomeCity.css";

export default function GameNavToast() {
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const clear = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };

    const show = () => {
      clear();
      setOpen(true);

      timerRef.current = window.setTimeout(() => {
        setOpen(false);
      }, 3200);
    };

    window.addEventListener("ag:showGameNavToast", show);
    return () => {
      window.removeEventListener("ag:showGameNavToast", show);
      clear();
    };
  }, []);

  if (!open) return null;

  return (
    <div
    className="agGameNavToast"
    aria-live="polite"
    style={{
      position: "fixed",
      top: 16,
      right: 16,
      zIndex: 1000000,
      pointerEvents: "none",
    }}
    >
      TOAST TEST — IF YOU SEE THIS, IT'S MOUNTED ✅
      <div className="agGameNavToast__scan" aria-hidden="true" />
      <div className="agGameNavToast__badge">
        <span className="agGameNavToast__dot" aria-hidden="true" />
        TIP://NAV
      </div>
      <div className="agGameNavToast__txt">
        Game HUD unlocked — click <b>GAME</b> anytime.
      </div>
      <div className="agGameNavToast__txt agGameNavToast__mono">
        (top-right)
      </div>
    </div>
  );
}
