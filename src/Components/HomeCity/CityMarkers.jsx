// src/Components/HomeCity/CityMarkers.jsx
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useGLTF, Html } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";

const FUCHSIA = "rgba(255,0,170,0.30)";
const FUCHSIA_SOLID = "rgba(255,0,170,0.95)";

const MARKER_CONFIG = {
  TRIGGER_PORTFOLIO: {
    route: "/portfolio",
    title: "Portfolio Vault",
    kicker: "Selected works",
    description:
      "Projets web + 3D + prototypes. Court, propre, et orienté impact.",
    chips: ["React", "3D", "UX", "Ship it"],
    cta: "Enter Portfolio",
  },
  TRIGGER_SKILLS: {
    route: "/skills",
    title: "Skill Tree",
    kicker: "Stack & superpowers",
    description:
      "Les outils que je maîtrise + ceux que j’upgrade. Spoiler : je build vite.",
    chips: ["JS", "React", "Python", "Blender"],
    cta: "Open Skills",
  },
  TRIGGER_ABOUT: {
    route: "/about",
    title: "About Kasia",
    kicker: "The builder behind it",
    description:
      "Profil hybride : dev fullstack + 3D + vision produit. Oui, c’est volontaire.",
    chips: ["Builder", "Design", "Systems"],
    cta: "Meet Me",
  },
  TRIGGER_VISION: {
    route: "/vision",
    title: "Vision Room",
    kicker: "Why this exists",
    description:
      "Angels Gang : mode évolutive + tech + expérience. Une marque, pas juste un produit.",
    chips: ["Hardware", "Software", "Brand"],
    cta: "See Vision",
  },
  TRIGGER_CONTACT: {
    route: "/contact",
    title: "Contact Portal",
    kicker: "Let’s collaborate",
    description:
      "Si tu veux quelqu’un qui exécute, itère, et livre — tu viens de me trouver.",
    chips: ["Freelance", "CDI", "Collab"],
    cta: "Contact",
  },
};

export default function CityMarkers({
  url = "/models/city_markers.glb",
  visible = true,

  // visuel
  radius = 2,
  yOffset = 2,

  // proximité
  openDistance = 10,
  closeDistance = 13,
}) {
  const { scene } = useGLTF(url);
  const { camera } = useThree();
  const navigate = useNavigate();

  const [selected, setSelected] = useState(null); // { name, position(Vector3), config }

  const tmpWorld = useMemo(() => new THREE.Vector3(), []);

  useLayoutEffect(() => {
    scene.updateMatrixWorld(true);
  }, [scene]);

  const points = useMemo(() => {
    const arr = [];
    scene.traverse((o) => {
      if (o.isMesh) return;
      if (!o.name || o.name === "Scene") return;

      const cfg = MARKER_CONFIG[o.name];
      if (!cfg) return;

      o.getWorldPosition(tmpWorld);
      arr.push({
        name: o.name,
        position: tmpWorld.clone(),
        config: cfg,
      });
    });

    console.log("[city_markers] triggers found:", arr.length, arr.map((p) => p.name));
    return arr;
  }, [scene, tmpWorld]);

  // Auto popup when close (closest only)
  useFrame(() => {
    if (!points.length) return;

    if (selected) {
      const d = camera.position.distanceTo(selected.position);
      if (d > closeDistance) setSelected(null);
      return;
    }

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
  });

  // SPACE / ENTER -> navigate
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code !== "Space" && e.code !== "Enter") return;
      if (!selected?.config?.route) return;
      e.preventDefault();
      navigate(selected.config.route);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, navigate]);

  const go = () => {
    if (!selected?.config?.route) return;
    navigate(selected.config.route);
  };

  return (
    <group>
      {/* ✅ Fuchsia spheres (empties) */}
      {points.map((p) => (
        <mesh
          key={p.name}
          position={[p.position.x, p.position.y + yOffset, p.position.z]}
          visible={visible}
          onPointerDown={(e) => {
            e.stopPropagation();
            setSelected(p);
          }}
        >
          <sphereGeometry args={[radius, 16, 16]} />
          <meshStandardMaterial
            transparent
            opacity={0.30}
            emissive={new THREE.Color(1, 0, 0.65)}
            emissiveIntensity={0.6}
            color={new THREE.Color(1, 0, 0.75)}
          />
        </mesh>
      ))}

      {/* ✅ Popup */}
      {selected && (
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
                "linear-gradient(135deg, rgba(255,0,170,0.16), rgba(124,58,237,0.14)), rgba(0,0,0,0.72)",
              border: "1px solid rgba(255,255,255,0.16)",
              boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
              backdropFilter: "blur(12px)",
              color: "white",
              fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, opacity: 0.75, letterSpacing: 1.2 }}>
                  {selected.config.kicker}
                </div>
                <div style={{ fontWeight: 950, fontSize: 16, marginTop: 3 }}>
                  {selected.config.title}
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
                Portal
              </div>
            </div>

            <div style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.45, fontSize: 12 }}>
              {selected.config.description}
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(selected.config.chips || []).map((c) => (
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
              style={{
                marginTop: 12,
                width: "100%",
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(255,122,0,0.95)",
                color: "#0b0b0b",
                fontWeight: 950,
                cursor: "pointer",
                letterSpacing: 0.2,
              }}
            >
              {selected.config.cta} <span style={{ opacity: 0.75 }}>(SPACE / ENTER)</span>
            </button>

            <div style={{ marginTop: 10, fontSize: 11, opacity: 0.7, textAlign: "center" }}>
              Approche → popup • Clique l’orbe → instant • ESC → unlock mouse
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

useGLTF.preload("/models/city_markers.glb");















// // ok
// import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
// import { useGLTF, Html } from "@react-three/drei";
// import { useThree, useFrame } from "@react-three/fiber";
// import { useNavigate } from "react-router-dom";
// import * as THREE from "three";

// const MARKER_CONFIG = {
//   TRIGGER_PORTFOLIO: {
//     route: "/portfolio",
//     title: "Portfolio",
//     description: "Enter the interactive portfolio.",
//     cta: "Let’s go",
//   },
//   TRIGGER_SKILLS: {
//     route: "/skills",
//     title: "Skills",
//     description: "See the stack, tools & strengths.",
//     cta: "Let’s go",
//   },
//   TRIGGER_ABOUT: {
//     route: "/about",
//     title: "About",
//     description: "Meet the mind behind Angels City.",
//     cta: "Let’s go",
//   },
//   TRIGGER_VISION: {
//     route: "/vision",
//     title: "Vision",
//     description: "The story, the mission, the bigger picture.",
//     cta: "Let’s go",
//   },
//   TRIGGER_CONTACT: {
//     route: "/contact",
//     title: "Contact",
//     description: "Let’s build something together.",
//     cta: "Let’s go",
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
// }) {
//   const { scene } = useGLTF(url);
//   const { camera } = useThree();
//   const navigate = useNavigate();

//   const [selected, setSelected] = useState(null); // { name, position(Vector3), config }

//   const tmpWorld = useMemo(() => new THREE.Vector3(), []);

//   useLayoutEffect(() => {
//     scene.updateMatrixWorld(true);
//   }, [scene]);

//   const points = useMemo(() => {
//     const arr = [];
//     scene.traverse((o) => {
//       if (o.isMesh) return;
//       if (!o.name || o.name === "Scene") return;

//       const cfg = MARKER_CONFIG[o.name];
//       if (!cfg) return; // ✅ on ne garde que tes triggers

//       o.getWorldPosition(tmpWorld);
//       arr.push({
//         name: o.name,
//         position: tmpWorld.clone(),
//         config: cfg,
//       });
//     });

//     console.log("[city_markers] triggers found:", arr.length, arr.map((p) => p.name));
//     return arr;
//   }, [scene, tmpWorld]);

//   // ✅ Auto popup quand proche (le plus proche uniquement)
//   useFrame(() => {
//     if (!points.length) return;

//     // si popup déjà ouverte -> on la ferme seulement quand on s'éloigne
//     if (selected) {
//       const d = camera.position.distanceTo(selected.position);
//       if (d > closeDistance) setSelected(null);
//       return;
//     }

//     let best = null;
//     let bestDist = Infinity;

//     for (const p of points) {
//       const d = camera.position.distanceTo(p.position);
//       if (d < openDistance && d < bestDist) {
//         best = p;
//         bestDist = d;
//       }
//     }

//     if (best) setSelected(best);
//   });

//   // ✅ SPACE redirige vers la route du trigger sélectionné
//   useEffect(() => {
//     const onKeyDown = (e) => {
//       if (e.code !== "Space") return;
//       if (!selected?.config?.route) return;
//       navigate(selected.config.route);
//     };
//     window.addEventListener("keydown", onKeyDown);
//     return () => window.removeEventListener("keydown", onKeyDown);
//   }, [selected, navigate]);

//   const go = () => {
//     if (!selected?.config?.route) return;
//     navigate(selected.config.route);
//   };

//   return (
//     <group>
//       {/* ✅ Sphères visibles (tes empties) */}
//       {points.map((p) => (
//         <mesh
//           key={p.name}
//           position={[p.position.x, p.position.y + yOffset, p.position.z]}
//           visible={visible}
//           onPointerDown={(e) => {
//             e.stopPropagation();
//             setSelected(p); // click = ouvre la popup aussi
//           }}
//         >
//           <sphereGeometry args={[radius, 16, 16]} />
//           <meshStandardMaterial transparent opacity={0.6} />
//         </mesh>
//       ))}

//       {/* ✅ Popup auto proche */}
//       {selected && (
//         <Html
//           position={[
//             selected.position.x,
//             selected.position.y + yOffset + 1.4,
//             selected.position.z,
//           ]}
//           center
//         >
//           <div
//             style={{
//               padding: "12px 14px",
//               background: "rgba(0,0,0,0.78)",
//               border: "1px solid rgba(255,255,255,0.18)",
//               borderRadius: 16,
//               color: "white",
//               fontFamily: "system-ui",
//               fontSize: 12,
//               backdropFilter: "blur(10px)",
//               minWidth: 260,
//               boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
//             }}
//           >
//             <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 6 }}>
//               {selected.config.title}
//             </div>

//             <div style={{ opacity: 0.85, lineHeight: 1.4, marginBottom: 12 }}>
//               {selected.config.description}
//             </div>

//             <button
//               onClick={go}
//               style={{
//                 width: "100%",
//                 padding: "9px 10px",
//                 borderRadius: 12,
//                 border: "1px solid rgba(255,255,255,0.18)",
//                 background: "rgba(255,122,0,0.95)",
//                 fontWeight: 900,
//                 cursor: "pointer",
//                 marginBottom: 8,
//               }}
//             >
//               {selected.config.cta}
//             </button>

//             <div style={{ opacity: 0.75, textAlign: "center", fontSize: 11 }}>
//               Press <b>SPACE</b> to enter
//             </div>
//           </div>
//         </Html>
//       )}
//     </group>
//   );
// }

// useGLTF.preload("/models/city_markers.glb");





