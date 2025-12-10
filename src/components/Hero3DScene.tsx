import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useState, useEffect, useMemo } from "react";
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
      // Slower, gentler rotation
      groupRef.current.rotation.y += 0.001;
      
      // Subtle floating animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
      
      // Very gentle mouse-follow tilt (only on desktop)
      if (!isMobile) {
        const targetRotationX = mousePosition.y * 0.08;
        const targetRotationZ = mousePosition.x * 0.08;
        groupRef.current.rotation.x += (targetRotationX - groupRef.current.rotation.x) * 0.03;
        groupRef.current.rotation.z += (targetRotationZ - groupRef.current.rotation.z) * 0.03;
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

// Particle system with gym-themed floating particles
function ParticleSystem({ mousePosition, isMobile }: { mousePosition: { x: number; y: number }, isMobile: boolean }) {
  const particlesRef = useRef<THREE.Points>(null);
  const count = isMobile ? 20 : 50;

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Spread particles in a wider area around the dumbbell
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;

      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      sizes[i] = Math.random() * 0.15 + 0.05;
    }

    return { positions, velocities, sizes };
  }, []);

  useFrame((state) => {
    if (!particlesRef.current) return;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      // Slower, gentler floating animation
      positions[i * 3] += particles.velocities[i * 3] * 0.5;
      positions[i * 3 + 1] += particles.velocities[i * 3 + 1] * 0.5 + Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.0005;
      positions[i * 3 + 2] += particles.velocities[i * 3 + 2] * 0.5;

      // Very subtle mouse influence
      const dx = mousePosition.x * 2 - positions[i * 3];
      const dy = mousePosition.y * 2 - positions[i * 3 + 1];
      positions[i * 3] += dx * 0.0005;
      positions[i * 3 + 1] += dy * 0.0005;

      // Boundary check - wrap around
      if (Math.abs(positions[i * 3]) > 6) positions[i * 3] *= -0.9;
      if (Math.abs(positions[i * 3 + 1]) > 5) positions[i * 3 + 1] *= -0.9;
      if (Math.abs(positions[i * 3 + 2]) > 4) positions[i * 3 + 2] *= -0.9;
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={particles.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        color="#00FF9C"
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function Scene({ isMobile }: { isMobile: boolean }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isMobile) {
      const handleMouseMove = (event: MouseEvent) => {
        setMousePosition({
          x: (event.clientX / window.innerWidth) * 2 - 1,
          y: -(event.clientY / window.innerHeight) * 2 + 1,
        });
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isMobile]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />

      <pointLight
        position={[5, 5, 5]}
        intensity={isMobile ? 1.5 : 2}
        color="#00FF9C"
        distance={15}
      />

      <pointLight
        position={[-5, -5, 5]}
        intensity={isMobile ? 1 : 1.5}
        color="#4CC9F0"
        distance={15}
      />

      {!isMobile && (
        <spotLight
          position={[0, 10, 0]}
          intensity={1}
          angle={0.6}
          penumbra={1}
          color="#7B2CBF"
          distance={20}
        />
      )}

      <Dumbbell />
      <ParticleSystem mousePosition={mousePosition} isMobile={isMobile} />
      
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full h-full" style={{ transform: isMobile ? 'scale(0.6)' : 'scale(1)' }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{
          antialias: !isMobile,
          alpha: true,
          powerPreference: isMobile ? "low-power" : "high-performance"
        }}
        dpr={isMobile ? [1, 1] : [1, 2]}
      >
        <Scene isMobile={isMobile} />
      </Canvas>
    </div>
  );
}
