import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Environment, OrbitControls, Loader } from "@react-three/drei";
import CityScene from "./CityScene";

export default function CityCanvas() {
  return (
    <>
    <Canvas
    dpr={[1, 1.5]}
    gl={{
        antialias: false,
        powerPreference: "high-performance",
        alpha: false,
        stencil: false,
        depth: true,
        preserveDrawingBuffer: false,
    }}
    camera={{ position: [3, 2, 6], fov: 45 }}
    onCreated={({ gl }) => {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    }}
    >

    <color attach="background" args={["#05060a"]} />

    <ambientLight intensity={0.7} />
    <directionalLight position={[5, 10, 5]} intensity={1} />


    <Suspense fallback={null}>
        <CityScene />
    </Suspense>
    </Canvas>



      <Loader />
    </>
  );
}
