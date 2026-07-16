import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere, Float } from "@react-three/drei";

function AnimatedSphere() {
  const sphereRef = useRef();

  useFrame(({ clock }) => {
    // Make it breathe
    const t = clock.getElapsedTime();
    sphereRef.current.distort = 0.4 + Math.sin(t) * 0.1;
  });

  return (
    <Float speed={1.5} rotationIntensity={1.5} floatIntensity={2}>
      <Sphere ref={sphereRef} args={[1, 100, 100]} scale={2.4}>
        <MeshDistortMaterial
          color="#7c3aed" // Brand Purple
          attach="material"
          distort={0.5} // Strength of the liquid effect
          speed={2} // Speed of the movement
          roughness={0.2}
          metalness={0.9} // Make it look metallic/premium
        />
      </Sphere>
    </Float>
  );
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <pointLight position={[-10, -10, -5]} color="#00ffff" intensity={2} />
        <AnimatedSphere />
      </Canvas>
    </div>
  );
}