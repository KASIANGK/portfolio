// src/Components/HomeCity/CityNightLights.jsx
import React, { useLayoutEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Palette "Night City Neon"
const COLORS = {
  NEON_RED: new THREE.Color("#ff003c"),
  NEON_PINK: new THREE.Color("#ff00aa"),
  NEON_BLUE: new THREE.Color("#00d5ff"),
  NEON_PURPLE: new THREE.Color("#7c3aed"),

  LAMP_WARM: new THREE.Color("#ffd7a1"),
  LAMP_RED: new THREE.Color("#ff3b3b"),

  FIRE: new THREE.Color("#ff7a00"),
};

// Helpers
const upper = (s) => (s || "").toUpperCase();

function classifyLight(name) {
  const n = upper(name);

  // Tes familles (d'après ta capture)
  // LIGHT_LAMP_...
  // LIGHT_LAMP_RED_...
  // LIGHT_NEON_RED_...
  // LIGHT_FIRE_...
  if (n.includes("LIGHT_NEON")) return "NEON";
  if (n.includes("LIGHT_LAMP_RED")) return "LAMP_RED";
  if (n.includes("LIGHT_LAMP")) return "LAMP";
  if (n.includes("LIGHT_FIRE")) return "FIRE";
  return null;
}

function pickColor(kind, name) {
  const n = upper(name);

  if (kind === "NEON") {
    if (n.includes("RED")) return COLORS.NEON_RED;
    // si plus tard tu fais NEON_BLUE / NEON_PINK etc.
    if (n.includes("BLUE")) return COLORS.NEON_BLUE;
    if (n.includes("PINK")) return COLORS.NEON_PINK;
    if (n.includes("PURPLE")) return COLORS.NEON_PURPLE;
    // fallback neon
    return COLORS.NEON_PINK;
  }

  if (kind === "LAMP_RED") return COLORS.LAMP_RED;
  if (kind === "LAMP") return COLORS.LAMP_WARM;
  if (kind === "FIRE") return COLORS.FIRE;

  return new THREE.Color("#ffffff");
}

export default function CityNightLights({
  url = "/models/city_light.glb",

  // Intensités (tune selon ton scale)
  lampIntensity = 18,
  lampRedIntensity = 22,
  neonIntensity = 45,
  fireIntensity = 28,

  // Portées
  lampDistance = 18,
  neonDistance = 26,
  fireDistance = 20,

  // Debug (si tu veux log)
  log = true,
}) {
  const { scene } = useGLTF(url);

  useLayoutEffect(() => {
    scene.updateMatrixWorld(true);
  }, [scene]);

  const lights = useMemo(() => {
    const arr = [];
    scene.traverse((o) => {
      if (o.isMesh) return;
      if (!o.name || o.name === "Scene") return;

      const kind = classifyLight(o.name);
      if (!kind) return;

      const pos = new THREE.Vector3();
      o.getWorldPosition(pos);

      arr.push({
        name: o.name,
        kind,
        pos,
        color: pickColor(kind, o.name),
      });
    });

    if (log) {
      const byKind = arr.reduce((acc, x) => {
        acc[x.kind] = (acc[x.kind] || 0) + 1;
        return acc;
      }, {});
      console.log("[city_light] lights:", arr.length, byKind, arr.map((x) => x.name));
    }

    return arr;
  }, [scene, log]);

  return (
    <group>
      {lights.map((l) => {
        let intensity = lampIntensity;
        let distance = lampDistance;
        let decay = 2;

        if (l.kind === "NEON") {
          intensity = neonIntensity;
          distance = neonDistance;
          decay = 2;
        } else if (l.kind === "LAMP_RED") {
          intensity = lampRedIntensity;
          distance = lampDistance;
          decay = 2;
        } else if (l.kind === "FIRE") {
          intensity = fireIntensity;
          distance = fireDistance;
          decay = 2;
        }

        return (
          <pointLight
            key={l.name}
            position={[l.pos.x, l.pos.y, l.pos.z]}
            color={l.color}
            intensity={intensity}
            distance={distance}
            decay={decay}
            castShadow={false}
          />
        );
      })}
    </group>
  );
}

useGLTF.preload("/models/city_light.glb");
