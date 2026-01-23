// src/Components/HomeCity/StepsHomeCity.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../style/StepsHomeCity.css";

const LS_KEY = "ag_city_tutorial_done_v1";

// timings
const LOOK_SECONDS = 2.4;   // <- mets 2.0 si tu veux encore plus court
const MOVE_SECONDS = 1.2;

const CONTROL_TOAST_MS = 900;

const LOOK_MAG_THRESHOLD = 0.14;
const MOVE_MAG_THRESHOLD = 0.14;

const STEP = {
  BOOT: 1,
  LOOK: 2,
  ESCAPE: 3,
  MOVE: 4,
  PORTALS: 5,
  GUIDE: 6,
};

const ARROW_ONLY = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function requestCanvasPointerLock() {
  // On prend le premier canvas de la page (dans /city il n’y en a qu’un)
  const el = document.querySelector("canvas");
  if (!el?.requestPointerLock) return false;
  try {
    el.requestPointerLock();
    return true;
  } catch {
    return false;
  }
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

  const [lookProg, setLookProg] = useState(0);
  const [moveProg, setMoveProg] = useState(0);

  // Step2: gating
  const [lookArmed, setLookArmed] = useState(false);
  const [hasHeadControl, setHasHeadControl] = useState(false);

  // Toast
  const [showHeadControlToast, setShowHeadControlToast] = useState(false);
  const toastUntilRef = useRef(0);

  // Desktop tracking
  const mouseDeltaRef = useRef({ dx: 0, dy: 0 });
  const pointerLockedRef = useRef(false);
  const keysRef = useRef(new Set());

  // Orbit hint
  const [orbitWorld, setOrbitWorld] = useState(null);
  const orbitHintArmedRef = useRef(false);

  const stepRef = useRef(step);
  useEffect(() => { stepRef.current = step; }, [step]);

  // ===== Policy pushed to HomeCity =====
  const pushPolicy = useCallback((nextStep) => {
    const s = nextStep ?? stepRef.current;

    const policy = {
      lockLook: true,
      lockMove: true,
      showOrbitHint: false,
      orbitHintWorld: null,
    };

    if (s === STEP.BOOT) {
      policy.lockLook = true;
      policy.lockMove = true;
    } else if (s === STEP.LOOK) {
      policy.lockMove = true;
      policy.lockLook = !hasHeadControl; // ✅ unlocked only once control is acquired
    } else if (s === STEP.ESCAPE) {
      policy.lockMove = true;
      policy.lockLook = false;
    } else if (s === STEP.MOVE) {
      policy.lockMove = false;
      policy.lockLook = false;
    } else if (s === STEP.PORTALS) {
      policy.lockMove = false;
      policy.lockLook = false;
    } else if (s === STEP.GUIDE) {
      policy.lockMove = false;
      policy.lockLook = false;
      policy.showOrbitHint = true;
      policy.orbitHintWorld = orbitWorld;
    }

    onControlChange?.(policy);
  }, [onControlChange, hasHeadControl, orbitWorld]);

  useEffect(() => {
    if (!enabled) return;
    pushPolicy(step);
  }, [enabled, step, pushPolicy]);

  // Reset local state on step changes
  useEffect(() => {
    if (!enabled) return;

    if (step === STEP.BOOT) {
      setLookArmed(false);
      setHasHeadControl(false);
      setShowHeadControlToast(false);
      toastUntilRef.current = 0;
      setLookProg(0);
      setMoveProg(0);
      keysRef.current.clear();
      mouseDeltaRef.current.dx = 0;
      mouseDeltaRef.current.dy = 0;
    }

    if (step === STEP.LOOK) {
      setLookProg(0);
      mouseDeltaRef.current.dx = 0;
      mouseDeltaRef.current.dy = 0;
      setLookArmed(false);
      setHasHeadControl(false);
      setShowHeadControlToast(false);
      toastUntilRef.current = 0;
    }

    if (step === STEP.MOVE) {
      setMoveProg(0);
      keysRef.current.clear();
    }
  }, [enabled, step]);

  // ===== pointerlock tracking (desktop) =====
  useEffect(() => {
    if (!enabled) return;
    if (isMobile) return;

    const onPLC = () => {
      const locked = !!document.pointerLockElement;
      pointerLockedRef.current = locked;

      if (stepRef.current === STEP.LOOK) {
        if (lookArmed && locked) {
          // ✅ instantly grant head control + show toast
          setHasHeadControl(true);
          setShowHeadControlToast(true);
          toastUntilRef.current = performance.now() + CONTROL_TOAST_MS;
        } else if (!locked) {
          // user pressed ESC or lost lock
          setHasHeadControl(false);
        }
      }

      // Step1 must never allow head control
      if (stepRef.current === STEP.BOOT && locked) {
        setHasHeadControl(false);
      }
    };

    document.addEventListener("pointerlockchange", onPLC);
    return () => document.removeEventListener("pointerlockchange", onPLC);
  }, [enabled, isMobile, lookArmed]);

  // ===== Desktop mouse delta tracking for Step2 progress (ONLY when head control) =====
  useEffect(() => {
    if (!enabled) return;
    if (isMobile) return;

    const onMove = (e) => {
      if (stepRef.current !== STEP.LOOK) return;
      if (!hasHeadControl) return;
      if (!pointerLockedRef.current) return;

      const dx = Math.abs(e.movementX || 0);
      const dy = Math.abs(e.movementY || 0);
      mouseDeltaRef.current.dx += dx;
      mouseDeltaRef.current.dy += dy;
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [enabled, isMobile, hasHeadControl]);

  // ✅ Step2: arm + AUTO request pointer lock
  const armLookControls = useCallback(() => {
    if (!enabled) return;
    if (stepRef.current !== STEP.LOOK) return;

    // Already armed? If not locked yet, try again (useful after ESC)
    setLookArmed(true);

    if (isMobile) {
      // mobile: we consider control acquired on tap, movement comes from joystick
      setHasHeadControl(true);
      setShowHeadControlToast(true);
      toastUntilRef.current = performance.now() + CONTROL_TOAST_MS;
      return;
    }

    // desktop: request pointer lock right now
    requestCanvasPointerLock();

    // Some browsers want it in same user gesture; this is still in click handler.
    // If it fails for any reason, a second try right after often works.
    setTimeout(() => {
      if (stepRef.current !== STEP.LOOK) return;
      if (document.pointerLockElement) return;
      requestCanvasPointerLock();
    }, 0);
  }, [enabled, isMobile]);

  // ✅ click/tap anywhere in Step2 should arm automatically
  useEffect(() => {
    if (!enabled) return;

    const onPointerDown = () => {
      if (stepRef.current !== STEP.LOOK) return;
      armLookControls();
    };

    // capture so we catch it even if overlay/card is above canvas
    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [enabled, armLookControls]);

  // ===== Keys =====
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e) => {
      const code = e.code;

      if (stepRef.current === STEP.MOVE && ARROW_ONLY.has(code)) {
        keysRef.current.add(code);
      }

      if (code !== "Enter" && code !== "Space") return;
      e.preventDefault();

      if (stepRef.current === STEP.BOOT) return goNext();
      if (stepRef.current === STEP.ESCAPE) return goNext();
      if (stepRef.current === STEP.PORTALS) return goNext();
      if (stepRef.current === STEP.GUIDE) return complete();
    };

    const onKeyUp = (e) => {
      if (ARROW_ONLY.has(e.code)) keysRef.current.delete(e.code);
    };

    window.addEventListener("keydown", onKeyDown, { passive: false, capture: true });
    window.addEventListener("keyup", onKeyUp, { capture: true });

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
    };
  }, [enabled]);

  // ===== RAF: toast + Step2/Step4 progress =====
  useEffect(() => {
    if (!enabled) return;

    let raf = 0;
    let last = performance.now();

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // toast lifetime
      if (showHeadControlToast && now >= toastUntilRef.current) {
        setShowHeadControlToast(false);
        toastUntilRef.current = 0;
      }

      // Step2 progress
      if (stepRef.current === STEP.LOOK) {
        const toastActive = showHeadControlToast || toastUntilRef.current > 0;

        let active = false;
        if (!hasHeadControl || toastActive) {
          active = false;
        } else if (isMobile) {
          const mag = Math.abs(lookInput?.x ?? 0) + Math.abs(lookInput?.y ?? 0);
          active = mag > LOOK_MAG_THRESHOLD;
        } else {
          const m = mouseDeltaRef.current;
          const delta = m.dx + m.dy;
          active = delta > 10;
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

      // Step4 progress (MOVE)
      if (stepRef.current === STEP.MOVE) {
        let active = false;

        if (isMobile) {
          const mag = Math.abs(moveInput?.x ?? 0) + Math.abs(moveInput?.y ?? 0);
          active = mag > MOVE_MAG_THRESHOLD;
        } else {
          active = keysRef.current.size > 0;
        }

        setMoveProg((p) => {
          const next = clamp01(p + (active ? dt / MOVE_SECONDS : -dt * 0.8));
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
  }, [enabled, isMobile, lookInput, moveInput, hasHeadControl, showHeadControlToast]);

  // Step6 orbit hint auto-hide
  useEffect(() => {
    if (!enabled) return;

    if (step === STEP.GUIDE && !orbitHintArmedRef.current) {
      orbitHintArmedRef.current = true;

      const world = orbitWorldPicker?.() ?? null;
      setOrbitWorld(world);

      const t = setTimeout(() => {
        onControlChange?.({
          lockLook: false,
          lockMove: false,
          showOrbitHint: false,
          orbitHintWorld: null,
        });
      }, 2000);

      return () => clearTimeout(t);
    }

    if (step !== STEP.GUIDE) {
      orbitHintArmedRef.current = false;
    }
  }, [enabled, step, orbitWorldPicker, onControlChange]);

  const goNext = useCallback(() => {
    setLookProg(0);
    setMoveProg(0);

    setStep((s) => {
      if (s === STEP.BOOT) return STEP.LOOK;
      if (s === STEP.ESCAPE) return STEP.MOVE;
      if (s === STEP.PORTALS) return STEP.GUIDE;
      return s;
    });
  }, []);

  const complete = useCallback(() => {
    try { localStorage.setItem(LS_KEY, "1"); } catch {}
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

      case STEP.LOOK: {
        // Phase A: not yet controlled
        if (!hasHeadControl) {
          return {
            badge: "CALIBRATE://POV",
            title: "Active le contrôle de la tête.",
            desc: isMobile
              ? "Tape une fois pour activer le pad (joystick droit)."
              : "Clique une fois pour prendre le contrôle de la tête.",
            hint: "Click • Tap Pad",
            cta: null,             // ✅ plus besoin de bouton : c’est auto
            showProgress: false,
          };
        }

        // Phase B: toast
        if (showHeadControlToast) {
          return {
            badge: "CALIBRATE://POV",
            title: "TÊTE SOUS CONTRÔLE.",
            desc: "Nice. Synchronisation…",
            hint: "…",
            cta: null,
            showProgress: true,
            progressLabel: "LINK",
            progressValue: 1,
          };
        }

        // Phase C: test
        return {
          badge: "CALIBRATE://POV",
          title: "Prends quelques étirements.",
          desc: isMobile
            ? "Bouge la vue (joystick droit) pendant ~2 sec."
            : "Bouge la tête (souris) pendant ~2 sec.",
          hint: "Objectif : bouger la caméra",
          cta: null,
          showProgress: true,
          progressLabel: "POV SYNC",
          progressValue: lookProg,
        };
      }

      case STEP.ESCAPE:
        return {
          badge: "CONTROL://ESC",
          title: "Échappe au contrôle.",
          desc: "Appuie sur ESC pour sortir du contrôle de la tête quand tu veux.",
          hint: "Enter • Space • Click",
          cta: "CONTINUER",
          showProgress: false,
        };

      case STEP.MOVE:
        return {
          badge: "CALIBRATE://MOVE",
          title: "Déplace-toi.",
          desc: isMobile
            ? "Joystick gauche → bouge (1.2s)."
            : "Flèches uniquement → bouge (1.2s).",
          hint: "Objectif : avancer",
          cta: null,
          showProgress: true,
          progressLabel: "MOTOR LINK",
          progressValue: moveProg,
        };

      case STEP.PORTALS:
        return {
          badge: "PORTALS://ORBIT",
          title: "Repère les orbits roses.",
          desc: "Ce sont des portails. Approche-toi… et la ville te répond.",
          hint: "Enter • Space • Click",
          cta: "LET’S GOOO",
          showProgress: false,
        };

      case STEP.GUIDE:
      default:
        return {
          badge: "GUIDE://TARGET",
          title: "Trouve un orbit.",
          desc: orbitWorldPicker
            ? "Je t’en ping un, juste 2 secondes. Ensuite… à toi de jouer."
            : "Astuce : cherche les anneaux roses qui pulsent. Approche-toi.",
          hint: "Enter • Space • Click",
          cta: "DONE",
          showProgress: false,
        };
    }
  }, [step, isMobile, hasHeadControl, showHeadControlToast, lookProg, moveProg, orbitWorldPicker]);

  const showArrow = step === STEP.GUIDE && orbitHintScreen?.onScreen;

  return (
    <div className="agCitySteps" role="dialog" aria-label="City tutorial" aria-live="polite">
      <div className="agCitySteps__bg" aria-hidden="true" />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
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
                      else if (step === STEP.PORTALS) goNext();
                      else if (step === STEP.GUIDE) complete();
                    }}
                  >
                    <span className="agCitySteps__chev" aria-hidden="true">&gt;</span>
                    {content.cta}
                  </button>
                ) : (
                  <span className="agCitySteps__lock">Waiting…</span>
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
            <span className={`p ${step >= 6 ? "on" : ""}`} />
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


