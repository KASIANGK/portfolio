// src/Components/HomeCity/StepsHomeCity.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../style/StepsHomeCity.css";

const LS_KEY = "ag_city_tutorial_done_v1";

// timings
const LOOK_SECONDS = 2.4; // 2–3s
const MOVE_SECONDS = 1.2;

// thresholds
const LOOK_MAG_THRESHOLD = 0.18;
const MOVE_MAG_THRESHOLD = 0.18;
const MOUSE_DELTA_THRESHOLD = 14;

const ARROWS_ONLY = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

const STEP = {
  BOOT: 1,
  LOOK: 2,
  ESCAPE: 3,
  MOVE: 4,
  PORTALS: 5,
};

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

/* =========================
   KEYCAPS UI (hints premium)
========================= */
function Key({ icon, label, sub, active, pressed }) {
  return (
    <span className={`agKey ${active ? "isActive" : ""} ${pressed ? "isPressed" : ""}`}>
      {icon ? <span className="agKey__icon">{icon}</span> : null}
      <span className="agKey__label">{label}</span>
      {sub ? <span className="agKey__sub">{sub}</span> : null}
    </span>
  );
}

function ArrowCluster({ active, pressedSet }) {
  const isPressed = (k) => !!pressedSet?.has?.(k);
  return (
    <span className="agKeyCluster" aria-label="Arrow keys">
      <span className="agKeyGrid">
        <span className={`agArrowKey up ${active ? "isActive" : ""} ${isPressed("ArrowUp") ? "isPressed" : ""}`}>
          ↑
        </span>
        <span className={`agArrowKey left ${active ? "isActive" : ""} ${isPressed("ArrowLeft") ? "isPressed" : ""}`}>
          ←
        </span>
        <span className={`agArrowKey down ${active ? "isActive" : ""} ${isPressed("ArrowDown") ? "isPressed" : ""}`}>
          ↓
        </span>
        <span
          className={`agArrowKey right ${active ? "isActive" : ""} ${isPressed("ArrowRight") ? "isPressed" : ""}`}
        >
          →
        </span>
      </span>
    </span>
  );
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

  // progress (0..1)
  const [lookProg, setLookProg] = useState(0);
  const [moveProg, setMoveProg] = useState(0);

  // orbit target for hint arrow
  const [orbitWorld, setOrbitWorld] = useState(null);
  const orbitHintArmedRef = useRef(false);

  // LOOK step phase
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

  // refs
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  // desktop input tracking
  const mouseDeltaRef = useRef({ dx: 0, dy: 0 });
  const arrowsRef = useRef(new Set());

  // pressed keys (for keycap "press" animation)
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
  // Policy pushed to HomeCity
  // -----------------------------------
  const pushPolicy = useCallback(
    (nextStep) => {
      const s = nextStep ?? stepRef.current;
      const captured = lookPhaseRef.current === "captured";

      const pointerLocked =
        !isMobile &&
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
        policy.lockLook = !captured;
        policy.lockMove = true;

        // before capture -> show request
        // after capture -> only request if desktop and pointerlock not acquired
        policy.requestLookCaptureNow = !captured || (!isMobile && !pointerLocked);
      }

      if (s === STEP.ESCAPE) {
        policy.lockLook = false;
        policy.lockMove = true;
      }

      if (s === STEP.MOVE) {
        policy.lockLook = false;
        policy.lockMove = false;
      }

      if (s === STEP.PORTALS) {
        policy.lockLook = false;
        policy.lockMove = false;
        policy.showOrbitHint = true;
        policy.orbitHintWorld = orbitWorld;
      }

      onControlChange?.(policy);
    },
    [onControlChange, orbitWorld, isMobile]
  );

  useEffect(() => {
    if (!enabled) return;
    pushPolicy(step);
  }, [enabled, step, pushPolicy]);

  useEffect(() => {
    if (!enabled) return;
    if (step !== STEP.LOOK) return;
    pushPolicy(step);
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
      orbitHintArmedRef.current = false;
    }
  }, [enabled, step]);

  // -----------------------------------
  // Global keyboard handling (logic)
  // -----------------------------------
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e) => {
      const code = e.code;

      if (ARROWS_ONLY.has(code)) arrowsRef.current.add(code);

      if (stepRef.current === STEP.ESCAPE && code === "Escape") {
        e.preventDefault();
        goNext();
        return;
      }

      if (code !== "Enter" && code !== "Space") return;
      e.preventDefault();

      if (stepRef.current === STEP.BOOT) return goNext();
      if (stepRef.current === STEP.ESCAPE) return goNext();
      if (stepRef.current === STEP.PORTALS) return complete();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

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
  // Capture head control on first click/tap ONLY on LOOK step
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

          if (isMobile) {
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
                setStep(STEP.ESCAPE);
              });
            }
            return next;
          });
        }
      }

      if (s === STEP.MOVE) {
        let active = false;

        if (isMobile) {
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
  }, [enabled, isMobile, lookInput, moveInput]);

  // -----------------------------------
  // PORTALS: auto-ping orbit 2s then hide arrow (stay in PORTALS)
  // -----------------------------------
  useEffect(() => {
    if (!enabled) return;

    if (step === STEP.PORTALS && !orbitHintArmedRef.current) {
      orbitHintArmedRef.current = true;

      const world = orbitWorldPicker?.() ?? null;
      setOrbitWorld(world);

      const t = setTimeout(() => {
        onControlChange?.({
          lockLook: false,
          lockMove: false,
          showOrbitHint: false,
          orbitHintWorld: null,
          requestLookCaptureNow: false,
          lookCaptureNonce: lookCaptureNonceRef.current,
        });
      }, 2000);

      return () => clearTimeout(t);
    }

    if (step !== STEP.PORTALS) orbitHintArmedRef.current = false;
  }, [enabled, step, orbitWorldPicker, onControlChange]);

  // -----------------------------------
  // Navigation helpers
  // -----------------------------------
  const goNext = useCallback(() => {
    setLookProg(0);
    setMoveProg(0);

    setStep((s) => {
      if (s === STEP.BOOT) return STEP.LOOK;
      if (s === STEP.LOOK) return STEP.ESCAPE;
      if (s === STEP.ESCAPE) return STEP.MOVE;
      if (s === STEP.MOVE) return STEP.PORTALS;
      return s;
    });
  }, []);

  const complete = useCallback(() => {
    try {
      localStorage.setItem(LS_KEY, "1");
    } catch {}
    onDone?.();
  }, [onDone]);

  if (!enabled) return null;

  const content = useMemo(() => {
    switch (step) {
      case STEP.BOOT:
        return {
          badge: "CITY://JACK-IN",
          title: "Bienvenue dans la matrice.",
          desc: "Promis… ici c’est légal. (Et franchement premium.)",
          cta: "JACK IN",
          showProgress: false,
        };

      case STEP.LOOK:
        if (lookPhase !== "captured") {
          return {
            badge: "CALIBRATE://POV",
            title: "Active le contrôle de la tête.",
            desc: isMobile
              ? "Tap pad (zone droite) pour prendre le contrôle de la vue."
              : "Clique dans la scène pour prendre le contrôle de la vue.",
            cta: null,
            showProgress: false,
            subLock: "En attente du contrôle…",
          };
        }

        return {
          badge: "CALIBRATE://POV",
          title: "OK, bouge la vue.",
          desc: isMobile
            ? "Joystick droit → bouge vraiment la caméra (≈2–3s)."
            : "Souris → bouge vraiment la caméra (≈2–3s).",
          cta: null,
          showProgress: true,
          progressLabel: "POV SYNC",
          progressValue: lookProg,
        };

      case STEP.ESCAPE:
        return {
          badge: "POV://EXIT",
          title: "Échappe-toi du contrôle.",
          desc: "Appuie sur ESC pour quitter le contrôle de la tête quand tu veux.",
          cta: "OK",
          showProgress: false,
        };

      case STEP.MOVE:
        return {
          badge: "CALIBRATE://MOVE",
          title: "Déplacement (flèches only).",
          desc: isMobile
            ? "Joystick gauche → bouge. On valide quand tu avances vraiment (≈1.2s)."
            : "Flèches ← ↑ ↓ → uniquement. On valide quand tu bouges vraiment (≈1.2s).",
          cta: null,
          showProgress: true,
          progressLabel: "MOTOR LINK",
          progressValue: moveProg,
        };

      case STEP.PORTALS:
      default:
        return {
          badge: "PORTALS://ORBIT",
          title: "Repère les orbits roses.",
          desc: orbitWorldPicker
            ? "Ce sont des portails. Je t’en ping un, juste 2 secondes… ensuite à toi."
            : "Ce sont des portails. Approche-toi… et la ville te répond.",
          cta: "GOT IT",
          showProgress: false,
        };
    }
  }, [step, isMobile, lookPhase, lookProg, moveProg, orbitWorldPicker]);

  const showArrow = step === STEP.PORTALS && orbitHintScreen?.onScreen;

  // Matrix rain ONLY step 1: random columns
  const matrixCols = useMemo(() => {
    const n = 26;
    return Array.from({ length: n }, (_, i) => {
      const x = Math.random() * 100;
      const dur = 2.2 + Math.random() * 3.8;
      const delay = -Math.random() * dur;
      const alpha = 0.25 + Math.random() * 0.55;
      const size = 11 + Math.random() * 6;
      const blur = Math.random() < 0.25 ? 0.6 : 0;
      return { i, x, dur, delay, alpha, size, blur };
    });
  }, []);

  // Premium hint renderer (keycaps)
  const hintRow = useMemo(() => {
    // BOOT
    if (step === STEP.BOOT) {
      return (
        <div className="agCitySteps__hintRow">
          <Key icon="↵" label="ENTER" active pressed={pressedKeys.has("Enter")} />
          <Key icon="␣" label="SPACE" active pressed={pressedKeys.has("Space")} />
          <Key icon="●" label={isMobile ? "TAP" : "CLICK"} active />
        </div>
      );
    }

    // LOOK (need capture)
    if (step === STEP.LOOK && lookPhase !== "captured") {
      return (
        <div className="agCitySteps__hintRow">
          <Key icon="●" label={isMobile ? "TAP PAD" : "CLICK SCENE"} active />
        </div>
      );
    }

    // LOOK (captured)
    if (step === STEP.LOOK && lookPhase === "captured") {
      return (
        <div className="agCitySteps__hintRow">
          <Key icon={isMobile ? "▦" : "🖱"} label={isMobile ? "JOY RIGHT" : "MOUSE"} active />
        </div>
      );
    }

    // ESCAPE
    if (step === STEP.ESCAPE) {
      return (
        <div className="agCitySteps__hintRow">
          <Key icon="⎋" label="ESC" active pressed={pressedKeys.has("Escape")} />
          <Key icon="↵" label="ENTER" pressed={pressedKeys.has("Enter")} />
          <Key icon="␣" label="SPACE" pressed={pressedKeys.has("Space")} />
          <Key icon="●" label={isMobile ? "TAP" : "CLICK"} />
        </div>
      );
    }

    // MOVE
    if (step === STEP.MOVE) {
      return (
        <div className="agCitySteps__hintRow">
          {isMobile ? <Key icon="▦" label="JOY LEFT" active /> : <ArrowCluster active pressedSet={pressedKeys} />}
        </div>
      );
    }

    // PORTALS
    return (
      <div className="agCitySteps__hintRow">
        <Key icon="↵" label="ENTER" active pressed={pressedKeys.has("Enter")} />
        <Key icon="␣" label="SPACE" active pressed={pressedKeys.has("Space")} />
        <Key icon="●" label={isMobile ? "TAP" : "CLICK"} active />
      </div>
    );
  }, [step, isMobile, lookPhase, pressedKeys]);

  return (
    <div
      className="agCitySteps"
      data-step={step}
      role="dialog"
      aria-label="City tutorial"
      aria-live="polite"
    >
      <div className="agCitySteps__bg" aria-hidden="true" />

      {/* Matrix rain ONLY Step 1 */}
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
                <span className="agCitySteps__progressPct">
                  {Math.round((content.progressValue || 0) * 100)}%
                </span>
              </div>

              <div className="agCitySteps__bar">
                <div
                  className="agCitySteps__barFill"
                  style={{ transform: `scaleX(${clamp01(content.progressValue || 0)})` }}
                />
              </div>

              {/* progress footer hint */}
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
                      else if (step === STEP.ESCAPE) goNext();
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

          <div className="agCitySteps__dots" aria-hidden="true">
            <span className={`p ${step >= 1 ? "on" : ""}`} />
            <span className={`p ${step >= 2 ? "on" : ""}`} />
            <span className={`p ${step >= 3 ? "on" : ""}`} />
            <span className={`p ${step >= 4 ? "on" : ""}`} />
            <span className={`p ${step >= 5 ? "on" : ""}`} />
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
          <div className="agCitySteps__arrowLabel">ORBIT</div>
        </div>
      )}
    </div>
  );
}
