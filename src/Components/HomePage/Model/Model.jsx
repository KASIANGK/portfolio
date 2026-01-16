import React, { useRef, useEffect, useState } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import { useNavigate } from 'react-router-dom'; 
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Raycaster, Vector2 } from 'three'; // objets three.js
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'; // demarcation selectedPart mesh
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { motion } from 'framer-motion';

import './Model.css'

const Model = ({ mousePosition }) => {
  const meshRef = useRef();
  const gltf = useLoader(GLTFLoader, '/buildings.glb');  
  // console.log("let's go voir notre mesh: " + gltf);
  const navigate = useNavigate()
  const { scene, camera, gl } = useThree()
  const raycaster = new Raycaster() // pour afficher intersections entre un rayon (ici, du click de la mouse) 
  const mouse = new Vector2() // pour afficher position 2D (ici, de la mouse)
  const composer = useRef()
  const [selectedPart, setSelectedPart] = useState(null)
  const [hoveredText, setHoveredText] = useState('')

  // rendu scene
  useEffect(() => {
    const renderPass = new RenderPass(scene, camera); // creation scene apd camera's pov
    const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera); // demarcation/contours de la selectedPart
    // parametres des contours
    outlinePass.edgeStrength = 3;
    outlinePass.edgeGlow = 1;
    outlinePass.edgeThickness = 1;
    outlinePass.visibleEdgeColor.set('#ffffff');
    outlinePass.hiddenEdgeColor.set('#000000');
    
    composer.current = new EffectComposer(gl); // une classe de three.js qui permet de composer plusieurs effets visuels a la scene 3D (flous, contours, etc)
    composer.current.addPass(renderPass); // rendu classique de la scene
    composer.current.addPass(outlinePass); // rendu des contours sur slectedPart

    // fonction pour adapter taille des elements en fonction de la taille de fenetre
    const handleResize = () => {
      composer.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    // nettoyage (supprimer l'event resize qd composant est demonte pour eviter les fuites de memoire):
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [scene, camera, gl]);

  
  // boucle d'animation
  useEffect(() => {
    const animate = () => {
      composer.current.render(); // pour rendu de la scene avec tous les elements
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  // pour la rotation en fonction de la position de la mouse
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y = mousePosition.x * Math.PI; // rotation sur axe Y
      meshRef.current.rotation.x = mousePosition.y * Math.PI / 2; // rotation sur axe X
    }
  }, [mousePosition]);

  const handleMouseMove = (event) => {
    // calcul des cordonnees du click de la mouse :
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera); // maj Raycaster avec position de la mouse (transformee en cordonnees de l'ecran) et de la canera

    const intersects = raycaster.intersectObject(meshRef.current, true); // pour calculer interactions entre rayon et mesh / presence interactions = user qui a click sur mesh 

    if (intersects.length > 0) {
      const selectedPart = intersects[0].object
      setSelectedPart(selectedPart)
      
      // OutlinePass pour delimiter zone de click (contours de selectedPart)
      const outlinePass = composer.current.passes.find(pass => pass instanceof OutlinePass);
      outlinePass.selectedObjects = [selectedPart];

      // afficher texte correspondant a selectedPart
      if (selectedPart.name === 'Cube_1') {
        setHoveredText('Go to About')
      } else if (selectedPart.name === 'Cube_3') {
        setHoveredText('Go to Expertise')
      } else {
        setHoveredText('Go to About')
      }
    } else {
      setSelectedPart(null)
      setHoveredText('')
    }
  };

  const handlePointerOff = () => {
    setHoveredText('')
  }
  

  // fonction navigation
  const handleMeshClick = () => {
    if (selectedPart) {
      if (selectedPart.name === 'Cube_1') {
        navigate('/about')
      } else if (selectedPart.name === 'Cube_3') {
        navigate('/expertise')
      } else {
        navigate('/')
      }
    }
  };


  // verif noms du mesh
  // useEffect(() => {
  //   if (gltf.scene) {
  //     // traverse = fonction qui parcourt tous les meshes de la scene
  //     gltf.scene.traverse((child) => {
  //       if (child.isMesh) {
  //         console.log("nom du mesh: " + child.name); 
  //       }
  //     })
  //   }
  // }, [gltf]);

  return (
    <group>

      <directionalLight 
        position={[5, 10, 5]} 
        intensity={1.5} 
        castShadow 
      />
      <primitive 
        object={gltf.scene} 
        ref={meshRef} 
        scale={[1, 1, 1]} 
        position={[0, -0.2, 0]}  
        onPointerMove={handleMouseMove}
        onClick={handleMeshClick}
        onPointerOut={handlePointerOff}
      />
      {selectedPart && hoveredText && (
        <Html position={[selectedPart.position.x + 1.7, selectedPart.position.y + 1.8, selectedPart.position.z]} className="mesh-label">
          <motion.div 
            className="hoveredText-selectedPart"
            initial={{ opacity: 0, y: -10 }} // Départ invisible et légèrement au-dessus
            animate={{ opacity: 1, y: 0 }} // Fin visible et position normale
            transition={{ duration: 0.5 }} // Durée de l'animation
          >
            {hoveredText}
          </motion.div>
        </Html>
      )}
    </group>
  );
};

export default Model;