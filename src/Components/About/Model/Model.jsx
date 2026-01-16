import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';  

const Model = ({ mousePosition }) => {
    const meshRef = useRef()
    const { scene } = useGLTF('/emoji.glb');

    // animation mesh
    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.position.x = mousePosition.x * 5;  
            meshRef.current.position.y = -mousePosition.y * 5;  
            meshRef.current.rotation.x += 0.01;
            meshRef.current.rotation.y += 0.01;
        }
    });

    return (
        <mesh ref={meshRef}>
            <primitive object={scene} scale={0.5} />  
        </mesh>
    )
}

export default Model