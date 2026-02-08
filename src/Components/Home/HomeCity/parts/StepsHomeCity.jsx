// src/Components/Home/HomeCity/parts/StepsHomeCity.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import "./style/StepsHomeCity.css";
import "./style/StepsHintUI.css";


import {
  HintRow,
  Keycap,
  ArrowCluster,
  MouseTap,
  TrackpadTap,
  CursorClick,
  DesktopEtirement,
} from "./StepsHintUI";

const LS_KEY = "ag_city_tutorial_done_v1";

// ✅ GameNav toast: show only first time, return on reset
// const LS_GAMENAV_TOAST_SEEN = "ag_gamenav_toast_seen_v1";

// timings
const LOOK_SECONDS = 2.4;
const MOVE_SECONDS = 1.2;

// thresholds
const LOOK_MAG_THRESHOLD = 0.18;
const MOVE_MAG_THRESHOLD = 0.18;
const MOUSE_DELTA_THRESHOLD = 14;

const ARROWS_ONLY = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

// ✅ 4 steps only
const STEP = {
  BOOT: 1,
  LOOK: 2,
  MOVE: 3,
  PORTALS: 4,
};

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

// function shouldShowGameNavToast() {
//   try {
//     return localStorage.getItem(LS_GAMENAV_TOAST_SEEN) !== "1";
//   } catch {
//     return false;
//   }
// }
// function markGameNavToastSeen() {
//   try {
//     localStorage.setItem(LS_GAMENAV_TOAST_SEEN, "1");
//   } catch {}
// }
// function resetGameNavToastSeen() {
//   try {
//     localStorage.removeItem(LS_GAMENAV_TOAST_SEEN);
//   } catch {}
// }

export default function StepsHomeCity({
  enabled,
  isMobile,
  lookInput,
  moveInput,
  orbitWorldPicker,
  orbitHintScreen,
  onControlChange,
  onDone,
}) {
  const { t } = useTranslation("home");

  const [step, setStep] = useState(STEP.BOOT);

  // progress
  const [lookProg, setLookProg] = useState(0);
  const [moveProg, setMoveProg] = useState(0);

  // orbit target
  const [orbitWorld, setOrbitWorld] = useState(null);

  // overlays hide states
  const [hideStretch, setHideStretch] = useState(false); // Step2 captured overlay
  const [hideMoveOverlay, setHideMoveOverlay] = useState(false); // Step3 overlay

  // ✅ Step 3 confirmation (A)
  const [step3Confirmed, setStep3Confirmed] = useState(false);
  const step3ConfirmedRef = useRef(false);
  useEffect(() => {
    step3ConfirmedRef.current = step3Confirmed;
  }, [step3Confirmed]);

  // LOOK phase
  const [lookPhase, setLookPhase] = useState("needCapture"); // needCapture | captured
  const lookPhaseRef = useRef(lookPhase);
  useEffect(() => {
    lookPhaseRef.current = lookPhase;
  }, [lookPhase]);

  // nonce to tell HomeCity “capture happened NOW”
  const [lookCaptureNonce, setLookCaptureNonce] = useState(0);
  const lookCaptureNonceRef = useRef(0);
  useEffect(() => {
    lookCaptureNonceRef.current = lookCaptureNonce;
  }, [lookCaptureNonce]);

  // step ref
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  // desktop input tracking
  const mouseDeltaRef = useRef({ dx: 0, dy: 0 });
  const arrowsRef = useRef(new Set());

  // pressed keys (for UI)
  const [pressedKeys, setPressedKeys] = useState(new Set());
  const pressedRef = useRef(new Set());

  // ✅ open GAME HUD once when reaching STEP.PORTALS (per run)
  const openedGameHudRef = useRef(false);

  // ---------------------------
  // Key pressed UI tracking
  // ---------------------------
  useEffect(() => {
    if (!enabled) return;

    const down = (e) => {
      const next = new Set(pressedRef.current);
      next.add(e.code);
      pressedRef.current = next;
      setPressedKeys(next);
    };
    const up = (e) => {
      const next = new Set(pressedRef.current);
      next.delete(e.code);
      pressedRef.current = next;
      setPressedKeys(next);
    };

    window.addEventListener("keydown", down, { passive: true });
    window.addEventListener("keyup", up, { passive: true });

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [enabled]);

  // -----------------------------------
  // ✅ STABLE REFS (anti infinite loop)
  // -----------------------------------
  const onControlChangeRef = useRef(onControlChange);
  useEffect(() => {
    onControlChangeRef.current = onControlChange;
  }, [onControlChange]);

  const orbitWorldRef = useRef(orbitWorld);
  useEffect(() => {
    orbitWorldRef.current = orbitWorld;
  }, [orbitWorld]);

  const isMobileRef = useRef(isMobile);
  useEffect(() => {
    isMobileRef.current = isMobile;
  }, [isMobile]);

  // -----------------------------------
  // Policy pushed to HomeCity (stable)
  // -----------------------------------
  const pushPolicy = useCallback(
    (nextStep) => {
      const s = nextStep ?? stepRef.current;
      const captured = lookPhaseRef.current === "captured";

      const pointerLocked =
        !isMobileRef.current &&
        typeof document !== "undefined" &&
        document.pointerLockElement != null;

      const policy = {
        lockLook: true,
        lockMove: true,
        showOrbitHint: false,
        orbitHintWorld: null,
        requestLookCaptureNow: false,
        lookCaptureNonce: lookCaptureNonceRef.current,
      };

      if (s === STEP.BOOT) {
        policy.lockLook = true;
        policy.lockMove = true;
      }

      if (s === STEP.LOOK) {
        // before capture: lock look; after capture: allow look (camera) but still lock movement
        policy.lockLook = !captured;
        policy.lockMove = true;

        // request capture until we have it; then request only if pointerlock not acquired (desktop)
        policy.requestLookCaptureNow = !captured || (!isMobileRef.current && !pointerLocked);
      }

      if (s === STEP.MOVE) {
        policy.lockLook = false;
        policy.lockMove = false;
      }

      if (s === STEP.PORTALS) {
        policy.lockLook = false;
        policy.lockMove = true;
        policy.showOrbitHint = true;
        policy.orbitHintWorld = orbitWorldPicker?.() ?? orbitWorldRef.current ?? null;
      }

      onControlChangeRef.current?.(policy);
    },
    [orbitWorldPicker]
  );

  // push on step change
  useEffect(() => {
    if (!enabled) return;
    pushPolicy(step);
  }, [enabled, step, pushPolicy]);

  // push on lookPhase change while in LOOK
  useEffect(() => {
    if (!enabled) return;
    if (step !== STEP.LOOK) return;
    pushPolicy(STEP.LOOK);
  }, [enabled, step, lookPhase, pushPolicy]);

  // -----------------------------------
  // Step enter side-effects
  // -----------------------------------
  useEffect(() => {
    if (!enabled) return;

    if (step === STEP.LOOK) {
      setLookPhase("needCapture");
      setLookProg(0);
      mouseDeltaRef.current.dx = 0;
      mouseDeltaRef.current.dy = 0;
      setHideStretch(false);
    }

    if (step === STEP.MOVE) {
      setMoveProg(0);
      arrowsRef.current.clear();
      setHideMoveOverlay(false);
      setStep3Confirmed(false); // ✅ reset confirmation when entering move
    }

    if (step === STEP.PORTALS) {
      const w = orbitWorldPicker?.() ?? null;
      setOrbitWorld(w);
    }
  }, [enabled, step, orbitWorldPicker]);

  // -----------------------------------
  // ✅ Reset StepsHomeCity (closes GameNav + re-enable toast on next run)
  // Listen to: window.dispatchEvent(new Event("ag:resetStepsHomeCity"))
  // -----------------------------------
  useEffect(() => {
    if (!enabled) return;

    const onReset = () => {
      // close HUD immediately
      window.dispatchEvent(new Event("ag:closeGameHud"));

      // allow GameNav toast to show again
      // resetGameNavToastSeen();

      // reset all local tutorial states
      openedGameHudRef.current = false;

      setStep(STEP.BOOT);
      setLookPhase("needCapture");
      setLookProg(0);
      setMoveProg(0);
      setOrbitWorld(null);

      setHideStretch(false);
      setHideMoveOverlay(false);
      setStep3Confirmed(false);

      arrowsRef.current.clear();
      mouseDeltaRef.current.dx = 0;
      mouseDeltaRef.current.dy = 0;

      // also repush policy so HomeCity re-locks correctly
      queueMicrotask(() => pushPolicy(STEP.BOOT));
    };

    window.addEventListener("ag:resetStepsHomeCity", onReset);
    return () => window.removeEventListener("ag:resetStepsHomeCity", onReset);
  }, [enabled, pushPolicy]);

  // -----------------------------------
  // Global keyboard handling (logic)
  // -----------------------------------
  const goNext = useCallback(() => {
    setLookProg(0);
    setMoveProg(0);

    setStep((s) => {
      if (s === STEP.BOOT) return STEP.LOOK;
      return s;
    });
  }, []);

  const complete = useCallback(() => {
    try {
      localStorage.setItem(LS_KEY, "1");
    } catch {}

    // ✅ open HUD + show toast exactly at the end (Step 4 confirmation)
    window.dispatchEvent(new Event("ag:cityTutorialConfirmed"));

    onDone?.();
  }, [onDone]);

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e) => {
      const code = e.code;
      if (ARROWS_ONLY.has(code)) arrowsRef.current.add(code);

      if (stepRef.current === STEP.BOOT && (code === "Enter" || code === "Space")) {
        e.preventDefault();
        goNext();
        return;
      }

      if (stepRef.current === STEP.PORTALS && (code === "Enter" || code === "Space")) {
        e.preventDefault();
        complete();
        return;
      }
    };

    const onKeyUp = (e) => {
      const code = e.code;
      if (ARROWS_ONLY.has(code)) arrowsRef.current.delete(code);
    };

    // ✅ Keep SAME options object references for add/remove
    const downOpts = { capture: true, passive: false };
    const upOpts = { capture: true, passive: true };

    window.addEventListener("keydown", onKeyDown, downOpts);
    window.addEventListener("keyup", onKeyUp, upOpts);

    return () => {
      window.removeEventListener("keydown", onKeyDown, downOpts);
      window.removeEventListener("keyup", onKeyUp, upOpts);
    };
  }, [enabled, goNext, complete]);

  // -----------------------------------
  // Desktop mouse delta tracking (LOOK validation)
  // -----------------------------------
  useEffect(() => {
    if (!enabled) return;
    if (isMobile) return;

    const onMove = (e) => {
      if (stepRef.current !== STEP.LOOK) return;
      if (lookPhaseRef.current !== "captured") return;

      const dx = Math.abs(e.movementX || 0);
      const dy = Math.abs(e.movementY || 0);
      mouseDeltaRef.current.dx += dx;
      mouseDeltaRef.current.dy += dy;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [enabled, isMobile]);

  // -----------------------------------
  // Capture head control on first click/tap ONLY on LOOK
  // -----------------------------------
  useEffect(() => {
    if (!enabled) return;
    if (step !== STEP.LOOK) return;

    const captureNow = (e) => {
      // ✅ ignore clicks on the tutorial UI
      if (e?.target?.closest?.(".agCitySteps__card")) return;
      if (e?.target?.closest?.(".agCitySteps")) return;

      if (lookPhaseRef.current !== "needCapture") return;

      lookPhaseRef.current = "captured";
      setLookPhase("captured");
      setLookProg(0);

      mouseDeltaRef.current.dx = 0;
      mouseDeltaRef.current.dy = 0;

      // show stretch overlay initially
      setHideStretch(false);

      setLookCaptureNonce((n) => n + 1);

      queueMicrotask(() => pushPolicy(STEP.LOOK));
    };

    window.addEventListener("pointerdown", captureNow, { passive: true, capture: true });
    window.addEventListener("touchstart", captureNow, { passive: true, capture: true });

    return () => {
      window.removeEventListener("pointerdown", captureNow, { passive: true, capture: true });
      window.removeEventListener("touchstart", captureNow, { passive: true, capture: true });
    };
  }, [enabled, step, pushPolicy]);

  // -----------------------------------
  // Timed completion loops (LOOK / MOVE)
  // -----------------------------------
  useEffect(() => {
    if (!enabled) return;

    let raf = 0;
    let last = performance.now();

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const s = stepRef.current;

      // ----------------------
      // STEP 2: LOOK
      // ----------------------
      if (s === STEP.LOOK && lookPhaseRef.current === "captured") {
        let active = false;

        if (isMobileRef.current) {
          const mag = Math.abs(lookInput?.x || 0) + Math.abs(lookInput?.y || 0);
          active = mag > LOOK_MAG_THRESHOLD;
        } else {
          const m = mouseDeltaRef.current;
          const delta = m.dx + m.dy;
          active = delta > MOUSE_DELTA_THRESHOLD;

          // decay for smoothness
          m.dx *= 0.35;
          m.dy *= 0.35;
        }

        // ✅ hide stretch overlay as soon as user actually moves view
        if (active && !hideStretch) setHideStretch(true);

        setLookProg((p) => {
          const next = clamp01(p + (active ? dt / LOOK_SECONDS : -dt * 0.7));
          if (next >= 1) {
            queueMicrotask(() => {
              setLookProg(0);
              setStep(STEP.MOVE);
            });
          }
          return next;
        });
      }

      // ----------------------
      // STEP 3: MOVE
      // ----------------------
      if (s === STEP.MOVE) {
        let active = false;

        if (isMobileRef.current) {
          const mag = Math.abs(moveInput?.x || 0) + Math.abs(moveInput?.y || 0);
          active = mag > MOVE_MAG_THRESHOLD;
        } else {
          active = arrowsRef.current.size > 0;
        }

        // ✅ hide arrow overlay as soon as user starts moving
        if (active && !hideMoveOverlay) setHideMoveOverlay(true);

        setMoveProg((p) => {
          const next = clamp01(p + (active ? dt / MOVE_SECONDS : -dt * 0.7));

          if (next >= 1) {
            queueMicrotask(() => {
              // ✅ A) confirm step 3 and instantly hide ArrowCluster (inside card)
              setStep3Confirmed(true);

              setMoveProg(0);
              setStep(STEP.PORTALS);
            });
          }
          return next;
        });
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, lookInput, moveInput, hideStretch, hideMoveOverlay]);

  // -----------------------------------
  // PORTALS: reping orbit while waiting for confirmation
  // - show arrow 2s, then hide
  // - repeat every 5s until completed
  // -----------------------------------
  useEffect(() => {
    if (!enabled) return;
    if (step !== STEP.PORTALS) return;

    let alive = true;

    const pick = () => {
      const w = orbitWorldPicker?.() ?? null;
      setOrbitWorld(w);
      orbitWorldRef.current = w; // ✅ sync ref immediately
      return w;
    };

    const showFor2s = (w) => {
      if (!alive) return;

      onControlChangeRef.current?.({
        lockLook: false,
        lockMove: true,
        showOrbitHint: true,
        orbitHintWorld: w ?? orbitWorldRef.current ?? null,
        requestLookCaptureNow: false,
        lookCaptureNonce: lookCaptureNonceRef.current,
      });

      window.setTimeout(() => {
        if (!alive) return;
        onControlChangeRef.current?.({
          lockLook: false,
          lockMove: true,
          showOrbitHint: false,
          orbitHintWorld: null,
          requestLookCaptureNow: false,
          lookCaptureNonce: lookCaptureNonceRef.current,
        });
      }, 2000);
    };

    const w0 = pick();
    showFor2s(w0);

    const id = window.setInterval(() => {
      const w = pick();
      showFor2s(w);
    }, 5000);

    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [enabled, step, orbitWorldPicker]);

  // -----------------------------------
  // UI content (i18n)
  // -----------------------------------
  if (!enabled) return null;

  const content = useMemo(() => {
    switch (step) {
      case STEP.BOOT:
        return {
          badge: t("cityTutorial.boot.badge"),
          title: t("cityTutorial.boot.title"),
          desc: t("cityTutorial.boot.desc"),
          cta: t("cityTutorial.boot.cta"),
          showProgress: false,
        };

      case STEP.LOOK:
        if (lookPhase !== "captured") {
          return {
            badge: t("cityTutorial.look.badge"),
            title: t("cityTutorial.look.preCapture.title"),
            desc: t("cityTutorial.look.preCapture.desc"),
            cta: null,
            showProgress: false,
            subLock: t("cityTutorial.look.preCapture.subLock"),
          };
        }

        return {
          badge: t("cityTutorial.look.badge"),
          title: t("cityTutorial.look.captured.title"),
          desc: isMobile
            ? t("cityTutorial.look.captured.descMobile")
            : t("cityTutorial.look.captured.descDesktop"),
          cta: null,
          showProgress: true,
          progressLabel: t("cityTutorial.look.captured.progressLabel"),
          progressValue: lookProg,
        };

      case STEP.MOVE:
        return {
          badge: t("cityTutorial.move.badge"),
          title: t("cityTutorial.move.title"),
          desc: isMobile
            ? t("cityTutorial.move.descMobile")
            : t("cityTutorial.move.descDesktop"),
          cta: null,
          showProgress: true,
          progressLabel: t("cityTutorial.move.progressLabel"),
          progressValue: moveProg,
        };

      case STEP.PORTALS:
      default:
        return {
          badge: t("cityTutorial.portals.badge"),
          title: t("cityTutorial.portals.title"),
          desc: t("cityTutorial.portals.desc"),
          cta: t("cityTutorial.portals.cta"),
          showProgress: false,
        };
    }
  }, [step, isMobile, lookPhase, lookProg, moveProg, t]);

  const showArrow = step === STEP.PORTALS && orbitHintScreen?.onScreen;

  // Matrix rain ONLY step 1
  const matrixCols = useMemo(() => {
    const n = 24;
    return Array.from({ length: n }, (_, i) => {
      const x = Math.random() * 100;
      const dur = 2.2 + Math.random() * 3.8;
      const delay = -Math.random() * dur;
      const alpha = 0.22 + Math.random() * 0.55;
      const size = 11 + Math.random() * 6;
      const blur = Math.random() < 0.25 ? 0.6 : 0;
      return { i, x, dur, delay, alpha, size, blur };
    });
  }, []);

  const hintRow = useMemo(() => {
    if (step === STEP.LOOK && lookPhase !== "captured") {
      return (
        <HintRow>
          <MouseTap active={!isMobile} label={t("cityTutorial.hints.click")} />
          <TrackpadTap active={!isMobile} label={t("cityTutorial.hints.tapPad")} />
        </HintRow>
      );
    }

    if (step === STEP.LOOK && lookPhase === "captured") {
      return (
        <HintRow>
          <Keycap label={isMobile ? t("cityTutorial.hints.joyRight") : t("cityTutorial.hints.mouse")} active />
          <Keycap label={t("cityTutorial.hints.moveCamera")} sub={t("cityTutorial.hints.seconds_2_3")} active />
          <Keycap
            label={isMobile ? t("cityTutorial.hints.tap") : t("cityTutorial.hints.click")}
            sub={t("cityTutorial.hints.toggleAnytime")}
          />
        </HintRow>
      );
    }

    if (step === STEP.MOVE) {
      return (
        <HintRow>
          {isMobile ? (
            <Keycap label={t("cityTutorial.hints.joyLeft")} active />
          ) : (
            <Keycap label={t("cityTutorial.hints.useArrows")} sub={t("cityTutorial.hints.move")} active />
          )}
        </HintRow>
      );
    }

    return null;
  }, [step, isMobile, lookPhase, t]);

  const noEnterAnim = step === STEP.BOOT;

  return (
    <div className="agCitySteps" data-step={step} role="dialog" aria-label="City tutorial" aria-live="polite">
      <div className="agCitySteps__bg" aria-hidden="true" />

      {/* ---------------------------
          OUTSIDE CARD — Desktop overlays
      ---------------------------- */}
      {step === STEP.LOOK && !isMobile && (
        <>
          {lookPhase !== "captured" ? (
            <div className="agCitySteps__cursorOverlay" aria-hidden="true">
              <CursorClick
                active
                label={t("cityTutorial.look.cursorOverlayLabel")}
                sub={t("cityTutorial.look.cursorOverlaySub")}
              />
            </div>
          ) : (
            <DesktopEtirement
              active
              label={t("cityTutorial.look.stretchOverlayLabel")}
              sub={t("cityTutorial.look.stretchOverlaySub")}
              className={hideStretch ? "isHidden" : ""}
            />
          )}
        </>
      )}

      {/* Matrix rain ONLY step 1 */}
      {step === STEP.BOOT && (
        <div className="agCitySteps__matrixRain" aria-hidden="true">
          {matrixCols.map((c) => (
            <span
              key={c.i}
              className="agCitySteps__matrixCol"
              style={{
                "--x": `${c.x}%`,
                "--dur": `${c.dur}s`,
                "--delay": `${c.delay}s`,
                "--a": c.alpha,
                "--fs": `${c.size}px`,
                "--blur": `${c.blur}px`,
              }}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={`${step}-${lookPhase}`}
          className="agCitySteps__card"
          initial={noEnterAnim ? false : { opacity: 0, y: 10, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.99 }}
          transition={noEnterAnim ? { duration: 0 } : { duration: 0.22, ease: "easeOut" }}
        >
          <div className="agCitySteps__sheen" aria-hidden="true" />

          <div className="agCitySteps__badge">
            <span className="agCitySteps__dot" aria-hidden="true" />
            {content.badge}
          </div>

          <h1 className="agCitySteps__title">{content.title}</h1>
          <div className="agCitySteps__desc">{content.desc}</div>

          {/* ✅ Step 3: ArrowCluster INSIDE card — disappears as soon as step3Confirmed */}
          {step === STEP.MOVE && !isMobile && !step3Confirmed && (
            <div className={`agCitySteps__inlineArrows agMoveBlue ${hideMoveOverlay ? "isHidden" : ""}`}>
              <ArrowCluster active pressedSet={pressedKeys} demoPulse />
              <div className="agCitySteps__inlineArrowsHint">
                {t("cityTutorial.move.holdArrowHint")}
              </div>
            </div>
          )}

          {content.showProgress ? (
            <div className="agCitySteps__progressBlock">
              <div className="agCitySteps__progressTop">
                <span className="agCitySteps__progressLabel">{content.progressLabel}</span>
                <span className="agCitySteps__progressPct">{Math.round((content.progressValue || 0) * 100)}%</span>
              </div>

              <div className="agCitySteps__bar">
                <div
                  className="agCitySteps__barFill"
                  style={{ transform: `scaleX(${clamp01(content.progressValue || 0)})` }}
                />
              </div>

              <div className="agCitySteps__hintMono">{hintRow}</div>
            </div>
          ) : (
            <div className="agCitySteps__footer">
              <div className="agCitySteps__hint">{hintRow}</div>

              <div className="agCitySteps__actions">
                {content.cta ? (
                  <button
                    className="agCitySteps__cta"
                    type="button"
                    onClick={() => {
                      if (step === STEP.BOOT) goNext();
                      else if (step === STEP.PORTALS) complete();
                    }}
                  >
                    <span className="agCitySteps__chev" aria-hidden="true">
                      &gt;
                    </span>
                    {content.cta}
                  </button>
                ) : (
                  <span className="agCitySteps__lock">{content.subLock || t("cityTutorial.common.waiting")}</span>
                )}
              </div>
            </div>
          )}

          {/* ✅ 4 dots only */}
          <div className="agCitySteps__dots" aria-hidden="true">
            <span className={`p ${step >= 1 ? "on" : ""}`} />
            <span className={`p ${step >= 2 ? "on" : ""}`} />
            <span className={`p ${step >= 3 ? "on" : ""}`} />
            <span className={`p ${step >= 4 ? "on" : ""}`} />
          </div>
        </motion.div>
      </AnimatePresence>

      {showArrow && (
        <div
          className="agCitySteps__arrow"
          style={{ left: orbitHintScreen.x, top: orbitHintScreen.y }}
          aria-hidden="true"
        >
          <div className="agCitySteps__arrowCore" />
          <div className="agCitySteps__arrowTip" />
          <div className="agCitySteps__arrowLabel">{t("cityTutorial.portals.arrowLabel")}</div>
        </div>
      )}
    </div>
  );
}


