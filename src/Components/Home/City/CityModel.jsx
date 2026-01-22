// src/Components/HomeCity/CityModel.jsx
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { RigidBody, MeshCollider } from "@react-three/rapier";

export default function CityModel({
  url,
  withColliders = false,
  collisionOnly = false, // true => invisible à la caméra via layers (mais visible=true pour le collider)
  onLoaded,
}) {
  const gltf = useGLTF(url);

  const scene = useMemo(() => {
    if (!gltf?.scene) return null;
    return gltf.scene.clone(true);
  }, [gltf]);

  useEffect(() => {
    if (!scene) return;

    scene.traverse((o) => {
      if (!o.isMesh) return;

      o.frustumCulled = true;
      o.castShadow = false;
      o.receiveShadow = false;

      // Mat safe (pour la ville visuelle). Pour collisionOnly, on ne dépendra pas du matériau.
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        if (!m) return;
        m.side = THREE.FrontSide;
        m.toneMapped = true;
        m.needsUpdate = true;
      });

      // ✅ Astuce: on garde visible=true (sinon MeshCollider peut ignorer)
      // mais on met les meshes collision sur une autre layer => caméra ne les rend pas.
      if (collisionOnly) {
        o.visible = true;
        o.layers.set(1); // layer 1 = collision
      } else {
        o.layers.set(0); // layer 0 = normal
      }
    });

    onLoaded?.();
  }, [scene, onLoaded, collisionOnly]);

  if (!scene) return null;

  // ✅ visuel uniquement
  if (!withColliders) return <primitive object={scene} />;

  // ✅ colliders trimesh (doit être dans <Physics />)
  scene.updateWorldMatrix(true, true);

  return (
    <RigidBody type="fixed" colliders={false}>
      <MeshCollider type="trimesh">
        <primitive object={scene} />
      </MeshCollider>
    </RigidBody>
  );
}

useGLTF.preload("/models/city_final_draco.glb");
useGLTF.preload("/models/City_collision_2.glb");

