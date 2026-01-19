import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useNavigate } from "react-router-dom";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Raycaster, Vector2 } from "three";

import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import * as THREE from "three";

import { motion } from "framer-motion";
import "./Model.css";

const ROUTE_BY_MESH = {
  // Tu peux changer l’affectation ici quand tu veux
  Cube_1: { route: "/about", label: "Go to About" },
  Cube_2: { route: "/portfolio", label: "Go to Portfolio" },
  Cube_3: { route: "/expertise", label: "Go to Expertise" },
  Cube_4: { route: "/contact", label: "Go to Contact" },
  Cube_5: { route: "/members", label: "Go to Members" }, // tu renommeras + tard
};

export default function Model({ mousePosition }) {
  const gltf = useLoader(GLTFLoader, "/buildings.glb");

  const meshRootRef = useRef();
  const composerRef = useRef(null);
  const outlinePassRef = useRef(null);

  const navigate = useNavigate();
  const { scene, camera, gl } = useThree();

  const raycaster = useMemo(() => new Raycaster(), []);
  const mouse = useMemo(() => new Vector2(), []);

  const [hoverPart, setHoverPart] = useState(null);
  const [clickedPart, setClickedPart] = useState(null);

  const [hoveredText, setHoveredText] = useState("");
  const [labelWorldPos, setLabelWorldPos] = useState(null);

  const [lampPositions, setLampPositions] = useState([]);

  // --- DEBUG: log mesh names une seule fois
  useEffect(() => {
    if (!gltf?.scene) return;
    gltf.scene.traverse((child) => {
      if (child.isMesh) console.log("MESH:", child.name);
    });
  }, [gltf]);

  // --- Fix "fenêtres visibles depuis l'autre côté" + profondeur
  // On clone les materials (pour ne pas casser le GLTF global) et on force FrontSide + depth ok.
  useEffect(() => {
    if (!gltf?.scene) return;

    gltf.scene.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      // Clone pour éviter partage entre meshes
      child.material = child.material.clone();

      child.material.side = THREE.FrontSide;
      child.material.transparent = false;
      child.material.depthWrite = true;
      child.material.depthTest = true;
    });
  }, [gltf]);

  // --- Détection lampadaires (heuristique SAFE: proche du sol + taille min)
  // IMPORTANT: on ne modifie PAS les matériaux (sinon rendu moche).
  useEffect(() => {
    if (!gltf?.scene) return;

    const positions = [];

    gltf.scene.traverse((child) => {
      if (!child.isMesh) return;

      // world position
      const p = new THREE.Vector3();
      child.getWorldPosition(p);

      // filtre hauteur (lampadaires proches du sol)
      // Ajuste si besoin : tu peux remonter le max à 0.3 si tu perds des lampes
      if (p.y < -0.25 || p.y > 0.15) return;

      // filtre taille (évite de prendre des mini faces)
      const box = new THREE.Box3().setFromObject(child);
      const size = new THREE.Vector3();
      box.getSize(size);

      // un lampadaire devrait avoir une hauteur mini
      if (size.y < 0.12) return;

      positions.push(p);
    });

    // limite pour éviter surexposition
    setLampPositions(positions.slice(0, 10));
  }, [gltf]);

  // --- Postprocessing: outline orange (hover/click)
  useEffect(() => {
    if (!scene || !camera || !gl) return;

    gl.autoClear = false;

    const renderPass = new RenderPass(scene, camera);

    const outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      scene,
      camera
    );
    outlinePassRef.current = outlinePass;

    // Style outline
    outlinePass.visibleEdgeColor.set("#ff7a00");
    outlinePass.hiddenEdgeColor.set("#2b0f00");
    outlinePass.edgeStrength = 3.2;
    outlinePass.edgeGlow = 0.7;
    outlinePass.edgeThickness = 1.15;

    const composer = new EffectComposer(gl);
    composer.addPass(renderPass);
    composer.addPass(outlinePass);
    composer.setSize(window.innerWidth, window.innerHeight);

    composerRef.current = composer;

    const onResize = () => {
      composer.setSize(window.innerWidth, window.innerHeight);
      outlinePass.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [scene, camera, gl]);

  // --- Render loop via composer (sinon outline disparait)
  useEffect(() => {
    let raf = 0;

    const tick = () => {
      if (!composerRef.current) return;
      gl.clear();
      composerRef.current.render();
      raf = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(raf);
  }, [gl]);

  // --- rotation du groupe selon mouse
  useEffect(() => {
    if (!meshRootRef.current) return;
    meshRootRef.current.rotation.y = mousePosition.x * Math.PI;
    meshRootRef.current.rotation.x = (mousePosition.y * Math.PI) / 2;
  }, [mousePosition]);

  // --- update outline selection + intensité hover/click
  useEffect(() => {
    const outline = outlinePassRef.current;
    if (!outline) return;

    const activeObj = clickedPart || hoverPart;

    if (!activeObj) {
      outline.selectedObjects = [];
      return;
    }

    outline.selectedObjects = [activeObj];

    const isClicked = !!clickedPart && activeObj === clickedPart;

    outline.visibleEdgeColor.set(isClicked ? "#ff7a00" : "#ff9a3c");
    outline.edgeStrength = isClicked ? 4.1 : 2.2;
    outline.edgeGlow = isClicked ? 0.95 : 0.35;
    outline.edgeThickness = isClicked ? 1.2 : 1.0;
  }, [hoverPart, clickedPart]);

  const updateHover = useCallback(
    (event) => {
      // coords écran -> normalized
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObject(meshRootRef.current, true);

      if (intersects.length === 0) {
        setHoverPart(null);
        setHoveredText("");
        setLabelWorldPos(null);
        return;
      }

      const part = intersects[0].object;
      setHoverPart(part);

      const cfg = ROUTE_BY_MESH[part.name];
      setHoveredText(cfg?.label || "");

      // position du label proche de la pièce hover
      const wp = new THREE.Vector3();
      part.getWorldPosition(wp);
      setLabelWorldPos([wp.x + 0.25, wp.y + 0.25, wp.z]);
    },
    [camera, mouse, raycaster]
  );

  const handlePointerOut = () => {
    setHoverPart(null);
    setHoveredText("");
    setLabelWorldPos(null);
  };

  const handleClick = () => {
    if (!hoverPart) return;

    setClickedPart(hoverPart);

    const cfg = ROUTE_BY_MESH[hoverPart.name];
    if (cfg?.route) navigate(cfg.route);
  };

  return (
    <group>
      {/* Lumière “ciné” minimale, le reste vient de HomePage */}
      <ambientLight intensity={0.08} />
      <directionalLight position={[6, 10, 6]} intensity={0.65} />

      {/* Lampadaires (glow léger) */}
      {lampPositions.map((p, i) => (
        <pointLight
          key={i}
          position={[p.x, p.y + 0.12, p.z]}
          color="#ff7a00"
          intensity={0.35}
          distance={1.2}
          decay={2}
          castShadow={false}
        />
      ))}

      {/* Modèle */}
      <primitive
        object={gltf.scene}
        ref={meshRootRef}
        scale={[1, 1, 1]}
        position={[0, -0.2, 0]}
        onPointerMove={updateHover}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />

      {/* Label hover */}
      {labelWorldPos && hoveredText && (
        <Html position={labelWorldPos} className="mesh-label">
          <motion.div
            className="hoveredText-selectedPart"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            {hoveredText}
          </motion.div>
        </Html>
      )}
    </group>
  );
}
























// import React, { useRef, useEffect, useState, useMemo } from 'react';
// import { useLoader, useThree } from '@react-three/fiber';
// import { useNavigate } from 'react-router-dom'; 
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
// import { Raycaster, Vector2 } from 'three'; // objets three.js
// import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'; // demarcation selectedPart mesh
// import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
// import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
// import * as THREE from 'three';
// import { Html } from '@react-three/drei';
// import { motion } from 'framer-motion';


// import './Model.css'

// const Model = ({ mousePosition }) => {
//   const meshRef = useRef();
//   const gltf = useLoader(GLTFLoader, '/buildings.glb');  
//   useEffect(() => {
//     if (!gltf?.scene) return;
  
//     gltf.scene.traverse((child) => {
//       if (child.isMesh) console.log("MESH:", child.name);
//     });
//   }, [gltf]);
  
//   // console.log("let's go voir notre mesh: " + gltf);
//   const navigate = useNavigate()
//   const { scene, camera, gl } = useThree()
//   const raycaster = new Raycaster() // pour afficher intersections entre un rayon (ici, du click de la mouse) 
//   const mouse = new Vector2() // pour afficher position 2D (ici, de la mouse)
//   const composer = useRef()
//   const [selectedPart, setSelectedPart] = useState(null)
//   const [hoveredText, setHoveredText] = useState('')
//   const [lampPositions, setLampPositions] = useState([]);
//   const [clickedPart, setClickedPart] = useState(null);
//   const [hoverPart, setHoverPart] = useState(null);
//   const outlinePassRef = useRef(null);


//   // rendu scene
//   useEffect(() => {
//     const renderPass = new RenderPass(scene, camera); // creation scene apd camera's pov
//     const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera); // demarcation/contours de la selectedPart
//     // parametres des contours
//     outlinePass.visibleEdgeColor.set('#ff7a00'); // orange
//     outlinePass.hiddenEdgeColor.set('#2b0f00');  // ombre chaude
//     outlinePass.edgeStrength = 4;
//     outlinePass.edgeGlow = 0.8;
//     outlinePass.edgeThickness = 1.2;

    
//     composer.current = new EffectComposer(gl); // une classe de three.js qui permet de composer plusieurs effets visuels a la scene 3D (flous, contours, etc)
//     composer.current.addPass(renderPass); // rendu classique de la scene
//     composer.current.addPass(outlinePass); // rendu des contours sur slectedPart

//     // fonction pour adapter taille des elements en fonction de la taille de fenetre
//     const handleResize = () => {
//       composer.current.setSize(window.innerWidth, window.innerHeight);
//     };
//     window.addEventListener('resize', handleResize);
//     // nettoyage (supprimer l'event resize qd composant est demonte pour eviter les fuites de memoire):
//     return () => {
//       window.removeEventListener('resize', handleResize);
//     };
//   }, [scene, camera, gl]);

//   // rendu lampadaires
//   useEffect(() => {
//     if (!gltf?.scene) return;
  
//     const positions = [];
//     const lampNameRegex = /(lamp|street|light|pole)/i;
  
//     gltf.scene.traverse((child) => {
//       if (!child.isMesh) return;
  
//       // 1) dtecter les lampadaires
//       if (lampNameRegex.test(child.name)) {
//         const p = new THREE.Vector3();
//         child.getWorldPosition(p);
//         positions.push(p);
  
//         // 2) rendre la partie "lumineuse" plus glow 
//         if (child.material) {
//           child.material = child.material.clone();
//           child.material.emissive = new THREE.Color("#ff8a00");
//           child.material.emissiveIntensity = 2.2;
//           child.material.toneMapped = false; // glow plus "néon"
//         }
//       }
  
//       // Option bonus : si tes "fenêtres" ont un nom/type aussi, on peut les rendre légèrement emissive
//       // if (/window/i.test(child.name)) { ... }
//     });
  
//     setLampPositions(positions);
//   }, [gltf]);
  
  
//   // boucle d'animation
//   useEffect(() => {
//     const animate = () => {
//       composer.current.render(); // pour rendu de la scene avec tous les elements
//       requestAnimationFrame(animate);
//     };
//     animate();
//   }, []);

//   // pour la rotation en fonction de la position de la mouse
//   useEffect(() => {
//     if (meshRef.current) {
//       meshRef.current.rotation.y = mousePosition.x * Math.PI; // rotation sur axe Y
//       meshRef.current.rotation.x = mousePosition.y * Math.PI / 2; // rotation sur axe X
//     }
//   }, [mousePosition]);

//   const handleMouseMove = (event) => {
//     // calcul des cordonnees du click de la mouse :
//     mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//     mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
//     raycaster.setFromCamera(mouse, camera); // maj Raycaster avec position de la mouse (transformee en cordonnees de l'ecran) et de la canera

//     const intersects = raycaster.intersectObject(meshRef.current, true); // pour calculer interactions entre rayon et mesh / presence interactions = user qui a click sur mesh 
//     if (intersects.length > 0) {
//       const part = intersects[0].object;
//       setHoverPart(part);
//       setHoveredText(part.name === 'Cube_1' ? 'Go to About' : part.name === 'Cube_3' ? 'Go to Expertise' : '');
//     } else {
//       setHoverPart(null);
//       setHoveredText('');
//     }
    
//     // if (intersects.length > 0) {
//     //   const selectedPart = intersects[0].object
//     //   setSelectedPart(selectedPart)
      
//     //   // OutlinePass pour delimiter zone de click (contours de selectedPart)
//     //   const outlinePass = composer.current.passes.find(pass => pass instanceof OutlinePass);
//     //   outlinePass.selectedObjects = [selectedPart];

//     //   // afficher texte correspondant a selectedPart
//     //   if (selectedPart.name === 'Cube_1') {
//     //     setHoveredText('Go to About')
//     //   } else if (selectedPart.name === 'Cube_3') {
//     //     setHoveredText('Go to Expertise')
//     //   } else {
//     //     setHoveredText('Go to About')
//     //   }
//     // } else {
//     //   setSelectedPart(null)
//     //   setHoveredText('')
//     // }
//   };

//   const handlePointerOff = () => {
//     setHoveredText('')
//   }

//   // fonction navigation
//   const handleMeshClick = () => {
//     if (!hoverPart) return;
//     setClickedPart(hoverPart);
  
//     if (hoverPart.name === "Cube_1") navigate("/about");
//     else if (hoverPart.name === "Cube_3") navigate("/expertise");
//   };  
//   // const handleMeshClick = () => {
//   //   if (selectedPart) {
//   //     if (selectedPart.name === 'Cube_1') {
//   //       navigate('/about')
//   //     } else if (selectedPart.name === 'Cube_3') {
//   //       navigate('/expertise')
//   //     } else {
//   //       navigate('/')
//   //     }
//   //   }
//   // };


//   // verif noms du mesh
//   // useEffect(() => {
//   //   if (gltf.scene) {
//   //     // traverse = fonction qui parcourt tous les meshes de la scene
//   //     gltf.scene.traverse((child) => {
//   //       if (child.isMesh) {
//   //         console.log("nom du mesh: " + child.name); 
//   //       }
//   //     })
//   //   }
//   // }, [gltf]);
//   useEffect(() => {
//     const outline = outlinePassRef.current;
//     if (!outline) return;
  
//     const activeObj = clickedPart || hoverPart;
  
//     if (!activeObj) {
//       outline.selectedObjects = [];
//       return;
//     }
  
//     outline.selectedObjects = [activeObj];
  
//     // hover = doux, click = plus fort
//     const isClicked = !!clickedPart && activeObj === clickedPart;
  
//     outline.visibleEdgeColor.set(isClicked ? "#ff7a00" : "#ff9a3c");
//     outline.edgeStrength = isClicked ? 4.5 : 2.2;
//     outline.edgeGlow = isClicked ? 1.0 : 0.35;
//     outline.edgeThickness = isClicked ? 1.25 : 1.0;
//   }, [hoverPart, clickedPart]);
  

//   return (
//     <group>

//       <directionalLight 
//         position={[5, 10, 5]} 
//         intensity={1.5} 
//         castShadow 
//       />
//       <pointLight position={[1.8, 0.2, 1.2]} intensity={2.8} color="#ff7a00" distance={3.5} />
//       <pointLight position={[-1.4, 0.2, -0.8]} intensity={2.8} color="#ff7a00" distance={3.5} />
//       <pointLight position={[0.2, 0.2, -1.6]} intensity={2.8} color="#ff7a00" distance={3.5} />

//       <primitive 
//         object={gltf.scene} 
//         ref={meshRef} 
//         scale={[1, 1, 1]} 
//         position={[0, -0.2, 0]}  
//         onPointerMove={handleMouseMove}
//         onClick={handleMeshClick}
//         onPointerOut={handlePointerOff}
//       />

//       {lampPositions.map((p, i) => (
//         <pointLight
//           key={i}
//           position={[p.x, p.y + 0.2, p.z]}
//           color="#ff8a00"
//           intensity={2.2}
//           distance={3.2}
//           decay={2}
//           castShadow={false}
//         />
//       ))}

//       {selectedPart && hoveredText && (
//         <Html position={[selectedPart.position.x + 1.7, selectedPart.position.y + 1.8, selectedPart.position.z]} className="mesh-label">
//           <motion.div 
//             className="hoveredText-selectedPart"
//             initial={{ opacity: 0, y: -10 }} // Départ invisible et légèrement au-dessus
//             animate={{ opacity: 1, y: 0 }} // Fin visible et position normale
//             transition={{ duration: 0.5 }} // Durée de l'animation
//           >
//             {hoveredText}
//           </motion.div>
//         </Html>
//       )}
//     </group>
//   );
// };

// export default Model;