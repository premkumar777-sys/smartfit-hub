import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";

function Dumbbell() {
  const groupRef = useRef<THREE.Group>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isMobile) {
        setMousePosition({
          x: (event.clientX / window.innerWidth) * 2 - 1,
          y: -(event.clientY / window.innerHeight) * 2 + 1,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMobile]);

  useFrame((state) => {
    if (groupRef.current) {
      // Smooth rotation
      groupRef.current.rotation.y += 0.003;
      
      // Floating animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.2;
      
      // Mouse-follow tilt (only on desktop)
      if (!isMobile) {
        const targetRotationX = mousePosition.y * 0.15;
        const targetRotationZ = mousePosition.x * 0.15;
        groupRef.current.rotation.x += (targetRotationX - groupRef.current.rotation.x) * 0.05;
        groupRef.current.rotation.z += (targetRotationZ - groupRef.current.rotation.z) * 0.05;
      }
    }
  });

  // Dumbbell geometry
  const barRadius = 0.15;
  const barLength = 2.5;
  const plateRadius = 0.6;
  const plateThickness = 0.2;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Center Bar */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[barRadius, barRadius, barLength, 32]} />
        <meshStandardMaterial
          color="#1a1a1f"
          metalness={0.9}
          roughness={0.2}
          emissive="#00FF9C"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Left Handle Grip */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
        <cylinderGeometry args={[barRadius * 1.3, barRadius * 1.3, 0.8, 32]} />
        <meshStandardMaterial
          color="#0a0a0f"
          metalness={0.7}
          roughness={0.4}
        />
      </mesh>

      {/* Left Weight Plates */}
      {[-1.4, -1.6].map((pos, i) => (
        <group key={`left-${i}`} position={[pos, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[plateRadius - i * 0.1, plateRadius - i * 0.1, plateThickness, 32]} />
            <meshStandardMaterial
              color="#1a1a1f"
              metalness={0.95}
              roughness={0.1}
              emissive="#00FF9C"
              emissiveIntensity={0.3}
            />
          </mesh>
          {/* Plate ring detail */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[plateRadius - i * 0.1 - 0.05, 0.02, 16, 32]} />
            <meshStandardMaterial
              color="#00FF9C"
              metalness={1}
              roughness={0}
              emissive="#00FF9C"
              emissiveIntensity={0.8}
            />
          </mesh>
        </group>
      ))}

      {/* Right Weight Plates */}
      {[1.4, 1.6].map((pos, i) => (
        <group key={`right-${i}`} position={[pos, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[plateRadius - i * 0.1, plateRadius - i * 0.1, plateThickness, 32]} />
            <meshStandardMaterial
              color="#1a1a1f"
              metalness={0.95}
              roughness={0.1}
              emissive="#4CC9F0"
              emissiveIntensity={0.3}
            />
          </mesh>
          {/* Plate ring detail */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[plateRadius - i * 0.1 - 0.05, 0.02, 16, 32]} />
            <meshStandardMaterial
              color="#4CC9F0"
              metalness={1}
              roughness={0}
              emissive="#4CC9F0"
              emissiveIntensity={0.8}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Scene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      
      <pointLight 
        position={[5, 5, 5]} 
        intensity={2} 
        color="#00FF9C"
        distance={15}
      />
      
      <pointLight 
        position={[-5, -5, 5]} 
        intensity={1.5} 
        color="#4CC9F0"
        distance={15}
      />
      
      <spotLight
        position={[0, 10, 0]}
        intensity={1}
        angle={0.6}
        penumbra={1}
        color="#7B2CBF"
        distance={20}
      />

      <Dumbbell />
      
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 2}
        autoRotate={false}
        enableRotate={false}
      />
    </>
  );
}

export default function Hero3DScene() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance"
        }}
        dpr={[1, 2]}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
