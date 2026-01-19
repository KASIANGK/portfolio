// src/Components/HomeCity/FPSControls.jsx
import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function applyDeadzone(v, dz) {
  if (Math.abs(v) < dz) return 0;
  const sign = Math.sign(v);
  const mag = (Math.abs(v) - dz) / (1 - dz);
  return sign * clamp(mag, 0, 1);
}

export default function FPSControls({
  onLockChange,

  // Overview (drone)
  overviewPos = [0, 30, 40],
  overviewYaw = Math.PI,
  overviewPitch = -0.65,

  // Street spawn
  streetPos = [0, 1.8, 10],
  streetYaw = 0,
  playerHeight = 1.8,

  // Move
  speed = 3.8,

  // Look
  lookSensitivity = 0.0022,
  minPitch = -THREE.MathUtils.degToRad(85),
  maxPitch = THREE.MathUtils.degToRad(85),
  invertY = false,

  // Auto-sprint
  sprintAfterMs = 4000,
  sprintMultiplier = 1.75,

  // UX
  teleportOnFirstLock = true,
}) {
  const { camera, gl } = useThree();

  const yawPitch = useRef({ yaw: overviewYaw, pitch: overviewPitch });

  const keys = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  const holdRef = useRef({
    anyArrowDownAt: null,
  });

  const look = useRef({
    dx: 0,
    dy: 0,
    locked: false,
    hovering: false,
    lastX: 0,
    lastY: 0,
  });

  const didTeleportRef = useRef(false);

  const tmp = useMemo(
    () => ({
      fwd: new THREE.Vector3(),
      right: new THREE.Vector3(),
      move: new THREE.Vector3(),
      euler: new THREE.Euler(0, 0, 0, "YXZ"),
    }),
    []
  );

  // Init overview camera once
  useEffect(() => {
    camera.position.set(overviewPos[0], overviewPos[1], overviewPos[2]);

    yawPitch.current.yaw = overviewYaw;
    yawPitch.current.pitch = overviewPitch;

    tmp.euler.set(overviewPitch, overviewYaw, 0, "YXZ");
    camera.quaternion.setFromEuler(tmp.euler);

    didTeleportRef.current = false;
    holdRef.current.anyArrowDownAt = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    camera,
    overviewPos[0],
    overviewPos[1],
    overviewPos[2],
    overviewYaw,
    overviewPitch,
  ]);

  // Keyboard arrows
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code.startsWith("Arrow")) {
        if (holdRef.current.anyArrowDownAt === null) {
          holdRef.current.anyArrowDownAt = performance.now();
        }
      }

      switch (e.code) {
        case "ArrowUp":
          keys.current.up = true;
          break;
        case "ArrowDown":
          keys.current.down = true;
          break;
        case "ArrowLeft":
          keys.current.left = true;
          break;
        case "ArrowRight":
          keys.current.right = true;
          break;
      }
    };

    const onKeyUp = (e) => {
      switch (e.code) {
        case "ArrowUp":
          keys.current.up = false;
          break;
        case "ArrowDown":
          keys.current.down = false;
          break;
        case "ArrowLeft":
          keys.current.left = false;
          break;
        case "ArrowRight":
          keys.current.right = false;
          break;
      }

      if (e.code.startsWith("Arrow")) {
        const k = keys.current;
        const stillDown = k.up || k.down || k.left || k.right;
        if (!stillDown) holdRef.current.anyArrowDownAt = null;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Pointer lock toggle on click
  useEffect(() => {
    const el = gl.domElement;

    const onPointerLockChange = () => {
      const nowLocked = document.pointerLockElement === el;
      look.current.locked = nowLocked;
      onLockChange?.(nowLocked);

      if (nowLocked && teleportOnFirstLock && !didTeleportRef.current) {
        didTeleportRef.current = true;

        camera.position.set(streetPos[0], streetPos[1], streetPos[2]);
        yawPitch.current.yaw = streetYaw;
        yawPitch.current.pitch = 0;

        tmp.euler.set(0, streetYaw, 0, "YXZ");
        camera.quaternion.setFromEuler(tmp.euler);
      }

      look.current.dx = 0;
      look.current.dy = 0;
      look.current.lastX = 0;
      look.current.lastY = 0;
    };

    const toggleLock = () => {
      if (document.pointerLockElement === el) {
        document.exitPointerLock?.();
      } else {
        el.requestPointerLock?.();
      }
    };

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      toggleLock();
    };

    const onEsc = (e) => {
      if (e.code === "Escape" && document.pointerLockElement) {
        document.exitPointerLock?.();
      }
    };

    document.addEventListener("pointerlockchange", onPointerLockChange);
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onEsc);

    return () => {
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onEsc);
    };
  }, [gl.domElement, camera, streetPos, streetYaw, tmp, teleportOnFirstLock, onLockChange]);

  // Mouse look (locked => full 360)
  useEffect(() => {
    const el = gl.domElement;

    const onEnter = () => {
      look.current.hovering = true;
      look.current.lastX = 0;
      look.current.lastY = 0;
    };
    const onLeave = () => {
      look.current.hovering = false;
      look.current.lastX = 0;
      look.current.lastY = 0;
    };

    const onMouseMove = (e) => {
      if (look.current.locked) {
        look.current.dx += e.movementX;
        look.current.dy += e.movementY;
        return;
      }
      if (!look.current.hovering) return;

      if (look.current.lastX === 0 && look.current.lastY === 0) {
        look.current.lastX = e.clientX;
        look.current.lastY = e.clientY;
        return;
      }

      look.current.dx += e.clientX - look.current.lastX;
      look.current.dy += e.clientY - look.current.lastY;
      look.current.lastX = e.clientX;
      look.current.lastY = e.clientY;
    };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [gl.domElement]);

  useFrame((_, dt) => {
    // LOOK
    const dx = look.current.dx;
    const dy = look.current.dy;
    look.current.dx = 0;
    look.current.dy = 0;

    if (dx || dy) {
      const signY = invertY ? -1 : 1;
      yawPitch.current.yaw -= dx * lookSensitivity;
      yawPitch.current.pitch -= dy * lookSensitivity * signY;
      yawPitch.current.pitch = clamp(yawPitch.current.pitch, minPitch, maxPitch);
    }

    tmp.euler.set(yawPitch.current.pitch, yawPitch.current.yaw, 0, "YXZ");
    camera.quaternion.setFromEuler(tmp.euler);

    // MOVE (arrows)
    const kx = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);
    const ky = (keys.current.up ? 1 : 0) - (keys.current.down ? 1 : 0);

    let mx = clamp(kx, -1, 1);
    let my = clamp(ky, -1, 1);

    const len = Math.hypot(mx, my);
    if (len > 1e-6) {
      const n = Math.min(1, len);
      mx /= n;
      my /= n;
    }

    if (mx || my) {
      const now = performance.now();
      const heldLong =
        holdRef.current.anyArrowDownAt !== null &&
        now - holdRef.current.anyArrowDownAt >= sprintAfterMs;

      const sprintMul = heldLong ? sprintMultiplier : 1.0;

      tmp.fwd.set(0, 0, -1).applyEuler(new THREE.Euler(0, yawPitch.current.yaw, 0));
      tmp.right.set(1, 0, 0).applyEuler(new THREE.Euler(0, yawPitch.current.yaw, 0));

      tmp.move.copy(tmp.right).multiplyScalar(mx).add(tmp.fwd.multiplyScalar(my));

      camera.position.addScaledVector(tmp.move, speed * sprintMul * dt);
    }

    // Keep height after teleport
    if (teleportOnFirstLock && didTeleportRef.current) {
      camera.position.y = playerHeight;
    }
  });

  return null;
}
















// // src/Components/HomeCity/FPSControls.jsx
// import * as THREE from "three";
// import { useEffect, useMemo, useRef } from "react";
// import { useFrame, useThree } from "@react-three/fiber";

// function clamp(n, min, max) {
//   return Math.max(min, Math.min(max, n));
// }

// function applyDeadzone(v, dz) {
//   if (Math.abs(v) < dz) return 0;
//   const sign = Math.sign(v);
//   const mag = (Math.abs(v) - dz) / (1 - dz);
//   return sign * clamp(mag, 0, 1);
// }

// export default function FPSControls({
//   // Optional: mobile dual sticks
//   getMoveJoystick,
//   getLookJoystick,

//   // --- Overview (drone) camera on load ---
//   overviewPos = [0, 30, 40],
//   overviewYaw = Math.PI,
//   overviewPitch = -0.65,

//   // --- Street spawn when user enters FPS (click / pointer lock) ---
//   streetPos = [0, 1.8, 10],
//   streetYaw = 0,
//   playerHeight = 1.8,

//   // Move
//   speed = 3.8,
//   joystickDeadzone = 0.1,

//   // Look
//   lookSensitivity = 0.0022,        // mouse sensitivity
//   lookStickSensitivity = 0.045,    // joystick look intensity
//   minPitch = -THREE.MathUtils.degToRad(85),
//   maxPitch = THREE.MathUtils.degToRad(85),
//   invertY = false,

//   // Sprint (auto after holding arrows)
//   sprintAfterMs = 4000,
//   sprintMultiplier = 1.75,

//   // UX
//   teleportOnFirstLock = true,
// }) {
//   const { camera, gl } = useThree();

//   // yaw/pitch state (YXZ)
//   const yawPitch = useRef({ yaw: overviewYaw, pitch: overviewPitch });

//   // Arrow keys for movement
//   const keys = useRef({
//     up: false,
//     down: false,
//     left: false,
//     right: false,
//     shift: false, // optional bonus
//   });

//   // Track arrow-hold duration for auto sprint
//   const holdRef = useRef({
//     anyArrowDownAt: null, // timestamp (ms)
//   });

//   // Mouse look state
//   const look = useRef({
//     dx: 0,
//     dy: 0,
//     locked: false,
//     hovering: false,
//     lastX: 0,
//     lastY: 0,
//   });

//   // Teleport only once (first entry to FPS)
//   const didTeleportRef = useRef(false);

//   const tmp = useMemo(
//     () => ({
//       fwd: new THREE.Vector3(),
//       right: new THREE.Vector3(),
//       move: new THREE.Vector3(),
//       euler: new THREE.Euler(0, 0, 0, "YXZ"),
//     }),
//     []
//   );

//   // --- Init overview camera
//   useEffect(() => {
//     camera.position.set(overviewPos[0], overviewPos[1], overviewPos[2]);

//     yawPitch.current.yaw = overviewYaw;
//     yawPitch.current.pitch = overviewPitch;

//     tmp.euler.set(overviewPitch, overviewYaw, 0, "YXZ");
//     camera.quaternion.setFromEuler(tmp.euler);

//     didTeleportRef.current = false;
//     holdRef.current.anyArrowDownAt = null;
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [
//     camera,
//     overviewPos[0],
//     overviewPos[1],
//     overviewPos[2],
//     overviewYaw,
//     overviewPitch,
//   ]);

//   // --- Keyboard handlers (arrows + optional shift)
//   useEffect(() => {
//     const onKeyDown = (e) => {
//       // Start sprint timer when any arrow is pressed
//       if (e.code.startsWith("Arrow")) {
//         if (holdRef.current.anyArrowDownAt === null) {
//           holdRef.current.anyArrowDownAt = performance.now();
//         }
//       }

//       switch (e.code) {
//         case "ArrowUp":
//           keys.current.up = true;
//           break;
//         case "ArrowDown":
//           keys.current.down = true;
//           break;
//         case "ArrowLeft":
//           keys.current.left = true;
//           break;
//         case "ArrowRight":
//           keys.current.right = true;
//           break;
//         case "ShiftLeft":
//         case "ShiftRight":
//           keys.current.shift = true;
//           break;
//       }
//     };

//     const onKeyUp = (e) => {
//       switch (e.code) {
//         case "ArrowUp":
//           keys.current.up = false;
//           break;
//         case "ArrowDown":
//           keys.current.down = false;
//           break;
//         case "ArrowLeft":
//           keys.current.left = false;
//           break;
//         case "ArrowRight":
//           keys.current.right = false;
//           break;
//         case "ShiftLeft":
//         case "ShiftRight":
//           keys.current.shift = false;
//           break;
//       }

//       // Reset sprint timer when NO arrow key remains pressed
//       if (e.code.startsWith("Arrow")) {
//         const k = keys.current;
//         const stillDown = k.up || k.down || k.left || k.right;
//         if (!stillDown) holdRef.current.anyArrowDownAt = null;
//       }
//     };

//     window.addEventListener("keydown", onKeyDown);
//     window.addEventListener("keyup", onKeyUp);
//     return () => {
//       window.removeEventListener("keydown", onKeyDown);
//       window.removeEventListener("keyup", onKeyUp);
//     };
//   }, []);

//   // --- Pointer lock toggle on click (lock/unlock)
//   useEffect(() => {
//     const el = gl.domElement;

//     const onPointerLockChange = () => {
//       const nowLocked = document.pointerLockElement === el;
//       look.current.locked = nowLocked;

//       // On first lock -> teleport to street
//       if (nowLocked && teleportOnFirstLock && !didTeleportRef.current) {
//         didTeleportRef.current = true;

//         camera.position.set(streetPos[0], streetPos[1], streetPos[2]);
//         yawPitch.current.yaw = streetYaw;
//         yawPitch.current.pitch = 0;

//         tmp.euler.set(0, streetYaw, 0, "YXZ");
//         camera.quaternion.setFromEuler(tmp.euler);
//       }

//       // Reset mouse deltas
//       look.current.dx = 0;
//       look.current.dy = 0;
//       look.current.lastX = 0;
//       look.current.lastY = 0;
//     };

//     const toggleLock = () => {
//       if (document.pointerLockElement === el) {
//         document.exitPointerLock?.();
//       } else {
//         el.requestPointerLock?.();
//       }
//     };

//     const onMouseDown = (e) => {
//       if (e.button !== 0) return;
//       toggleLock();
//     };

//     const onKeyDown = (e) => {
//       if (e.code === "Escape" && document.pointerLockElement) {
//         document.exitPointerLock?.();
//       }
//     };

//     document.addEventListener("pointerlockchange", onPointerLockChange);
//     el.addEventListener("mousedown", onMouseDown);
//     window.addEventListener("keydown", onKeyDown);

//     return () => {
//       document.removeEventListener("pointerlockchange", onPointerLockChange);
//       el.removeEventListener("mousedown", onMouseDown);
//       window.removeEventListener("keydown", onKeyDown);
//     };
//   }, [gl.domElement, camera, streetPos, streetYaw, tmp, teleportOnFirstLock]);

//   // --- Mouse move look:
//   // locked -> use movementX/Y (full 360)
//   // unlocked -> optional hover look
//   useEffect(() => {
//     const el = gl.domElement;

//     const onEnter = () => {
//       look.current.hovering = true;
//       look.current.lastX = 0;
//       look.current.lastY = 0;
//     };
//     const onLeave = () => {
//       look.current.hovering = false;
//       look.current.lastX = 0;
//       look.current.lastY = 0;
//     };

//     const onMouseMove = (e) => {
//       if (look.current.locked) {
//         look.current.dx += e.movementX;
//         look.current.dy += e.movementY;
//         return;
//       }

//       if (!look.current.hovering) return;

//       if (look.current.lastX === 0 && look.current.lastY === 0) {
//         look.current.lastX = e.clientX;
//         look.current.lastY = e.clientY;
//         return;
//       }

//       look.current.dx += e.clientX - look.current.lastX;
//       look.current.dy += e.clientY - look.current.lastY;
//       look.current.lastX = e.clientX;
//       look.current.lastY = e.clientY;
//     };

//     el.addEventListener("mouseenter", onEnter);
//     el.addEventListener("mouseleave", onLeave);
//     window.addEventListener("mousemove", onMouseMove);

//     return () => {
//       el.removeEventListener("mouseenter", onEnter);
//       el.removeEventListener("mouseleave", onLeave);
//       window.removeEventListener("mousemove", onMouseMove);
//     };
//   }, [gl.domElement]);

//   useFrame((_, dt) => {
//     // ---------- LOOK (mouse + optional look joystick) ----------
//     if (getLookJoystick) {
//       const v = getLookJoystick() || { x: 0, y: 0 };
//       const lx = applyDeadzone(v.x || 0, joystickDeadzone);
//       const ly = applyDeadzone(v.y || 0, joystickDeadzone);

//       // convert joystick values to pseudo-pixels per frame (stable)
//       look.current.dx += lx * (lookStickSensitivity / Math.max(dt, 1e-4));
//       look.current.dy += ly * (lookStickSensitivity / Math.max(dt, 1e-4));
//     }

//     const dx = look.current.dx;
//     const dy = look.current.dy;
//     look.current.dx = 0;
//     look.current.dy = 0;

//     if (dx || dy) {
//       const signY = invertY ? -1 : 1;
//       yawPitch.current.yaw -= dx * lookSensitivity;

//       // pitch: clamp to avoid flipping
//       yawPitch.current.pitch -= dy * lookSensitivity * signY;
//       yawPitch.current.pitch = clamp(yawPitch.current.pitch, minPitch, maxPitch);
//     }

//     tmp.euler.set(yawPitch.current.pitch, yawPitch.current.yaw, 0, "YXZ");
//     camera.quaternion.setFromEuler(tmp.euler);

//     // ---------- MOVE (arrows + optional move joystick) ----------
//     const kx = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);
//     const ky = (keys.current.up ? 1 : 0) - (keys.current.down ? 1 : 0);

//     let jx = 0;
//     let jy = 0;
//     if (getMoveJoystick) {
//       const v = getMoveJoystick() || { x: 0, y: 0 };
//       jx = applyDeadzone(v.x || 0, joystickDeadzone);
//       jy = applyDeadzone(v.y || 0, joystickDeadzone);
//     }

//     let mx = clamp(kx + jx, -1, 1);
//     let my = clamp(ky + jy, -1, 1);

//     const len = Math.hypot(mx, my);
//     if (len > 1e-6) {
//       const n = Math.min(1, len);
//       mx /= n;
//       my /= n;
//     }

//     if (mx || my) {
//       // auto-sprint if holding any arrow > sprintAfterMs
//       const now = performance.now();
//       const heldLong =
//         holdRef.current.anyArrowDownAt !== null &&
//         now - holdRef.current.anyArrowDownAt >= sprintAfterMs;

//       // Optional: Shift bonus ON TOP
//       const shiftBonus = keys.current.shift ? 1.35 : 1.0;

//       const sprintMul = (heldLong ? sprintMultiplier : 1.0) * shiftBonus;

//       tmp.fwd.set(0, 0, -1).applyEuler(new THREE.Euler(0, yawPitch.current.yaw, 0));
//       tmp.right.set(1, 0, 0).applyEuler(new THREE.Euler(0, yawPitch.current.yaw, 0));

//       tmp.move.copy(tmp.right).multiplyScalar(mx).add(tmp.fwd.multiplyScalar(my));

//       const moveSpeed = speed * sprintMul * dt;
//       camera.position.addScaledVector(tmp.move, moveSpeed);
//     }

//     // keep eye height once teleported in FPS mode
//     if (teleportOnFirstLock && didTeleportRef.current) {
//       camera.position.y = playerHeight;
//     }
//   });

//   return null;
// }










