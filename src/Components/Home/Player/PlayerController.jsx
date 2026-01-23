// src/Components/Player/PlayerController.jsx
import * as THREE from "three";
import { useEffect, useMemo, useRef, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, useRapier } from "@react-three/rapier";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function safeVec3(v, fallback = [0, 2, 0]) {
  if (Array.isArray(v) && v.length >= 3) return v;
  return fallback;
}

const ARROW_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

export default function PlayerController({
  rbRef,
  active = true,

  lockMovement = false,
  lockLook = false,

  teleportNonce = 0,
  onPlayerReady,

  lookInput = { x: 0, y: 0 },
  moveInput = { x: 0, y: 0 },

  mobileSpeedMultiplier = 1.0,
  mobileLookSensitivity = 0.045,

  overviewPos = [0, 8, 10],
  overviewYaw = 0,
  overviewPitch = -0.25,

  streetPos = [0, 2, 0],
  streetYaw = 0,

  playerHeight = 1.8,

  speed = 4.6,
  sprintAfterMs = 2000,
  sprintMultiplier = 2.6,

  stepHeight = 0.55,
  maxSlopeDeg = 50,

  lookSensitivity = 0.0022,
  minPitch = -THREE.MathUtils.degToRad(85),
  maxPitch = THREE.MathUtils.degToRad(85),
  invertY = false,

  yawOffset = 0,
}) {
  const { camera, gl } = useThree();
  const { world, rapier } = useRapier();

  const rbLocal = useRef(null);
  const rb = rbRef ?? rbLocal;

  const keys = useRef({ up: false, down: false, left: false, right: false });

  const look = useRef({ dx: 0, dy: 0, locked: false });
  const holdRef = useRef({ anyArrowDownAt: null });

  const controllerRef = useRef(null);
  const velY = useRef(0);

  // ✅ target vs current (smooth)
  const yawPitchTarget = useRef({
    yaw: Number.isFinite(overviewYaw) ? overviewYaw : 0,
    pitch: Number.isFinite(overviewPitch) ? overviewPitch : 0,
  });

  const yawPitchCurrent = useRef({
    yaw: Number.isFinite(overviewYaw) ? overviewYaw : 0,
    pitch: Number.isFinite(overviewPitch) ? overviewPitch : 0,
  });

  const tmp = useMemo(
    () => ({
      euler: new THREE.Euler(0, 0, 0, "YXZ"),
      fwd: new THREE.Vector3(),
      right: new THREE.Vector3(),
      move: new THREE.Vector3(),
      yawEuler: new THREE.Euler(0, 0, 0, "YXZ"),
    }),
    []
  );

  // Camera smoothing (position)
  const camTarget = useRef(new THREE.Vector3());
  const camPos = useRef(new THREE.Vector3());
  const camInited = useRef(false);

  const CAPSULE_HALF = 0.55;
  const CAPSULE_RADIUS = 0.35;
  const CENTER_FROM_GROUND = CAPSULE_HALF + CAPSULE_RADIUS;
  const EYE_FROM_CENTER = Math.max(0.75, playerHeight - 0.9);

  const resetCameraSmoothing = () => {
    camInited.current = false;
    camPos.current.set(0, 0, 0);
    camTarget.current.set(0, 0, 0);
  };

  const applyCameraOrientation = (yaw, pitch) => {
    tmp.euler.set(pitch, yaw + yawOffset, 0, "YXZ");
    camera.quaternion.setFromEuler(tmp.euler);
  };

  const snapCameraToBody = () => {
    if (!rb.current) return;
    const t = rb.current.translation();
    camTarget.current.set(t.x, t.y + EYE_FROM_CENTER, t.z);
    camPos.current.copy(camTarget.current);
    camera.position.copy(camTarget.current);
    camInited.current = true;
  };

  const getGroundY = useCallback(
    (x, z, hintY = 0) => {
      const baseY = Number.isFinite(hintY) ? hintY : 0;
      const originY = baseY + 60;
      const ray = new rapier.Ray({ x, y: originY, z }, { x: 0, y: -1, z: 0 });
      const hit = world.castRay(ray, 200, true);
      if (hit && hit.toi != null) return originY - hit.toi;
      return baseY;
    },
    [rapier, world]
  );

  // Character controller
  useEffect(() => {
    const c = world.createCharacterController(0.05);

    if (c.setMaxClimb) c.setMaxClimb(stepHeight);
    if (c.setMaxSlopeClimbAngle)
      c.setMaxSlopeClimbAngle((maxSlopeDeg * Math.PI) / 180);
    if (c.setMinSlopeSlideAngle)
      c.setMinSlopeSlideAngle((maxSlopeDeg * Math.PI) / 180);

    controllerRef.current = c;
    return () => {
      controllerRef.current = null;
    };
  }, [world, stepHeight, maxSlopeDeg]);

  // Pointer lock tracking
  useEffect(() => {
    const el = gl.domElement;
    const onPLC = () => {
      look.current.locked = document.pointerLockElement === el;
      look.current.dx = 0;
      look.current.dy = 0;
    };
    document.addEventListener("pointerlockchange", onPLC);
    return () => document.removeEventListener("pointerlockchange", onPLC);
  }, [gl]);

  // ✅ HARD BLOCK: if lockLook is true (Step1), ensure pointerlock cannot stay
  useEffect(() => {
    if (!lockLook) return;
    if (document.pointerLockElement === gl.domElement) {
      document.exitPointerLock?.();
    }
    // also flush deltas
    look.current.dx = 0;
    look.current.dy = 0;
  }, [lockLook, gl.domElement]);

  // Mouse look (ONLY when pointer locked)
  useEffect(() => {
    const onMouseMove = (e) => {
      if (!active) return;
      if (lockLook) return;
      if (!look.current.locked) return; // ✅ requires pointer lock

      look.current.dx += e.movementX || 0;
      look.current.dy += e.movementY || 0;
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [active, lockLook]);

  // Arrows movement keys
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!active || lockMovement) return;

      if (ARROW_KEYS.has(e.code)) {
        e.preventDefault();
        e.stopPropagation();
        if (holdRef.current.anyArrowDownAt === null) {
          holdRef.current.anyArrowDownAt = performance.now();
        }
      }

      if (e.code === "ArrowUp") keys.current.up = true;
      if (e.code === "ArrowDown") keys.current.down = true;
      if (e.code === "ArrowLeft") keys.current.left = true;
      if (e.code === "ArrowRight") keys.current.right = true;
    };

    const onKeyUp = (e) => {
      if (ARROW_KEYS.has(e.code)) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (e.code === "ArrowUp") keys.current.up = false;
      if (e.code === "ArrowDown") keys.current.down = false;
      if (e.code === "ArrowLeft") keys.current.left = false;
      if (e.code === "ArrowRight") keys.current.right = false;

      if (ARROW_KEYS.has(e.code)) {
        const k = keys.current;
        if (!(k.up || k.down || k.left || k.right)) {
          holdRef.current.anyArrowDownAt = null;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown, { passive: false, capture: true });
    window.addEventListener("keyup", onKeyUp, { passive: false, capture: true });

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
    };
  }, [active, lockMovement]);

  // Clear keys on blur
  useEffect(() => {
    const clear = () => {
      keys.current.up = keys.current.down = keys.current.left = keys.current.right = false;
      holdRef.current.anyArrowDownAt = null;
    };
    const onVis = () => {
      if (document.visibilityState !== "visible") clear();
    };
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Overview init
  useEffect(() => {
    const oPos = safeVec3(overviewPos, [0, 8, 10]);
    const oYaw = Number.isFinite(overviewYaw) ? overviewYaw : 0;
    const oPitch = Number.isFinite(overviewPitch) ? overviewPitch : -0.25;

    if (rb.current) rb.current.setTranslation({ x: oPos[0], y: oPos[1], z: oPos[2] }, true);
    else camera.position.set(oPos[0], oPos[1], oPos[2]);

    yawPitchTarget.current.yaw = oYaw;
    yawPitchTarget.current.pitch = oPitch;

    yawPitchCurrent.current.yaw = oYaw;
    yawPitchCurrent.current.pitch = oPitch;

    applyCameraOrientation(oYaw, oPitch);

    velY.current = 0;
    resetCameraSmoothing();
    snapCameraToBody();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overviewPos, overviewYaw, overviewPitch, yawOffset]);

  // Teleport to street
  useEffect(() => {
    if (!rb.current) return;

    const sPos = safeVec3(streetPos, [0, 2, 0]);
    const sYaw = Number.isFinite(streetYaw) ? streetYaw : 0;

    const groundY = getGroundY(sPos[0], sPos[2], sPos[1]);

    rb.current.setTranslation(
      { x: sPos[0], y: groundY + CENTER_FROM_GROUND, z: sPos[2] },
      true
    );

    yawPitchTarget.current.yaw = sYaw;
    yawPitchTarget.current.pitch = 0;

    yawPitchCurrent.current.yaw = sYaw;
    yawPitchCurrent.current.pitch = 0;

    applyCameraOrientation(sYaw, 0);

    velY.current = 0;
    resetCameraSmoothing();
    snapCameraToBody();

    if (typeof onPlayerReady === "function") {
      requestAnimationFrame(() => onPlayerReady());
    }
  }, [teleportNonce, getGroundY, streetPos, streetYaw]);

  useFrame((_, dt) => {
    // ===== LOOK INPUT -> target yaw/pitch =====
    if (active && !lockLook) {
      // desktop pointer-locked mouse
      if (look.current.locked) {
        const dx = look.current.dx;
        const dy = look.current.dy;
        look.current.dx = 0;
        look.current.dy = 0;

        if (dx || dy) {
          const signY = invertY ? -1 : 1;
          yawPitchTarget.current.yaw -= dx * lookSensitivity;
          yawPitchTarget.current.pitch -= dy * lookSensitivity * signY;
          yawPitchTarget.current.pitch = clamp(yawPitchTarget.current.pitch, minPitch, maxPitch);
        }
      } else {
        // not locked => no mouse look (ESC escape = stops control)
        look.current.dx = 0;
        look.current.dy = 0;
      }

      // mobile joystick look
      if (!look.current.locked) {
        const lx = clamp(lookInput?.x ?? 0, -1, 1);
        const ly = clamp(lookInput?.y ?? 0, -1, 1);

        if (lx || ly) {
          const signY = invertY ? -1 : 1;
          yawPitchTarget.current.yaw -= lx * mobileLookSensitivity;
          yawPitchTarget.current.pitch -= ly * mobileLookSensitivity * signY;
          yawPitchTarget.current.pitch = clamp(yawPitchTarget.current.pitch, minPitch, maxPitch);
        }
      }
    } else {
      look.current.dx = 0;
      look.current.dy = 0;
    }

    // ===== SMOOTH yaw/pitch (makes it fluid) =====
    {
      const smooth = 1 - Math.exp(-18 * dt); // higher = snappier, still smooth
      yawPitchCurrent.current.yaw += (yawPitchTarget.current.yaw - yawPitchCurrent.current.yaw) * smooth;
      yawPitchCurrent.current.pitch += (yawPitchTarget.current.pitch - yawPitchCurrent.current.pitch) * smooth;
      applyCameraOrientation(yawPitchCurrent.current.yaw, yawPitchCurrent.current.pitch);
    }

    // ===== CAMERA FOLLOW (position) =====
    const followCamera = (dtLocal) => {
      if (!rb.current) return;

      const t = rb.current.translation();
      camTarget.current.set(t.x, t.y + EYE_FROM_CENTER, t.z);

      if (!camInited.current) {
        camInited.current = true;
        camPos.current.copy(camTarget.current);
        camera.position.copy(camTarget.current);
        return;
      }

      const alpha = 1 - Math.exp(-12 * dtLocal);
      camPos.current.lerp(camTarget.current, alpha);
      camera.position.copy(camPos.current);
    };

    if (!active || lockMovement || !rb.current || !controllerRef.current) {
      followCamera(dt);
      return;
    }

    // ===== MOVE INPUT =====
    const kx = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);
    const ky = (keys.current.up ? 1 : 0) - (keys.current.down ? 1 : 0);

    const jx = clamp(moveInput?.x ?? 0, -1, 1);
    const jy = clamp(moveInput?.y ?? 0, -1, 1);

    let mx = clamp(kx + jx, -1, 1);
    let my = clamp(ky + -jy, -1, 1);

    const len = Math.hypot(mx, my);
    if (len > 1) {
      mx /= len;
      my /= len;
    }

    const now = performance.now();
    const heldLong =
      holdRef.current.anyArrowDownAt !== null &&
      now - holdRef.current.anyArrowDownAt >= sprintAfterMs;
    const sprintMul = heldLong ? sprintMultiplier : 1.0;

    tmp.yawEuler.set(0, yawPitchCurrent.current.yaw + yawOffset, 0, "YXZ");
    tmp.fwd.set(0, 0, -1).applyEuler(tmp.yawEuler);
    tmp.right.set(1, 0, 0).applyEuler(tmp.yawEuler);
    tmp.move.copy(tmp.right).multiplyScalar(mx).add(tmp.fwd.multiplyScalar(my));

    const ctrl = controllerRef.current;
    const collider = rb.current.collider(0);
    const t = rb.current.translation();

    const g = 9.81;
    velY.current -= g * dt;
    velY.current = Math.max(velY.current, -25);

    const hasJoy = Math.abs(jx) > 0.01 || Math.abs(jy) > 0.01;
    const moveSpeed = speed * sprintMul * (hasJoy ? mobileSpeedMultiplier : 1.0);

    const dxw = tmp.move.x * moveSpeed * dt;
    const dzw = tmp.move.z * moveSpeed * dt;
    const dyw = velY.current * dt;

    if (collider && ctrl.computeColliderMovement && ctrl.computedMovement) {
      ctrl.computeColliderMovement(collider, { x: dxw, y: dyw, z: dzw });
      const corrected = ctrl.computedMovement();

      const cx = corrected?.x ?? 0;
      const cy = corrected?.y ?? 0;
      const cz = corrected?.z ?? 0;

      if (dyw < 0 && cy > dyw * 0.5) velY.current = 0;

      const y = Math.abs(cy) < 0.0008 ? 0 : cy;

      rb.current.setNextKinematicTranslation({
        x: t.x + cx,
        y: t.y + y,
        z: t.z + cz,
      });
    }

    followCamera(dt);
  });

  return (
    <RigidBody
      ref={rb}
      type="kinematicPosition"
      position={safeVec3(overviewPos, [0, 8, 10])}
      enabledRotations={[false, false, false]}
      colliders={false}
      linearDamping={6}
      angularDamping={6}
    >
      <CapsuleCollider args={[CAPSULE_HALF, CAPSULE_RADIUS]} />
    </RigidBody>
  );
}


