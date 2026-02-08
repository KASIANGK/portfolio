import { useLocation, useNavigate } from "react-router-dom";
import { memo, useCallback } from "react";

import "./Footer.css";

function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  const goHome = useCallback(() => {
    if (location.pathname === "/") {
      const el = document.getElementById("welcome");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      navigate("/");
    }
  }, [location.pathname, navigate]);

  return (
    <footer className="agFooter" aria-label="Footer">
      <div className="agFooter__wrap">
        {/* LEFT */}
        <div className="agFooter__left">
        <button
            className="agFooter__homeBtn"
            onClick={goHome}
            aria-label="Go to home"
          >
            <svg
              className="agFooter__homeIcon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M3 11.5L12 4l9 7.5M6 10.5V20h12v-9.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <span className="agFooter__name">Kasia Nagorka</span>
        </div>

        {/* CENTER */}
        <div className="agFooter__center">
          © 2026 — All rights reserved
        </div>

        {/* RIGHT */}
        <div className="agFooter__right">
          <span className="agFooter__tag">Creative Technologist</span>
        </div>
      </div>
    </footer>
  );
}

export default memo(Footer);
