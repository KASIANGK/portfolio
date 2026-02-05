import React, { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const clamp = THREE.MathUtils.clamp;

export default function LegacyModel({ mousePosition, isActive }) {
  const groupRef = useRef();
  const { scene } = useGLTF("/emoji.glb");
  const model = useMemo(() => scene.clone(true), [scene]);

  const targetPos = useRef(new THREE.Vector3(0, 0, 0));
  const targetRot = useRef(new THREE.Euler(0, 0, 0));

  useEffect(() => {
    model.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = false;
        obj.receiveShadow = false;
      }
    });
  }, [model]);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;

    const t = state.clock.getElapsedTime();
    const idleY = Math.sin(t * 0.6) * 0.08;
    const idleX = Math.cos(t * 0.45) * 0.05;

    if (isActive) {
      const mx = clamp(mousePosition?.x ?? 0, -1, 1);
      const my = clamp(mousePosition?.y ?? 0, -1, 1);

      targetPos.current.set(mx * 1.35, my * 0.95, 0);
      targetRot.current.set(-my * 0.35, mx * 0.55, 0);

      g.position.x = THREE.MathUtils.damp(g.position.x, targetPos.current.x, 12, delta);
      g.position.y = THREE.MathUtils.damp(g.position.y, targetPos.current.y, 12, delta);

      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetRot.current.x + idleX, 14, delta);
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetRot.current.y + idleY, 14, delta);
      return;
    }

    g.position.x = THREE.MathUtils.damp(g.position.x, 0, 6.5, delta);
    g.position.y = THREE.MathUtils.damp(g.position.y, 0, 6.5, delta);

    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, idleX, 7.5, delta);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, idleY, 7.5, delta);
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={model} scale={0.28} />
    </group>
  );
}

useGLTF.preload("/emoji.glb");
