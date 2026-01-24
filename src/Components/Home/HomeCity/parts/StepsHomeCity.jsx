// src/Components/Home/HomeCity/parts/StepsHomeCity.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../style/StepsHomeCity.css";
import "../style/StepsHintUI.css";

import { HintRow, Keycap, ArrowCluster, MouseTap, TrackpadTap } from "./ui/StepsHintUI";

const LS_KEY = "ag_city_tutorial_done_v1";

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
  const [step, setStep] = useState(STEP.BOOT);

  // progress
  const [lookProg, setLookProg] = useState(0);
  const [moveProg, setMoveProg] = useState(0);

  // orbit target
  const [orbitWorld, setOrbitWorld] = useState(null);

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
  const pushPolicy = useCallback((nextStep) => {
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
      policy.lockMove = true; // ✅ IMPORTANT: blocked until confirm
      policy.showOrbitHint = true;
      policy.orbitHintWorld = orbitWorldRef.current;
    }

    onControlChangeRef.current?.(policy);
  }, []);

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
    }

    if (step === STEP.MOVE) {
      setMoveProg(0);
      arrowsRef.current.clear();
    }

    if (step === STEP.PORTALS) {
      // pick orbit once on entry
      const w = orbitWorldPicker?.() ?? null;
      setOrbitWorld(w);
    }
  }, [enabled, step, orbitWorldPicker]);

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
    onDone?.();
  }, [onDone]);

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e) => {
      const code = e.code;

      if (ARROWS_ONLY.has(code)) arrowsRef.current.add(code);

      // BOOT -> next
      if (stepRef.current === STEP.BOOT && (code === "Enter" || code === "Space")) {
        e.preventDefault();
        goNext();
        return;
      }

      // PORTALS -> complete (confirm)
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

    window.addEventListener("keydown", onKeyDown, { passive: false, capture: true });
    window.addEventListener("keyup", onKeyUp, { passive: true, capture: true });

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
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

    const captureNow = () => {
      if (lookPhaseRef.current !== "needCapture") return;

      lookPhaseRef.current = "captured";
      setLookPhase("captured");
      setLookProg(0);

      mouseDeltaRef.current.dx = 0;
      mouseDeltaRef.current.dy = 0;

      setLookCaptureNonce((n) => n + 1);

      // re-push policy now
      queueMicrotask(() => pushPolicy(STEP.LOOK));
    };

    window.addEventListener("pointerdown", captureNow, { passive: true, capture: true });
    window.addEventListener("touchstart", captureNow, { passive: true, capture: true });

    return () => {
      window.removeEventListener("pointerdown", captureNow, true);
      window.removeEventListener("touchstart", captureNow, true);
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

      if (s === STEP.LOOK) {
        if (lookPhaseRef.current === "captured") {
          let active = false;

          if (isMobileRef.current) {
            const mag = Math.abs(lookInput?.x || 0) + Math.abs(lookInput?.y || 0);
            active = mag > LOOK_MAG_THRESHOLD;
          } else {
            const m = mouseDeltaRef.current;
            const delta = m.dx + m.dy;
            active = delta > MOUSE_DELTA_THRESHOLD;

            m.dx *= 0.35;
            m.dy *= 0.35;
          }

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
      }

      if (s === STEP.MOVE) {
        let active = false;

        if (isMobileRef.current) {
          const mag = Math.abs(moveInput?.x || 0) + Math.abs(moveInput?.y || 0);
          active = mag > MOVE_MAG_THRESHOLD;
        } else {
          active = arrowsRef.current.size > 0;
        }

        setMoveProg((p) => {
          const next = clamp01(p + (active ? dt / MOVE_SECONDS : -dt * 0.7));
          if (next >= 1) {
            queueMicrotask(() => {
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
  }, [enabled, lookInput, moveInput]);

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
    };

    const showFor2s = () => {
      if (!alive) return;

      // ✅ lockMove true (blocked until confirm)
      onControlChangeRef.current?.({
        lockLook: false,
        lockMove: true,
        showOrbitHint: true,
        orbitHintWorld: orbitWorldPicker?.() ?? orbitWorldRef.current ?? null,
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

    pick();
    showFor2s();

    const id = window.setInterval(() => {
      pick();
      showFor2s();
    }, 5000);

    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [enabled, step, orbitWorldPicker]);

  // -----------------------------------
  // UI content
  // -----------------------------------
  if (!enabled) return null;

  const content = useMemo(() => {
    switch (step) {
      case STEP.BOOT:
        return {
          badge: "CITY://JACK-IN",
          title: "Bienvenue dans la matrice.",
          desc: "Onboarding rapide. Rendu premium. Ensuite… la ville.",
          cta: "JACK IN",
          showProgress: false,
        };

      case STEP.LOOK:
        // step 2: show mouse + trackpad, text explains toggle ON/OFF view
        if (lookPhase !== "captured") {
          return {
            badge: "CALIBRATE://POV",
            title: "Active la vue (ON/OFF).",
            desc: "CLICK / TAP PAD → toggle contrôle de caméra.",
            cta: null,
            showProgress: false,
            subLock: "En attente de capture…",
          };
        }

        return {
          badge: "CALIBRATE://POV",
          title: "Bouge la vue.",
          desc: isMobile ? "Joystick droit → bouge la caméra (≈2–3s)." : "Souris → bouge la caméra (≈2–3s).",
          cta: null,
          showProgress: true,
          progressLabel: "POV_SYNC",
          progressValue: lookProg,
        };

      case STEP.MOVE:
        return {
          badge: "CALIBRATE://MOVE",
          title: "Déplacement.",
          desc: isMobile
            ? "Joystick gauche → bouge. Validation quand tu avances vraiment."
            : "Flèches ← ↑ ↓ → uniquement. Validation quand tu bouges vraiment.",
          cta: null,
          showProgress: true,
          progressLabel: "MOTOR_LINK",
          progressValue: moveProg,
        };

      case STEP.PORTALS:
      default:
        return {
          badge: "PORTALS://ORBIT",
          title: "Repère les orbits roses.",
          desc: "Je t’en ping un. Approche-toi. Et quand t’es prêt… confirme.",
          cta: "GOT IT",
          showProgress: false,
        };
    }
  }, [step, isMobile, lookPhase, lookProg, moveProg]);

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
    // STEP 1: no icons beside ENTER/SPACE/CLICK
    if (step === STEP.BOOT) {
      return (
        <HintRow>
          <Keycap label="ENTER" active pressed={pressedKeys.has("Enter")} />
          <Keycap label="SPACE" active pressed={pressedKeys.has("Space")} />
          <Keycap label={isMobile ? "TAP" : "CLICK"} active />
        </HintRow>
      );
    }

    // STEP 2: show mouse + trackpad icons, + toggle hint
    if (step === STEP.LOOK && lookPhase !== "captured") {
      return (
        <HintRow>
          <MouseTap active={!isMobile} label="CLICK" />
          <TrackpadTap active={isMobile} label="TAP PAD" />
          <Keycap label="TOGGLE VIEW" sub="ON / OFF" active />
        </HintRow>
      );
    }

    // STEP 2 (captured): explain moving camera + remind toggle
    if (step === STEP.LOOK && lookPhase === "captured") {
      return (
        <HintRow>
          <Keycap label={isMobile ? "JOY RIGHT" : "MOUSE"} active />
          <Keycap label="MOVE CAMERA" sub="2–3s" active />
          <Keycap label={isMobile ? "TAP PAD" : "CLICK"} sub="toggle anytime" />
        </HintRow>
      );
    }

    // STEP 3: move
    if (step === STEP.MOVE) {
      return (
        <HintRow>
          {isMobile ? <Keycap label="JOY LEFT" active /> : <ArrowCluster active pressedSet={pressedKeys} />}
        </HintRow>
      );
    }

    // STEP 4: confirm only (movement blocked by policy)
    return (
      <HintRow>
        <Keycap label="ENTER" active pressed={pressedKeys.has("Enter")} />
        <Keycap label="SPACE" active pressed={pressedKeys.has("Space")} />
        <Keycap label={isMobile ? "TAP" : "CLICK"} active />
      </HintRow>
    );
  }, [step, isMobile, lookPhase, pressedKeys]);

  return (
    <div className="agCitySteps" data-step={step} role="dialog" aria-label="City tutorial" aria-live="polite">
      <div className="agCitySteps__bg" aria-hidden="true" />

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
          initial={{ opacity: 0, y: 10, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.99 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <div className="agCitySteps__sheen" aria-hidden="true" />

          <div className="agCitySteps__badge">
            <span className="agCitySteps__dot" aria-hidden="true" />
            {content.badge}
          </div>

          <div className="agCitySteps__title">{content.title}</div>
          <div className="agCitySteps__desc">{content.desc}</div>

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
                  <span className="agCitySteps__lock">{content.subLock || "Waiting…"}</span>
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
        <div className="agCitySteps__arrow" style={{ left: orbitHintScreen.x, top: orbitHintScreen.y }} aria-hidden="true">
          <div className="agCitySteps__arrowCore" />
          <div className="agCitySteps__arrowTip" />
          <div className="agCitySteps__arrowLabel">ORBIT</div>
        </div>
      )}
    </div>
  );
}





