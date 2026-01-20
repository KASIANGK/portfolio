import React, {
  Suspense,
  lazy,
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { useNavigate } from "react-router-dom";
import { EffectComposer, Bloom, Vignette, SMAA } from "@react-three/postprocessing";

import PlayerController from "./PlayerController";
import MiniMapHUD from "./MiniMapHUD";
import CityModel from "./CityModel";
import CityMarkers from "./CityMarkers";
import CityNightLights from "./CityNightLights";
import Joystick from "./Joystick";
import { useTranslation } from "react-i18next";

// ✅ Lazy UI (loaded only when needed)
const IntroOverlay3Steps = lazy(() => import("./ui/IntroOverlay3Steps"));
const FullScreenLoader = lazy(() => import("./ui/FullScreenLoader"));
const DevResetIntroButton = lazy(() => import("./ui/DevResetIntroButton"));

export default function HomeCity() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("home");
  console.log("lang:", i18n.language, "home subLabel:", t("loader.subLabel"));


  const [playerReady, setPlayerReady] = useState(false);

  const skipIntro =
    typeof window !== "undefined"
      ? localStorage.getItem("angels_city_skip_intro") === "1"
      : false;

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
// import * as THREE from "three";
// import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
// import { useNavigate } from "react-router-dom";
// import { EffectComposer, Bloom, Vignette, SMAA } from "@react-three/postprocessing";

// import PlayerController from "./PlayerController";
// import MiniMapHUD from "./MiniMapHUD";
// import CityModel from "./CityModel";
// import CityMarkers from "./CityMarkers";
// import CityNightLights from "./CityNightLights";
// import Joystick from "./Joystick";

// // ✅ Lazy UI (loaded only when needed)
// const IntroOverlay2Steps = lazy(() => import("./ui/IntroOverlay3Steps"));
// const FullScreenLoader = lazy(() => import("./ui/FullScreenLoader"));
// const DevResetIntroButton = lazy(() => import("./ui/DevResetIntroButton"));

// export default function HomeCity() {
//   const navigate = useNavigate();

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
//   const [lookInput, setLookInput] = useState({ x: 0, y: 0 });

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
//     const el = canvasElRef.current;
//     el?.requestPointerLock?.();
//   }, []);

//   // Pre-position guard (do NOT teleport here; avoid flicker)
//   useEffect(() => {
//     if (!requestedEnter) return;
//     if (!colliderReady) return;
//     if (prePositionedRef.current) return;

//     prePositionedRef.current = true;
//     // intentionally no teleportNonce++ and no playerReady false here
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
//     setEnterPressed(true);
//     setRequestedEnter(true);
//     setPlayerReady(false);

//     // reset gate so loader stays until stable ready again
//     setGateOpen(false);
//     gateOpeningRef.current = false;

//     if (!isMobile) {
//       // ✅ user gesture => OK
//       requestPointerLock();
//     }

//   }, [isMobile, requestPointerLock]);

//   // When everything is ready -> close intro + teleport + lock pointer
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

//     if (!isMobile) {
//       window.focus();
//       // requestPointerLock();
//     }
//   }, [requestedEnter, canEnterCity, dontShowAgain, isMobile, requestPointerLock]);

//   // SPACE/ENTER on intro overlay
//   useEffect(() => {
//     if (!uiIntro) return;

//     const onKeyDown = (e) => {
//       if (e.code !== "Space" && e.code !== "Enter") return;
//       e.preventDefault();

//       if (introStep === 1) {
//         setIntroStep(2);
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

//   // ✅ "forced loader" message
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
//           <IntroOverlay2Steps
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
//           {/* ✅ Forced loader stays until gateOpen */}
//           {shouldShowLoader && (
//             <Suspense fallback={null}>
//               <FullScreenLoader
//                 force
//                 label={waitingReason}
//                 subLabel="Enjoy — coffee break while I boot the world ✨"
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
//             }}
//             onPointerDown={() => {
//               window.focus();
//               if (!uiIntro && !isMobile) requestPointerLock();
//             }}
//           >
//             <fogExp2 attach="fog" density={0.00105} color={"#1a2455"} />

//             <ambientLight intensity={0.42} />
//             <hemisphereLight intensity={0.75} color={"#9dbbff"} groundColor={"#2a0030"} />
//             <directionalLight position={[12, 18, 10]} intensity={1.25} color={"#ffe2c0"} />
//             <directionalLight position={[-12, 14, -8]} intensity={0.85} color={"#b48cff"} />

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
//                 // ✅ use onShown instead of onLoaded (real visibility)
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
//                 active
//                 lockMovement={uiIntro}
//                 yawOffset={-Math.PI / 2}
//                 onPlayerReady={() => setPlayerReady(true)}
//                 lookInput={lookInput}
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

//       {/* Mobile joystick */}
//       {/* {!uiIntro && requestedEnter && isMobile && (
//         <div style={{ position: "fixed", left: 16, bottom: 16, zIndex: 9999 }}>
//           <Joystick onMove={setMoveInput} />
//         </div>
//       )} */}
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
//             <Joystick
//               variant="pink"
//               onOutput={setMoveInput}
//               size={140}
//               deadZone={0.10}
//             />
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
//             <Joystick
//               variant="blue"
//               onOutput={setLookInput}
//               size={140}
//               deadZone={0.10}
//             />
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














// // src/Components/HomeCity/HomeCity.jsx
// import { Suspense, useMemo, useState, useEffect, useCallback, useRef } from "react";
// import { Canvas } from "@react-three/fiber";
// import * as THREE from "three";
// import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
// import { useNavigate } from "react-router-dom";
// import { EffectComposer, Bloom, Vignette, SMAA } from "@react-three/postprocessing";
// import { useProgress } from "@react-three/drei";

// import PlayerController from "./PlayerController";
// import MiniMapHUD from "./MiniMapHUD";
// import CityModel from "./CityModel";
// import CityMarkers from "./CityMarkers";
// import CityNightLights from "./CityNightLights";
// import Joystick from "./Joystick";

// /* ----------------------------- Loader UI ----------------------------- */
// function FullscreenLoader({ label = "Loading Angels City..." }) {
//   const { active, progress } = useProgress();

//   const pct = Math.min(100, Math.max(0, Math.round(progress)));
//   const eta = pct >= 100 ? 0 : Math.ceil((100 - pct) / 18);

//   if (!active && pct >= 100) return null;

//   return (
//     <div
//       style={{
//         position: "fixed",
//         inset: 0,
//         display: "grid",
//         placeItems: "center",
//         background:
//           "radial-gradient(1200px 800px at 20% 20%, rgba(255,122,0,0.10), transparent 60%), radial-gradient(900px 700px at 80% 30%, rgba(124,58,237,0.12), transparent 55%), #0a0b12",
//         color: "white",
//         zIndex: 300,
//         fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
//       }}
//     >
//       <div style={{ textAlign: "center", width: "min(420px, 92vw)" }}>
//         <div
//           style={{
//             width: 54,
//             height: 54,
//             borderRadius: 999,
//             border: "2px solid rgba(255,255,255,0.14)",
//             borderTopColor: "rgba(255,122,0,0.95)",
//             margin: "0 auto 14px",
//             animation: "spin 0.9s linear infinite",
//           }}
//         />
//         <div style={{ opacity: 0.95, fontSize: 14, letterSpacing: 0.4 }}>{label}</div>

//         <div style={{ marginTop: 10, fontWeight: 950, fontSize: 16 }}>{pct}%</div>

//         <div
//           style={{
//             height: 8,
//             borderRadius: 999,
//             background: "rgba(255,255,255,0.10)",
//             overflow: "hidden",
//             marginTop: 10,
//           }}
//         >
//           <div
//             style={{
//               height: "100%",
//               width: `${pct}%`,
//               background: "rgba(255,122,0,0.75)",
//               transition: "width 120ms linear",
//             }}
//           />
//         </div>

//         <div style={{ marginTop: 10, opacity: 0.75, fontSize: 12 }}>
//           {pct < 100 ? `~${eta}s` : "Ready"}
//         </div>

//         <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//       </div>
//     </div>
//   );
// }

// /* ----------------------------- Intro Overlay (UI only) ----------------------------- */
// function IntroOverlay2Steps({
//   step,
//   setStep,
//   dontShowAgain,
//   setDontShowAgain,
//   onEnterRequest,
//   onGoPortfolio,
//   onGoEssential,
// }) {
//   const isStep1 = step === 1;

//   const primaryBtnStyle = {
//     padding: "11px 12px",
//     borderRadius: 14,
//     border: "1px solid rgba(255,255,255,0.16)",
//     background: "rgba(255,122,0,0.95)",
//     color: "#0b0b0b",
//     fontWeight: 950,
//     cursor: "pointer",
//     letterSpacing: 0.2,
//   };

//   const ghostBtnStyle = {
//     padding: "10px 12px",
//     borderRadius: 14,
//     border: "1px solid rgba(255,255,255,0.14)",
//     background: "rgba(255,255,255,0.08)",
//     color: "white",
//     fontWeight: 900,
//     cursor: "pointer",
//     opacity: 0.95,
//   };

//   const neonBtnStyle = (enabled = true) => ({
//     padding: "11px 12px",
//     borderRadius: 14,
//     border: "1px solid rgba(255,0,170,0.35)",
//     background: enabled ? "rgba(255,0,170,0.14)" : "rgba(255,255,255,0.06)",
//     color: "white",
//     fontWeight: 950,
//     cursor: enabled ? "pointer" : "not-allowed",
//     letterSpacing: 0.2,
//     opacity: enabled ? 1 : 0.6,
//   });

//   return (
//     <div
//       style={{
//         position: "fixed",
//         inset: 0,
//         zIndex: 200,
//         display: "grid",
//         placeItems: "center",
//         background:
//           "radial-gradient(1000px 720px at 20% 20%, rgba(255,0,170,0.16), transparent 60%), radial-gradient(950px 700px at 80% 30%, rgba(124,58,237,0.18), transparent 55%), rgba(0,0,0,0.24)",
//         color: "white",
//         fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
//         padding: 16,
//       }}
//     >
//       <div
//         style={{
//           width: "min(560px, 94vw)",
//           padding: 18,
//           borderRadius: 20,
//           background: "rgba(0,0,0,0.40)",
//           border: "1px solid rgba(255,255,255,0.14)",
//           backdropFilter: "blur(12px)",
//           boxShadow: "0 18px 55px rgba(0,0,0,0.42)",
//         }}
//       >
//         <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
//           <div>
//             <div style={{ fontSize: 12, letterSpacing: 1.2, opacity: 0.82 }}>ANGELS CITY</div>
//             <div style={{ fontSize: 20, fontWeight: 950, marginTop: 4 }}>
//               {isStep1 ? "Bienvenue." : "Commandes."}
//             </div>
//           </div>

//           <div
//             style={{
//               fontSize: 11,
//               padding: "6px 10px",
//               borderRadius: 999,
//               border: "1px solid rgba(255,255,255,0.16)",
//               background: "rgba(255,255,255,0.08)",
//               height: "fit-content",
//               whiteSpace: "nowrap",
//             }}
//           >
//             <span style={{ color: "rgba(255,0,170,0.95)", fontWeight: 900 }}>●</span> Step {step}/2
//           </div>
//         </div>

//         {isStep1 ? (
//           <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.6, opacity: 0.96 }}>
//             <div style={{ opacity: 0.96 }}>
//               Mini-ville interactive = CV vivant. Explore, trouve les orbes, ouvre des portails.
//             </div>

//             <div style={{ marginTop: 10, opacity: 0.88 }}>Tu veux aller direct à l’essentiel ?</div>

//             <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
//               <button onClick={onGoPortfolio} style={primaryBtnStyle}>
//                 Go to Portfolio
//               </button>

//               <button onClick={onGoEssential} style={ghostBtnStyle}>
//                 Go to Essential
//               </button>

//               <button
//                 onClick={() => setStep(2)}
//                 style={{ gridColumn: "1 / -1", ...neonBtnStyle(true) }}
//               >
//                 Next → Controls (SPACE / ENTER)
//               </button>
//             </div>
//           </div>
//         ) : (
//           <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.6, opacity: 0.96 }}>
//             <div>
//               <b>Arrows</b> — move
//             </div>
//             <div>
//               <b>Mouse / trackpad</b> — look around
//             </div>

//             <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
//               <button onClick={() => setStep(1)} style={ghostBtnStyle}>
//                 ← Back
//               </button>

//               <button onClick={onEnterRequest} style={neonBtnStyle(true)}>
//                 Enter City (SPACE / ENTER)
//               </button>
//             </div>
//           </div>
//         )}

//         <div
//           style={{
//             marginTop: 14,
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             gap: 12,
//             flexWrap: "wrap",
//           }}
//         >
//           <label style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.92 }}>
//             <input
//               type="checkbox"
//               checked={dontShowAgain}
//               onChange={(e) => setDontShowAgain(e.target.checked)}
//               style={{ width: 16, height: 16 }}
//             />
//             <span style={{ fontSize: 12 }}>Ne plus afficher</span>
//           </label>

//           <div style={{ fontSize: 11, opacity: 0.8, textAlign: "right" }}>
//             Tip: <b>ESC</b> unlocks the mouse
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ----------------------------- Dev reset ----------------------------- */
// function DevResetIntroButton() {
//   const reset = () => {
//     localStorage.removeItem("angels_city_skip_intro");
//     window.location.reload();
//   };

//   return (
//     <button
//       onClick={reset}
//       style={{
//         position: "fixed",
//         right: 16,
//         bottom: 16,
//         zIndex: 9999,
//         padding: "8px 12px",
//         borderRadius: 10,
//         border: "1px solid rgba(255,255,255,0.15)",
//         background: "rgba(0,0,0,0.65)",
//         color: "white",
//         fontSize: 11,
//         fontWeight: 800,
//         cursor: "pointer",
//         opacity: 0.6,
//         backdropFilter: "blur(6px)",
//       }}
//     >
//       Reset intro (dev)
//     </button>
//   );
// }

// /* ----------------------------- HomeCity ----------------------------- */
// export default function HomeCity() {
//   const navigate = useNavigate();
//   const [playerReady, setPlayerReady] = useState(false);

//   const skipIntro =
//     typeof window !== "undefined" ? localStorage.getItem("angels_city_skip_intro") === "1" : false;

//   const [uiIntro, setUiIntro] = useState(!skipIntro);
//   const [introStep, setIntroStep] = useState(1);
//   const [dontShowAgain, setDontShowAgain] = useState(false);

//   const [requestedEnter, setRequestedEnter] = useState(skipIntro);
//   const [teleportNonce, setTeleportNonce] = useState(skipIntro ? 1 : 0);

//   const [visualReady, setVisualReady] = useState(false);
//   const [colliderReady, setColliderReady] = useState(false);

//   const [moveInput, setMoveInput] = useState({ x: 0, y: 0 });
//   const prePositionedRef = useRef(false);
//   const [enterPressed, setEnterPressed] = useState(false);

//   const isMobile =
//     typeof window !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

//   // ✅ Keep these stable (no re-renders causing re-init)
//   const streetPos = useMemo(() => [-142.49, 2, -40.345], []);
//   const streetYaw = 0;

//   const overviewPos = useMemo(() => [-142.49, 10.5, -52.0], []);
//   const overviewYaw = 0;
//   const overviewPitch = -0.22;

//   const BASE = import.meta.env.BASE_URL || "/";
//   const visualUrl = `${BASE}models/city_final_draco.glb`;
//   const collisionUrl = `${BASE}models/City_collision_2.glb`;
//   const lightsUrl = `${BASE}models/city_light.glb`;

//   const canEnterCity = visualReady && colliderReady;

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
//     const el = canvasElRef.current;
//     el?.requestPointerLock?.();
//   }, []);

//   useEffect(() => {
//     // Pre-position player as soon as visuals are ready (avoid weird POV)
//     if (!requestedEnter) return;
//     if (!colliderReady) return;   
//     // if (!visualReady) return;
//     if (prePositionedRef.current) return;

//     prePositionedRef.current = true;
//     setPlayerReady(false);
//     setTeleportNonce((n) => n + 1);

//   }, [requestedEnter, colliderReady]);

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
//     // change this route if you have a dedicated "essential" page
//     navigate("/portfolio");
//   }, [navigate]);

//   // const onEnterRequest = useCallback(() => {
//   //   setEnterPressed(true);
//   //   setRequestedEnter(true);
//   //   setPlayerReady(false);
//   //   setVisualReady(false);
//   //   setColliderReady(false);

//   // }, []);
//     const onEnterRequest = useCallback(() => {
//       setEnterPressed(true);
//       setRequestedEnter(true);
//       setPlayerReady(false);
//     }, []);
  

//   // Once requestedEnter AND models ready -> close UI + teleport + lock pointer
//   useEffect(() => {
//     if (!requestedEnter) return;
//     if (!canEnterCity) return;

//     if (dontShowAgain) localStorage.setItem("angels_city_skip_intro", "1");

//     setUiIntro(false);
//     setEnterPressed(false);
//     document.activeElement?.blur?.();

//     // Teleport to street now that collisions + visuals are ready
    
//     setPlayerReady(false);
//     setTeleportNonce((n) => n + 1);
    
//     if (!isMobile) {
//       window.focus();
//       requestPointerLock();
//     }
//   }, [requestedEnter, canEnterCity, dontShowAgain, isMobile, requestPointerLock]);

//   // SPACE/ENTER on intro overlay
//   useEffect(() => {
//     if (!uiIntro) return;

//     const onKeyDown = (e) => {
//       if (e.code !== "Space" && e.code !== "Enter") return;
//       e.preventDefault();

//       if (introStep === 1) {
//         setIntroStep(2);
//         return;
//       }
//       onEnterRequest();
//     };

//     window.addEventListener("keydown", onKeyDown, { passive: false });
//     return () => window.removeEventListener("keydown", onKeyDown);
//   }, [uiIntro, introStep, onEnterRequest]);

//   const introBg = (
//     <div
//       style={{
//         position: "fixed",
//         inset: 0,
//         background:
//           "radial-gradient(1200px 800px at 20% 20%, rgba(255,122,0,0.12), transparent 60%), radial-gradient(900px 700px at 80% 30%, rgba(124,58,237,0.18), transparent 55%), #070916",
//       }}
//     />
//   );

//   return (
//     <div style={{ width: "100vw", height: "100vh", background: "#070916" }}>
//       {!requestedEnter && introBg}

//       {uiIntro && !enterPressed && (
//         <IntroOverlay2Steps
//           step={introStep}
//           setStep={setIntroStep}
//           dontShowAgain={dontShowAgain}
//           setDontShowAgain={setDontShowAgain}
//           onEnterRequest={onEnterRequest}
//           onGoPortfolio={goPortfolio}
//           onGoEssential={goEssential}
//         />
//       )}

//       {requestedEnter && (
//         <>
//         {(!visualReady || !colliderReady || !playerReady) && (
//           <FullscreenLoader label="Loading Angels City..." />
//         )}

//           <Canvas
//             dpr={[1, 1.5]}
//             gl={{
//               antialias: false,
//               alpha: false,
//               powerPreference: "high-performance",
//               preserveDrawingBuffer: false,
//             }}
//             onCreated={({ gl }) => {
//               // store canvas element for pointer lock
//               canvasElRef.current = gl.domElement;

//               gl.outputColorSpace = THREE.SRGBColorSpace;
//               gl.toneMapping = THREE.ACESFilmicToneMapping;
//               gl.toneMappingExposure = 2.15;
//               gl.setClearColor(new THREE.Color("#0b1024"), 1);
//             }}
//             onPointerDown={() => {
//               window.focus();
//               if (!uiIntro && !isMobile) requestPointerLock();
//             }}
//           >
//             <fogExp2 attach="fog" density={0.00105} color={"#1a2455"} />

//             <ambientLight intensity={0.42} />
//             <hemisphereLight intensity={0.75} color={"#9dbbff"} groundColor={"#2a0030"} />
//             <directionalLight position={[12, 18, 10]} intensity={1.25} color={"#ffe2c0"} />
//             <directionalLight position={[-12, 14, -8]} intensity={0.85} color={"#b48cff"} />

//             <Suspense fallback={null}>
//               <CityModel url={visualUrl} withColliders={false} onLoaded={() => setVisualReady(true)} />
//             </Suspense>

//             <Suspense fallback={null}>
//               <CityMarkers visible={!uiIntro} radius={3} openDistance={7} closeDistance={9} />
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

//               {/* Big fallback ground */}
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
//                 active
//                 lockMovement={uiIntro}
//                 yawOffset={-Math.PI / 2}
//                 onPlayerReady={() => setPlayerReady(true)}
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

//       {!uiIntro && requestedEnter && isMobile && (
//         <div style={{ position: "fixed", left: 16, bottom: 16, zIndex: 9999 }}>
//           <Joystick onMove={setMoveInput} />
//         </div>
//       )}

//       {import.meta.env.DEV && <DevResetIntroButton />}
//     </div>
//   );
// }




