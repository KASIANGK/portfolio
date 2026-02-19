// src/Components/City/CityMarkers.jsx
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useGLTF, Html } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { useTranslation } from "react-i18next";

/** ---------------------------
 *  Groups & Trigger naming
 *  -------------------------- */
const GROUP = { NAV: "NAV", GLOW: "GLOW", FUN: "FUN" };

const NAV_ORBITS = new Set([
  "TRIGGER_ABOUT",
  "TRIGGER_PROJECT",
  "TRIGGER_PORTFOLIO",
  "TRIGGER_VISION_HOME",
]);

const MARKER_ROUTES = {
  TRIGGER_ABOUT: null,
  TRIGGER_PROJECT: null,
  TRIGGER_PORTFOLIO: null,
  TRIGGER_VISION_HOME: "/",
};


const MARKER_CHIPS = {
  TRIGGER_PROJECT: ["React", "3D", "UX", "Ship it"],
  TRIGGER_ABOUT: ["Builder", "Design", "Systems"],
  TRIGGER_PORTFOLIO: ["Collab", "Freelance", "CDI"],
  TRIGGER_VISION_HOME: ["Back", "Reset", "Lobby"],
};

function getGroupByName(name) {
  if (NAV_ORBITS.has(name)) return GROUP.NAV;

  if (name.startsWith("TRIGGER_")) {
    // GLOW
    if (
      name === "TRIGGER_PARKMETRE" ||
      name === "TRIGGER_TRASH" ||
      name === "TRIGGER_DRINK_DISTRIBUTOR" ||
      name === "TRIGGER_DRINK_COFFEE" ||
      name === "TRIGGER_CAR"
    )
      return GROUP.GLOW;

    // FUN
    if (
      name === "TRIGGER_BUS" ||
      name === "TRIGGER_STAIRS" ||
      name === "TRIGGER_FIRE" ||
      name === "TRIGGER_NOTHING"
    )
      return GROUP.FUN;
  }

  return null;
}

/** ---------------------------
 *  Colors per group (neon)
 *  -------------------------- */
const COLORS = {
  [GROUP.NAV]: {
    color: new THREE.Color("#ff00ff"),
    emissive: new THREE.Color("#ff00ff"),
    baseOpacity: 0.22,
    selectedOpacity: 0.44,
    baseEmi: 1.05,
    selectedEmi: 2.1,
  },
  [GROUP.GLOW]: {
    color: new THREE.Color("#00F2FF"),
    emissive: new THREE.Color("#00F2FF"),
    baseOpacity: 0.16,
    selectedOpacity: 0.34,
    baseEmi: 0.95,
    selectedEmi: 1.85,
  },
  [GROUP.FUN]: {
    color: new THREE.Color("#C400FF"),
    emissive: new THREE.Color("#C400FF"),
    baseOpacity: 0.16,
    selectedOpacity: 0.34,
    baseEmi: 0.9,
    selectedEmi: 1.8,
  },
};

/** ---------------------------
 *  Distributor logic
 *  -------------------------- */
const DRINK_MODE = { CITY: "city", FUTURE: "future", SASS: "sass" };
const DIST_STEP = { INTRO: 1, DISPENSE: 2 };

function randItem(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}
function randMode() {
  const m = [DRINK_MODE.CITY, DRINK_MODE.FUTURE, DRINK_MODE.SASS];
  return m[Math.floor(Math.random() * m.length)];
}

/** ---------------------------
 *  NOTHING cutscene
 *  -------------------------- */
const NOTHING = {
  ID: "TRIGGER_NOTHING",
  PHASE: { OFF: null, TITLE: "TITLE" },
  TITLE_MS: 5200,
};

export default function CityMarkers({
  url = "/models/markers_final.glb",
  visible = true,
  radius = 2, // visual orb radius
  yOffset = 2,
  openDistance = 10,
  closeDistance = 13,
  clickDistance = 18, // ✅ only allow click-select within this distance
  hitboxScale = 18.9, // ✅ hitbox radius = radius * hitboxScale
  onLoaded,
  onShown,
  onOrbits,
  onMinimapPoints,
  onNavTrigger,
}) {
  const { scene } = useGLTF(url);
  const { camera } = useThree();
  const navigate = useNavigate();
  const { t } = useTranslation("markers");

  const [selected, setSelected] = useState(null);
  const [pinned, setPinned] = useState(false);

  // Distributor state
  const [drinkMode, setDrinkMode] = useState(DRINK_MODE.CITY);
  const [drinkPick, setDrinkPick] = useState(null);
  const [distStep, setDistStep] = useState(DIST_STEP.INTRO);

  // Temporary description override
  const [descOverride, setDescOverride] = useState({});
  const timersRef = useRef(new Map());

  // NOTHING cutscene
  const [nothingPhase, setNothingPhase] = useState(NOTHING.PHASE.OFF);
  const nothingTimersRef = useRef({ t1: null, t2: null });

  const tmpWorld = useMemo(() => new THREE.Vector3(), []);
  const orbRefs = useRef(new Map());

  const loadedOnceRef = useRef(false);
  const shownOnceRef = useRef(false);

  const cursorWantedRef = useRef(false);

  useLayoutEffect(() => {
    scene.updateMatrixWorld(true);
  }, [scene]);

  /** ---------------------------
   *  Parse triggers from GLB
   *  -------------------------- */
  const points = useMemo(() => {
    const arr = [];
    scene.traverse((o) => {
      if (!o.name || o.name === "Scene") return;
      if (o.isMesh) return; // only empties/groups

      const group = getGroupByName(o.name);
      if (!group) return;

      o.getWorldPosition(tmpWorld);

      arr.push({
        name: o.name,
        group,
        position: tmpWorld.clone(),
        route: MARKER_ROUTES[o.name] || null,
      });
    });
    return arr;
  }, [scene, tmpWorld]);

  /** ---------------------------
   *  Expose orbit positions
   *  -------------------------- */
  useEffect(() => {
    if (!points?.length) return;

    const orbits = points
      .filter((p) => p.group === GROUP.NAV && NAV_ORBITS.has(p.name))
      .map((p) => ({
        id: p.name,
        position: [p.position.x, p.position.y + yOffset, p.position.z],
        route: p.route,
      }));

    onOrbits?.(orbits);
  }, [points, yOffset, onOrbits]);

  useEffect(() => {
    if (!points?.length) return;

    onMinimapPoints?.(
      points.map((p) => ({
        id: p.name,
        group: p.group,
        x: p.position.x,
        z: p.position.z,
      }))
    );
  }, [points, onMinimapPoints]);

  /** ---------------------------
   *  loaded / shown
   *  -------------------------- */
  useEffect(() => {
    if (loadedOnceRef.current) return;
    if (points.length >= 1) {
      loadedOnceRef.current = true;
      onLoaded?.();
    }
  }, [points, onLoaded]);

  useEffect(() => {
    if (shownOnceRef.current) return;
    if (!visible) return;
    if (points.length === 0) return;

    shownOnceRef.current = true;
    requestAnimationFrame(() => onShown?.());
  }, [visible, points, onShown]);

  /** ---------------------------
   *  Select logic + pulse
   *  -------------------------- */
  useFrame((state) => {
    if (!points.length) return;

    // auto-select nearest only if NOT pinned and nothing currently selected
    if (!pinned) {
      if (selected) {
        const d = camera.position.distanceTo(selected.position);
        if (d > closeDistance) setSelected(null);
      } else {
        let best = null;
        let bestDist = Infinity;

        for (const p of points) {
          const d = camera.position.distanceTo(p.position);
          if (d < openDistance && d < bestDist) {
            best = p;
            bestDist = d;
          }
        }
        if (best) setSelected(best);
      }
    } else {
      // pinned: still auto-close if user walks far away
      if (selected) {
        const d = camera.position.distanceTo(selected.position);
        if (d > closeDistance) {
          setSelected(null);
          setPinned(false);
        }
      }
    }

    const tt = state.clock.getElapsedTime();

    for (const p of points) {
      const mesh = orbRefs.current.get(p.name);
      if (!mesh) continue;

      const isSelected = selected?.name === p.name;
      const cfg = COLORS[p.group] || COLORS[GROUP.NAV];

      const speed = p.group === GROUP.NAV ? 1.8 : 0.75;
      const pulse = 0.5 + 0.5 * Math.sin(tt * speed + p.position.x * 0.1);
      const sparkle =
        p.group === GROUP.NAV ? 0 : 0.5 + 0.5 * Math.sin(tt * 0.23 + p.position.z * 0.07);

      const ampScale = p.group === GROUP.NAV ? 0.14 : 0.10;
      const s = isSelected ? 1.28 : 1.0 + pulse * ampScale;
      mesh.scale.setScalar(s);

      const mat = mesh.material;
      if (mat) {
        mat.opacity = isSelected ? cfg.selectedOpacity : cfg.baseOpacity + pulse * 0.08;

        const emiExtra =
          p.group === GROUP.NAV ? pulse * 0.45 : pulse * 0.25 + sparkle * 0.35;

        mat.emissiveIntensity = isSelected ? cfg.selectedEmi : cfg.baseEmi + emiExtra;
      }
    }
  });

  /** ---------------------------
   *  i18n helpers
   *  -------------------------- */
  const markerI18n = useCallback(
    (id, group) => {
      if (group === GROUP.NAV) {
        return {
          title: t(`markers.${id}.title`),
          kicker: t(`markers.${id}.kicker`),
          description: t(`markers.${id}.description`),
          description2: t(`markers.${id}.description2`, { defaultValue: "" }),
          cta: t(`markers.${id}.cta`),
          badge: t("portalBadge"),
        };
      }

      const bucket = group === GROUP.GLOW ? "TRIGGER_GLOW" : "TRIGGER_FUN";
      return {
        title: t(`markers.${bucket}.items.${id}.title`),
        kicker: t(`markers.${bucket}.items.${id}.kicker`),
        description: t(`markers.${bucket}.items.${id}.description`),
        description2: t(`markers.${bucket}.items.${id}.description2`, {
          defaultValue: "",
        }),
        cta: t(`markers.${bucket}.items.${id}.cta`, { defaultValue: "" }),
        badge: t(`markers.${bucket}.label`),
      };
    },
    [t]
  );

  /** ---------------------------
   *  Button styles
   *  -------------------------- */
  const getBtnTheme = (group) => {
    if (group === GROUP.GLOW) {
      return {
        border: "1px solid rgba(0,242,255,0.40)",
        bg: "linear-gradient(90deg, rgba(0,242,255,0.22), rgba(124,58,237,0.18))",
        dot: "rgba(0,242,255,0.98)",
      };
    }
    if (group === GROUP.FUN) {
      return {
        border: "1px solid rgba(196,0,255,0.36)",
        bg: "linear-gradient(90deg, rgba(196,0,255,0.26), rgba(255,0,170,0.14))",
        dot: "rgba(196,0,255,0.98)",
      };
    }
    return {
      border: "1px solid rgba(255,0,170,0.40)",
      bg: "linear-gradient(90deg, rgba(124,58,237,0.92), rgba(255,0,170,0.24))",
      dot: "rgba(255,0,170,0.98)",
    };
  };

  const btnBase = (group) => {
    const th = getBtnTheme(group);
    return {
      marginTop: 12,
      width: "100%",
      padding: "10px 12px",
      borderRadius: 14,
      border: th.border,
      background: th.bg,
      color: "rgba(255,255,255,0.94)",
      fontWeight: 950,
      cursor: "pointer",
      letterSpacing: 0.2,
      transition:
        "transform 140ms ease, box-shadow 160ms ease, border-color 160ms ease, filter 160ms ease",
    };
  };

  const btnHover = (el, group) => {
    el.style.transform = "translateY(-1px)";
    el.style.filter = "brightness(1.06)";
    el.style.boxShadow =
      group === GROUP.GLOW
        ? "0 0 0 1px rgba(0,242,255,0.20), 0 0 28px rgba(0,242,255,0.16), 0 0 72px rgba(124,58,237,0.10)"
        : group === GROUP.FUN
        ? "0 0 0 1px rgba(196,0,255,0.18), 0 0 28px rgba(196,0,255,0.14), 0 0 72px rgba(255,0,170,0.08)"
        : "0 0 0 1px rgba(255,0,170,0.20), 0 0 28px rgba(255,0,170,0.16), 0 0 72px rgba(124,58,237,0.12)";
    el.style.borderColor =
      group === GROUP.GLOW
        ? "rgba(0,242,255,0.70)"
        : group === GROUP.FUN
        ? "rgba(196,0,255,0.65)"
        : "rgba(255,0,170,0.70)";
  };

  const btnLeave = (el, group) => {
    const th = getBtnTheme(group);
    el.style.transform = "translateY(0)";
    el.style.filter = "none";
    el.style.border = th.border;
    el.style.boxShadow = "none";
  };

  /** ---------------------------
   *  Distributor: roll logic
   *  -------------------------- */
  const rollDrink = useCallback(() => {
    const cityItems = t("drinks.city.items", { returnObjects: true });
    const futureItems = t("drinks.future.items", { returnObjects: true });
    const sassItems = t("drinks.sass.items", { returnObjects: true });

    const mode = randMode();
    setDrinkMode(mode);

    if (mode === DRINK_MODE.CITY) {
      setDrinkPick({ mode, item: randItem(cityItems) });
      return;
    }
    if (mode === DRINK_MODE.FUTURE) {
      setDrinkPick({ mode, item: randItem(futureItems) });
      return;
    }

    setDrinkPick({ mode, item: randItem(sassItems) });
  }, [t]);

  /** ---------------------------
   *  Mini interaction: show description2 for 5s
   *  -------------------------- */
  const flashDescription = useCallback((id, text, ms = 5000) => {
    if (!text) return;

    const prev = timersRef.current.get(id);
    if (prev) clearTimeout(prev);

    setDescOverride((cur) => ({ ...cur, [id]: text }));

    const to = setTimeout(() => {
      setDescOverride((cur) => {
        const next = { ...cur };
        delete next[id];
        return next;
      });
      timersRef.current.delete(id);
    }, ms);

    timersRef.current.set(id, to);
  }, []);

  /** ---------------------------
   *  NOTHING cutscene controller
   *  -------------------------- */
  const startNothingCutscene = useCallback(() => {
    if (nothingPhase !== NOTHING.PHASE.OFF) return;

    if (nothingTimersRef.current.t1) clearTimeout(nothingTimersRef.current.t1);

    setNothingPhase(NOTHING.PHASE.TITLE);

    nothingTimersRef.current.t1 = setTimeout(() => {
      setNothingPhase(NOTHING.PHASE.OFF);
    }, NOTHING.TITLE_MS);
  }, [nothingPhase]);

  useEffect(() => {
    return () => {
      for (const to of timersRef.current.values()) clearTimeout(to);
      timersRef.current.clear();

      if (nothingTimersRef.current.t1) clearTimeout(nothingTimersRef.current.t1);
      if (nothingTimersRef.current.t2) clearTimeout(nothingTimersRef.current.t2);
      document.body.style.cursor = "default";
    };
  }, []);

  useEffect(() => {
    if (selected?.name !== NOTHING.ID && nothingPhase !== NOTHING.PHASE.OFF) {
      setNothingPhase(NOTHING.PHASE.OFF);
    }
  }, [selected, nothingPhase]);

  /** ---------------------------
   *  ONE action for click/space/enter
   *  -------------------------- */
  const triggerAction = useCallback(() => {
    if (!selected) return;
  
    // ✅ NAV (only)
    if (selected.group === GROUP.NAV) {
      // preferred: delegate to HomeCity
      if (onNavTrigger) {
        onNavTrigger(selected.name);
        return;
      }
  
      // fallback: legacy route
      if (selected.route) {
        navigate(selected.route);
        return;
      }
  
      return;
    }
  
    // Distributor
    if (selected.name === "TRIGGER_DRINK_DISTRIBUTOR") {
      if (distStep === DIST_STEP.INTRO) {
        setDistStep(DIST_STEP.DISPENSE);
        rollDrink();
        return;
      }
      setDrinkPick(null);
      setDistStep(DIST_STEP.INTRO);
      return;
    }
  
    // NOTHING
    if (selected.name === NOTHING.ID) {
      startNothingCutscene();
      return;
    }
  
    // GLOW / FUN
    if (selected.group === GROUP.GLOW || selected.group === GROUP.FUN) {
      const ui = markerI18n(selected.name, selected.group);
      flashDescription(selected.name, ui.description2, 5000);
    }
  }, [
    selected,
    onNavTrigger,
    navigate,
    distStep,
    rollDrink,
    startNothingCutscene,
    markerI18n,
    flashDescription,
  ]);
  

  /** ---------------------------
   *  Keyboard: Enter/Space triggers same action
   *  -------------------------- */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code !== "Space" && e.code !== "Enter") return;
      if (!selected) return;

      const tag = e.target?.tagName?.toLowerCase?.();
      if (tag === "input" || tag === "textarea" || e.target?.isContentEditable) return;

      e.preventDefault();
      triggerAction();
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, triggerAction]);

  /** ---------------------------
   *  Distributor Screen UI
   *  -------------------------- */
  const DistributorScreen = () => {
    const hint = t("drinks.hint");
    const ctaPrimary = t("drinks.ctaPrimary");
    const letsGo = t("drinks.ctaLetsGo", { defaultValue: "Let’s go" });

    const cityImg = t("drinks.city.image");
    const futureImg = t("drinks.future.image");

    const isCity = drinkMode === DRINK_MODE.CITY;
    const isFuture = drinkMode === DRINK_MODE.FUTURE;
    const isSass = drinkMode === DRINK_MODE.SASS;

    const screenImg = isFuture ? futureImg : cityImg;

    const pickedName = drinkPick?.item?.name || "—";
    const pickedLine = drinkPick?.item?.line || "";
    const pickedPred = drinkPick?.item?.prediction || "";

    const startDispense = () => {
      if (distStep === DIST_STEP.INTRO) {
        setDistStep(DIST_STEP.DISPENSE);
        rollDrink();
      }
    };

    const pressTake = () => {
      setDrinkPick(null);
      setDistStep(DIST_STEP.INTRO);
    };

    return (
      <div style={{ marginTop: 12 }}>
        {distStep === DIST_STEP.INTRO && (
          <div
            style={{
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.35)",
              padding: 12,
            }}
          >
            <div
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 11,
                opacity: 0.75,
                marginBottom: 6,
              }}
            >
              terminal://distributor
            </div>

            <button
              type="button"
              onClick={startDispense}
              style={{
                marginTop: 6,
                width: "100%",
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(0,242,255,0.40)",
                background:
                  "linear-gradient(90deg, rgba(0,242,255,0.20), rgba(124,58,237,0.16))",
                color: "rgba(255,255,255,0.94)",
                fontWeight: 950,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => btnHover(e.currentTarget, GROUP.GLOW)}
              onMouseLeave={(e) => btnLeave(e.currentTarget, GROUP.GLOW)}
            >
              {letsGo}
            </button>

            <div style={{ marginTop: 8, fontSize: 11, opacity: 0.7, textAlign: "center" }}>
              {hint}
            </div>
          </div>
        )}

        {distStep === DIST_STEP.DISPENSE && (
          <div
            style={{
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.12)",
              overflow: "hidden",
              background: "rgba(0,0,0,0.38)",
              boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                padding: "10px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 11,
                color: "rgba(255,255,255,0.78)",
                background: "rgba(0,0,0,0.35)",
              }}
            >
              <span>terminal://drink</span>
              <span style={{ opacity: 0.65 }}>ready</span>
            </div>

            <div style={{ padding: 12, position: "relative" }}>
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  background:
                    "repeating-linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.05) 1px, transparent 1px, transparent 4px)",
                  opacity: 0.12,
                  mixBlendMode: "overlay",
                }}
              />

              {(isCity || isFuture) && (
                <div
                  style={{
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.28)",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
                    marginBottom: 10,
                    overflow: "hidden",
                    display: "grid",
                    placeItems: "center",
                    padding: 8,
                  }}
                >
                  <img
                    src={screenImg}
                    alt={isFuture ? "future juice" : "city drinks"}
                    draggable={false}
                    style={{
                      width: "100%",
                      height: 160,
                      objectFit: "contain",
                      display: "block",
                      userSelect: "none",
                    }}
                  />
                </div>
              )}

              <div
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  color: "rgba(255,255,255,0.90)",
                  lineHeight: 1.35,
                  fontSize: 12,
                }}
              >
                <div style={{ opacity: 0.75 }}>drink.name</div>
                <div style={{ fontSize: 14, fontWeight: 900, marginTop: 2 }}>
                  <span style={{ color: "rgba(0,242,255,0.98)" }}>{pickedName}</span>
                </div>

                {isFuture && (
                  <>
                    <div style={{ marginTop: 10, opacity: 0.75 }}>prediction</div>
                    <div
                      style={{
                        marginTop: 2,
                        fontFamily:
                          '"Plus Jakarta Sans", system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
                      }}
                    >
                      {pickedPred || "—"}
                    </div>
                  </>
                )}

                {isCity && (
                  <>
                    <div style={{ marginTop: 10, opacity: 0.75 }}>note</div>
                    <div
                      style={{
                        marginTop: 2,
                        fontFamily:
                          '"Plus Jakarta Sans", system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
                      }}
                    >
                      {pickedLine || "—"}
                    </div>
                  </>
                )}

                {isSass && (
                  <>
                    <div style={{ marginTop: 10, opacity: 0.75 }}>machine.says</div>
                    <div style={{ marginTop: 2 }}>{pickedLine || "…"}</div>
                  </>
                )}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={pressTake}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 14,
                    border: "1px solid rgba(0,242,255,0.40)",
                    background:
                      "linear-gradient(90deg, rgba(0,242,255,0.22), rgba(124,58,237,0.14))",
                    color: "rgba(255,255,255,0.94)",
                    fontWeight: 950,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => btnHover(e.currentTarget, GROUP.GLOW)}
                  onMouseLeave={(e) => btnLeave(e.currentTarget, GROUP.GLOW)}
                >
                  {ctaPrimary}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  /** ---------------------------
   *  Shared "select by click" handler
   *  ✅ separated hitbox vs visual
   *  -------------------------- */
  const selectByClick = useCallback(
    (p) => {
      // only clickable when close enough
      const d = camera.position.distanceTo(p.position);
      if (d > clickDistance) return;

      setSelected(p);
      setPinned(true);

      // reset distributor state on select
      if (p.name === "TRIGGER_DRINK_DISTRIBUTOR") {
        setDrinkPick(null);
        setDrinkMode(DRINK_MODE.CITY);
        setDistStep(DIST_STEP.INTRO);
      }

      // reset NOTHING cutscene if selecting something else
      if (p.name !== NOTHING.ID && nothingPhase !== NOTHING.PHASE.OFF) {
        setNothingPhase(NOTHING.PHASE.OFF);
      }
    },
    [camera, clickDistance, nothingPhase]
  );

  /** ---------------------------
   *  Render
   *  -------------------------- */
  return (
    <group>
      {points.map((p) => {
        const cfg = COLORS[p.group] || COLORS[GROUP.NAV];
        const pos = [p.position.x, p.position.y + yOffset, p.position.z];

        return (
          <group key={p.name} position={pos} visible={visible}>
            {/* ✅ VISUAL ORB (pretty) */}
            <mesh
              ref={(r) => {
                if (!r) orbRefs.current.delete(p.name);
                else orbRefs.current.set(p.name, r);
              }}
            >
              <sphereGeometry args={[radius, 18, 18]} />
              <meshStandardMaterial
                transparent
                opacity={cfg.baseOpacity}
                emissive={cfg.emissive}
                emissiveIntensity={cfg.baseEmi}
                color={cfg.color}
                depthWrite={false}
              />
            </mesh>

            {/* ✅ HITBOX (bigger, invisible, clickable) */}
            <mesh
              onPointerOver={(e) => {
                e.stopPropagation();
                const d = camera.position.distanceTo(p.position);
                cursorWantedRef.current = d <= clickDistance;
                document.body.style.cursor = cursorWantedRef.current ? "pointer" : "default";
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                cursorWantedRef.current = false;
                document.body.style.cursor = "default";
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                selectByClick(p);
              }}
            >
              <sphereGeometry args={[radius * hitboxScale, 12, 12]} />
              <meshBasicMaterial
                transparent
                opacity={0}
                depthWrite={false}
                depthTest={false}
              />
            </mesh>
          </group>
        );
      })}

      {selected &&
        (() => {
          const ui = markerI18n(selected.name, selected.group);
          const chips = selected.group === GROUP.NAV ? MARKER_CHIPS[selected.name] || [] : [];
          const th = getBtnTheme(selected.group);

          const isDistributor = selected.name === "TRIGGER_DRINK_DISTRIBUTOR";
          const isNothing = selected.name === NOTHING.ID;

          const override = descOverride[selected.name];
          const descriptionToShow = override || ui.description;

          const showCta =
            !isDistributor && !override && !(isNothing && nothingPhase !== NOTHING.PHASE.OFF);

          return (
            <Html
              position={[
                selected.position.x,
                selected.position.y + yOffset + 1.6,
                selected.position.z,
              ]}
              center
              style={{ pointerEvents: "none" }}
            >
              <div
                style={{
                  pointerEvents: "auto",
                  width: 340,
                  borderRadius: 18,
                  padding: 14,
                  background:
                    selected.group === GROUP.GLOW
                      ? "radial-gradient(700px 360px at 18% 25%, rgba(0,242,255,0.14), transparent 60%)," +
                        "radial-gradient(700px 360px at 78% 35%, rgba(124,58,237,0.14), transparent 55%)," +
                        "rgba(0,0,0,0.72)"
                      : selected.group === GROUP.FUN
                      ? "radial-gradient(700px 360px at 18% 25%, rgba(196,0,255,0.14), transparent 60%)," +
                        "radial-gradient(700px 360px at 78% 35%, rgba(255,0,170,0.10), transparent 55%)," +
                        "rgba(0,0,0,0.72)"
                      : "radial-gradient(700px 360px at 18% 25%, rgba(255,0,170,0.16), transparent 60%)," +
                        "radial-gradient(700px 360px at 78% 35%, rgba(124,58,237,0.18), transparent 55%)," +
                        "rgba(0,0,0,0.72)",
                  border: "1px solid rgba(255,255,255,0.16)",
                  boxShadow:
                    selected.group === GROUP.GLOW
                      ? "0 18px 55px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,242,255,0.10), 0 0 60px rgba(0,242,255,0.10)"
                      : selected.group === GROUP.FUN
                      ? "0 18px 55px rgba(0,0,0,0.55), 0 0 0 1px rgba(196,0,255,0.10), 0 0 60px rgba(196,0,255,0.10)"
                      : "0 18px 55px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,0,170,0.10), 0 0 60px rgba(124,58,237,0.10)",
                  backdropFilter: "blur(12px)",
                  color: "white",
                  fontFamily:
                    '"Plus Jakarta Sans", system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background:
                      "repeating-linear-gradient(to bottom, rgba(255,255,255,0.04), rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px)",
                    opacity: 0.12,
                    mixBlendMode: "overlay",
                  }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.75, letterSpacing: 1.2 }}>
                      {ui.kicker}
                    </div>
                    <div style={{ fontWeight: 950, fontSize: 16, marginTop: 3 }}>
                      {ui.title}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(0,0,0,0.35)",
                      whiteSpace: "nowrap",
                      height: "fit-content",
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    }}
                  >
                    <span style={{ color: th.dot, fontWeight: 900 }}>●</span> {ui.badge}
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  {isNothing && nothingPhase === NOTHING.PHASE.TITLE && (
                    <div
                      style={{
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(0,0,0,0.85)",
                        padding: 14,
                        textAlign: "center",
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        fontWeight: 900,
                        letterSpacing: 2,
                        fontSize: 46,
                      }}
                    >
                      {t("nothing.nic")}
                    </div>
                  )}

                  {(!isNothing || nothingPhase === NOTHING.PHASE.OFF) && (
                    <>
                      {!(isDistributor && distStep === DIST_STEP.DISPENSE) && (
                        <div style={{ opacity: 0.9, lineHeight: 1.45, fontSize: 16 }}>
                          {descriptionToShow}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {!!chips.length && (
                  <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {chips.map((c) => (
                      <div
                        key={c}
                        style={{
                          fontSize: 11,
                          padding: "6px 10px",
                          borderRadius: 999,
                          border: "1px solid rgba(255,255,255,0.14)",
                          background: "rgba(255,255,255,0.06)",
                          opacity: 0.95,
                        }}
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                )}

                {isDistributor && <DistributorScreen />}

                {showCta && (
                  <button
                    type="button"
                    onClick={triggerAction}
                    style={btnBase(selected.group)}
                    onMouseEnter={(e) => btnHover(e.currentTarget, selected.group)}
                    onMouseLeave={(e) => btnLeave(e.currentTarget, selected.group)}
                  >
                    {ui.cta}
                  </button>
                )}
              </div>
            </Html>
          );
        })()}
    </group>
  );
}

useGLTF.preload("/models/markers_final.glb");
