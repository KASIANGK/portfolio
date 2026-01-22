// src/Components/HomeCity/Joystick.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

const VARIANTS = {
  pink: {
    knobBg: "rgba(255,0,170,0.18)",
    knobBorder: "rgba(255,0,170,0.55)",
    knobGlow: "0 0 28px rgba(255,0,170,0.22), 0 0 70px rgba(124,58,237,0.12)",
    baseGlow: "0 12px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,0,170,0.12)",
  },
  blue: {
    knobBg: "rgba(96,165,250,0.16)",
    knobBorder: "rgba(96,165,250,0.55)",
    knobGlow: "0 0 28px rgba(96,165,250,0.20), 0 0 70px rgba(124,58,237,0.10)",
    baseGlow: "0 12px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(96,165,250,0.12)",
  },
};

export default function Joystick({
  onOutput,                 // ✅ new: unified output callback
  size = 140,
  deadZone = 0.12,
  variant = "pink",         // ✅ pink | blue
}) {
  const baseRef = useRef(null);

  // UI only
  const [stick, setStick] = useState({ x: 0, y: 0 });

  const activeRef = useRef(false);
  const pointerIdRef = useRef(null);

  const radius = useMemo(() => size / 2, [size]);
  const knobRadius = useMemo(() => size * 0.22, [size]);

  const v = VARIANTS[variant] || VARIANTS.pink;

  useEffect(() => {
    const el = baseRef.current;
    if (!el) return;

    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

    const getCenter = () => {
      const r = el.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    };

    const setFromClient = (clientX, clientY) => {
      const { cx, cy } = getCenter();
      const dx = clientX - cx;
      const dy = clientY - cy;

      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.max(1, radius - knobRadius);

      let nx = dx;
      let ny = dy;

      if (dist > maxDist) {
        const k = maxDist / dist;
        nx *= k;
        ny *= k;
      }

      const vx = nx / maxDist;
      const vy = ny / maxDist;

      const mag = Math.sqrt(vx * vx + vy * vy);

      let outX = vx;
      let outY = vy;

      if (mag < deadZone) {
        outX = 0;
        outY = 0;
        nx = 0;
        ny = 0;
      }

      setStick({ x: nx, y: ny });
      onOutput?.({ x: clamp(outX, -1, 1), y: clamp(outY, -1, 1) });
    };

    const reset = () => {
      activeRef.current = false;
      pointerIdRef.current = null;
      setStick({ x: 0, y: 0 });
      onOutput?.({ x: 0, y: 0 });
    };

    const preventTouchDefaults = (e) => e.preventDefault();

    const onPointerDown = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;

      activeRef.current = true;
      pointerIdRef.current = e.pointerId;

      e.preventDefault();
      e.stopPropagation();

      el.setPointerCapture?.(e.pointerId);
      setFromClient(e.clientX, e.clientY);
    };

    const onPointerMove = (e) => {
      if (!activeRef.current) return;
      if (pointerIdRef.current != null && e.pointerId !== pointerIdRef.current) return;
      e.preventDefault();
      setFromClient(e.clientX, e.clientY);
    };

    const onPointerUp = (e) => {
      if (pointerIdRef.current != null && e.pointerId !== pointerIdRef.current) return;
      e.preventDefault();
      reset();
    };

    const onPointerCancel = () => reset();

    el.addEventListener("touchstart", preventTouchDefaults, { passive: false });
    el.addEventListener("touchmove", preventTouchDefaults, { passive: false });

    el.addEventListener("pointerdown", onPointerDown, { passive: false });
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp, { passive: false });
    window.addEventListener("pointercancel", onPointerCancel, { passive: false });
    window.addEventListener("blur", reset);

    return () => {
      el.removeEventListener("touchstart", preventTouchDefaults);
      el.removeEventListener("touchmove", preventTouchDefaults);

      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("blur", reset);
    };
  }, [deadZone, knobRadius, onOutput, radius]);

  return (
    <div
      ref={baseRef}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: v.baseGlow,
        backdropFilter: "blur(10px)",
        position: "relative",
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTapHighlightColor: "transparent",
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
          background: v.knobBg,
          border: `1px solid ${v.knobBorder}`,
          boxShadow: v.knobGlow,
        }}
      />
    </div>
  );
}



// import React, { useEffect, useMemo, useRef, useState } from "react";

// export default function Joystick({ onMove, size = 140, deadZone = 0.12 }) {
//   const baseRef = useRef(null);
//   const [active, setActive] = useState(false);
//   const [stick, setStick] = useState({ x: 0, y: 0 });

//   const radius = useMemo(() => size / 2, [size]);
//   const knobRadius = useMemo(() => size * 0.22, [size]);

//   useEffect(() => {
//     const el = baseRef.current;
//     if (!el) return;

//     const getCenter = () => {
//       const r = el.getBoundingClientRect();
//       return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
//     };

//     const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

//     const setFromClient = (clientX, clientY) => {
//       const { cx, cy } = getCenter();
//       const dx = clientX - cx;
//       const dy = clientY - cy;

//       const dist = Math.sqrt(dx * dx + dy * dy);
//       const maxDist = radius - knobRadius;

//       let nx = dx;
//       let ny = dy;

//       if (dist > maxDist) {
//         const k = maxDist / dist;
//         nx *= k;
//         ny *= k;
//       }

//       // normalized [-1..1]
//       const vx = nx / maxDist;
//       const vy = ny / maxDist;

//       const mag = Math.sqrt(vx * vx + vy * vy);
//       const dz = deadZone;

//       let outX = vx;
//       let outY = vy;

//       // deadzone
//       if (mag < dz) {
//         outX = 0;
//         outY = 0;
//       }

//       setStick({ x: nx, y: ny });
//       onMove?.({ x: outX, y: outY }); // y: bas positif (on inversera côté movement)
//     };

//     const onPointerDown = (e) => {
//       setActive(true);
//       el.setPointerCapture?.(e.pointerId);
//       setFromClient(e.clientX, e.clientY);
//     };

//     const onPointerMove = (e) => {
//       if (!active) return;
//       setFromClient(e.clientX, e.clientY);
//     };

//     const onPointerUp = () => {
//       setActive(false);
//       setStick({ x: 0, y: 0 });
//       onMove?.({ x: 0, y: 0 });
//     };

//     el.addEventListener("pointerdown", onPointerDown);
//     window.addEventListener("pointermove", onPointerMove);
//     window.addEventListener("pointerup", onPointerUp);

//     return () => {
//       el.removeEventListener("pointerdown", onPointerDown);
//       window.removeEventListener("pointermove", onPointerMove);
//       window.removeEventListener("pointerup", onPointerUp);
//     };
//   }, [active, deadZone, knobRadius, onMove, radius]);

//   return (
//     <div
//       ref={baseRef}
//       style={{
//         width: size,
//         height: size,
//         borderRadius: 999,
//         background: "rgba(255,255,255,0.06)",
//         border: "1px solid rgba(255,255,255,0.10)",
//         boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
//         backdropFilter: "blur(10px)",
//         position: "relative",
//         touchAction: "none",
//         userSelect: "none",
//       }}
//     >
//       <div
//         style={{
//           position: "absolute",
//           left: "50%",
//           top: "50%",
//           width: knobRadius * 2,
//           height: knobRadius * 2,
//           borderRadius: 999,
//           transform: `translate(calc(-50% + ${stick.x}px), calc(-50% + ${stick.y}px))`,
//           background: "rgba(255,122,0,0.25)",
//           border: "1px solid rgba(255,122,0,0.55)",
//           boxShadow: "0 0 28px rgba(255,122,0,0.35)",
//         }}
//       />
//     </div>
//   );
// }
