import { Canvas, useFrame, extend } from "@react-three/fiber";
import { useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";

// Custom shader material for individual twinkling stars
const StarMaterial = shaderMaterial(
  {
    uTime: 0,
    uOpacity: 0.8,
  },
  // Vertex shader
  `
  varying float vOpacity;
  varying vec3 vColor;
  attribute float aPhase;
  attribute float aSize;
  attribute vec3 color;
  uniform float uTime;
  
  void main() {
    vColor = color;
    // Calculate twinkling phase
    float blink = 0.5 + 0.5 * sin(uTime * 2.0 + aPhase);
    vOpacity = blink;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
  `,
  // Fragment shader
  `
  varying float vOpacity;
  varying vec3 vColor;
  uniform float uOpacity;
  
  void main() {
    // Soft circular particle
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    float alpha = smoothstep(0.5, 0.2, dist) * vOpacity * uOpacity;
    gl_FragColor = vec4(vColor, alpha);
  }
  `
);

// Register the custom shader material
extend({ StarMaterial });

function Starfield({ count = 1000 }) {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<any>(null);

  const { positions, phases, sizes, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const phs = new Float32Array(count);
    const szs = new Float32Array(count);
    const cols = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Wide dispersion
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;

      // Unique timing phase for each star
      phs[i] = Math.random() * Math.PI * 2;

      // Random sizes
      szs[i] = 0.05 + Math.random() * 0.15;

      // Cyan / Blue cinematic colors
      const color = new THREE.Color(Math.random() > 0.3 ? "#00E5FF" : "#4CC9F0");
      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;
    }
    return { positions: pos, phases: phs, sizes: szs, colors: cols };
  }, [count]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          count={count}
          array={phases}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={count}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      {/* @ts-ignore */}
      <starMaterial ref={materialRef} transparent depthWrite={false} vertexColors />
    </points>
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
        camera={{ position: [0, 0, 15], fov: 60 }}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={isMobile ? [1, 1] : [1, 2]}
      >
        <ambientLight intensity={0.5} />
        <Starfield count={isMobile ? 500 : 1200} />
      </Canvas>
    </div>
  );
}
