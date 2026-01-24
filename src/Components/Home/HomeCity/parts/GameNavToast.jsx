// src/Components/Home/HomeCity/parts/GameNavToast.jsx
import React, { useEffect, useRef, useState } from "react";
import "../style/StepsHomeCity.css"; // OK (ou GameNavToast.css si tu veux)

export default function GameNavToast({ show }) {
  const [visible, setVisible] = useState(false);
  const tRef = useRef(null);

  useEffect(() => {
    // reset si show retombe
    if (!show) {
      setVisible(false);
      if (tRef.current) window.clearTimeout(tRef.current);
      tRef.current = null;
      return;
    }

    // show -> popup 3s
    setVisible(true);
    if (tRef.current) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(() => setVisible(false), 3000);

    return () => {
      if (tRef.current) window.clearTimeout(tRef.current);
      tRef.current = null;
    };
  }, [show]);

  if (!visible) return null;

  return (
    <div className="agGameNavToast" role="status" aria-live="polite">
      <div className="agGameNavToast__badge">
        <span className="agGameNavToast__dot" aria-hidden="true" />
        TIP://NAV
      </div>

      <div className="agGameNavToast__txt">
        Besoin d’un repère ? La <b>Game Nav</b> est là. <span className="agGameNavToast__mono">(Oui, c’est légal.)</span>
      </div>

      <div className="agGameNavToast__scan" aria-hidden="true" />
    </div>
  );
}
