import React, { useEffect, useMemo, useRef, useState } from "react";

export default function Joystick({ onMove, size = 140, deadZone = 0.12 }) {
  const baseRef = useRef(null);
  const [active, setActive] = useState(false);
  const [stick, setStick] = useState({ x: 0, y: 0 });

  const radius = useMemo(() => size / 2, [size]);
  const knobRadius = useMemo(() => size * 0.22, [size]);

  useEffect(() => {
    const el = baseRef.current;
    if (!el) return;

    const getCenter = () => {
      const r = el.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    };

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const setFromClient = (clientX, clientY) => {
      const { cx, cy } = getCenter();
      const dx = clientX - cx;
      const dy = clientY - cy;

      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = radius - knobRadius;

      let nx = dx;
      let ny = dy;

      if (dist > maxDist) {
        const k = maxDist / dist;
        nx *= k;
        ny *= k;
      }

      // normalized [-1..1]
      const vx = nx / maxDist;
      const vy = ny / maxDist;

      const mag = Math.sqrt(vx * vx + vy * vy);
      const dz = deadZone;

      let outX = vx;
      let outY = vy;

      // deadzone
      if (mag < dz) {
        outX = 0;
        outY = 0;
      }

      setStick({ x: nx, y: ny });
      onMove?.({ x: outX, y: outY }); // y: bas positif (on inversera côté movement)
    };

    const onPointerDown = (e) => {
      setActive(true);
      el.setPointerCapture?.(e.pointerId);
      setFromClient(e.clientX, e.clientY);
    };

    const onPointerMove = (e) => {
      if (!active) return;
      setFromClient(e.clientX, e.clientY);
    };

    const onPointerUp = () => {
      setActive(false);
      setStick({ x: 0, y: 0 });
      onMove?.({ x: 0, y: 0 });
    };

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [active, deadZone, knobRadius, onMove, radius]);

  return (
    <div
      ref={baseRef}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        backdropFilter: "blur(10px)",
        position: "relative",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: knobRadius * 2,
          height: knobRadius * 2,
          borderRadius: 999,
          transform: `translate(calc(-50% + ${stick.x}px), calc(-50% + ${stick.y}px))`,
          background: "rgba(255,122,0,0.25)",
          border: "1px solid rgba(255,122,0,0.55)",
          boxShadow: "0 0 28px rgba(255,122,0,0.35)",
        }}
      />
    </div>
  );
}
