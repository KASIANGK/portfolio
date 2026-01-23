// src/Components/HomeCity/HomeCity.jsx
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
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { EffectComposer, Bloom, Vignette, SMAA } from "@react-three/postprocessing";
import { useTranslation } from "react-i18next";

import "./HomeCity.css";

import PlayerController from "../Player/PlayerController";
import MiniMapHUD from "../City/MiniMapHUD";
import CityModel from "../City/CityModel";
import CityMarkers from "../City/CityMarkers";
import CityNightLights from "../City/CityNightLights";
import Joystick from "../Player/Joystick";

import StepsHomeCity from "./parts/StepsHomeCity";
import ResetStepsHomeCity from "./parts/ResetStepsHomeCity";

const TUTO_KEY = "ag_city_tutorial_done_v1";
const FullScreenLoader = lazy(() => import("./parts/FullScreenLoader"));

function OrbitHintProjector({ enabled, world, onScreen }) {
  const { camera, size } = useThree();

  useFrame(() => {
    if (!enabled || !world) return;

    const v = new THREE.Vector3(world.x, world.y, world.z);
    v.project(camera);

    const x = (v.x * 0.5 + 0.5) * size.width;
    const y = (-v.y * 0.5 + 0.5) * size.height;

    const on =
      v.z > -1 &&
      v.z < 1 &&
      x >= 0 &&
      x <= size.width &&
      y >= 0 &&
      y <= size.height;

    onScreen?.({ x, y, onScreen: on });
  });

  return null;
}

export default function HomeCity() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation("home");

  const autoEnterCity = !!location.state?.autoEnterCity;

  useEffect(() => {
    const nav = performance.getEntriesByType?.("navigation")?.[0];
    const type = nav?.type;
    const cameFromExplore = !!location.state?.autoEnterCity;

    if ((type === "reload" || type === "navigate") && !cameFromExplore) {
      navigate("/", { replace: true });
    }
  }, [navigate, location.state]);

  const [tutorialDone, setTutorialDone] = useState(() => {
    try {
      return localStorage.getItem(TUTO_KEY) === "1";
    } catch {
      return false;
    }
  });

  const [tutorialControl, setTutorialControl] = useState({
    lockLook: true,
    lockMove: true,
    showOrbitHint: false,
    orbitHintWorld: null,
    requestLookCaptureNow: false,
    lookCaptureNonce: 0,
  });

  const [orbitHintScreen, setOrbitHintScreen] = useState(null);

  const [playerReady, setPlayerReady] = useState(false);

  const skipIntroStorage =
    typeof window !== "undefined"
      ? localStorage.getItem("angels_city_skip_intro") === "1"
      : false;

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

  const [orbits, setOrbits] = useState([]);

  const prePositionedRef = useRef(false);

  const [gateOpen, setGateOpen] = useState(false);
  const gateOpeningRef = useRef(false);

  const [headControlEnabled, setHeadControlEnabled] = useState(false);

  const isMobile =
    typeof window !== "undefined" &&
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  const streetPos = useMemo(() => [-142.49, 2, -40.345], []);
  const streetYaw = 0;

  const overviewPos = useMemo(() => [-142.49, 10.5, -52.0], []);
  const overviewYaw = 0;
  const overviewPitch = -0.22;

  const BASE = import.meta.env.BASE_URL || "/";
  const visualUrl = `${BASE}models/city_final_draco.glb`;
  const collisionUrl = `${BASE}models/City_collision_2.glb`;
  const lightsUrl = `${BASE}models/city_light.glb`;

  useEffect(() => {
    if (!colliderReady) {
      setColliderShown(false);
      return;
    }
    requestAnimationFrame(() => setColliderShown(true));
  }, [colliderReady]);

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

  const shouldShowTutorial = requestedEnter && gateOpen && !tutorialDone;

  const lockLook = uiIntro || (shouldShowTutorial && tutorialControl.lockLook);
  const lockMove = uiIntro || (shouldShowTutorial && tutorialControl.lockMove);

  const canvasElRef = useRef(null);

  const requestPointerLock = useCallback(() => {
    const el = canvasElRef.current;
    if (!el) return;
    try {
      el.requestPointerLock?.();
    } catch {}
  }, []);

  const toggleHeadControl = useCallback(() => {
    if (uiIntro || lockLook) return;

    setHeadControlEnabled((prev) => {
      const next = !prev;

      if (!isMobile && next) {
        window.focus?.();
        requestPointerLock();
      }
      if (!isMobile && !next) {
        document.exitPointerLock?.();
      }
      return next;
    });
  }, [uiIntro, lockLook, isMobile, requestPointerLock]);

  const resetStepsHomeCity = useCallback(() => {
    try {
      localStorage.removeItem(TUTO_KEY);
    } catch {}
    navigate("/", { replace: true, state: { resetCityTutorial: true } });
  }, [navigate]);

  useEffect(() => {
    if (!autoEnterCity) return;

    setRequestedEnter(true);
    setGateOpen(false);
    gateOpeningRef.current = false;
    setPlayerReady(false);
    setTeleportNonce((n) => n + 1);

    window.history.replaceState({}, document.title);
  }, [autoEnterCity]);

  useEffect(() => {
    if (skipIntro) setUiIntro(false);
  }, [skipIntro]);

  const lastCaptureNonceRef = useRef(0);
  useEffect(() => {
    if (!shouldShowTutorial) return;

    const nonce = tutorialControl?.lookCaptureNonce ?? 0;
    if (!nonce) return;

    if (nonce === lastCaptureNonceRef.current) return;
    lastCaptureNonceRef.current = nonce;

    if (tutorialControl.lockLook === false) {
      setHeadControlEnabled(true);
    }
  }, [shouldShowTutorial, tutorialControl?.lookCaptureNonce, tutorialControl?.lockLook]);

  useEffect(() => {
    if (!requestedEnter) return;
    if (!colliderReady) return;
    if (prePositionedRef.current) return;
    prePositionedRef.current = true;
  }, [requestedEnter, colliderReady]);

  useEffect(() => {
    return () => {
      if (document.pointerLockElement) document.exitPointerLock?.();
    };
  }, []);

  const onEnterRequest = useCallback(() => {
    setRequestedEnter(true);
    setPlayerReady(false);

    setGateOpen(false);
    gateOpeningRef.current = false;

    if (!isMobile) {
      window.focus?.();
      requestPointerLock();
    }
  }, [isMobile, requestPointerLock]);

  useEffect(() => {
    if (!requestedEnter) return;
    if (!canEnterCity) return;

    if (dontShowAgain) localStorage.setItem("angels_city_skip_intro", "1");

    setUiIntro(false);
    document.activeElement?.blur?.();

    setPlayerReady(false);
    setTeleportNonce((n) => n + 1);
  }, [requestedEnter, canEnterCity, dontShowAgain]);

  useEffect(() => {
    if (!uiIntro) return;

    const onKeyDown = (e) => {
      if (e.code !== "Space" && e.code !== "Enter") return;
      e.preventDefault();

      if (introStep < 3) {
        setIntroStep((s) => Math.min(3, s + 1));
        return;
      }

      onEnterRequest();
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [uiIntro, introStep, onEnterRequest]);

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

  const waitingReason = !visualReady
    ? "Loading city visuals…"
    : !colliderShown
      ? "Loading collisions…"
      : !markersReady
        ? "Loading portals…"
        : !playerReady
          ? "Spawning player…"
          : "Finalizing…";

  const shouldShowLoader = requestedEnter && !gateOpen;

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

  const onTutorialDone = useCallback(() => {
    try {
      localStorage.setItem(TUTO_KEY, "1");
    } catch {}
    setTutorialDone(true);

    setTutorialControl({
      lockLook: false,
      lockMove: false,
      showOrbitHint: false,
      orbitHintWorld: null,
      requestLookCaptureNow: false,
      lookCaptureNonce: 0,
    });
    setOrbitHintScreen(null);
  }, []);

  const pickOrbitWorld = useCallback(() => {
    if (!orbits?.length) return null;
    const o = orbits[0];
    return { x: o.position[0], y: o.position[1], z: o.position[2] };
  }, [orbits]);

  useEffect(() => {
    const fn = () => import("./parts/FullScreenLoader").catch(() => {});
    const id = "requestIdleCallback" in window ? requestIdleCallback(fn) : setTimeout(fn, 0);

    return () => {
      if (typeof id === "number") clearTimeout(id);
      else cancelIdleCallback?.(id);
    };
  }, []);

  useEffect(() => {
    if (!lockLook) return;
    setHeadControlEnabled(false);
    if (!isMobile) document.exitPointerLock?.();
  }, [lockLook, isMobile]);

  const rootClass = `home-city${shouldShowTutorial ? " isTutorial" : ""}`;

  return (
    <div className={rootClass}>
      {/* Loader / Tutorial (layers hautes) */}
      {requestedEnter && (
        <>
          {shouldShowLoader && (
            <Suspense fallback={null}>
              <FullScreenLoader force label={waitingReason} subLabel={t("loader.subLabel")} />
            </Suspense>
          )}

          {shouldShowTutorial && (
            <StepsHomeCity
              enabled
              isMobile={isMobile}
              lookInput={lookInput}
              moveInput={moveInput}
              orbitWorldPicker={pickOrbitWorld}
              orbitHintScreen={orbitHintScreen}
              onControlChange={setTutorialControl}
              onDone={onTutorialDone}
            />
          )}
        </>
      )}

      {/* ✅ Canvas ABSOLU (ne bouge jamais) */}
      {requestedEnter && (
        <Canvas
          className="home-city__canvas"
          dpr={shouldShowLoader ? 1 : [1, 1.5]}
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

            gl.domElement.style.touchAction = "none";
          }}
          onPointerDown={() => {
            if (uiIntro) return;

            if (shouldShowTutorial && tutorialControl.requestLookCaptureNow) {
              setHeadControlEnabled(true);

              if (!isMobile) {
                window.focus?.();
                requestPointerLock();
              }
              return;
            }

            if (lockLook) return;
            toggleHeadControl();
          }}
        >
          <OrbitHintProjector
            enabled={shouldShowTutorial && tutorialControl.showOrbitHint}
            world={tutorialControl.orbitHintWorld}
            onScreen={setOrbitHintScreen}
          />

          <fogExp2 attach="fog" density={0.00105} color={"#1a2455"} />

          <ambientLight intensity={0.42} />
          <hemisphereLight intensity={0.75} color={"#9dbbff"} groundColor={"#2a0030"} />
          <directionalLight position={[12, 18, 10]} intensity={1.25} color={"#ffe2c0"} />
          <directionalLight position={[-12, 14, -8]} intensity={0.85} color={"#b48cff"} />

          <Suspense fallback={null}>
            <CityModel url={visualUrl} withColliders={false} onLoaded={() => setVisualReady(true)} />
          </Suspense>

          <Suspense fallback={null}>
            <CityMarkers
              visible={!uiIntro}
              radius={3}
              openDistance={7}
              closeDistance={9}
              onLoaded={() => setMarkersReady(true)}
              onOrbits={setOrbits}
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
              lockMovement={lockMove}
              lockLook={lockLook}
              yawOffset={-Math.PI / 2}
              onPlayerReady={() => setPlayerReady(true)}
              mobileSpeedMultiplier={1.35}
              mobileLookSensitivity={0.05}
              headControlEnabled={headControlEnabled}
              onHeadControlChange={setHeadControlEnabled}
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
            <Bloom intensity={0.45} luminanceThreshold={0.25} luminanceSmoothing={0.85} mipmapBlur />
            <Vignette eskil={false} offset={0.15} darkness={0.25} />
          </EffectComposer>
        </Canvas>
      )}

      {/* ✅ Tint AU-DESSUS du Canvas, n'intercepte rien */}
      {requestedEnter && <div className="agCityTint" aria-hidden="true" />}

      {/* Joysticks mobile (au-dessus) */}
      {!uiIntro && requestedEnter && isMobile && (
        <>
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

      {import.meta.env.DEV && requestedEnter && (
        <ResetStepsHomeCity onResetSteps={resetStepsHomeCity} />
      )}
    </div>
  );
}
