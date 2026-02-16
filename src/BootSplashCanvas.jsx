// src/BootSplashCanvas.jsx
import React, { useEffect, useRef } from "react";

export default function BootSplashCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    const t0 = performance.now();
    const DPR = Math.min(2, window.devicePixelRatio || 1);

    // Chrome dino polygon points (from your SVG)
    const DINO_POINTS = [
      [256.351585, 91.6642857],[213.916427, 91.6642857],[213.916427, 80.0385714],
      [284.492795, 80.0385714],[284.492795, 14.3085714],[270.198847, 14.3085714],
      [270.198847, 0],[155.400576, 0],[155.400576, 14.3085714],[141.553314, 14.3085714],
      [141.553314, 105.972857],[127.259366, 105.972857],[127.259366, 119.834286],
      [106.26513, 119.834286],[106.26513, 134.142857],[85.2708934, 134.142857],
      [85.2708934, 148.451429],[70.9769452, 148.451429],[70.9769452, 162.312857],
      [45.0691643, 162.312857],[45.0691643, 148.004286],[31.221902, 148.004286],
      [31.221902, 134.142857],[16.9279539, 134.142857],[16.9279539, 105.972857],
      [0.847262248, 105.972857],[0.847262248, 192.718571],[14.6945245, 192.718571],
      [14.6945245, 207.027143],[28.9884726, 207.027143],[28.9884726, 220.888571],
      [42.8357349, 220.888571],[42.8357349, 235.197143],[57.129683, 235.197143],
      [57.129683, 249.058571],[70.9769452, 249.058571],[70.9769452, 305.398571],
      [101.351585, 305.398571],[101.351585, 289.301429],[87.5043228, 289.301429],
      [87.5043228, 277.228571],[101.351585, 277.228571],[101.351585, 263.367143],
      [115.645533, 263.367143],[115.645533, 249.058571],[127.259366, 249.058571],
      [127.259366, 263.367143],[141.553314, 263.367143],[141.553314, 305.398571],
      [171.927954, 305.398571],[171.927954, 289.301429],[157.634006, 289.301429],
      [157.634006, 235.197143],[171.927954, 235.197143],[171.927954, 220.888571],
      [185.775216, 220.888571],[185.775216, 199.872857],[200.069164, 199.872857],
      [200.069164, 150.687143],[211.682997, 150.687143],[211.682997, 164.548571],
      [228.210375, 164.548571],[228.210375, 134.142857],[200.069164, 134.142857],
      [200.069164, 108.208571],[256.351585, 108.208571],
    ];

    // Eye rect from SVG
    const EYE = { x: 169.247839, y: 20.5685714, w: 16.9740634, h: 16.9914286 };
    const VB = { w: 284.492795, h: 305.398571 };

    // Palette (aligned w/ your Step1 vibe)
    const pal = {
      // Dino (more mauve/pink cyber, slightly brighter)
      dA: "rgba(255, 95, 210, 0.95)",   // pink
      dB: "rgba(185, 120, 255, 0.92)",  // mauve
      dC: "rgba(80, 210, 255, 0.70)",   // small cyan lift
      edge: "rgba(0,0,0,0.22)",

      // Eye / laser
      eye: "rgba(255,60,60,0.98)",
      laser: "rgba(255,60,60,0.92)",
      laserGlow: "rgba(255,60,60,0.35)",

      // Buildings (slightly more visible, cyber blue)
      bLine: "rgba(0,255,255,0.26)",
      bFill: "rgba(0,255,255,0.06)",
      bWin: "rgba(245,245,255,0.10)",

      // Overlays
      scan: "rgba(255,255,255,0.03)",
      grain: "rgba(255,255,255,0.035)",
    };

    function resize() {
      const w = Math.floor(window.innerWidth);
      const h = Math.floor(window.innerHeight);
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.imageSmoothingEnabled = true;
    }

    resize();
    window.addEventListener("resize", resize);

    const floorY = () => Math.floor(window.innerHeight * 0.62);

    function drawBG() {
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Base: deep violet → navy (no green)
      const g0 = ctx.createLinearGradient(0, 0, 0, h);
      g0.addColorStop(0, "rgba(6, 5, 16, 1)");
      g0.addColorStop(0.55, "rgba(7, 6, 22, 1)");
      g0.addColorStop(1, "rgba(5, 7, 18, 1)");
      ctx.fillStyle = g0;
      ctx.fillRect(0, 0, w, h);

      // Large soft washes like your Choose screen
      const wash = (x, y, r, stops) => {
        const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
        stops.forEach(([p, c]) => rg.addColorStop(p, c));
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, w, h);
      };

      // Top-left magenta haze
      wash(w * 0.18, h * 0.22, Math.max(w, h) * 0.85, [
        [0, "rgba(255,0,170,0.12)"],
        [0.45, "rgba(124,58,237,0.10)"],
        [1, "rgba(0,0,0,0)"],
      ]);

      // Top-right cool violet/blue haze
      wash(w * 0.78, h * 0.18, Math.max(w, h) * 0.78, [
        [0, "rgba(120,70,255,0.11)"],
        [0.5, "rgba(0,120,255,0.07)"],
        [1, "rgba(0,0,0,0)"],
      ]);

      // Bottom wave glow (very subtle)
      wash(w * 0.52, h * 0.92, Math.max(w, h) * 0.95, [
        [0, "rgba(0,140,255,0.05)"],
        [0.5, "rgba(124,58,237,0.07)"],
        [1, "rgba(0,0,0,0)"],
      ]);

      // Horizon line
      const y = floorY();
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(w * 0.18, y + 18, w * 0.64, 1);

      // Vignette
      const r = Math.max(w, h);
      const vg = ctx.createRadialGradient(
        w * 0.5, h * 0.48, r * 0.12,
        w * 0.5, h * 0.5,  r * 0.75
      );
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.62)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      // ✅ Dark veil (matches Step1 mood)
      // tweak: 0.45 (lighter) → 0.58 (darker). 0.50 is a sweet spot.
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.50)";
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    function drawText(time) {
      const w = window.innerWidth;
      const base = floorY();

      ctx.save();
      ctx.textAlign = "center";

      const float = Math.sin(time * 0.0014) * 1.5;

      // ✅ position relative to road/dino => centered/consistent
      const y0 = Math.floor(base + 94 + float);

      // Hello (bigger)
      ctx.font = "800 18px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      ctx.fillStyle = "rgba(160,240,255,0.75)";
      ctx.fillText("Hello.", w / 2, y0);

      // No panic (bigger + clearer)
      ctx.font = "700 16px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      ctx.fillStyle = "rgba(245,245,255,0.86)";
      ctx.fillText("No panic. We’re just loading magic.", w / 2, y0 + 24);

      ctx.restore();
    }

    function drawGrain(time) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.save();
      ctx.globalAlpha = 0.10;
      ctx.fillStyle = pal.grain;

      const count = Math.floor((w * h) / 65000);
      for (let i = 0; i < count; i++) {
        const x = (Math.sin(i * 999 + time * 0.0008) * 0.5 + 0.5) * w;
        const y = (Math.cos(i * 777 + time * 0.0011) * 0.5 + 0.5) * h;
        ctx.fillRect(x, y, 1, 1);
      }
      ctx.restore();
    }

    function drawScanlines() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.save();
      ctx.globalAlpha = 0.10;
      ctx.fillStyle = pal.scan;
      for (let y = 0; y < h; y += 8) ctx.fillRect(0, y, w, 1);
      ctx.restore();
    }


    function drawBuildings3(time) {
      const w = window.innerWidth;
      const base = floorY();

      const bandL = w * 0.30;
      const bandR = w * 0.70;

      const speed = 0.06;
      const spacing = Math.max(220, Math.floor(w * 0.22));
      const startX = bandR + 180;

      const SCALE = 0.42;

      for (let i = 0; i < 3; i++) {
        const x = startX - ((time * speed + i * spacing) % (spacing * 3));

        const bw = Math.floor((70 + i * 22) * SCALE);
        const bh = Math.floor((110 + i * 36) * SCALE);

        const xx = x; // no clamp
        const y = base + 18 - bh;

        // skip if not visible in band
        if (xx + bw < bandL || xx > bandR) continue;

        ctx.fillStyle = pal.bFill;
        ctx.fillRect(xx, y, bw, bh);

        ctx.strokeStyle = pal.bLine;
        ctx.lineWidth = 1;
        ctx.strokeRect(xx + 0.5, y + 0.5, bw - 1, bh - 1);

        ctx.fillStyle = pal.bWin;
        for (let yy = y + 10; yy < y + bh - 8; yy += 11) {
          for (let xx2 = xx + 10; xx2 < xx + bw - 10; xx2 += 11) {
            if (((i * 31 + yy + xx2) % 29) < 17) continue;
            ctx.fillRect(xx2, yy, 2, 2);
          }
        }
      }
    }

    // ✅ Keep EXACT (your lasers + road aim are perfect)
    function drawDinoAndLaser(time) {
      const w = window.innerWidth;
      const base = floorY();

      // keep it small like your screenshot (centered)
      const sizePx = Math.floor(Math.min(160, Math.max(120, w * 0.12)));
      const bob = Math.sin(time * 0.0025) * 1.4;

      // subtle "walk" illusion (no loop seam): tiny stride shift
      const stride = Math.sin(time * 0.012) * 1.8;

      const x = Math.floor(w * 0.5 - sizePx * 0.5 + stride);
      const y = Math.floor(base - sizePx * 0.55 + bob);

      // Dino gradient (updated to mauve/pink cyber)
      const grad = ctx.createLinearGradient(x, y, x + sizePx, y + sizePx);
      grad.addColorStop(0, pal.dA);
      grad.addColorStop(0.62, pal.dB);
      grad.addColorStop(1, pal.dC);

      // Draw polygon in local coords
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(sizePx / VB.w, sizePx / VB.h);

      ctx.beginPath();
      ctx.moveTo(DINO_POINTS[0][0], DINO_POINTS[0][1]);
      for (let i = 1; i < DINO_POINTS.length; i++) ctx.lineTo(DINO_POINTS[i][0], DINO_POINTS[i][1]);
      ctx.closePath();

      ctx.fillStyle = grad;
      ctx.fill();

      ctx.lineWidth = 5;
      ctx.strokeStyle = pal.edge;
      ctx.stroke();

      // Eye (red, same vibe as laser)
      ctx.fillStyle = pal.eye;
      ctx.fillRect(EYE.x, EYE.y, EYE.w, EYE.h);

      ctx.restore();

      // Laser origin in screen coords
      const eyeScreen = {
        x: x + (EYE.x + EYE.w * 0.85) * (sizePx / VB.w),
        y: y + (EYE.y + EYE.h * 0.55) * (sizePx / VB.h),
      };

      // Laser target: aim DOWN to the road
      const roadY = base + 18;
      const laserLen = Math.min(380, w * 0.38);
      const flick = Math.sin(time * 0.01) * 1.2;

      const target = {
        x: Math.min(w * 0.76, eyeScreen.x + laserLen),
        y: roadY + 2 + flick,
      };

      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      // main beam
      ctx.strokeStyle = pal.laser;
      ctx.lineWidth = 2;
      ctx.shadowColor = pal.laserGlow;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(eyeScreen.x, eyeScreen.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();

      // faint sub-beam
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(eyeScreen.x, eyeScreen.y + 2);
      ctx.lineTo(target.x - 22, target.y - 2);
      ctx.stroke();

      // tiny impact glow on road
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "rgba(255,60,60,0.18)";
      ctx.beginPath();
      ctx.ellipse(target.x, target.y, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    function loop(now) {
      const time = now - t0;
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      drawBG();
      drawBuildings3(time);
      drawDinoAndLaser(time);
      drawText(time);

      // subtle overlays
      drawGrain(time);
      drawScanlines();

      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        width: "100%",
        height: "100%",
        background: "transparent",
        display: "block",
        pointerEvents: "none",
      }}
    />
  );
}
