import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three";

// Dynamic Neural Network component
function NeuralNetwork({ isMobile }: { isMobile: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const count = isMobile ? 40 : 120;
  const connectionDistance = 3.5;
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const { positions, velocities, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5;

      vel[i * 3] = (Math.random() - 0.5) * 0.008;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.008;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.008;

      // Colors: primarily #00FF9C (green) and #4CC9F0 (cyan)
      const color = new THREE.Color(Math.random() > 0.5 ? "#00FF9C" : "#4CC9F0");
      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;
    }
    return { positions: pos, velocities: vel, colors: cols };
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current || !linesRef.current) return;

    const pointsAttr = pointsRef.current.geometry.attributes.position;
    const linePositions = [];

    for (let i = 0; i < count; i++) {
      // Update positions based on velocity
      pointsAttr.array[i * 3] += velocities[i * 3];
      pointsAttr.array[i * 3 + 1] += velocities[i * 3 + 1];
      pointsAttr.array[i * 3 + 2] += velocities[i * 3 + 2];

      // Boundary bouncing
      if (Math.abs(pointsAttr.array[i * 3]) > 10) velocities[i * 3] *= -1;
      if (Math.abs(pointsAttr.array[i * 3 + 1]) > 7) velocities[i * 3 + 1] *= -1;
      if (Math.abs(pointsAttr.array[i * 3 + 2]) > 5) velocities[i * 3 + 2] *= -1;

      // Mouse interactivity - nodes move away from cursor
      if (!isMobile) {
        const dx = pointsAttr.array[i * 3] - mousePosition.x * 10;
        const dy = pointsAttr.array[i * 3 + 1] - mousePosition.y * 7;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 4) {
          const force = (4 - dist) / 4;
          pointsAttr.array[i * 3] += dx * force * 0.05;
          pointsAttr.array[i * 3 + 1] += dy * force * 0.05;
        }
      }
    }

    pointsAttr.needsUpdate = true;

    // Generate connections
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = pointsAttr.array[i * 3] - pointsAttr.array[j * 3];
        const dy = pointsAttr.array[i * 3 + 1] - pointsAttr.array[j * 3 + 1];
        const dz = pointsAttr.array[i * 3 + 2] - pointsAttr.array[j * 3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < connectionDistance * connectionDistance) {
          linePositions.push(
            pointsAttr.array[i * 3], pointsAttr.array[i * 3 + 1], pointsAttr.array[i * 3 + 2],
            pointsAttr.array[j * 3], pointsAttr.array[j * 3 + 1], pointsAttr.array[j * 3 + 2]
          );
        }
      }
    }

    linesRef.current.geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(linePositions, 3)
    );
  });

  return (
    <group>
      <PointsComponent count={count} positions={positions} colors={colors} pointsRef={pointsRef} />
      <lineSegments ref={linesRef}>
        <bufferGeometry />
        <lineBasicMaterial
          color="#4CC9F0"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

// Separate component for points to optimize rendering
function PointsComponent({ count, positions, colors, pointsRef }: any) {
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function Scene({ isMobile }: { isMobile: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Subtle group rotation
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00FF9C" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4CC9F0" />

      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <group ref={groupRef}>
          <NeuralNetwork isMobile={isMobile} />
        </group>
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
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 45 }}
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
