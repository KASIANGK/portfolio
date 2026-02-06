import React, { memo } from "react";
import "./Footer.css";

function Footer() {
  return (
    <footer className="agFooter" aria-label="Footer">
      <div className="agFooter__wrap">
        {/* LEFT */}
        <div className="agFooter__left">
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
