// src/Components/Navbar/Navbar.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEnvelope, FaPhoneAlt, FaInstagram, FaTwitter } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import LanguagePicker from "./LanguagePicker";
import "./Navbar.css";

/**
 * Global "intent" flag so LanguageToast can show ONLY when user changed language via Navbar.
 * LanguageToast should check:
 *   window.__AG_LANG_INTENT__?.src === "navbar"
 *   && Date.now() - window.__AG_LANG_INTENT__.at < 1200
 */
function markNavbarLangIntent() {
  if (typeof window === "undefined") return;
  if (document.documentElement.dataset.agOnboarding === "1") return;
  window.__AG_LANG_INTENT__ = { src: "navbar", at: Date.now() };
}

const MODE = {
  MENU: "menu",
  GAME: "game",
};

const LS_GAME_COLLAPSED = "ag_nav_game_collapsed_v1";

export default function Navbar() {
  const { t } = useTranslation("nav");
  const location = useLocation();
  const navigate = useNavigate();

  const [mode, setMode] = useState(MODE.MENU);

  // MENU panel open/close (classic)
  const [isOpen, setIsOpen] = useState(false);

  // GAME: always open by default, but can be collapsed (mini HUD)
  const [gameCollapsed, setGameCollapsed] = useState(() => {
    try {
      return localStorage.getItem(LS_GAME_COLLAPSED) === "1";
    } catch {
      return false;
    }
  });

  const menuRef = useRef(null);

  // Hover support only when actually available
  const canHover =
    typeof window !== "undefined" &&
    window.matchMedia?.("(hover: hover)")?.matches;

  // Touch-ish environments
  const isTouch =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(hover: none)")?.matches ||
      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));

  // Desktop hover open/close with a small delay to avoid flicker
  const closeTimerRef = useRef(null);
  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    clearCloseTimer();
    setIsOpen(true);
  }, [clearCloseTimer]);

  const closeMenu = useCallback(() => {
    clearCloseTimer();
    setIsOpen(false);
  }, [clearCloseTimer]);

  const scheduleCloseMenu = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      closeTimerRef.current = null;
    }, 140);
  }, [clearCloseTimer]);

  const toggleMenu = useCallback(() => setIsOpen((v) => !v), []);

  const toggleGameCollapsed = useCallback(() => {
    setGameCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(LS_GAME_COLLAPSED, next ? "1" : "0");
      } catch {}
      return next;
    });
  }, []);

  // Close on route change (only affects MENU hover/open)
  useEffect(() => {
    closeMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Click outside + ESC
  useEffect(() => {
    const onClick = (event) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) closeMenu();
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") closeMenu();
    };

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeMenu]);

  // Cleanup hover timer
  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  const navItems = useMemo(
    () => [
      { to: "/", key: "home" },
      { to: "/essential", key: "essential" },
      { to: "/about", key: "about" },
      { to: "/contact", key: "contact" },
      { to: "/portfolio", key: "portfolio" },
    ],
    []
  );

  // GAME items (structure similaire, contenu différent)
  const gameItems = useMemo(
    () => [
      { type: "action", key: "returnHome", label: "RETURN HOME", onClick: () => navigate("/") },
      { type: "divider" },
      { type: "info", key: "cmd_1", label: "MOVE", value: "← ↑ ↓ → / Joystick L" },
      { type: "info", key: "cmd_2", label: "LOOK", value: "Mouse / Joystick R" },
      { type: "info", key: "cmd_3", label: "ESC", value: "Release head control" },
      { type: "info", key: "cmd_4", label: "ENTER/SPACE", value: "Confirm / Continue" },
    ],
    [navigate]
  );

  // ✅ Panel open logic
  // MENU: controlled by isOpen
  // GAME: always open unless collapsed
  const panelOpen =
    mode === MODE.MENU ? isOpen : !gameCollapsed;

  const onModeClick = useCallback(
    (next) => {
      setMode(next);
      if (next === MODE.MENU) {
        // keep menu closed until user opens/hover
        // (or keep last state if you prefer)
        // setIsOpen(false);
      } else {
        // GAME mode: no need to open isOpen
        setIsOpen(false);
      }
    },
    []
  );

  return (
    <nav
      className={`navHUD ${panelOpen ? "isOpen" : ""} ${mode === MODE.GAME ? "isGame" : "isMenu"} ${gameCollapsed ? "isGameCollapsed" : ""}`}
      ref={menuRef}
      aria-label="Primary navigation"
    >
      {/* TOP BAR: MENU + GAME + collapse */}
      <div className="navHUD__topbar">
        {/* MENU button */}
        <button
          className={`navHUD__hamburger ${mode === MODE.MENU ? "isActive" : ""} ${isOpen ? "isOpen" : ""}`}
          onClick={() => {
            onModeClick(MODE.MENU);
            toggleMenu();
          }}
          aria-expanded={mode === MODE.MENU ? isOpen : false}
          aria-controls="navHUD-panel"
          type="button"
          onMouseEnter={() => {
            if (mode !== MODE.MENU) return;
            if (canHover && !isTouch) openMenu();
          }}
          onMouseLeave={() => {
            if (mode !== MODE.MENU) return;
            if (canHover && !isTouch) scheduleCloseMenu();
          }}
        >
          <span className="navHUD__hamburgerBars" aria-hidden="true">
            <span className="navHUD__bar" />
            <span className="navHUD__bar" />
            <span className="navHUD__bar" />
          </span>
          <span className="navHUD__label">{t("menu")}</span>
        </button>

        {/* GAME button */}
        <button
          className={`navHUD__gameBtn ${mode === MODE.GAME ? "isActive" : ""}`}
          type="button"
          onClick={() => onModeClick(MODE.GAME)}
          aria-pressed={mode === MODE.GAME}
        >
          <span className="navHUD__gameDot" aria-hidden="true" />
          GAME
        </button>

        {/* Collapse (only for GAME mode) */}
        <button
          className="navHUD__collapseBtn"
          type="button"
          onClick={toggleGameCollapsed}
          aria-label={gameCollapsed ? "Expand game HUD" : "Collapse game HUD"}
          title={gameCollapsed ? "Expand" : "Collapse"}
        >
          {gameCollapsed ? "»" : "«"}
        </button>
      </div>

      {/* Panel */}
      <div
        id="navHUD-panel"
        className={`navHUD__panel ${panelOpen ? "open" : ""}`}
        role="menu"
        onMouseEnter={() => {
          if (mode !== MODE.MENU) return;
          if (canHover && !isTouch) openMenu();
        }}
        onMouseLeave={() => {
          if (mode !== MODE.MENU) return;
          if (canHover && !isTouch) scheduleCloseMenu();
        }}
      >
        <div className="navHUD__panelScan" aria-hidden="true" />

        <div className="navHUD__panelTop">
          <div className="navHUD__chip">
            {mode === MODE.GAME ? "GAME HUD" : "NAV"}
          </div>
        </div>

        {/* Language picker area — we capture user intent here */}
        <div
          className="navHUD__lang"
          onPointerDownCapture={markNavbarLangIntent}
          onClickCapture={markNavbarLangIntent}
          onKeyDownCapture={(e) => {
            if (e.key === "Enter" || e.key === " ") markNavbarLangIntent();
          }}
        >
          <div className="navHUD__langLabel">{t("language")}</div>
          <LanguagePicker compact />
        </div>

        <div className="navHUD__divider" />

        {/* CONTENT SWITCH */}
        {mode === MODE.MENU ? (
          <>
            <ul className="navHUD__list" role="none">
              {navItems.map((it) => (
                <li key={it.key} role="none">
                  <Link role="menuitem" to={it.to} onClick={closeMenu}>
                    {t(`items.${it.key}`)}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="navHUD__divider" />

            <div className="navHUD__social social-icons-navbar">
              <a href="mailto:ngk.kasia@gmail.com" aria-label={t("social.email")}>
                <FaEnvelope size={18} />
              </a>
              <a href="tel:123456789" aria-label={t("social.phone")}>
                <FaPhoneAlt size={18} />
              </a>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("social.instagram")}
              >
                <FaInstagram size={18} />
              </a>
              <a
                href="https://www.twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("social.twitter")}
              >
                <FaTwitter size={18} />
              </a>
            </div>
          </>
        ) : (
          <>
            <div className="navHUD__gameWrap">
              <div className="navHUD__gameTitle">COMMANDS</div>

              <ul className="navHUD__gameList" role="none">
                {gameItems.map((it, idx) => {
                  if (it.type === "divider") {
                    return <li key={`div-${idx}`} className="navHUD__gameDivider" role="none" />;
                  }

                  if (it.type === "action") {
                    return (
                      <li key={it.key} role="none">
                        <button
                          type="button"
                          className="navHUD__gameAction"
                          onClick={it.onClick}
                        >
                          {it.label}
                        </button>
                      </li>
                    );
                  }

                  // info
                  return (
                    <li key={it.key} role="none" className="navHUD__gameRow">
                      <span className="navHUD__gameK">{it.label}</span>
                      <span className="navHUD__gameV">{it.value}</span>
                    </li>
                  );
                })}
              </ul>

              <div className="navHUD__gameFoot">
                HUD is {gameCollapsed ? "collapsed" : "open"} • click « to hide
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}



// // src/Components/Navbar/Navbar.jsx
// import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
// import { Link, useLocation } from "react-router-dom";
// import { FaEnvelope, FaPhoneAlt, FaInstagram, FaTwitter } from "react-icons/fa";
// import { useTranslation } from "react-i18next";
// import LanguagePicker from "./LanguagePicker";
// import "./Navbar.css";

// /**
//  * Global "intent" flag so LanguageToast can show ONLY when user changed language via Navbar.
//  * LanguageToast should check:
//  *   window.__AG_LANG_INTENT__?.src === "navbar"
//  *   && Date.now() - window.__AG_LANG_INTENT__.at < 1200
//  */
// function markNavbarLangIntent() {
//   if (typeof window === "undefined") return;
//   if (document.documentElement.dataset.agOnboarding === "1") return;
//   window.__AG_LANG_INTENT__ = { src: "navbar", at: Date.now() };
// }



// export default function Navbar() {
//   const { t } = useTranslation("nav");
//   const location = useLocation();

//   const [isOpen, setIsOpen] = useState(false);
//   const menuRef = useRef(null);

//   // Hover support only when actually available
//   const canHover =
//     typeof window !== "undefined" &&
//     window.matchMedia?.("(hover: hover)")?.matches;

//   // Touch-ish environments
//   const isTouch =
//     typeof window !== "undefined" &&
//     (window.matchMedia?.("(hover: none)")?.matches ||
//       /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));

//   // Desktop hover open/close with a small delay to avoid flicker
//   const closeTimerRef = useRef(null);
//   const clearCloseTimer = useCallback(() => {
//     if (closeTimerRef.current) {
//       window.clearTimeout(closeTimerRef.current);
//       closeTimerRef.current = null;
//     }
//   }, []);

//   const openMenu = useCallback(() => {
//     clearCloseTimer();
//     setIsOpen(true);
//   }, [clearCloseTimer]);

//   const closeMenu = useCallback(() => {
//     clearCloseTimer();
//     setIsOpen(false);
//   }, [clearCloseTimer]);

//   const scheduleCloseMenu = useCallback(() => {
//     clearCloseTimer();
//     closeTimerRef.current = window.setTimeout(() => {
//       setIsOpen(false);
//       closeTimerRef.current = null;
//     }, 140);
//   }, [clearCloseTimer]);

//   const toggleMenu = useCallback(() => setIsOpen((v) => !v), []);

//   // Close on route change
//   useEffect(() => {
//     closeMenu();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [location.pathname]);

//   // Click outside + ESC
//   useEffect(() => {
//     const onClick = (event) => {
//       if (!menuRef.current) return;
//       if (!menuRef.current.contains(event.target)) closeMenu();
//     };

//     const onKeyDown = (event) => {
//       if (event.key === "Escape") closeMenu();
//     };

//     document.addEventListener("click", onClick);
//     document.addEventListener("keydown", onKeyDown);
//     return () => {
//       document.removeEventListener("click", onClick);
//       document.removeEventListener("keydown", onKeyDown);
//     };
//   }, [closeMenu]);

//   // Cleanup hover timer
//   useEffect(() => {
//     return () => clearCloseTimer();
//   }, [clearCloseTimer]);

//   const navItems = useMemo(
//     () => [
//       { to: "/", key: "home" },
//       { to: "/essential", key: "essential" },
//       { to: "/about", key: "about" },
//       { to: "/contact", key: "contact" },
//       { to: "/portfolio", key: "portfolio" },
//     ],
//     []
//   );

//   return (
//     <nav
//       className={`navHUD ${isOpen ? "isOpen" : ""}`}
//       ref={menuRef}
//       aria-label="Primary navigation"
//     >
//       {/* Hamburger */}
//       <button
//         className={`navHUD__hamburger ${isOpen ? "isOpen" : ""}`}
//         onClick={toggleMenu}
//         aria-expanded={isOpen}
//         aria-controls="navHUD-menu"
//         type="button"
//         onMouseEnter={() => {
//           if (canHover && !isTouch) openMenu();
//         }}
//         onMouseLeave={() => {
//           if (canHover && !isTouch) scheduleCloseMenu();
//         }}
//       >
//         <span className="navHUD__hamburgerBars" aria-hidden="true">
//           <span className="navHUD__bar" />
//           <span className="navHUD__bar" />
//           <span className="navHUD__bar" />
//         </span>
//         <span className="navHUD__label">{t("menu")}</span>
//       </button>

//       {/* Panel */}
//       <div
//         id="navHUD-menu"
//         className={`navHUD__panel ${isOpen ? "open" : ""}`}
//         role="menu"
//         onMouseEnter={() => {
//           if (canHover && !isTouch) openMenu();
//         }}
//         onMouseLeave={() => {
//           if (canHover && !isTouch) scheduleCloseMenu();
//         }}
//       >
//         <div className="navHUD__panelScan" aria-hidden="true" />

//         <div className="navHUD__panelTop">
//           <div className="navHUD__chip">NAV</div>
//         </div>

//         {/* Language picker area — we capture user intent here */}
//         <div
//           className="navHUD__lang"
//           onPointerDownCapture={markNavbarLangIntent}
//           onClickCapture={markNavbarLangIntent}
//           onKeyDownCapture={(e) => {
//             if (e.key === "Enter" || e.key === " ") markNavbarLangIntent();
//           }}
//         >
//           <div className="navHUD__langLabel">{t("language")}</div>
//           <LanguagePicker compact />
//         </div>

//         <div className="navHUD__divider" />

//         <ul className="navHUD__list" role="none">
//           {navItems.map((it) => (
//             <li key={it.key} role="none">
//               <Link role="menuitem" to={it.to} onClick={closeMenu}>
//                 {t(`items.${it.key}`)}
//               </Link>
//             </li>
//           ))}
//         </ul>

//         <div className="navHUD__divider" />

//         <div className="navHUD__social social-icons-navbar">
//           <a href="mailto:ngk.kasia@gmail.com" aria-label={t("social.email")}>
//             <FaEnvelope size={18} />
//           </a>
//           <a href="tel:123456789" aria-label={t("social.phone")}>
//             <FaPhoneAlt size={18} />
//           </a>
//           <a
//             href="https://www.instagram.com"
//             target="_blank"
//             rel="noopener noreferrer"
//             aria-label={t("social.instagram")}
//           >
//             <FaInstagram size={18} />
//           </a>
//           <a
//             href="https://www.twitter.com"
//             target="_blank"
//             rel="noopener noreferrer"
//             aria-label={t("social.twitter")}
//           >
//             <FaTwitter size={18} />
//           </a>
//         </div>
//       </div>
//     </nav>
//   );
// }


