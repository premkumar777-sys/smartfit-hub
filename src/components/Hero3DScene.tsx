import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, MeshDistortMaterial, Sphere } from "@react-three/drei";
import { useRef, Suspense } from "react";
import * as THREE from "three";

function AnimatedCube() {
  const meshRef = useRef<THREE.Mesh>(null);
  const mouseX = useRef(0);
  const mouseY = useRef(0);

  useFrame((state) => {
    if (meshRef.current) {
      // Smooth rotation
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.x += 0.002;
      
      // Mouse tilt effect
      const targetRotationY = mouseX.current * 0.2;
      const targetRotationX = mouseY.current * 0.2;
      meshRef.current.rotation.y += (targetRotationY - meshRef.current.rotation.y) * 0.05;
      meshRef.current.rotation.x += (targetRotationX - meshRef.current.rotation.x) * 0.05;
    }
  });

  const handlePointerMove = (event: any) => {
    mouseX.current = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY.current = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  return (
    <mesh ref={meshRef} onPointerMove={handlePointerMove}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial
        color="#00FF9C"
        emissive="#00FF9C"
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

function FloatingTorus() {
  const torusRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (torusRef.current) {
      torusRef.current.rotation.x += 0.01;
      torusRef.current.rotation.z += 0.005;
      torusRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });

  return (
    <mesh ref={torusRef} position={[0, -2, 0]}>
      <torusGeometry args={[1.5, 0.4, 16, 100]} />
      <meshStandardMaterial
        color="#4CC9F0"
        emissive="#4CC9F0"
        emissiveIntensity={0.6}
        metalness={0.9}
        roughness={0.1}
      />
    </mesh>
  );
}

function FloatingSphere() {
  return (
    <Sphere args={[0.5, 64, 64]} position={[-3, 1, -2]}>
      <MeshDistortMaterial
        color="#7B2CBF"
        emissive="#7B2CBF"
        emissiveIntensity={0.4}
        distort={0.3}
        speed={2}
        metalness={0.8}
        roughness={0.2}
      />
    </Sphere>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00FF9C" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4CC9F0" />
      <spotLight
        position={[0, 5, 0]}
        intensity={1.5}
        angle={0.6}
        penumbra={1}
        color="#7B2CBF"
      />
      
      <AnimatedCube />
      <FloatingTorus />
      <FloatingSphere />
      
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 2}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
}

export default function Hero3DScene() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
