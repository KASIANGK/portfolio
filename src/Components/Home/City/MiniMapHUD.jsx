// src/Components/HomeCity/MiniMapHUD.jsx
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";

export default function MiniMapHUD({
  enabled = true,
  size = 150,
  centerX = 0,
  centerZ = 0,
  scale = 0.8,
}) {
  const { camera } = useThree();
  const containerRef = useRef(null);
  const stateRef = useRef({ x: 0, z: 0, yaw: 0 });

  // Create DOM container once
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

  // Update camera state (30 fps)
  const tick = useMemo(() => ({ acc: 0 }), []);
  useFrame((_, dt) => {
    if (!containerRef.current) return;

    tick.acc += dt;
    if (tick.acc < 1 / 30) return;
    tick.acc = 0;

    const p = camera.position;
    const e = new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ");

    stateRef.current = { x: p.x, z: p.z, yaw: e.y };
    renderHUD();
  });

  // Render HUD into portal container
  const renderHUD = () => {
    const el = containerRef.current;
    if (!el) return;

    const { x, z, yaw } = stateRef.current;

    const half = size / 2;
    const px = half + (z - centerZ) * scale;
    const py = half - (x - centerX) * scale;
    
    const dotX = Math.max(10, Math.min(size - 10, px));
    const dotY = Math.max(10, Math.min(size - 10, py));
    


    el.innerHTML = `
      <div style="
        position:fixed;
        left:16px;
        top:16px;        
        width:${size}px;
        height:${size}px;
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

        <div style="
          position:absolute;
          left:${dotX - 5}px;
          top:${dotY - 5}px;
          width:10px;
          height:10px;
          border-radius:999px;
          background:rgba(0,180,255,0.95);    
          box-shadow:0 0 12px rgba(0,180,255,0.6), 0 0 0 2px rgba(0,0,0,0.35);
          box-shadow:0 0 0 2px rgba(0,0,0,0.35);
        "></div>

        <div style="
          position:absolute;
          left:${dotX - 1}px;
          top:${dotY - 18}px;
          width:2px;
          height:16px;
          background:rgba(255,255,255,0.9);
          transform-origin:50% 18px;
          transform:rotate(${yaw + Math.PI / 2}rad);
          border-radius:2px;
        "></div>

        <div style="
          position:absolute;
          left:10px;
          bottom:8px;
          font-size:10px;
          letter-spacing:0.5px;
          color:rgba(255,255,255,0.6);
        ">
          MAP
        </div>
      </div>
    `;
  };

  // Component renders nothing in R3F tree
  return null;
}
