import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Float, MeshReflectorMaterial } from "@react-three/drei";
import { useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three";

// Stylized Squat Rack
function SquatRack({ position = [0, 0, 0] as [number, number, number] }) {
  const material = new THREE.MeshStandardMaterial({
    color: "#1a1a1f",
    metalness: 0.9,
    roughness: 0.1
  });
  const glowMaterial = new THREE.MeshStandardMaterial({
    color: "#00FF9C",
    emissive: "#00FF9C",
    emissiveIntensity: 2
  });

  return (
    <group position={position}>
      {/* Vertical Posts */}
      <mesh position={[-0.8, 1.2, 0]}>
        <boxGeometry args={[0.1, 2.4, 0.1]} />
        <primitive object={material} attach="material" />
      </mesh>
      <mesh position={[0.8, 1.2, 0]}>
        <boxGeometry args={[0.1, 2.4, 0.1]} />
        <primitive object={material} attach="material" />
      </mesh>

      {/* Top Crossbar */}
      <mesh position={[0, 2.3, 0]}>
        <boxGeometry args={[1.7, 0.08, 0.08]} />
        <primitive object={material} attach="material" />
      </mesh>

      {/* J-Hooks (Glow) */}
      <mesh position={[-0.8, 1.5, 0.1]}>
        <boxGeometry args={[0.15, 0.05, 0.2]} />
        <primitive object={glowMaterial} attach="material" />
      </mesh>
      <mesh position={[0.8, 1.5, 0.1]}>
        <boxGeometry args={[0.15, 0.05, 0.2]} />
        <primitive object={glowMaterial} attach="material" />
      </mesh>

      {/* Barbell */}
      <mesh position={[0, 1.55, 0.15]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 2.2, 16]} />
        <meshStandardMaterial color="#444" metalness={1} roughness={0.1} />
      </mesh>

      {/* Weight Plates */}
      <mesh position={[-0.8, 1.55, 0.15]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
        <meshStandardMaterial color="#111" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0.8, 1.55, 0.15]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
        <meshStandardMaterial color="#111" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

// Stylized Weight Bench
function WeightBench({ position = [0, 0, 0] as [number, number, number] }) {
  return (
    <group position={position}>
      {/* Pad */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.4, 0.1, 1.4]} />
        <meshStandardMaterial color="#111" roughness={0.8} />
      </mesh>
      {/* Frame */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.3, 0.4, 1.2]} />
        <meshStandardMaterial color="#1a1a1f" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Neon Detail */}
      <mesh position={[0, 0.45, 0.71]}>
        <boxGeometry args={[0.42, 0.02, 0.02]} />
        <meshStandardMaterial color="#4CC9F0" emissive="#4CC9F0" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

// Dumbbell Rack
function DumbbellRack({ position = [0, 0, 0] as [number, number, number] }) {
  return (
    <group position={position} rotation={[0, -Math.PI / 4, 0]}>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.5, 0.8, 0.4]} />
        <meshStandardMaterial color="#1a1a1f" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Dumbbells */}
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[-0.6 + i * 0.3, 0.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.25, 16]} />
          <meshStandardMaterial color="#111" metalness={0.5} />
        </mesh>
      ))}
      {/* Glow */}
      <mesh position={[0, 0.81, 0]}>
        <boxGeometry args={[1.52, 0.02, 0.42]} />
        <meshStandardMaterial color="#00FF9C" emissive="#00FF9C" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

function GymEnvironment({ isMobile }: { isMobile: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Very slow rotation to show off the 3D space
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Centerpiece Squat Rack */}
      <SquatRack position={[0, -1.2, -1]} />

      {/* Bench in front */}
      <WeightBench position={[0, -1.2, 0.5]} />

      {/* Side Equipment */}
      {!isMobile && (
        <>
          <DumbbellRack position={[-2.5, -1.2, -0.5]} />
          <SquatRack position={[2.8, -1.2, -1.5]} />
        </>
      )}

      {/* Reflective Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
        <planeGeometry args={[20, 20]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={40}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#101010"
          metalness={0.5}
          mirror={1}
        />
      </mesh>

      {/* Ceiling / Lights */}
      <gridHelper args={[20, 20, 0x00FF9C, 0x222222]} position={[0, 3, 0]} rotation={[Math.PI, 0, 0]} />
    </group>
  );
}

function Scene({ isMobile }: { isMobile: boolean }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.5, 6]} fov={isMobile ? 50 : 40} />

      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00FF9C" />
      <pointLight position={[-10, 5, 5]} intensity={0.5} color="#4CC9F0" />

      {/* Volumetric-like glow lights */}
      <pointLight position={[0, 2, -2]} intensity={2} distance={10} color="#00FF9C" />
      <pointLight position={[-2, 1, 1]} intensity={1.5} distance={8} color="#4CC9F0" />

      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.1}>
        <GymEnvironment isMobile={isMobile} />
      </Float>

      {/* Fog for depth */}
      <fog attach="fog" args={["#000", 5, 15]} />
    </>
  );
}

export default function Hero3DScene() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full h-full bg-black">
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
        dpr={isMobile ? [1, 1] : [1, 2]}
      >
        <Scene isMobile={isMobile} />
      </Canvas>
    </div>
  );
}
