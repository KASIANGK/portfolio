// src/Components/HomeCity/StepsHomeCity.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../style/StepsHomeCity.css";

const LS_KEY = "ag_city_tutorial_done_v1";

// ✅ timings
const LOOK_SECONDS = 2.4; // 2–3s réelles
const MOVE_SECONDS = 1.2;

// detection thresholds
const LOOK_MAG_THRESHOLD = 0.18;
const MOVE_MAG_THRESHOLD = 0.18;

// Desktop: how much mouse delta counts as “real movement”
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

  // -----------------------------------
  // Policy pushed to HomeCity
  // -----------------------------------
  const pushPolicy = useCallback(
    (nextStep) => {
      const s = nextStep ?? stepRef.current;
      const captured = lookPhaseRef.current === "captured";

      // ✅ Desktop: if pointer lock failed, keep showing “click to take control”
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
        // Before capture: lock look + request capture
        // After capture: unlock look (head control allowed)
        policy.lockLook = !captured;
        policy.lockMove = true;

        // ✅ request capture UI:
        // - before captured → yes
        // - after captured → only if desktop and pointer lock not acquired yet
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

  // keep policy in sync
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
  // Global keyboard handling
  // -----------------------------------
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e) => {
      const code = e.code;

      if (ARROWS_ONLY.has(code)) {
        arrowsRef.current.add(code);
      }

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
  // Desktop mouse delta tracking (for LOOK validation)
  // We track movementX/Y regardless; but Step2 will only “count” it once captured.
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
  // - switch UI to “captured”
  // - bump nonce (HomeCity will pointer-lock due to gesture)
  // -----------------------------------
  useEffect(() => {
    if (!enabled) return;
    if (step !== STEP.LOOK) return;

    const captureNow = () => {
      if (lookPhaseRef.current !== "needCapture") return;

      // ✅ make it immediate (avoid ref stale in pushPolicy)
      lookPhaseRef.current = "captured";
      setLookPhase("captured");
      setLookProg(0);

      // clear deltas so the first “active” is real
      mouseDeltaRef.current.dx = 0;
      mouseDeltaRef.current.dy = 0;

      // bump nonce so HomeCity can react *on the same gesture* (Canvas pointerdown)
      setLookCaptureNonce((n) => n + 1);

      // push policy right away => unlock look ASAP
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
  // LOOK: only progresses when there is real movement
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
        if (lookPhaseRef.current !== "captured") {
          // keep at 0
          // (avoid setState spam)
        } else {
          let active = false;

          if (isMobile) {
            const mag = Math.abs(lookInput?.x || 0) + Math.abs(lookInput?.y || 0);
            active = mag > LOOK_MAG_THRESHOLD;
          } else {
            const m = mouseDeltaRef.current;
            const delta = m.dx + m.dy;

            active = delta > MOUSE_DELTA_THRESHOLD;

            // decay so you must keep moving (stable)
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
          hint: "Enter • Space • Click",
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
            hint: "Click • Tap Pad",
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
          hint: "Objectif : bouger la caméra",
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
          hint: "ESC • Enter • Space • Click",
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
          hint: "Objectif : avancer",
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
          hint: "Enter • Space • Click",
          cta: "GOT IT",
          showProgress: false,
        };
    }
  }, [step, isMobile, lookPhase, lookProg, moveProg, orbitWorldPicker]);

  const showArrow = step === STEP.PORTALS && orbitHintScreen?.onScreen;

  return (
    <div className="agCitySteps" role="dialog" aria-label="City tutorial" aria-live="polite">
      <div className="agCitySteps__bg" aria-hidden="true" />

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

          {content.showProgress && (
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
              <div className="agCitySteps__hintMono">{content.hint}</div>
            </div>
          )}

          {!content.showProgress && (
            <div className="agCitySteps__footer">
              <div className="agCitySteps__hint">{content.hint}</div>

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
