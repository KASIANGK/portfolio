import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";

function City() {
  const { scene } = useGLTF("/models/angels_city_home_web.glb");

  useEffect(() => {
    let texCount = 0;
    scene.traverse((o) => {
      if (o.isMesh) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => {
          if (!m) return;
          Object.values(m).forEach((v) => {
            if (v && v.isTexture) texCount++;
          });
        });
      }
    });
    console.log("Approx texture refs:", texCount);
  }, [scene]);

  return <primitive object={scene} />;
}
