import React, {
  Suspense,
  lazy,
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { EffectComposer, Bloom, Vignette, SMAA } from "@react-three/postprocessing";

import PlayerController from "./Player/PlayerController";
import MiniMapHUD from "./City/MiniMapHUD";
import CityModel from "./City/CityModel";
import CityMarkers from "./City/CityMarkers";
import CityNightLights from "./City/CityNightLights";
import Joystick from "./Player/Joystick";
import { useTranslation } from "react-i18next";


// ✅ Lazy UI (loaded only when needed)
const FullScreenLoader = lazy(() => import("./ui/FullScreenLoader"));
const DevResetIntroButton = lazy(() => import("./ui/DevResetIntroButton"));


export default function HomeCity() {
  const navigate = useNavigate();
  const location = useLocation();

  const autoEnterCity = !!location.state?.autoEnterCity; // ✅ depuis Step2

  const { t, i18n } = useTranslation("home");
  console.log("lang:", i18n.language, "home subLabel:", t("loader.subLabel"));


  const [playerReady, setPlayerReady] = useState(false);

  const skipIntroStorage =
  typeof window !== "undefined"
    ? localStorage.getItem("angels_city_skip_intro") === "1"
    : false;

  // const skipIntro =
  //   typeof window !== "undefined"
  //     ? localStorage.getItem("angels_city_skip_intro") === "1"
  //     : false;
  // ✅ si on arrive depuis Step2, on force l'entrée directe
  const skipIntro = autoEnterCity || skipIntroStorage;

  const [uiIntro, setUiIntro] = useState(!skipIntro);
  const [introStep, setIntroStep] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const [requestedEnter, setRequestedEnter] = useState(skipIntro);
  const [teleportNonce, setTeleportNonce] = useState(skipIntro ? 1 : 0);

  const [visualReady, setVisualReady] = useState(false);
  const [colliderReady, setColliderReady] = useState(false);
  const [colliderShown, setColliderShown] = useState(false);
  const [markersReady, setMarkersReady] = useState(false);

  const [moveInput, setMoveInput] = useState({ x: 0, y: 0 });
  const [lookInput, setLookInput] = useState({ x: 0, y: 0 });

  const prePositionedRef = useRef(false);
  const [enterPressed, setEnterPressed] = useState(false);

  // ✅ Sticky gate (prevents loader flashing)
  const [gateOpen, setGateOpen] = useState(false);
  const gateOpeningRef = useRef(false);

  useEffect(() => {
    if (!autoEnterCity) return;
    // on “consomme” le state, comme ça refresh/back n’auto-enter pas par accident
    window.history.replaceState({}, document.title);
  }, [autoEnterCity]);

  useEffect(() => {
    if (skipIntro) {
      setUiIntro(false);
    }
  }, [skipIntro]);
  
  const isMobile =
    typeof window !== "undefined" &&
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  // ✅ Stable spawn points
  const streetPos = useMemo(() => [-142.49, 2, -40.345], []);
  const streetYaw = 0;

  const overviewPos = useMemo(() => [-142.49, 10.5, -52.0], []);
  const overviewYaw = 0;
  const overviewPitch = -0.22;

  const BASE = import.meta.env.BASE_URL || "/";
  const visualUrl = `${BASE}models/city_final_draco.glb`;
  const collisionUrl = `${BASE}models/City_collision_2.glb`;
  const lightsUrl = `${BASE}models/city_light.glb`;

  // ✅ Mark colliders as "shown" 1 frame after they are ready (more stable)
  useEffect(() => {
    if (!colliderReady) {
      setColliderShown(false);
      return;
    }
    requestAnimationFrame(() => setColliderShown(true));
  }, [colliderReady]);

  // ✅ We consider the experience "enterable" only when EVERYTHING is ready
  const canEnterCity = visualReady && colliderShown && markersReady;
  const allReady = canEnterCity && playerReady;

  const minimapConfig = useMemo(
    () => ({
      enabled: requestedEnter && !uiIntro,
      size: 150,
      centerX: streetPos[0],
      centerZ: streetPos[2],
      scale: 0.8,
    }),
    [requestedEnter, uiIntro, streetPos]
  );

  // Canvas element ref for reliable pointer lock
  const canvasElRef = useRef(null);

  const requestPointerLock = useCallback(() => {
    // ✅ Must be called only from a user gesture (click/keydown)
    const el = canvasElRef.current;
    if (!el) return;
    try {
      el.requestPointerLock?.();
    } catch {
      // ignore
    }
  }, []);

  // Pre-position guard (do NOT teleport here; avoid flicker)
  useEffect(() => {
    if (!requestedEnter) return;
    if (!colliderReady) return;
    if (prePositionedRef.current) return;

    prePositionedRef.current = true;
  }, [requestedEnter, colliderReady]);

  // Exit pointer lock on unmount
  useEffect(() => {
    return () => {
      if (document.pointerLockElement) document.exitPointerLock?.();
    };
  }, []);

  const goPortfolio = useCallback(() => {
    if (document.pointerLockElement) document.exitPointerLock?.();
    navigate("/portfolio");
  }, [navigate]);

  const goEssential = useCallback(() => {
    if (document.pointerLockElement) document.exitPointerLock?.();
    navigate("/portfolio");
  }, [navigate]);

  const onEnterRequest = useCallback(() => {
    // ✅ Called from user gesture (button, keydown)
    setEnterPressed(true);
    setRequestedEnter(true);
    setPlayerReady(false);

    // Reset gate so loader stays until stable ready again
    setGateOpen(false);
    gateOpeningRef.current = false;

    // ✅ Desktop: request pointer lock immediately on gesture
    if (!isMobile) {
      window.focus?.();
      requestPointerLock();
    }
  }, [isMobile, requestPointerLock]);

  // When everything is ready -> close intro + teleport
  // (NO pointer lock here – must be on gesture)
  useEffect(() => {
    if (!requestedEnter) return;
    if (!canEnterCity) return;

    if (dontShowAgain) localStorage.setItem("angels_city_skip_intro", "1");

    setUiIntro(false);
    setEnterPressed(false);
    document.activeElement?.blur?.();

    // teleport now that collisions + markers exist
    setPlayerReady(false);
    setTeleportNonce((n) => n + 1);
  }, [requestedEnter, canEnterCity, dontShowAgain]);

  // ✅ SPACE/ENTER on intro overlay (3 steps)
  useEffect(() => {
    if (!uiIntro) return;

    const onKeyDown = (e) => {
      if (e.code !== "Space" && e.code !== "Enter") return;
      e.preventDefault();

      // 1 -> 2 -> 3 -> enter
      if (introStep < 3) {
        setIntroStep((s) => Math.min(3, s + 1));
        return;
      }

      onEnterRequest();
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [uiIntro, introStep, onEnterRequest]);

  // ✅ Sticky Gate logic: once loader is shown, it will NOT disappear until
  // allReady is stable and 2 frames have passed.
  useEffect(() => {
    if (!requestedEnter) return;

    if (!allReady) {
      setGateOpen(false);
      gateOpeningRef.current = false;
      return;
    }

    if (gateOpeningRef.current) return;
    gateOpeningRef.current = true;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setGateOpen(true);
      });
    });
  }, [requestedEnter, allReady]);

  const introBg = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "radial-gradient(1200px 800px at 20% 20%, rgba(124,58,237,0.18), transparent 60%), radial-gradient(900px 700px at 80% 30%, rgba(255,0,170,0.14), transparent 55%), #070916",
      }}
    />
  );

  const waitingReason = !visualReady
    ? "Loading city visuals…"
    : !colliderShown
    ? "Loading collisions…"
    : !markersReady
    ? "Loading portals…"
    : !playerReady
    ? "Spawning player…"
    : "Finalizing…";

  // ✅ Loader is only controlled by gateOpen (sticky)
  const shouldShowLoader = requestedEnter && !gateOpen;

  // ✅ Prevent scroll/pinch on joystick zones (non-passive native listeners)
  // Mobile-only. Does NOTHING on desktop → no perf regression.
  useEffect(() => {
    if (!requestedEnter || uiIntro || !isMobile) return;

    const zones = Array.from(document.querySelectorAll("[data-joystick-zone='1']"));
    if (!zones.length) return;

    const prevent = (e) => e.preventDefault();

    zones.forEach((el) => {
      el.addEventListener("touchstart", prevent, { passive: false });
      el.addEventListener("touchmove", prevent, { passive: false });
    });

    return () => {
      zones.forEach((el) => {
        el.removeEventListener("touchstart", prevent);
        el.removeEventListener("touchmove", prevent);
      });
    };
  }, [requestedEnter, uiIntro, isMobile]);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#070916" }}>
      {!requestedEnter && introBg}

      {/* Intro overlay */}
      {uiIntro && !enterPressed && (
        <Suspense fallback={null}>
          <IntroOverlay3Steps
            step={introStep}
            setStep={setIntroStep}
            dontShowAgain={dontShowAgain}
            setDontShowAgain={setDontShowAgain}
            onEnterRequest={onEnterRequest}
            onGoPortfolio={goPortfolio}
            onGoEssential={goEssential}
          />
        </Suspense>
      )}

      {/* Scene */}
      {requestedEnter && (
        <>
          {/* ✅ Loader stays until gateOpen */}
          {shouldShowLoader && (
            <Suspense fallback={null}>
              <FullScreenLoader
                force
                label={waitingReason}
                subLabel={t("loader.subLabel")}
              />
            </Suspense>
          )}

          <Canvas
            dpr={[1, 1.5]}
            gl={{
              antialias: false,
              alpha: false,
              powerPreference: "high-performance",
              preserveDrawingBuffer: false,
            }}
            onCreated={({ gl }) => {
              canvasElRef.current = gl.domElement;

              gl.outputColorSpace = THREE.SRGBColorSpace;
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 2.15;
              gl.setClearColor(new THREE.Color("#0b1024"), 1);

              // ✅ Makes touch interactions less “scrolly” if Canvas ever gets touches
              gl.domElement.style.touchAction = "none";
            }}
            onPointerDown={() => {
              // ✅ Desktop: allow (re)locking mouse on click
              if (!uiIntro && !isMobile) {
                window.focus?.();
                requestPointerLock();
              }
            }}
          >
            <fogExp2 attach="fog" density={0.00105} color={"#1a2455"} />

            <ambientLight intensity={0.42} />
            <hemisphereLight
              intensity={0.75}
              color={"#9dbbff"}
              groundColor={"#2a0030"}
            />
            <directionalLight
              position={[12, 18, 10]}
              intensity={1.25}
              color={"#ffe2c0"}
            />
            <directionalLight
              position={[-12, 14, -8]}
              intensity={0.85}
              color={"#b48cff"}
            />

            <Suspense fallback={null}>
              <CityModel
                url={visualUrl}
                withColliders={false}
                onLoaded={() => setVisualReady(true)}
              />
            </Suspense>

            <Suspense fallback={null}>
              <CityMarkers
                visible={!uiIntro}
                radius={3}
                openDistance={7}
                closeDistance={9}
                onLoaded={() => setMarkersReady(true)}
              />
            </Suspense>

            <Suspense fallback={null}>
              <CityNightLights
                url={lightsUrl}
                lampIntensity={12}
                lampRedIntensity={16}
                neonIntensity={28}
                fireIntensity={18}
                lampDistance={20}
                neonDistance={28}
                fireDistance={22}
              />
            </Suspense>

            <Physics gravity={[0, -9.81, 0]}>
              <Suspense fallback={null}>
                <CityModel
                  url={collisionUrl}
                  withColliders
                  collisionOnly
                  onLoaded={() => setColliderReady(true)}
                />
              </Suspense>

              <RigidBody type="fixed" colliders={false}>
                <CuboidCollider args={[2000, 1, 2000]} position={[0, -2, 0]} />
              </RigidBody>

              <PlayerController
                teleportNonce={teleportNonce}
                overviewPos={overviewPos}
                overviewYaw={overviewYaw}
                overviewPitch={overviewPitch}
                streetPos={streetPos}
                streetYaw={streetYaw}
                playerHeight={2.3}
                stepHeight={0.55}
                maxSlopeDeg={50}
                moveInput={moveInput}
                lookInput={lookInput}
                active
                lockMovement={uiIntro}
                yawOffset={-Math.PI / 2}
                onPlayerReady={() => setPlayerReady(true)}
                // ✅ mobile tuning (desktop unaffected because multiplier only applied when joystick has input)
                mobileSpeedMultiplier={1.35}
                mobileLookSensitivity={0.05}
              />
            </Physics>

            <MiniMapHUD
              enabled={minimapConfig.enabled}
              size={minimapConfig.size}
              centerX={minimapConfig.centerX}
              centerZ={minimapConfig.centerZ}
              scale={minimapConfig.scale}
            />

            <EffectComposer multisampling={0}>
              <SMAA />
              <Bloom
                intensity={0.45}
                luminanceThreshold={0.25}
                luminanceSmoothing={0.85}
                mipmapBlur
              />
              <Vignette eskil={false} offset={0.15} darkness={0.25} />
            </EffectComposer>
          </Canvas>
        </>
      )}

      {/* Mobile dual joysticks (kept, but desktop-first project) */}
      {!uiIntro && requestedEnter && isMobile && (
        <>
          {/* Move (left) */}
          <div
            data-joystick-zone="1"
            style={{
              position: "fixed",
              left: 16,
              bottom: 16,
              zIndex: 9999,
              pointerEvents: "auto",
              touchAction: "none",
            }}
          >
            <Joystick variant="pink" onOutput={setMoveInput} size={140} deadZone={0.1} />
          </div>

          {/* Look (right) */}
          <div
            data-joystick-zone="1"
            style={{
              position: "fixed",
              right: 16,
              bottom: 16,
              zIndex: 9999,
              pointerEvents: "auto",
              touchAction: "none",
            }}
          >
            <Joystick variant="blue" onOutput={setLookInput} size={140} deadZone={0.1} />
          </div>
        </>
      )}

      {/* Dev helper */}
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <DevResetIntroButton />
        </Suspense>
      )}
    </div>
  );
}



















//ok
// import React, {
//   Suspense,
//   lazy,
//   useMemo,
//   useState,
//   useEffect,
//   useCallback,
//   useRef,
// } from "react";
// import { Canvas } from "@react-three/fiber";
// import { useOnboarding, resetOnboarding } from "../../hooks/useOnboarding";
// import * as THREE from "three";
// import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
// import { useNavigate } from "react-router-dom";
// import { EffectComposer, Bloom, Vignette, SMAA } from "@react-three/postprocessing";

// import PlayerController from "./Player/PlayerController";
// import MiniMapHUD from "./City/MiniMapHUD";
// import CityModel from "./City/CityModel";
// import CityMarkers from "./City/CityMarkers";
// import CityNightLights from "./City/CityNightLights";
// import Joystick from "./Player/Joystick";
// import { useTranslation } from "react-i18next";

// // ✅ Lazy UI (loaded only when needed)
// const IntroOverlay3Steps = lazy(() => import("./ui/IntroOverlay3Steps"));
// const FullScreenLoader = lazy(() => import("./ui/FullScreenLoader"));
// const DevResetIntroButton = lazy(() => import("./ui/DevResetIntroButton"));


// export default function HomeCity() {
//   const navigate = useNavigate();
//   const { t, i18n } = useTranslation("home");
//   console.log("lang:", i18n.language, "home subLabel:", t("loader.subLabel"));


//   const [playerReady, setPlayerReady] = useState(false);

//   const skipIntro =
//     typeof window !== "undefined"
//       ? localStorage.getItem("angels_city_skip_intro") === "1"
//       : false;

//   const [uiIntro, setUiIntro] = useState(!skipIntro);
//   const [introStep, setIntroStep] = useState(1);
//   const [dontShowAgain, setDontShowAgain] = useState(false);

//   const [requestedEnter, setRequestedEnter] = useState(skipIntro);
//   const [teleportNonce, setTeleportNonce] = useState(skipIntro ? 1 : 0);

//   const [visualReady, setVisualReady] = useState(false);
//   const [colliderReady, setColliderReady] = useState(false);
//   const [colliderShown, setColliderShown] = useState(false);
//   const [markersReady, setMarkersReady] = useState(false);

//   const [moveInput, setMoveInput] = useState({ x: 0, y: 0 });
//   const [lookInput, setLookInput] = useState({ x: 0, y: 0 });

//   const prePositionedRef = useRef(false);
//   const [enterPressed, setEnterPressed] = useState(false);

//   // ✅ Sticky gate (prevents loader flashing)
//   const [gateOpen, setGateOpen] = useState(false);
//   const gateOpeningRef = useRef(false);

//   const isMobile =
//     typeof window !== "undefined" &&
//     /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

//   // ✅ Stable spawn points
//   const streetPos = useMemo(() => [-142.49, 2, -40.345], []);
//   const streetYaw = 0;

//   const overviewPos = useMemo(() => [-142.49, 10.5, -52.0], []);
//   const overviewYaw = 0;
//   const overviewPitch = -0.22;

//   const BASE = import.meta.env.BASE_URL || "/";
//   const visualUrl = `${BASE}models/city_final_draco.glb`;
//   const collisionUrl = `${BASE}models/City_collision_2.glb`;
//   const lightsUrl = `${BASE}models/city_light.glb`;

//   // ✅ Mark colliders as "shown" 1 frame after they are ready (more stable)
//   useEffect(() => {
//     if (!colliderReady) {
//       setColliderShown(false);
//       return;
//     }
//     requestAnimationFrame(() => setColliderShown(true));
//   }, [colliderReady]);

//   // ✅ We consider the experience "enterable" only when EVERYTHING is ready
//   const canEnterCity = visualReady && colliderShown && markersReady;
//   const allReady = canEnterCity && playerReady;

//   const minimapConfig = useMemo(
//     () => ({
//       enabled: requestedEnter && !uiIntro,
//       size: 150,
//       centerX: streetPos[0],
//       centerZ: streetPos[2],
//       scale: 0.8,
//     }),
//     [requestedEnter, uiIntro, streetPos]
//   );

//   // Canvas element ref for reliable pointer lock
//   const canvasElRef = useRef(null);

//   const requestPointerLock = useCallback(() => {
//     // ✅ Must be called only from a user gesture (click/keydown)
//     const el = canvasElRef.current;
//     if (!el) return;
//     try {
//       el.requestPointerLock?.();
//     } catch {
//       // ignore
//     }
//   }, []);

//   // Pre-position guard (do NOT teleport here; avoid flicker)
//   useEffect(() => {
//     if (!requestedEnter) return;
//     if (!colliderReady) return;
//     if (prePositionedRef.current) return;

//     prePositionedRef.current = true;
//   }, [requestedEnter, colliderReady]);

//   // Exit pointer lock on unmount
//   useEffect(() => {
//     return () => {
//       if (document.pointerLockElement) document.exitPointerLock?.();
//     };
//   }, []);

//   const goPortfolio = useCallback(() => {
//     if (document.pointerLockElement) document.exitPointerLock?.();
//     navigate("/portfolio");
//   }, [navigate]);

//   const goEssential = useCallback(() => {
//     if (document.pointerLockElement) document.exitPointerLock?.();
//     navigate("/portfolio");
//   }, [navigate]);

//   const onEnterRequest = useCallback(() => {
//     // ✅ Called from user gesture (button, keydown)
//     setEnterPressed(true);
//     setRequestedEnter(true);
//     setPlayerReady(false);

//     // Reset gate so loader stays until stable ready again
//     setGateOpen(false);
//     gateOpeningRef.current = false;

//     // ✅ Desktop: request pointer lock immediately on gesture
//     if (!isMobile) {
//       window.focus?.();
//       requestPointerLock();
//     }
//   }, [isMobile, requestPointerLock]);

//   // When everything is ready -> close intro + teleport
//   // (NO pointer lock here – must be on gesture)
//   useEffect(() => {
//     if (!requestedEnter) return;
//     if (!canEnterCity) return;

//     if (dontShowAgain) localStorage.setItem("angels_city_skip_intro", "1");

//     setUiIntro(false);
//     setEnterPressed(false);
//     document.activeElement?.blur?.();

//     // teleport now that collisions + markers exist
//     setPlayerReady(false);
//     setTeleportNonce((n) => n + 1);
//   }, [requestedEnter, canEnterCity, dontShowAgain]);

//   // ✅ SPACE/ENTER on intro overlay (3 steps)
//   useEffect(() => {
//     if (!uiIntro) return;

//     const onKeyDown = (e) => {
//       if (e.code !== "Space" && e.code !== "Enter") return;
//       e.preventDefault();

//       // 1 -> 2 -> 3 -> enter
//       if (introStep < 3) {
//         setIntroStep((s) => Math.min(3, s + 1));
//         return;
//       }

//       onEnterRequest();
//     };

//     window.addEventListener("keydown", onKeyDown, { passive: false });
//     return () => window.removeEventListener("keydown", onKeyDown);
//   }, [uiIntro, introStep, onEnterRequest]);

//   // ✅ Sticky Gate logic: once loader is shown, it will NOT disappear until
//   // allReady is stable and 2 frames have passed.
//   useEffect(() => {
//     if (!requestedEnter) return;

//     if (!allReady) {
//       setGateOpen(false);
//       gateOpeningRef.current = false;
//       return;
//     }

//     if (gateOpeningRef.current) return;
//     gateOpeningRef.current = true;

//     requestAnimationFrame(() => {
//       requestAnimationFrame(() => {
//         setGateOpen(true);
//       });
//     });
//   }, [requestedEnter, allReady]);

//   const introBg = (
//     <div
//       style={{
//         position: "fixed",
//         inset: 0,
//         background:
//           "radial-gradient(1200px 800px at 20% 20%, rgba(124,58,237,0.18), transparent 60%), radial-gradient(900px 700px at 80% 30%, rgba(255,0,170,0.14), transparent 55%), #070916",
//       }}
//     />
//   );

//   const waitingReason = !visualReady
//     ? "Loading city visuals…"
//     : !colliderShown
//     ? "Loading collisions…"
//     : !markersReady
//     ? "Loading portals…"
//     : !playerReady
//     ? "Spawning player…"
//     : "Finalizing…";

//   // ✅ Loader is only controlled by gateOpen (sticky)
//   const shouldShowLoader = requestedEnter && !gateOpen;

//   // ✅ Prevent scroll/pinch on joystick zones (non-passive native listeners)
//   // Mobile-only. Does NOTHING on desktop → no perf regression.
//   useEffect(() => {
//     if (!requestedEnter || uiIntro || !isMobile) return;

//     const zones = Array.from(document.querySelectorAll("[data-joystick-zone='1']"));
//     if (!zones.length) return;

//     const prevent = (e) => e.preventDefault();

//     zones.forEach((el) => {
//       el.addEventListener("touchstart", prevent, { passive: false });
//       el.addEventListener("touchmove", prevent, { passive: false });
//     });

//     return () => {
//       zones.forEach((el) => {
//         el.removeEventListener("touchstart", prevent);
//         el.removeEventListener("touchmove", prevent);
//       });
//     };
//   }, [requestedEnter, uiIntro, isMobile]);

//   return (
//     <div style={{ width: "100vw", height: "100vh", background: "#070916" }}>
//       {!requestedEnter && introBg}

//       {/* Intro overlay */}
//       {uiIntro && !enterPressed && (
//         <Suspense fallback={null}>
//           <IntroOverlay3Steps
//             step={introStep}
//             setStep={setIntroStep}
//             dontShowAgain={dontShowAgain}
//             setDontShowAgain={setDontShowAgain}
//             onEnterRequest={onEnterRequest}
//             onGoPortfolio={goPortfolio}
//             onGoEssential={goEssential}
//           />
//         </Suspense>
//       )}

//       {/* Scene */}
//       {requestedEnter && (
//         <>
//           {/* ✅ Loader stays until gateOpen */}
//           {shouldShowLoader && (
//             <Suspense fallback={null}>
//               <FullScreenLoader
//                 force
//                 label={waitingReason}
//                 subLabel={t("loader.subLabel")}
//               />
//             </Suspense>
//           )}

//           <Canvas
//             dpr={[1, 1.5]}
//             gl={{
//               antialias: false,
//               alpha: false,
//               powerPreference: "high-performance",
//               preserveDrawingBuffer: false,
//             }}
//             onCreated={({ gl }) => {
//               canvasElRef.current = gl.domElement;

//               gl.outputColorSpace = THREE.SRGBColorSpace;
//               gl.toneMapping = THREE.ACESFilmicToneMapping;
//               gl.toneMappingExposure = 2.15;
//               gl.setClearColor(new THREE.Color("#0b1024"), 1);

//               // ✅ Makes touch interactions less “scrolly” if Canvas ever gets touches
//               gl.domElement.style.touchAction = "none";
//             }}
//             onPointerDown={() => {
//               // ✅ Desktop: allow (re)locking mouse on click
//               if (!uiIntro && !isMobile) {
//                 window.focus?.();
//                 requestPointerLock();
//               }
//             }}
//           >
//             <fogExp2 attach="fog" density={0.00105} color={"#1a2455"} />

//             <ambientLight intensity={0.42} />
//             <hemisphereLight
//               intensity={0.75}
//               color={"#9dbbff"}
//               groundColor={"#2a0030"}
//             />
//             <directionalLight
//               position={[12, 18, 10]}
//               intensity={1.25}
//               color={"#ffe2c0"}
//             />
//             <directionalLight
//               position={[-12, 14, -8]}
//               intensity={0.85}
//               color={"#b48cff"}
//             />

//             <Suspense fallback={null}>
//               <CityModel
//                 url={visualUrl}
//                 withColliders={false}
//                 onLoaded={() => setVisualReady(true)}
//               />
//             </Suspense>

//             <Suspense fallback={null}>
//               <CityMarkers
//                 visible={!uiIntro}
//                 radius={3}
//                 openDistance={7}
//                 closeDistance={9}
//                 onLoaded={() => setMarkersReady(true)}
//               />
//             </Suspense>

//             <Suspense fallback={null}>
//               <CityNightLights
//                 url={lightsUrl}
//                 lampIntensity={12}
//                 lampRedIntensity={16}
//                 neonIntensity={28}
//                 fireIntensity={18}
//                 lampDistance={20}
//                 neonDistance={28}
//                 fireDistance={22}
//               />
//             </Suspense>

//             <Physics gravity={[0, -9.81, 0]}>
//               <Suspense fallback={null}>
//                 <CityModel
//                   url={collisionUrl}
//                   withColliders
//                   collisionOnly
//                   onLoaded={() => setColliderReady(true)}
//                 />
//               </Suspense>

//               <RigidBody type="fixed" colliders={false}>
//                 <CuboidCollider args={[2000, 1, 2000]} position={[0, -2, 0]} />
//               </RigidBody>

//               <PlayerController
//                 teleportNonce={teleportNonce}
//                 overviewPos={overviewPos}
//                 overviewYaw={overviewYaw}
//                 overviewPitch={overviewPitch}
//                 streetPos={streetPos}
//                 streetYaw={streetYaw}
//                 playerHeight={2.3}
//                 stepHeight={0.55}
//                 maxSlopeDeg={50}
//                 moveInput={moveInput}
//                 lookInput={lookInput}
//                 active
//                 lockMovement={uiIntro}
//                 yawOffset={-Math.PI / 2}
//                 onPlayerReady={() => setPlayerReady(true)}
//                 // ✅ mobile tuning (desktop unaffected because multiplier only applied when joystick has input)
//                 mobileSpeedMultiplier={1.35}
//                 mobileLookSensitivity={0.05}
//               />
//             </Physics>

//             <MiniMapHUD
//               enabled={minimapConfig.enabled}
//               size={minimapConfig.size}
//               centerX={minimapConfig.centerX}
//               centerZ={minimapConfig.centerZ}
//               scale={minimapConfig.scale}
//             />

//             <EffectComposer multisampling={0}>
//               <SMAA />
//               <Bloom
//                 intensity={0.45}
//                 luminanceThreshold={0.25}
//                 luminanceSmoothing={0.85}
//                 mipmapBlur
//               />
//               <Vignette eskil={false} offset={0.15} darkness={0.25} />
//             </EffectComposer>
//           </Canvas>
//         </>
//       )}

//       {/* Mobile dual joysticks (kept, but desktop-first project) */}
//       {!uiIntro && requestedEnter && isMobile && (
//         <>
//           {/* Move (left) */}
//           <div
//             data-joystick-zone="1"
//             style={{
//               position: "fixed",
//               left: 16,
//               bottom: 16,
//               zIndex: 9999,
//               pointerEvents: "auto",
//               touchAction: "none",
//             }}
//           >
//             <Joystick variant="pink" onOutput={setMoveInput} size={140} deadZone={0.1} />
//           </div>

//           {/* Look (right) */}
//           <div
//             data-joystick-zone="1"
//             style={{
//               position: "fixed",
//               right: 16,
//               bottom: 16,
//               zIndex: 9999,
//               pointerEvents: "auto",
//               touchAction: "none",
//             }}
//           >
//             <Joystick variant="blue" onOutput={setLookInput} size={140} deadZone={0.1} />
//           </div>
//         </>
//       )}

//       {/* Dev helper */}
//       {import.meta.env.DEV && (
//         <Suspense fallback={null}>
//           <DevResetIntroButton />
//         </Suspense>
//       )}
//     </div>
//   );
// }

