// src/Components/Navbar/Navbar.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEnvelope, FaPhoneAlt, FaInstagram, FaTwitter } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import LanguagePicker from "./LanguagePicker";
import "./Navbar.css";

/**
 * UX detail:
 * If user clicks language while onboarding, we don't want to "steal focus" or close overlays unexpectedly.
 * This marker is used by your Home overlay logic.
 */
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
const LS_GAME_USERSET = "ag_nav_game_userset_v1";
const TUTO_KEY = "ag_city_tutorial_done_v1";

export default function Navbar() {
  const { t } = useTranslation("nav");
  const location = useLocation();
  const navigate = useNavigate();

  const isCity = location.pathname === "/city" || location.pathname.startsWith("/city/");
  const canHover =
    typeof window !== "undefined" && window.matchMedia?.("(hover: hover)")?.matches;

  const isTouch =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(hover: none)")?.matches ||
      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));

  const gameIsMobile = isTouch;
  // -----------------------------
  // State
  // -----------------------------
  const [mode, setMode] = useState(MODE.MENU);
  const [isOpen, setIsOpen] = useState(false);

  const [tutorialDone, setTutorialDone] = useState(() => {
    try {
      return localStorage.getItem(TUTO_KEY) === "1";
    } catch {
      return false;
    }
  });

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

  // Tracks fullscreen loader from HomeCity
  const [cityLoaderOn, setCityLoaderOn] = useState(false);

  // -----------------------------
  // Refs to avoid stale closures
  // -----------------------------
  const isCityRef = useRef(isCity);
  useEffect(() => {
    isCityRef.current = isCity;
  }, [isCity]);

  const cityLoaderOnRef = useRef(cityLoaderOn);
  useEffect(() => {
    cityLoaderOnRef.current = cityLoaderOn;
  }, [cityLoaderOn]);

  const pendingOpenGameRef = useRef(false);

  // -----------------------------
  // DOM refs / timers
  // -----------------------------
  const menuRef = useRef(null);
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

  // -----------------------------
  // Helpers
  // -----------------------------
  const setCollapsed = useCallback((next, { user = true } = {}) => {
    setGameCollapsed(next);

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

  const readTutorialDoneLS = useCallback(() => {
    try {
      return localStorage.getItem(TUTO_KEY) === "1";
    } catch {
      return false;
    }
  }, []);

  // A very explicit open (used after tutorial confirm / loader off)
  const forceOpenGameHUD = useCallback(() => {
    setMode(MODE.GAME);
    setIsOpen(false);
    setCollapsed(false, { user: false });
  }, [setCollapsed]);

  // -----------------------------
  // ✅ Hash navigation helper (works from any page)
  // -----------------------------
  const goHash = useCallback(
    (hash) => {
      const targetHash = hash.startsWith("#") ? hash : `#${hash}`;
      const targetUrl = `/${targetHash}`;

      // Close MENU overlay immediately for UX
      closeMenu();

      // If we are already on "/", just update hash + scroll
      const alreadyHome = location.pathname === "/";

      if (alreadyHome) {
        // update hash without double navigation
        if (window.location.hash !== targetHash) {
          window.history.pushState({}, "", targetUrl);
        }
      } else {
        navigate(targetUrl);
      }

      // Scroll after DOM has had time to paint (Home + sections)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = document.querySelector(targetHash);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    },
    [closeMenu, location.pathname, navigate]
  );

  // -----------------------------
  // Items
  // -----------------------------
  const navItems = useMemo(
    () => [
      { to: "/", key: "home", type: "route" },
      // { to: "/essential", key: "essential", type: "route" },
      { to: "#about", key: "about", type: "hash" },
      { to: "#projects", key: "projects", type: "hash" },
      { to: "#contact", key: "contact", type: "hash" },
    ],
    []
  );

  const gameItems = useMemo(() => {
    const rows = t(`game.commands.${gameIsMobile ? "mobile" : "desktop"}.rows`, {
      returnObjects: true,
      defaultValue: [],
    });
  
    return [
      {
        type: "action",
        key: "returnHome",
        label: t("game.actions.returnHome"),
        onClick: () => navigate("/", { state: { goHomeStep: 2 } }),
      },
      { type: "divider" },
  
      // rows[] venant du JSON
      ...(Array.isArray(rows)
        ? rows.map((r, i) => ({
            type: "info",
            key: `cmd_${i}`,
            label: r?.k ?? "",
            value: r?.v ?? "",
          }))
        : []),
    ];
  }, [navigate, t, gameIsMobile]);
  

  // Panel open logic:
  const panelOpen =
    mode === MODE.MENU ? isOpen : isOpen || (isCity && tutorialDone && !cityLoaderOn && !gameCollapsed);

  // -----------------------------
  // Behavior: clicking GAME button
  // -----------------------------
  const onGameClick = useCallback(() => {
    if (!isCity) {
      navigate("/city", { state: { autoEnterCity: true } });
      return;
    }

    const done = readTutorialDoneLS();
    setTutorialDone(done);

    if (!done) {
      setMode(MODE.MENU);
      setIsOpen(false);
      setCollapsed(true, { user: false });
      return;
    }

    forceOpenGameHUD();
  }, [isCity, navigate, readTutorialDoneLS, setCollapsed, forceOpenGameHUD]);

  const onGameHoverOpen = useCallback(() => {
    if (!canHover || isTouch) return;
    if (!isCity || cityLoaderOn) return;

    const done = readTutorialDoneLS();
    if (!done) return;

    clearCloseTimer();
    setIsOpen(false);

    if (gameCollapsed) {
      setMode(MODE.GAME);
      setCollapsed(false, { user: false });
    } else {
      setMode(MODE.GAME);
    }
  }, [
    canHover,
    isTouch,
    isCity,
    cityLoaderOn,
    readTutorialDoneLS,
    gameCollapsed,
    setCollapsed,
    clearCloseTimer,
  ]);

  const onModeClick = useCallback((next) => {
    setMode(next);
    if (next === MODE.GAME) setIsOpen(false);
  }, []);

  // -----------------------------
  // Keep MENU panel closed on route change
  // -----------------------------
  useEffect(() => {
    closeMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.hash]);
  

  // -----------------------------
  // Click outside + ESC closes MENU panel only
  // -----------------------------
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

  // -----------------------------
  // RULE: leaving /city => GAME HUD must be closed everywhere
  // -----------------------------
  useEffect(() => {
    if (isCity) return;

    setMode(MODE.MENU);
    setIsOpen(false);
    setCollapsed(true, { user: false });
  }, [isCity, setCollapsed]);

  // -----------------------------
  // On entering /city
  // -----------------------------
  useEffect(() => {
    if (!isCity) return;

    const nav = performance.getEntriesByType?.("navigation")?.[0];
    const navType = nav?.type;
    const isReload = navType === "reload";

    const done = readTutorialDoneLS();
    setTutorialDone(done);

    setIsOpen(false);

    if (cityLoaderOnRef.current) {
      setMode(MODE.GAME);
      setCollapsed(true, { user: false });
      return;
    }

    if (isReload) {
      setMode(MODE.GAME);
      setCollapsed(true, { user: false });
      return;
    }

    if (done) {
      setMode(MODE.GAME);
      if (gameUserSet) return;
      setCollapsed(false, { user: false });
      return;
    }

    setMode(MODE.MENU);
    setCollapsed(true, { user: false });
  }, [isCity, gameUserSet, readTutorialDoneLS, setCollapsed]);

  // -----------------------------
  // HomeCity loader events
  // -----------------------------
  useEffect(() => {
    const onOn = () => {
      if (!isCityRef.current) return;
      setCityLoaderOn(true);

      setIsOpen(false);
      setMode(MODE.GAME);
      setCollapsed(true, { user: false });
    };

    const onOff = () => {
      if (!isCityRef.current) return;
      setCityLoaderOn(false);

      if (pendingOpenGameRef.current) {
        pendingOpenGameRef.current = false;
        requestAnimationFrame(() => requestAnimationFrame(() => forceOpenGameHUD()));
        return;
      }

      const done = readTutorialDoneLS();
      setTutorialDone(done);

      if (!done) return;

      if (!gameUserSet) {
        requestAnimationFrame(() => requestAnimationFrame(() => forceOpenGameHUD()));
      }
    };

    window.addEventListener("ag:cityLoaderOn", onOn);
    window.addEventListener("ag:cityLoaderOff", onOff);
    return () => {
      window.removeEventListener("ag:cityLoaderOn", onOn);
      window.removeEventListener("ag:cityLoaderOff", onOff);
    };
  }, [forceOpenGameHUD, gameUserSet, readTutorialDoneLS]);

  // -----------------------------
  // Tutorial confirmation event
  // -----------------------------
  useEffect(() => {
    const onConfirmed = () => {
      setTutorialDone(true);

      if (!isCityRef.current) return;

      if (cityLoaderOnRef.current) {
        pendingOpenGameRef.current = true;
        return;
      }

      requestAnimationFrame(() => requestAnimationFrame(() => forceOpenGameHUD()));
    };

    window.addEventListener("ag:cityTutorialConfirmed", onConfirmed);
    return () => window.removeEventListener("ag:cityTutorialConfirmed", onConfirmed);
  }, [forceOpenGameHUD]);

  // -----------------------------
  // Tutorial reset event
  // -----------------------------
  useEffect(() => {
    const onReset = () => {
      setMode(MODE.MENU);
      setIsOpen(false);
      setTutorialDone(false);

      pendingOpenGameRef.current = false;

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

  return (
    <nav
      className={`navHUD ${panelOpen ? "isOpen" : ""} ${
        mode === MODE.GAME ? "isGame" : "isMenu"
      } ${gameCollapsed ? "isGameCollapsed" : ""}`}
      ref={menuRef}
      aria-label="Primary navigation"
    >
      <div className="navHUD__topbar">
        {/* MENU button */}
        <button
          className={`navHUD__hamburger ${mode === MODE.MENU ? "isActive" : ""} ${
            isOpen ? "isOpen" : ""
          }`}
          onClick={() => {
            onModeClick(MODE.MENU);
            setIsOpen((v) => !v);
          }}
          aria-expanded={mode === MODE.MENU ? isOpen : false}
          aria-controls="navHUD-panel"
          type="button"
          onMouseEnter={() => {
            if (!canHover || isTouch) return;
            onModeClick(MODE.MENU);
            openMenu();
          }}
          onMouseLeave={() => {
            if (!canHover || isTouch) return;
            scheduleCloseMenu();
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
          onClick={onGameClick}
          onMouseEnter={onGameHoverOpen}
          aria-pressed={mode === MODE.GAME}
          title={isCity ? t("game.titleCity") : t("game.titleGoCity")}
        >
          <span className="navHUD__gameDot" aria-hidden="true" />
          {t("game.button")}
        </button>
      </div>

      {/* Panel */}
      <div
        id="navHUD-panel"
        className={`navHUD__panel ${panelOpen ? "open" : ""}`}
        role="menu"
        onMouseEnter={() => {
          if (!canHover || isTouch) return;
          if (mode === MODE.MENU) openMenu();
        }}
        onMouseLeave={() => {
          if (!canHover || isTouch) return;
          if (mode === MODE.MENU) scheduleCloseMenu();
        }}
      >
        <div className="navHUD__panelScan" aria-hidden="true" />

        <div className="navHUD__panelTop">
          <div className="navHUD__chip">{mode === MODE.GAME ? t("game.chip") : t("chip")}</div>
        </div>

        {/* Language block */}
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
                  {it.type === "hash" ? (
                    <button
                      type="button"
                      className="navHUD__linkBtn"
                      role="menuitem"
                      onClick={() => goHash(it.to)}
                    >
                      {t(`items.${it.key}`)}
                    </button>
                  ) : (
                    <Link role="menuitem" to={it.to} onClick={closeMenu}>
                      {t(`items.${it.key}`)}
                    </Link>
                  )}
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
            <div className="navHUD__gameHead">
              <div className="navHUD__gameTitle">{t("game.commands.title")}</div>
            </div>

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
              <button
                  type="button"
                  className="navHUD__gameClose"
                  onClick={() => setCollapsed(true, { user: true })}
                  aria-label={t("game.collapse")}
                  title={t("game.collapse")}
                >
                  HIDE 
                </button>
              {/* {t("game.footer", {
                state: gameCollapsed ? t("game.stateCollapsed") : t("game.stateOpen"),
              })} */}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}



