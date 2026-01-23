// src/Components/HomeCity/StepsHomeCity.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../style/StepsHomeCity.css";

const LS_KEY = "ag_city_tutorial_done_v1";

// Timings “jeu vidéo”
const LOOK_SECONDS = 2.6;
const MOVE_SECONDS = 2.8;

// Sensibilité detection
const LOOK_MAG_THRESHOLD = 0.18; // joystick magnitude
const MOVE_MAG_THRESHOLD = 0.18;

const STEP = {
  BOOT: 1,
  LOOK: 2,
  MOVE: 3,
  PORTALS: 4,
  GUIDE: 5,
};

export default function StepsHomeCity({
  enabled,
  isMobile,
  lookInput,
  moveInput,
  orbitWorldPicker,     // () => {x,y,z} | null   (optionnel mais recommandé)
  orbitHintScreen,      // {x,y,onScreen} from projector (optionnel)
  onControlChange,      // (policy) => void
  onDone,
}) {
  const [step, setStep] = useState(STEP.BOOT);

  // progress bars (0..1)
  const [lookProg, setLookProg] = useState(0);
  const [moveProg, setMoveProg] = useState(0);

  // “world target” for orbit arrow
  const [orbitWorld, setOrbitWorld] = useState(null);
  const orbitHintArmedRef = useRef(false);

  const stepRef = useRef(step);
  useEffect(() => { stepRef.current = step; }, [step]);

  // Desktop input tracking
  const mouseDeltaRef = useRef({ dx: 0, dy: 0 });
  const keysRef = useRef(new Set());

  // === Policy (locks) pushed to HomeCity ===
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
      policy.lockLook = false;
      policy.lockMove = true;
    } else if (s === STEP.MOVE) {
      policy.lockLook = false;
      policy.lockMove = false;
    } else if (s === STEP.PORTALS) {
      policy.lockLook = false;
      policy.lockMove = false;
    } else if (s === STEP.GUIDE) {
      policy.lockLook = false;
      policy.lockMove = false;
      policy.showOrbitHint = true;
      policy.orbitHintWorld = orbitWorld;
    }

    onControlChange?.(policy);
  }, [onControlChange, orbitWorld]);

  // sync policy when step changes
  useEffect(() => {
    if (!enabled) return;
    pushPolicy(step);
  }, [enabled, step, pushPolicy]);

  // === Global key handling (Enter/Space) for CTAs ===
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e) => {
      const code = e.code;

      // Movement keys tracking (step3)
      const moveKeys = ["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","KeyZ","KeyQ"];
      if (moveKeys.includes(code)) keysRef.current.add(code);

      if (code !== "Enter" && code !== "Space") return;

      // prevent scroll on Space
      e.preventDefault();

      if (stepRef.current === STEP.BOOT) {
        goNext();
      } else if (stepRef.current === STEP.PORTALS) {
        goNext(); // -> GUIDE
      } else if (stepRef.current === STEP.GUIDE) {
        complete();
      }
    };

    const onKeyUp = (e) => {
      keysRef.current.delete(e.code);
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [enabled]);

  // === Desktop mouse look delta tracking (step2) ===
  useEffect(() => {
    if (!enabled) return;
    if (isMobile) return;

    const onMove = (e) => {
      // si pointer lock, movementX/Y est le plus fiable
      const dx = Math.abs(e.movementX || 0);
      const dy = Math.abs(e.movementY || 0);

      mouseDeltaRef.current.dx += dx;
      mouseDeltaRef.current.dy += dy;
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [enabled, isMobile]);

  // === Timed completion loops (Step2 / Step3) ===
  useEffect(() => {
    if (!enabled) return;

    let raf = 0;
    let last = performance.now();

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const s = stepRef.current;

      // Step2: LOOK required for LOOK_SECONDS
      if (s === STEP.LOOK) {
        let active = false;

        if (isMobile) {
          const mag = Math.abs(lookInput.x) + Math.abs(lookInput.y);
          active = mag > LOOK_MAG_THRESHOLD;
        } else {
          // On considère “actif” si des deltas se cumulent
          const m = mouseDeltaRef.current;
          const delta = m.dx + m.dy;
          active = delta > 14; // seuil par frame cumulé
          // amorti
          mouseDeltaRef.current.dx *= 0.35;
          mouseDeltaRef.current.dy *= 0.35;
        }

        setLookProg((p) => {
          const next = clamp01(p + (active ? dt / LOOK_SECONDS : -dt * 0.7));
          if (next >= 1) {
            // transition
            queueMicrotask(() => {
              setLookProg(0);
              setMoveProg(0);
              setStep(STEP.MOVE);
            });
          }
          return next;
        });
      }

      // Step3: MOVE required for MOVE_SECONDS
      if (s === STEP.MOVE) {
        let active = false;

        if (isMobile) {
          const mag = Math.abs(moveInput.x) + Math.abs(moveInput.y);
          active = mag > MOVE_MAG_THRESHOLD;
        } else {
          // keys pressed
          active = keysRef.current.size > 0;
        }

        setMoveProg((p) => {
          const next = clamp01(p + (active ? dt / MOVE_SECONDS : -dt * 0.7));
          if (next >= 1) {
            queueMicrotask(() => {
              setLookProg(0);
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

  // === Step5 orbit hint auto-arm + auto-hide after 2s ===
  useEffect(() => {
    if (!enabled) return;

    if (step === STEP.GUIDE && !orbitHintArmedRef.current) {
      orbitHintArmedRef.current = true;

      const world = orbitWorldPicker?.() ?? null;
      setOrbitWorld(world);

      // after we have world, we want the arrow for 2 seconds
      const t = setTimeout(() => {
        // keep step, but stop showing the arrow
        onControlChange?.((prev) => ({
          ...(typeof prev === "function" ? prev() : prev),
          lockLook: false,
          lockMove: false,
          showOrbitHint: false,
          orbitHintWorld: null,
        }));
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

      case STEP.LOOK:
        return {
          badge: "CALIBRATE://POV",
          title: "Calibre ton POV.",
          desc: isMobile
            ? "Joystick droit → bouge la vue. On valide quand tu “vises” vraiment (2–3 sec)."
            : "Souris → bouge la vue. On valide quand tu “regardes” vraiment (2–3 sec).",
          hint: "Objectif : bouger la caméra",
          cta: null,
          showProgress: true,
          progressLabel: "POV SYNC",
          progressValue: lookProg,
        };

      case STEP.MOVE:
        return {
          badge: "CALIBRATE://MOVE",
          title: "Apprends à te déplacer.",
          desc: isMobile
            ? "Joystick gauche → avance. On valide quand tu te déplaces vraiment (2–3 sec)."
            : "ZQSD / WASD / flèches → avance. On valide quand tu te déplaces vraiment (2–3 sec).",
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
  }, [step, isMobile, lookProg, moveProg, orbitWorldPicker]);

  // Arrow UI (optional) from orbitHintScreen
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
                <span className="agCitySteps__progressPct">{Math.round((content.progressValue || 0) * 100)}%</span>
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
          </div>
        </motion.div>
      </AnimatePresence>

      {/* UI Arrow pointing to orbit (optional, premium) */}
      {showArrow && (
        <div
          className="agCitySteps__arrow"
          style={{
            left: orbitHintScreen.x,
            top: orbitHintScreen.y,
          }}
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

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}
