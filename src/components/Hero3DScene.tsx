import { Canvas, useFrame, extend } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

extend({ ShaderMaterial: THREE.ShaderMaterial });

const vertexShader = `
  attribute float size;
  attribute float phase;
  varying vec3 vColor;
  varying float vOpacity;
  uniform float uTime;

  void main() {
    vColor = color;
    // Individual blinking logic
    float blink = sin(uTime * 2.0 + phase) * 0.5 + 0.5;
    vOpacity = 0.3 + (blink * 0.7);
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z) * (0.8 + blink * 0.4);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    // Soft radial glow
    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
    gl_FragColor = vec4(vColor, vOpacity * glow);
  }
`;

function Starfield({ count = 1000 }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, colors, sizes, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const szs = new Float32Array(count);
    const phs = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;

      const isCyan = Math.random() > 0.3;
      const color = new THREE.Color(isCyan ? "#00E5FF" : "#4CC9F0");
      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;

      szs[i] = Math.random() * 0.2 + 0.1;
      phs[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, colors: cols, sizes: szs, phases: phs };
  }, [count]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-phase" count={count} array={phases} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export default function Hero3DScene() {
  return (
    <div className="w-full h-full bg-black">
      <Canvas camera={{ position: [0, 0, 20], fov: 45 }}>
        <Starfield />
      </Canvas>
    </div>
  );
}
