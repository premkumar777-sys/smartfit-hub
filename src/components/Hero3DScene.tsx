import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three";

// Floating kettlebell 3D model
function Kettlebell() {
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
      // Gentle rotation
      groupRef.current.rotation.y += 0.003;

      // Floating animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.2;

      // Slight tilt based on mouse
      if (!isMobile) {
        const targetRotationX = mousePosition.y * 0.1;
        const targetRotationZ = mousePosition.x * 0.1;
        groupRef.current.rotation.x += (targetRotationX - groupRef.current.rotation.x) * 0.02;
        groupRef.current.rotation.z += (targetRotationZ - groupRef.current.rotation.z) * 0.02;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={1.2}>
      {/* Kettlebell body (sphere) */}
      <mesh position={[0, -0.3, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color="#1a1a1f"
          metalness={0.9}
          roughness={0.15}
          emissive="#00FF9C"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Kettlebell handle */}
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.4, 0.12, 16, 32, Math.PI]} />
        <meshStandardMaterial
          color="#1a1a1f"
          metalness={0.95}
          roughness={0.1}
          emissive="#4CC9F0"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Handle connectors */}
      <mesh position={[-0.4, 0.1, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.1, 0.12, 0.4, 16]} />
        <meshStandardMaterial
          color="#1a1a1f"
          metalness={0.95}
          roughness={0.1}
          emissive="#00FF9C"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh position={[0.4, 0.1, 0]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.1, 0.12, 0.4, 16]} />
        <meshStandardMaterial
          color="#1a1a1f"
          metalness={0.95}
          roughness={0.1}
          emissive="#00FF9C"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Glowing ring detail */}
      <mesh position={[0, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.82, 0.03, 16, 48]} />
        <meshStandardMaterial
          color="#00FF9C"
          metalness={1}
          roughness={0}
          emissive="#00FF9C"
          emissiveIntensity={1}
        />
      </mesh>

      {/* Weight marking */}
      <mesh position={[0, -0.3, 0.82]} rotation={[0, 0, 0]}>
        <circleGeometry args={[0.15, 32]} />
        <meshStandardMaterial
          color="#00FF9C"
          emissive="#00FF9C"
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

// Energy rings orbiting
function EnergyRings() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.5;
      ring1Ref.current.rotation.y = t * 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = t * 0.4 + Math.PI / 3;
      ring2Ref.current.rotation.z = t * 0.2;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y = t * 0.6;
      ring3Ref.current.rotation.z = t * 0.3 + Math.PI / 2;
    }
  });

  return (
    <>
      <mesh ref={ring1Ref} position={[0, 0, 0]}>
        <torusGeometry args={[1.8, 0.02, 16, 64]} />
        <meshStandardMaterial
          color="#00FF9C"
          emissive="#00FF9C"
          emissiveIntensity={0.6}
          transparent
          opacity={0.5}
        />
      </mesh>
      <mesh ref={ring2Ref} position={[0, 0, 0]}>
        <torusGeometry args={[2.2, 0.015, 16, 64]} />
        <meshStandardMaterial
          color="#4CC9F0"
          emissive="#4CC9F0"
          emissiveIntensity={0.6}
          transparent
          opacity={0.4}
        />
      </mesh>
      <mesh ref={ring3Ref} position={[0, 0, 0]}>
        <torusGeometry args={[2.6, 0.01, 16, 64]} />
        <meshStandardMaterial
          color="#7B2CBF"
          emissive="#7B2CBF"
          emissiveIntensity={0.6}
          transparent
          opacity={0.3}
        />
      </mesh>
    </>
  );
}

// Particle system with energy particles
function ParticleSystem({ mousePosition, isMobile }: { mousePosition: { x: number; y: number }, isMobile: boolean }) {
  const particlesRef = useRef<THREE.Points>(null);
  const count = isMobile ? 30 : 80;

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Spread particles in spherical pattern
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = 3 + Math.random() * 4;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;

      // Random colors: green, cyan, purple
      const colorChoice = Math.random();
      if (colorChoice < 0.4) {
        colors[i * 3] = 0; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 0.6; // Green
      } else if (colorChoice < 0.7) {
        colors[i * 3] = 0.3; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 0.94; // Cyan
      } else {
        colors[i * 3] = 0.48; colors[i * 3 + 1] = 0.17; colors[i * 3 + 2] = 0.75; // Purple
      }
    }

    return { positions, velocities, colors };
  }, []);

  useFrame((state) => {
    if (!particlesRef.current) return;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      // Orbital movement
      const x = positions[i * 3];
      const z = positions[i * 3 + 2];
      const angle = 0.002;
      positions[i * 3] = x * Math.cos(angle) - z * Math.sin(angle);
      positions[i * 3 + 2] = x * Math.sin(angle) + z * Math.cos(angle);

      // Gentle floating
      positions[i * 3 + 1] += Math.sin(state.clock.elapsedTime + i) * 0.001;
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
          attach="attributes-color"
          count={count}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.7}
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
      <ambientLight intensity={0.3} />

      <pointLight
        position={[5, 5, 5]}
        intensity={isMobile ? 1.5 : 2}
        color="#00FF9C"
        distance={20}
      />

      <pointLight
        position={[-5, -5, 5]}
        intensity={isMobile ? 1 : 1.5}
        color="#4CC9F0"
        distance={20}
      />

      {!isMobile && (
        <spotLight
          position={[0, 8, 0]}
          intensity={1.2}
          angle={0.5}
          penumbra={1}
          color="#7B2CBF"
          distance={25}
        />
      )}

      <Kettlebell />
      <EnergyRings />
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
    <div className="w-full h-full" style={{ transform: isMobile ? 'scale(0.7)' : 'scale(1)' }}>
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
