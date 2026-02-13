// src/Components/HomeCity/MiniMapHUD.jsx
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export default function MiniMapHUD({
  enabled = true,
  width = 160,
  height = 260,
  centerX = 0,
  centerZ = 0,
  scale = 0.8,
  markers = [],

  // ✅ how low the player sits in the map (0–1)
  playerVerticalRatio = 0.98,
}) {
  const { camera } = useThree();
  const containerRef = useRef(null);
  const stateRef = useRef({ x: 0, z: 0, rot: 0 });
  const tmpForward = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (!enabled) return;
    const el = document.createElement("div");
    document.body.appendChild(el);
    containerRef.current = el;
    return () => {
      document.body.removeChild(el);
      containerRef.current = null;
    };
  }, [enabled]);

  const tick = useMemo(() => ({ acc: 0 }), []);
  useFrame((_, dt) => {
    if (!containerRef.current) return;

    tick.acc += dt;
    if (tick.acc < 1 / 30) return;
    tick.acc = 0;

    const p = camera.position;

    tmpForward.set(0, 0, -1).applyQuaternion(camera.quaternion);
    const fx = tmpForward.x;
    const fz = tmpForward.z;

    const rot = Math.atan2(fz, fx);

    stateRef.current = { x: p.x, z: p.z, rot };
    renderHUD();
  });

  const groupColor = (g) => {
    if (g === "NAV") return "rgba(255,0,255,0.95)";
    if (g === "GLOW") return "rgba(0,242,255,0.95)";
    if (g === "FUN") return "rgba(196,0,255,0.95)";
    return "rgba(255,255,255,0.65)";
  };

  const worldToMap = (wx, wz) => {
    const halfW = width / 2;

    // ✅ player is lower in the map
    const playerAnchorY = height * playerVerticalRatio;

    const px = halfW + (wz - centerZ) * scale;
    const py = playerAnchorY - (wx - centerX) * scale;

    const pad = 10;
    return {
      x: clamp(px, pad, width - pad),
      y: clamp(py, pad, height - pad),
    };
  };

  const renderHUD = () => {
    const el = containerRef.current;
    if (!el) return;

    const { x, z, rot } = stateRef.current;
    const me = worldToMap(x, z);

    const dotsHtml = (markers || [])
      .map((m) => {
        const p = worldToMap(m.x, m.z);
        const c = groupColor(m.group);
        return `
          <div style="
            position:absolute;
            left:${p.x - 3}px;
            top:${p.y - 3}px;
            width:6px;
            height:6px;
            border-radius:999px;
            background:${c};
            box-shadow:0 0 10px ${c};
            opacity:0.9;
          "></div>
        `;
      })
      .join("");

    el.innerHTML = `
      <div style="
        position:fixed;
        left:16px;
        top:16px;
        width:${width}px;
        height:${height}px;
        border-radius:18px;
        background:rgba(0,0,0,0.35);
        border:1px solid rgba(255,255,255,0.12);
        backdrop-filter:blur(10px);
        z-index:180;
        overflow:hidden;
        pointer-events:none;
        box-shadow:0 12px 30px rgba(0,0,0,0.25);
        font-family:system-ui;
      ">
        <div style="
          position:absolute;
          inset:0;
          background-image:
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size:18px 18px;
          opacity:0.55;
        "></div>

        ${dotsHtml}

        <div style="
          position:absolute;
          left:${me.x - 5}px;
          top:${me.y - 5}px;
          width:10px;
          height:10px;
          border-radius:999px;
          background:rgba(0,180,255,0.95);
          box-shadow:0 0 12px rgba(0,180,255,0.6), 0 0 0 2px rgba(0,0,0,0.35);
        "></div>

        <div style="
          position:absolute;
          left:${me.x - 1}px;
          top:${me.y - 18}px;
          width:2px;
          height:16px;
          background:rgba(255,255,255,0.9);
          transform-origin:50% 18px;
          transform:rotate(${rot}rad);
          border-radius:2px;
        "></div>

        <div style="
          position:absolute;
          left:10px;
          bottom:8px;
          font-size:10px;
          letter-spacing:0.5px;
          color:rgba(255,255,255,0.6);
        ">MAP</div>
      </div>
    `;
  };

  return null;
}
