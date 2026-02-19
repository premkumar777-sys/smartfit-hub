import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Points, PointMaterial } from "@react-three/drei";
import { useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three";

// Dynamic Digital Runner component
function DigitalRunner({ isMobile }: { isMobile: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const trailsRef = useRef<THREE.Group>(null);

  // Running animation state
  const strideRef = useRef(0);

  // Create joints for the silhouette
  const joints = useMemo(() => {
    return {
      head: new THREE.Vector3(0, 1.8, 0),
      neck: new THREE.Vector3(0, 1.5, 0),
      shoulderL: new THREE.Vector3(-0.4, 1.4, 0),
      shoulderR: new THREE.Vector3(0.4, 1.4, 0),
      elbowL: new THREE.Vector3(-0.6, 1.0, 0),
      elbowR: new THREE.Vector3(0.6, 1.0, 0),
      handL: new THREE.Vector3(-0.7, 0.6, 0),
      handR: new THREE.Vector3(0.7, 0.6, 0),
      hipL: new THREE.Vector3(-0.2, 0.8, 0),
      hipR: new THREE.Vector3(0.2, 0.8, 0),
      kneeL: new THREE.Vector3(-0.25, 0.4, 0),
      kneeR: new THREE.Vector3(0.25, 0.4, 0),
      footL: new THREE.Vector3(-0.3, 0, 0),
      footR: new THREE.Vector3(0.3, 0, 0)
    };
  }, []);

  const pointPositions = useMemo(() => new Float32Array(Object.keys(joints).length * 3), [joints]);

  useFrame((state, delta) => {
    strideRef.current += delta * 6; // Running speed
    const t = strideRef.current;

    // Animation logic - Sine waves to simulate running motion
    const bounce = Math.abs(Math.sin(t)) * 0.1;
    const bodyLean = 0.2;

    // Update joints based on running cycle
    // Left side leads when sin(t) is positive
    const cycleL = Math.sin(t);
    const cycleR = Math.sin(t + Math.PI);

    // Neck/Head
    joints.neck.set(0, 1.5 + bounce, bodyLean);
    joints.head.set(0, 1.8 + bounce, bodyLean + 0.1);

    // Arms (opposite to legs)
    joints.shoulderL.set(-0.4, 1.4 + bounce, bodyLean);
    joints.shoulderR.set(0.4, 1.4 + bounce, bodyLean);

    joints.elbowL.set(-0.5, 1.0 + bounce, bodyLean - cycleR * 0.5);
    joints.elbowR.set(0.5, 1.0 + bounce, bodyLean - cycleL * 0.5);

    joints.handL.set(-0.6, 0.7 + bounce, bodyLean - cycleR * 0.8);
    joints.handR.set(0.6, 0.7 + bounce, bodyLean - cycleL * 0.8);

    // Legs
    joints.hipL.set(-0.2, 0.8 + bounce, 0);
    joints.hipR.set(0.2, 0.8 + bounce, 0);

    // Knee lift
    joints.kneeL.set(-0.2, 0.4 + bounce + Math.max(0, cycleL) * 0.3, cycleL * 0.6);
    joints.kneeR.set(0.2, 0.4 + bounce + Math.max(0, cycleR) * 0.3, cycleR * 0.6);

    // Feet
    joints.footL.set(-0.2, Math.max(0, cycleL) * 0.5, cycleL * 0.9);
    joints.footR.set(0.2, Math.max(0, cycleR) * 0.5, cycleR * 0.9);

    // Update lines between joints
    const positions = [];
    const connections = [
      ['head', 'neck'],
      ['neck', 'shoulderL'], ['neck', 'shoulderR'],
      ['shoulderL', 'elbowL'], ['elbowL', 'handL'],
      ['shoulderR', 'elbowR'], ['elbowR', 'handR'],
      ['neck', 'hipL'], ['neck', 'hipR'],
      ['hipL', 'kneeL'], ['kneeL', 'footL'],
      ['hipR', 'kneeR'], ['kneeR', 'footR']
    ];

    connections.forEach(([a, b]) => {
      const vA = (joints as any)[a];
      const vB = (joints as any)[b];
      positions.push(vA.x, vA.y, vA.z, vB.x, vB.y, vB.z);
    });

    if (lineRef.current) {
      lineRef.current.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    }

    // Gentle global rotation
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.PI * 0.15; // Side view
    }
  });

  return (
    <group ref={groupRef} position={[0, -1, 0]} scale={isMobile ? 1.5 : 2.2}>
      {/* High-glow lines */}
      <lineSegments ref={lineRef}>
        <bufferGeometry />
        <lineBasicMaterial
          color="#00FF9C"
          linewidth={2}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Joint glow points */}
      <Points range={Object.keys(joints).length}>
        <PointMaterial
          transparent
          vertexColors
          size={isMobile ? 0.4 : 0.6}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      {/* Energy trail particles */}
      <RunnerTrails count={isMobile ? 50 : 150} />
    </group>
  );
}

// Particle trails behind the runner
function RunnerTrails({ count }: { count: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const life = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      resetParticle(pos, vel, life, i);
    }
    return { pos, vel, life };
  }, [count]);

  function resetParticle(pos: Float32Array, vel: Float32Array, life: Float32Array, i: number) {
    pos[i * 3] = (Math.random() - 0.5) * 0.5;
    pos[i * 3 + 1] = Math.random() * 2;
    pos[i * 3 + 2] = Math.random() * 0.5;

    vel[i * 3] = (Math.random() - 0.5) * 0.05;
    vel[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
    vel[i * 3 + 2] = -Math.random() * 0.1 - 0.05; // Move backwards

    life[i] = Math.random();
  }

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;

    for (let i = 0; i < count; i++) {
      particles.life[i] -= delta * 0.5;

      posAttr.array[i * 3] += particles.vel[i * 3];
      posAttr.array[i * 3 + 1] += particles.vel[i * 3 + 1];
      posAttr.array[i * 3 + 2] += particles.vel[i * 3 + 2];

      if (particles.life[i] <= 0) {
        resetParticle(posAttr.array as any, particles.vel, particles.life, i);
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.pos}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#4CC9F0"
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function Scene({ isMobile }: { isMobile: boolean }) {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#00FF9C" />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#4CC9F0" />

      {/* Cinematic bloom-like background grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[100, 100, 50, 50]} />
        <meshStandardMaterial
          color="#00FF9C"
          wireframe
          transparent
          opacity={0.03}
        />
      </mesh>

      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
        <DigitalRunner isMobile={isMobile} />
      </Float>
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
    <div className="w-full h-full bg-[#0a0a0a]">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
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
