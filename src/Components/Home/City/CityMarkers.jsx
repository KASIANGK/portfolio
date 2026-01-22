import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useGLTF, Html } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { useTranslation } from "react-i18next";

const FUCHSIA_SOLID = "rgba(255,0,170,0.95)";

// ✅ routes + chips restent “data”, pas du texte UI
const MARKER_ROUTES = {
  TRIGGER_PORTFOLIO: "/portfolio",
  TRIGGER_SKILLS: "/skills",
  TRIGGER_ABOUT: "/about",
  TRIGGER_VISION: "/vision",
  TRIGGER_CONTACT: "/contact",
};

const MARKER_CHIPS = {
  TRIGGER_PORTFOLIO: ["React", "3D", "UX", "Ship it"],
  TRIGGER_SKILLS: ["JS", "React", "Python", "Blender"],
  TRIGGER_ABOUT: ["Builder", "Design", "Systems"],
  TRIGGER_VISION: ["Hardware", "Software", "Brand"],
  TRIGGER_CONTACT: ["Freelance", "CDI", "Collab"],
};

export default function CityMarkers({
  url = "/models/city_markers.glb",
  visible = true,
  radius = 2,
  yOffset = 2,
  openDistance = 10,
  closeDistance = 13,
  onLoaded,
  onShown,
}) {
  const { scene } = useGLTF(url);
  const { camera } = useThree();
  const navigate = useNavigate();
  const { t } = useTranslation("markers");

  const [selected, setSelected] = useState(null);
  const tmpWorld = useMemo(() => new THREE.Vector3(), []);

  const loadedOnceRef = useRef(false);
  const shownOnceRef = useRef(false);

  const orbRefs = useRef(new Map());

  const orbColor = useMemo(() => new THREE.Color(1, 0, 0.75), []);
  const orbEmissive = useMemo(() => new THREE.Color(1, 0, 0.65), []);

  useLayoutEffect(() => {
    scene.updateMatrixWorld(true);
  }, [scene]);

  const points = useMemo(() => {
    const arr = [];

    scene.traverse((o) => {
      if (o.isMesh) return;
      if (!o.name || o.name === "Scene") return;

      const route = MARKER_ROUTES[o.name];
      if (!route) return;

      o.getWorldPosition(tmpWorld);
      arr.push({
        name: o.name,
        position: tmpWorld.clone(),
        route,
      });
    });

    return arr;
  }, [scene, tmpWorld]);

  // ✅ loaded = points parsed
  useEffect(() => {
    if (loadedOnceRef.current) return;
    if (points.length >= 1) {
      loadedOnceRef.current = true;
      onLoaded?.();
    }
  }, [points, onLoaded]);

  // ✅ shown = visible true + points + next frame
  useEffect(() => {
    if (shownOnceRef.current) return;
    if (!visible) return;
    if (points.length === 0) return;

    shownOnceRef.current = true;
    requestAnimationFrame(() => onShown?.());
  }, [visible, points, onShown]);

  useFrame((state) => {
    if (!points.length) return;

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

    const tt = state.clock.getElapsedTime();

    for (const p of points) {
      const mesh = orbRefs.current.get(p.name);
      if (!mesh) continue;

      const isSelected = selected?.name === p.name;

      const pulse = 0.5 + 0.5 * Math.sin(tt * 2.2 + p.position.x * 0.08);
      const s = isSelected ? 1.18 : 1.0 + pulse * 0.08;
      mesh.scale.setScalar(s);

      const mat = mesh.material;
      if (mat) {
        mat.opacity = isSelected ? 0.42 : 0.22 + pulse * 0.10;
        mat.emissiveIntensity = isSelected ? 1.65 : 0.75 + pulse * 0.55;
      }
    }
  });

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code !== "Space" && e.code !== "Enter") return;
      if (!selected?.route) return;
      e.preventDefault();
      navigate(selected.route);
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, navigate]);

  const go = () => {
    if (!selected?.route) return;
    navigate(selected.route);
  };

  const btnBase = {
    marginTop: 12,
    width: "100%",
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,0,170,0.35)",
    background: "linear-gradient(90deg, rgba(124,58,237,0.92), rgba(255,0,170,0.22))",
    color: "rgba(255,255,255,0.94)",
    fontWeight: 950,
    cursor: "pointer",
    letterSpacing: 0.2,
    transition:
      "transform 140ms ease, box-shadow 160ms ease, border-color 160ms ease, filter 160ms ease",
  };

  const btnHover = (el) => {
    el.style.transform = "translateY(-1px)";
    el.style.filter = "brightness(1.05)";
    el.style.borderColor = "rgba(255,0,170,0.60)";
    el.style.boxShadow =
      "0 0 0 1px rgba(255,0,170,0.18), 0 0 28px rgba(255,0,170,0.14), 0 0 70px rgba(124,58,237,0.12)";
  };

  const btnLeave = (el) => {
    el.style.transform = "translateY(0)";
    el.style.filter = "none";
    el.style.borderColor = "rgba(255,0,170,0.35)";
    el.style.boxShadow = "none";
  };

  // ✅ helper: get translated marker data
  const markerI18n = (id) => ({
    title: t(`markers.${id}.title`),
    kicker: t(`markers.${id}.kicker`),
    description: t(`markers.${id}.description`),
    cta: t(`markers.${id}.cta`),
  });

  return (
    <group>
      {points.map((p) => (
        <mesh
          key={p.name}
          position={[p.position.x, p.position.y + yOffset, p.position.z]}
          visible={visible}
          ref={(r) => {
            if (!r) {
              orbRefs.current.delete(p.name);
              return;
            }
            orbRefs.current.set(p.name, r);
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            setSelected(p);
          }}
        >
          <sphereGeometry args={[radius, 18, 18]} />
          <meshStandardMaterial
            transparent
            opacity={0.28}
            emissive={orbEmissive}
            emissiveIntensity={0.85}
            color={orbColor}
          />
        </mesh>
      ))}

      {selected && (() => {
        const ui = markerI18n(selected.name);
        const chips = MARKER_CHIPS[selected.name] || [];

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
                width: 320,
                borderRadius: 18,
                padding: 14,
                background:
                  "radial-gradient(700px 360px at 18% 25%, rgba(255,0,170,0.16), transparent 60%)," +
                  "radial-gradient(700px 360px at 78% 35%, rgba(124,58,237,0.18), transparent 55%)," +
                  "rgba(0,0,0,0.72)",
                border: "1px solid rgba(255,255,255,0.16)",
                boxShadow:
                  "0 18px 55px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,0,170,0.10), 0 0 60px rgba(124,58,237,0.10)",
                backdropFilter: "blur(12px)",
                color: "white",
                fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
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

              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, position: "relative" }}>
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
                  }}
                >
                  <span style={{ color: FUCHSIA_SOLID, fontWeight: 900 }}>●</span>{" "}
                  {t("portalBadge")}
                </div>
              </div>

              <div
                style={{
                  marginTop: 10,
                  opacity: 0.9,
                  lineHeight: 1.45,
                  fontSize: 12,
                  position: "relative",
                }}
              >
                {ui.description}
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", position: "relative" }}>
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

              <button
                onClick={go}
                style={btnBase}
                onMouseEnter={(e) => btnHover(e.currentTarget)}
                onMouseLeave={(e) => btnLeave(e.currentTarget)}
              >
                {ui.cta} <span style={{ opacity: 0.75 }}>{t("ctaHint")}</span>
              </button>

              <div
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  opacity: 0.7,
                  textAlign: "center",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  position: "relative",
                }}
              >
                {/* {t("footerHint")} */}
              </div>
            </div>
          </Html>
        );
      })()}
    </group>
  );
}

useGLTF.preload("/models/city_markers.glb");




// import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
// import { useGLTF, Html } from "@react-three/drei";
// import { useThree, useFrame } from "@react-three/fiber";
// import { useNavigate } from "react-router-dom";
// import * as THREE from "three";

// const FUCHSIA_SOLID = "rgba(255,0,170,0.95)";

// const MARKER_CONFIG = {
//   TRIGGER_PORTFOLIO: {
//     route: "/portfolio",
//     title: "Portfolio Vault",
//     kicker: "Selected works",
//     description: "Projets web + 3D + prototypes. Court, propre, et orienté impact.",
//     chips: ["React", "3D", "UX", "Ship it"],
//     cta: "Enter Portfolio",
//   },
//   TRIGGER_SKILLS: {
//     route: "/skills",
//     title: "Skill Tree",
//     kicker: "Stack & superpowers",
//     description: "Les outils que je maîtrise + ceux que j’upgrade. Spoiler : je build vite.",
//     chips: ["JS", "React", "Python", "Blender"],
//     cta: "Open Skills",
//   },
//   TRIGGER_ABOUT: {
//     route: "/about",
//     title: "About Kasia",
//     kicker: "The builder behind it",
//     description: "Profil hybride : dev fullstack + 3D + vision produit. Oui, c’est volontaire.",
//     chips: ["Builder", "Design", "Systems"],
//     cta: "Meet Me",
//   },
//   TRIGGER_VISION: {
//     route: "/vision",
//     title: "Vision Room",
//     kicker: "Why this exists",
//     description: "Angels Gang : mode évolutive + tech + expérience. Une marque, pas juste un produit.",
//     chips: ["Hardware", "Software", "Brand"],
//     cta: "See Vision",
//   },
//   TRIGGER_CONTACT: {
//     route: "/contact",
//     title: "Contact Portal",
//     kicker: "Let’s collaborate",
//     description: "Si tu veux quelqu’un qui exécute, itère, et livre — tu viens de me trouver.",
//     chips: ["Freelance", "CDI", "Collab"],
//     cta: "Contact",
//   },
// };

// export default function CityMarkers({
//   url = "/models/city_markers.glb",
//   visible = true,

//   // visuel
//   radius = 2,
//   yOffset = 2,

//   // proximité
//   openDistance = 10,
//   closeDistance = 13,

//   // callbacks
//   onLoaded,
//   onShown,
// }) {
//   const { scene } = useGLTF(url);
//   const { camera } = useThree();
//   const navigate = useNavigate();

//   const [selected, setSelected] = useState(null);
//   const tmpWorld = useMemo(() => new THREE.Vector3(), []);

//   const loadedOnceRef = useRef(false);
//   const shownOnceRef = useRef(false);

//   // AAA pulse refs
//   const orbRefs = useRef(new Map());

//   const orbColor = useMemo(() => new THREE.Color(1, 0, 0.75), []);
//   const orbEmissive = useMemo(() => new THREE.Color(1, 0, 0.65), []);

//   useLayoutEffect(() => {
//     scene.updateMatrixWorld(true);
//   }, [scene]);

//   const points = useMemo(() => {
//     const arr = [];

//     scene.traverse((o) => {
//       if (o.isMesh) return;
//       if (!o.name || o.name === "Scene") return;

//       const cfg = MARKER_CONFIG[o.name];
//       if (!cfg) return;

//       o.getWorldPosition(tmpWorld);
//       arr.push({
//         name: o.name,
//         position: tmpWorld.clone(),
//         config: cfg,
//       });
//     });

//     return arr;
//   }, [scene, tmpWorld]);

//   // ✅ 1) "Loaded" = points parsed
//   useEffect(() => {
//     if (loadedOnceRef.current) return;
//     if (points.length >= 1) {
//       loadedOnceRef.current = true;
//       onLoaded?.();
//     }
//   }, [points, onLoaded]);
  

//   // ✅ 2) "Shown" = visible true + points + at least 1 frame after render
//   useEffect(() => {
//     if (shownOnceRef.current) return;
//     if (!visible) return;
//     if (points.length === 0) return;

//     shownOnceRef.current = true;

//     requestAnimationFrame(() => {
//       onShown?.();
//     });
//   }, [visible, points, onShown]);

//   // ✅ Single frame loop for: proximity select + AAA pulse
//   useFrame((state) => {
//     if (!points.length) return;

//     // --- proximity selection ---
//     if (selected) {
//       const d = camera.position.distanceTo(selected.position);
//       if (d > closeDistance) setSelected(null);
//     } else {
//       let best = null;
//       let bestDist = Infinity;

//       for (const p of points) {
//         const d = camera.position.distanceTo(p.position);
//         if (d < openDistance && d < bestDist) {
//           best = p;
//           bestDist = d;
//         }
//       }

//       if (best) setSelected(best);
//     }

//     // --- AAA pulse ---
//     const t = state.clock.getElapsedTime();

//     for (const p of points) {
//       const mesh = orbRefs.current.get(p.name);
//       if (!mesh) continue;

//       const isSelected = selected?.name === p.name;

//       // organic-ish pulse (vary with world x to de-sync)
//       const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 + p.position.x * 0.08);

//       const s = isSelected ? 1.18 : 1.0 + pulse * 0.08;
//       mesh.scale.setScalar(s);

//       const mat = mesh.material;
//       if (mat) {
//         // opacity breathing
//         mat.opacity = isSelected ? 0.42 : 0.22 + pulse * 0.10;

//         // emissive punch
//         mat.emissiveIntensity = isSelected ? 1.65 : 0.75 + pulse * 0.55;
//       }
//     }
//   });

//   useEffect(() => {
//     const onKeyDown = (e) => {
//       if (e.code !== "Space" && e.code !== "Enter") return;
//       if (!selected?.config?.route) return;
//       e.preventDefault();
//       navigate(selected.config.route);
//     };
//     window.addEventListener("keydown", onKeyDown, { passive: false });
//     return () => window.removeEventListener("keydown", onKeyDown);
//   }, [selected, navigate]);

//   const go = () => {
//     if (!selected?.config?.route) return;
//     navigate(selected.config.route);
//   };

//   const btnBase = {
//     marginTop: 12,
//     width: "100%",
//     padding: "10px 12px",
//     borderRadius: 14,
//     border: "1px solid rgba(255,0,170,0.35)",
//     background: "linear-gradient(90deg, rgba(124,58,237,0.92), rgba(255,0,170,0.22))",
//     color: "rgba(255,255,255,0.94)",
//     fontWeight: 950,
//     cursor: "pointer",
//     letterSpacing: 0.2,
//     transition:
//       "transform 140ms ease, box-shadow 160ms ease, border-color 160ms ease, filter 160ms ease",
//   };

//   const btnHover = (el) => {
//     el.style.transform = "translateY(-1px)";
//     el.style.filter = "brightness(1.05)";
//     el.style.borderColor = "rgba(255,0,170,0.60)";
//     el.style.boxShadow =
//       "0 0 0 1px rgba(255,0,170,0.18), 0 0 28px rgba(255,0,170,0.14), 0 0 70px rgba(124,58,237,0.12)";
//   };

//   const btnLeave = (el) => {
//     el.style.transform = "translateY(0)";
//     el.style.filter = "none";
//     el.style.borderColor = "rgba(255,0,170,0.35)";
//     el.style.boxShadow = "none";
//   };

//   return (
//     <group>
//       {points.map((p) => (
//         <mesh
//           key={p.name}
//           position={[p.position.x, p.position.y + yOffset, p.position.z]}
//           visible={visible}
//           ref={(r) => {
//             if (!r) {
//               orbRefs.current.delete(p.name);
//               return;
//             }
//             orbRefs.current.set(p.name, r);
//           }}
//           onPointerDown={(e) => {
//             e.stopPropagation();
//             setSelected(p);
//           }}
//         >
//           <sphereGeometry args={[radius, 18, 18]} />
//           <meshStandardMaterial
//             transparent
//             opacity={0.28}
//             emissive={orbEmissive}
//             emissiveIntensity={0.85}
//             color={orbColor}
//           />
//         </mesh>
//       ))}

//       {selected && (
//         <Html
//           position={[
//             selected.position.x,
//             selected.position.y + yOffset + 1.6,
//             selected.position.z,
//           ]}
//           center
//           style={{ pointerEvents: "none" }}
//         >
//           <div
//             style={{
//               pointerEvents: "auto",
//               width: 320,
//               borderRadius: 18,
//               padding: 14,
//               background:
//                 "radial-gradient(700px 360px at 18% 25%, rgba(255,0,170,0.16), transparent 60%)," +
//                 "radial-gradient(700px 360px at 78% 35%, rgba(124,58,237,0.18), transparent 55%)," +
//                 "rgba(0,0,0,0.72)",
//               border: "1px solid rgba(255,255,255,0.16)",
//               boxShadow:
//                 "0 18px 55px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,0,170,0.10), 0 0 60px rgba(124,58,237,0.10)",
//               backdropFilter: "blur(12px)",
//               color: "white",
//               fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
//               overflow: "hidden",
//               position: "relative",
//             }}
//           >
//             <div
//               aria-hidden="true"
//               style={{
//                 position: "absolute",
//                 inset: 0,
//                 pointerEvents: "none",
//                 background:
//                   "repeating-linear-gradient(to bottom, rgba(255,255,255,0.04), rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px)",
//                 opacity: 0.12,
//                 mixBlendMode: "overlay",
//               }}
//             />

//             <div style={{ display: "flex", justifyContent: "space-between", gap: 10, position: "relative" }}>
//               <div>
//                 <div style={{ fontSize: 11, opacity: 0.75, letterSpacing: 1.2 }}>
//                   {selected.config.kicker}
//                 </div>
//                 <div style={{ fontWeight: 950, fontSize: 16, marginTop: 3 }}>
//                   {selected.config.title}
//                 </div>
//               </div>

//               <div
//                 style={{
//                   fontSize: 11,
//                   padding: "6px 10px",
//                   borderRadius: 999,
//                   border: "1px solid rgba(255,255,255,0.14)",
//                   background: "rgba(0,0,0,0.35)",
//                   whiteSpace: "nowrap",
//                   height: "fit-content",
//                 }}
//               >
//                 <span style={{ color: FUCHSIA_SOLID, fontWeight: 900 }}>●</span> Portal
//               </div>
//             </div>

//             <div
//               style={{
//                 marginTop: 10,
//                 opacity: 0.9,
//                 lineHeight: 1.45,
//                 fontSize: 12,
//                 position: "relative",
//               }}
//             >
//               {selected.config.description}
//             </div>

//             <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", position: "relative" }}>
//               {(selected.config.chips || []).map((c) => (
//                 <div
//                   key={c}
//                   style={{
//                     fontSize: 11,
//                     padding: "6px 10px",
//                     borderRadius: 999,
//                     border: "1px solid rgba(255,255,255,0.14)",
//                     background: "rgba(255,255,255,0.06)",
//                     opacity: 0.95,
//                   }}
//                 >
//                   {c}
//                 </div>
//               ))}
//             </div>

//             <button
//               onClick={go}
//               style={btnBase}
//               onMouseEnter={(e) => btnHover(e.currentTarget)}
//               onMouseLeave={(e) => btnLeave(e.currentTarget)}
//             >
//               {selected.config.cta} <span style={{ opacity: 0.75 }}>(SPACE / ENTER)</span>
//             </button>

//             <div
//               style={{
//                 marginTop: 10,
//                 fontSize: 11,
//                 opacity: 0.7,
//                 textAlign: "center",
//                 fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
//                 position: "relative",
//               }}
//             >
//               Approach → popup • Click orb → pin • ESC → unlock mouse
//             </div>
//           </div>
//         </Html>
//       )}
//     </group>
//   );
// }

// useGLTF.preload("/models/city_markers.glb");





