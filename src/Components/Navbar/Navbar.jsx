// src/Components/Navbar/Navbar.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEnvelope, FaPhoneAlt, FaInstagram, FaTwitter } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import LanguagePicker from "./LanguagePicker";
import "./Navbar.css";

function markNavbarLangIntent() {
  if (typeof window === "undefined") return;
  if (document.documentElement.dataset.agOnboarding === "1") return;

  window.__AG_LANG_INTENT__ = {
    src: "navbar",
    at: Date.now(),
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
  };

  window.dispatchEvent(new Event("ag:langIntent"));
}

const MODE = {
  MENU: "menu",
  GAME: "game",
};

const LS_GAME_COLLAPSED = "ag_nav_game_collapsed_v1";
const TUTO_KEY = "ag_city_tutorial_done_v1";
const LS_GAME_USERSET = "ag_nav_game_userset_v1"; // ✅ NEW


export default function Navbar() {
  const { t } = useTranslation("nav");
  const location = useLocation();
  const navigate = useNavigate();

  const isCity = location.pathname === "/city" || location.pathname.startsWith("/city/");

  const [mode, setMode] = useState(MODE.MENU);
  const [isOpen, setIsOpen] = useState(false);

  const [gameCollapsed, setGameCollapsed] = useState(() => {
    try {
      return localStorage.getItem(LS_GAME_COLLAPSED) === "1";
    } catch {
      return true;
    }
  });
  
  const [gameUserSet, setGameUserSet] = useState(() => {
    try {
      return localStorage.getItem(LS_GAME_USERSET) === "1";
    } catch {
      return false;
    }
  });
  

  const menuRef = useRef(null);

  const canHover =
    typeof window !== "undefined" && window.matchMedia?.("(hover: hover)")?.matches;

  const isTouch =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(hover: none)")?.matches ||
      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));

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

  const setCollapsed = useCallback((next, { user = true } = {}) => {
    setGameCollapsed(next);
  
    // ✅ On n’écrit LS_GAME_USERSET que si c’est un choix user
    if (user) {
      setGameUserSet(true);
      try {
        localStorage.setItem(LS_GAME_USERSET, "1");
      } catch {}
    }
  
    try {
      localStorage.setItem(LS_GAME_COLLAPSED, next ? "1" : "0");
    } catch {}
  }, []);
  
  const toggleGameCollapsed = useCallback(() => {
    setCollapsed(!gameCollapsed);
  }, [gameCollapsed, setCollapsed]);

  // ✅ Quand HomeCity confirme le tuto: switch GAME + open (mais user peut recollapse)
  useEffect(() => {
    const onTutorialConfirmed = () => {
      if (!isCity) return;
      setMode(MODE.GAME);
      setIsOpen(false);
      setCollapsed(false, { user: false }); // ✅ Ouvre sans marquer "userSet"
    };
  
    window.addEventListener("ag:cityTutorialConfirmed", onTutorialConfirmed);
    return () => window.removeEventListener("ag:cityTutorialConfirmed", onTutorialConfirmed);
  }, [isCity, setCollapsed]);
  

  // ✅ Reset tuto: repasse MENU + collapse
  useEffect(() => {
    const onReset = () => {
      setMode(MODE.MENU);
      setIsOpen(false);
  
      setGameUserSet(false);
      try {
        localStorage.removeItem(LS_GAME_USERSET);
        localStorage.removeItem(LS_GAME_COLLAPSED);
      } catch {}
  
      setGameCollapsed(true);
    };
  
    window.addEventListener("ag:resetHomeCityTutorial", onReset);
    return () => window.removeEventListener("ag:resetHomeCityTutorial", onReset);
  }, []);
  

  // Close MENU panel on route change
  useEffect(() => {
    closeMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Click outside + ESC closes MENU panel
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

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

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

  const gameItems = useMemo(
    () => [
      {
        type: "action",
        key: "returnHome",
        label: "RETURN HOME",
        onClick: () => navigate("/", { state: { goHomeStep: 2 } }),
      },
      { type: "divider" },
      { type: "info", key: "cmd_1", label: "MOVE", value: "← ↑ ↓ → / Joystick L" },
      { type: "info", key: "cmd_2", label: "LOOK", value: "Mouse / Joystick R" },
      { type: "info", key: "cmd_3", label: "ESC", value: "Release head control" },
      { type: "info", key: "cmd_4", label: "ENTER/SPACE", value: "Confirm / Continue" },
    ],
    [navigate]
  );

  const panelOpen = mode === MODE.MENU ? isOpen : !gameCollapsed;

  // ✅ le comportement clé : bouton GAME
  const onGameClick = useCallback(() => {
    // 1) si pas sur /city => go /city direct (comme Explore)
    if (!isCity) {
      navigate("/city", { state: { autoEnterCity: true } });
      return;
    }

    // 2) si sur /city : si tuto done => force open game HUD
    let tutoDone = false;
    try {
      tutoDone = localStorage.getItem(TUTO_KEY) === "1";
    } catch {}

    if (tutoDone) {
      setMode(MODE.GAME);
      setIsOpen(false);
      setCollapsed(false);
      return;
    }

    // 3) si sur /city mais tuto pas done => on laisse juste le mode MENU (ou tu peux ouvrir un toast)
    setMode(MODE.MENU);
  }, [isCity, navigate, setCollapsed]);

  const onModeClick = useCallback((next) => {
    setMode(next);
    if (next === MODE.GAME) setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isCity) return;
  
    // détecte reload
    const nav = performance.getEntriesByType?.("navigation")?.[0];
    const navType = nav?.type; // "reload" | "navigate" | "back_forward"
    const isReload = navType === "reload";
  
    let tutoDone = false;
    try {
      tutoDone = localStorage.getItem(TUTO_KEY) === "1";
    } catch {}
  
    // Toujours fermer le menu panel
    setIsOpen(false);
  
    // ✅ 1) refresh => fermé (peu importe tout le reste)
    if (isReload) {
      setMode(MODE.GAME);             // ou MODE.MENU, comme tu veux visuellement
      setCollapsed(true, { user: false }); // ✅ IMPORTANT: pas un choix user
      return;
    }
  
    // ✅ 2) navigation normale vers /city
    if (tutoDone) {
      // si user a déjà choisi => respecter
      if (gameUserSet) {
        setMode(MODE.GAME);
        // gameCollapsed déjà correct (state + LS), mais tu peux le re-set pour sécurité :
        // setCollapsed(gameCollapsed, { user: false });
        return;
      }
  
      // sinon => default ouvert
      setMode(MODE.GAME);
      setCollapsed(false, { user: false }); // ✅ pas un choix user
      return;
    }
  
    // ✅ 3) tuto pas done => normal, pas de HUD auto
    setMode(MODE.MENU);
    setCollapsed(true, { user: false });
  }, [isCity, gameUserSet, setCollapsed]);

  // ✅ Dès qu'on quitte /city : le HUD doit être fermé partout
  useEffect(() => {
    if (isCity) return;

    setMode(MODE.MENU);
    setIsOpen(false);
    setCollapsed(true, { user: false }); // force fermé sans marquer "user choice"
  }, [isCity, setCollapsed]);

  
  useEffect(() => {
    const onOn = () => {
      if (!isCity) return;
      // ferme tout pendant loader
      setIsOpen(false);
      setMode(MODE.GAME);
      setCollapsed(true, { user: false });
    };
  
    const onOff = () => {
      // rien à faire ici (ton logique /city existante reprend)
    };
  
    window.addEventListener("ag:cityLoaderOn", onOn);
    window.addEventListener("ag:cityLoaderOff", onOff);
    return () => {
      window.removeEventListener("ag:cityLoaderOn", onOn);
      window.removeEventListener("ag:cityLoaderOff", onOff);
    };
  }, [isCity, setCollapsed]);
  
  
  return (
    <nav
      className={`navHUD ${panelOpen ? "isOpen" : ""} ${
        mode === MODE.GAME ? "isGame" : "isMenu"
      } ${gameCollapsed ? "isGameCollapsed" : ""}`}
      ref={menuRef}
      aria-label="Primary navigation"
    >
      <div className="navHUD__topbar">
        <button
          className={`navHUD__hamburger ${mode === MODE.MENU ? "isActive" : ""} ${
            isOpen ? "isOpen" : ""
          }`}
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

        {/* ✅ GAME toujours cliquable */}
        <button
          className={`navHUD__gameBtn ${mode === MODE.GAME ? "isActive" : ""}`}
          type="button"
          onClick={onGameClick}
          aria-pressed={mode === MODE.GAME}
          title={isCity ? "Open Game HUD" : "Go to /city"}
        >
          <span className="navHUD__gameDot" aria-hidden="true" />
          GAME
        </button>

        {/* Collapse : utile seulement en GAME + /city */}
        <button
          className="navHUD__collapseBtn"
          type="button"
          onClick={toggleGameCollapsed}
          aria-label={gameCollapsed ? "Expand game HUD" : "Collapse game HUD"}
          title={gameCollapsed ? "Expand" : "Collapse"}
          disabled={!(isCity && mode === MODE.GAME)}
          style={!(isCity && mode === MODE.GAME) ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
        >
          {gameCollapsed ? "»" : "«"}
        </button>
      </div>

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
          <div className="navHUD__chip">{mode === MODE.GAME ? "GAME HUD" : "NAV"}</div>
        </div>

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
                      <button type="button" className="navHUD__gameAction" onClick={it.onClick}>
                        {it.label}
                      </button>
                    </li>
                  );
                }
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
        )}
      </div>
    </nav>
  );
}

