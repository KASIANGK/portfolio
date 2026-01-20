// src/Pages/About/Model/Model.jsx
import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const clamp = THREE.MathUtils.clamp;

export default function Model({ mousePosition, isActive }) {
  const groupRef = useRef();
  const { scene } = useGLTF("/emoji.glb");

  const model = useMemo(() => scene.clone(true), [scene]);

  const targetPos = useRef(new THREE.Vector3(0, 0, 0));
  const targetRot = useRef(new THREE.Euler(0, 0, 0));

  useEffect(() => {
    model.traverse((obj) => {
      if (obj.isMesh) {
        // ✅ zéro shadow (tu veux zéro ombre projetée)
        obj.castShadow = false;
        obj.receiveShadow = false;
      }
    });
  }, [model]);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;

    const t = state.clock.getElapsedTime();

    // Idle motion légère (toujours)
    const idleY = Math.sin(t * 0.6) * 0.08;
    const idleX = Math.cos(t * 0.45) * 0.05;

    if (isActive) {
      const mx = clamp(mousePosition?.x ?? 0, -1, 1);
      const my = clamp(mousePosition?.y ?? 0, -1, 1);

      targetPos.current.set(mx * 1.35, my * 0.95, 0);
      targetRot.current.set(-my * 0.35, mx * 0.55, 0);

      // ✅ réactif mais smooth
      const POS_SMOOTH = 12;
      const ROT_SMOOTH = 14;

      g.position.x = THREE.MathUtils.damp(g.position.x, targetPos.current.x, POS_SMOOTH, delta);
      g.position.y = THREE.MathUtils.damp(g.position.y, targetPos.current.y, POS_SMOOTH, delta);

      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetRot.current.x + idleX, ROT_SMOOTH, delta);
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetRot.current.y + idleY, ROT_SMOOTH, delta);
      return;
    }

    // ✅ retour “cinéma” lent au centre
    targetPos.current.set(0, 0, 0);
    targetRot.current.set(0, 0, 0);

    // plus petit = plus lent (donc plus doux)
    const POS_RETURN = 6.5;
    const ROT_RETURN = 7.5;

    g.position.x = THREE.MathUtils.damp(g.position.x, 0, POS_RETURN, delta);
    g.position.y = THREE.MathUtils.damp(g.position.y, 0, POS_RETURN, delta);

    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, 0 + idleX, ROT_RETURN, delta);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, 0 + idleY, ROT_RETURN, delta);
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={model} scale={0.55} />
    </group>
  );
}

useGLTF.preload("/emoji.glb");











// // src/Pages/About/Model/Model.jsx
// import React, { useEffect, useMemo, useRef } from "react";
// import { useFrame } from "@react-three/fiber";
// import { useGLTF } from "@react-three/drei";
// import * as THREE from "three";

// const clamp = THREE.MathUtils.clamp;

// export default function Model({ mousePosition }) {
//   const groupRef = useRef();
//   const { scene } = useGLTF("/emoji.glb");

//   // Clone pour éviter les soucis si plusieurs mounts
//   const model = useMemo(() => scene.clone(true), [scene]);

//   // Targets “smooth”
//   const targetPos = useRef(new THREE.Vector3(0, 0, 0));
//   const targetRot = useRef(new THREE.Euler(0, 0, 0));

//   useEffect(() => {
//     // Optionnel: mieux gérer les matériaux (si besoin)
//     model.traverse((obj) => {
//       if (obj.isMesh) {
//         obj.castShadow = true;
//         obj.receiveShadow = true;
//       }
//     });
//   }, [model]);

//   useFrame((state, delta) => {
//     const g = groupRef.current;
//     if (!g) return;

//     // Mouse -> target (clamp pour éviter les “jumps”)
//     const mx = clamp(mousePosition?.x ?? 0, -1, 1);
//     const my = clamp(mousePosition?.y ?? 0, -1, 1);

//     // ✅ Position: rapide mais fluide
//     const posX = mx * 1.35;
//     const posY = my * 0.95;

//     targetPos.current.set(posX, posY, 0);

//     // ✅ Rotation: légère + premium
//     const rotY = mx * 0.55;
//     const rotX = -my * 0.35;

//     targetRot.current.set(rotX, rotY, 0);

//     // Idle rotation très légère
//     const t = state.clock.getElapsedTime();
//     const idleY = Math.sin(t * 0.6) * 0.08;
//     const idleX = Math.cos(t * 0.45) * 0.05;

//     // Damping (plus grand = plus réactif)
//     const POS_SMOOTH = 16; // ↑ si tu veux plus “snappy”
//     const ROT_SMOOTH = 18;

//     g.position.x = THREE.MathUtils.damp(g.position.x, targetPos.current.x, POS_SMOOTH, delta);
//     g.position.y = THREE.MathUtils.damp(g.position.y, targetPos.current.y, POS_SMOOTH, delta);

//     g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetRot.current.x + idleX, ROT_SMOOTH, delta);
//     g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetRot.current.y + idleY, ROT_SMOOTH, delta);
//   });

//   return (
//     <group ref={groupRef} position={[0, 0, 0]}>
//       <primitive object={model} scale={0.55} />
//     </group>
//   );
// }

// useGLTF.preload("/emoji.glb");







// import React, { useRef } from 'react';
// import { useFrame } from '@react-three/fiber';
// import { useGLTF } from '@react-three/drei';  

// const Model = ({ mousePosition }) => {
//     const meshRef = useRef()
//     const { scene } = useGLTF('/emoji.glb');

//     // animation mesh
//     useFrame(() => {
//         if (meshRef.current) {
//             meshRef.current.position.x = mousePosition.x * 5;  
//             meshRef.current.position.y = -mousePosition.y * 5;  
//             meshRef.current.rotation.x += 0.01;
//             meshRef.current.rotation.y += 0.01;
//         }
//     });

//     return (
//         <mesh ref={meshRef}>
//             <primitive object={scene} scale={0.5} />  
//         </mesh>
//     )
// }

// export default Model