import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AnimatedTrainerProps {
  exercise: 'squat' | 'pushup' | 'bicepCurl' | 'idle';
  isAnimating: boolean;
}

/**
 * 3D Animated Human Trainer with Athletic Physique
 * Uses procedural animation on a muscular human figure
 * Each exercise has unique joint movements
 */
export function AnimatedTrainer({ exercise, isAnimating }: AnimatedTrainerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  // Body part refs for animation
  const torsoRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftForearmRef = useRef<THREE.Mesh>(null);
  const rightForearmRef = useRef<THREE.Mesh>(null);
  const leftCalfRef = useRef<THREE.Mesh>(null);
  const rightCalfRef = useRef<THREE.Mesh>(null);

  // Metallic Athletic Material (Sleek carbon/chrome hybrid)
  const anatomicalMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a1a1f',
    roughness: 0.15,
    metalness: 0.8,
    envMapIntensity: 1,
  }), []);

  // Intense Emerald Glow for active muscles
  const highlightMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#00FF9C',
    emissive: '#00FF9C',
    emissiveIntensity: 4,
    transparent: true,
    opacity: 0.95,
  }), []);

  // Map exercises to target muscles
  const activeMuscles = useMemo(() => {
    switch (exercise) {
      case 'pushup': return ['chest', 'abs', 'arms', 'shoulders'];
      case 'squat': return ['legs', 'abs', 'glutes'];
      case 'bicepCurl': return ['arms', 'shoulders'];
      default: return [];
    }
  }, [exercise]);

  // Helper to determine material for a muscle group
  const getMaterial = (groupName: string) => {
    return isAnimating && activeMuscles.includes(groupName) ? highlightMaterial : anatomicalMaterial;
  };

  // Animation logic
  useFrame((state, delta) => {
    if (!isAnimating) {
      // Gentle idle breathe even when not active
      timeRef.current += delta;
      animateIdle(timeRef.current);
      return;
    }

    timeRef.current += delta * 2.5;
    const t = timeRef.current;

    switch (exercise) {
      case 'squat':
        animateSquat(t);
        break;
      case 'pushup':
        animatePushup(t);
        break;
      case 'bicepCurl':
        animateBicepCurl(t);
        break;
      case 'idle':
        animateIdle(t);
        break;
    }
  });

  const animateSquat = (t: number) => {
    const squat = Math.sin(t) * 0.5 + 0.5;

    if (groupRef.current) {
      groupRef.current.position.y = -squat * 0.9;
    }

    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = squat * 1.35;
      rightLegRef.current.rotation.x = squat * 1.35;
    }

    if (leftCalfRef.current && rightCalfRef.current) {
      leftCalfRef.current.rotation.x = -squat * 1.6;
      rightCalfRef.current.rotation.x = -squat * 1.6;
    }

    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = -squat * 1.2;
      rightArmRef.current.rotation.x = -squat * 1.2;
    }

    if (torsoRef.current) {
      torsoRef.current.rotation.x = squat * 0.25;
    }
  };

  const animatePushup = (t: number) => {
    const pushup = Math.sin(t) * 0.5 + 0.5;

    if (groupRef.current) {
      groupRef.current.rotation.x = -Math.PI / 2 + 0.1;
      groupRef.current.position.y = -1.4 + pushup * 0.5;
      groupRef.current.position.z = 1;
    }

    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.z = 0.4;
      rightArmRef.current.rotation.z = -0.4;
    }

    if (leftForearmRef.current && rightForearmRef.current) {
      leftForearmRef.current.rotation.x = pushup * 1.4;
      rightForearmRef.current.rotation.x = pushup * 1.4;
    }
  };

  const animateBicepCurl = (t: number) => {
    const curl = Math.sin(t) * 0.5 + 0.5;

    if (groupRef.current) {
      groupRef.current.position.y = 0;
      groupRef.current.rotation.x = 0;
    }

    if (leftForearmRef.current && rightForearmRef.current) {
      leftForearmRef.current.rotation.x = -curl * 2.6;
      rightForearmRef.current.rotation.x = -curl * 2.6;
    }

    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = curl * 0.3;
      rightArmRef.current.rotation.x = curl * 0.3;
      leftArmRef.current.rotation.z = 0.15;
      rightArmRef.current.rotation.z = -0.15;
    }
  };

  const animateIdle = (t: number) => {
    const breath = Math.sin(t * 0.8) * 0.03;
    if (torsoRef.current) {
      torsoRef.current.scale.x = 1 + breath;
      torsoRef.current.scale.z = 1 + breath;
    }

    if (groupRef.current && exercise === 'idle') {
      groupRef.current.position.y = Math.sin(t * 0.5) * 0.05;
      groupRef.current.rotation.x = 0;
      groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.1;
    }

    if (leftArmRef.current && rightArmRef.current && exercise === 'idle') {
      leftArmRef.current.rotation.set(0, 0, 0.15 + breath);
      rightArmRef.current.rotation.set(0, 0, -0.15 - breath);
    }
  };

  return (
    <group ref={groupRef}>
      {/* ===== TORSO & CORE (The X-Frame) ===== */}
      <mesh ref={torsoRef} position={[0, 0.6, 0]}>
        <capsuleGeometry args={[0.32, 0.5, 12, 16]} />
        <primitive object={anatomicalMaterial} />
      </mesh>

      {/* Lats (Broad V-Taper) */}
      <mesh position={[0.2, 0.65, -0.05]} rotation={[0, 0, -0.2]}>
        <capsuleGeometry args={[0.15, 0.35, 8, 8]} />
        <primitive object={anatomicalMaterial} />
      </mesh>
      <mesh position={[-0.2, 0.65, -0.05]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[0.15, 0.35, 8, 8]} />
        <primitive object={anatomicalMaterial} />
      </mesh>

      {/* Trapezius */}
      <mesh position={[0, 0.95, -0.1]} rotation={[0, 0, 0]}>
        <capsuleGeometry args={[0.2, 0.2, 8, 8]} />
        <primitive object={anatomicalMaterial} />
      </mesh>

      {/* Abdominals (Core) - Deeply defined 6 Pack */}
      <group position={[0, 0.45, 0.18]}>
        {[0, 1, 2].map((i) => (
          <group key={i} position={[0, -i * 0.12, 0]}>
            <mesh position={[0.08, 0, 0]}>
              <capsuleGeometry args={[0.06, 0.04, 8, 8]} />
              <primitive object={getMaterial('abs')} />
            </mesh>
            <mesh position={[-0.08, 0, 0]}>
              <capsuleGeometry args={[0.06, 0.04, 8, 8]} />
              <primitive object={getMaterial('abs')} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Pectorals (Massive Upper Chest) */}
      <mesh position={[0.16, 0.78, 0.22]} rotation={[0, 0.3, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <primitive object={getMaterial('chest')} />
      </mesh>
      <mesh position={[-0.16, 0.78, 0.22]} rotation={[0, -0.3, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <primitive object={getMaterial('chest')} />
      </mesh>

      {/* ===== HEAD ===== */}
      <mesh position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <primitive object={anatomicalMaterial} />
      </mesh>
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.22, 12]} />
        <primitive object={anatomicalMaterial} />
      </mesh>

      {/* ===== ARMS & BROAD SHOULDERS ===== */}
      {/* Shoulder / Deltoid Muscles */}
      <group position={[0.42, 0.9, 0]}>
        <mesh>
          <sphereGeometry args={[0.18, 16, 16]} />
          <primitive object={getMaterial('shoulders')} />
        </mesh>
      </group>
      <group position={[-0.42, 0.9, 0]}>
        <mesh>
          <sphereGeometry args={[0.18, 16, 16]} />
          <primitive object={getMaterial('shoulders')} />
        </mesh>
      </group>

      <group ref={leftArmRef} position={[0.42, 0.9, 0]} rotation={[0, 0, 0.15]}>
        {/* Massive Bicep/Tricep */}
        <mesh position={[0.08, -0.2, 0]}>
          <capsuleGeometry args={[0.14, 0.35, 12, 12]} />
          <primitive object={getMaterial('arms')} />
        </mesh>
        <mesh ref={leftForearmRef} position={[0.08, -0.58, 0]}>
          <capsuleGeometry args={[0.09, 0.35, 10, 10]} />
          <primitive object={getMaterial('arms')} />
        </mesh>
      </group>

      <group ref={rightArmRef} position={[-0.42, 0.9, 0]} rotation={[0, 0, -0.15]}>
        {/* Massive Bicep/Tricep */}
        <mesh position={[-0.08, -0.2, 0]}>
          <capsuleGeometry args={[0.14, 0.35, 12, 12]} />
          <primitive object={getMaterial('arms')} />
        </mesh>
        <mesh ref={rightForearmRef} position={[-0.08, -0.58, 0]}>
          <capsuleGeometry args={[0.09, 0.35, 10, 10]} />
          <primitive object={getMaterial('arms')} />
        </mesh>
      </group>

      {/* ===== HIPS & QUADZILLA LEGS ===== */}
      <mesh position={[0, 0.1, 0]}>
        <capsuleGeometry args={[0.25, 0.2, 12, 12]} />
        <primitive object={anatomicalMaterial} />
      </mesh>

      {/* Glutes */}
      <mesh position={[0.12, 0.05, -0.15]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <primitive object={getMaterial('glutes')} />
      </mesh>
      <mesh position={[-0.12, 0.05, -0.15]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <primitive object={getMaterial('glutes')} />
      </mesh>

      <group ref={leftLegRef} position={[0.2, -0.1, 0]}>
        {/* Massive Quads */}
        <mesh position={[0, -0.38, 0]}>
          <capsuleGeometry args={[0.17, 0.48, 12, 12]} />
          <primitive object={getMaterial('legs')} />
        </mesh>
        <mesh ref={leftCalfRef} position={[0, -0.9, 0]}>
          <capsuleGeometry args={[0.11, 0.48, 10, 10]} />
          <primitive object={anatomicalMaterial} />
        </mesh>
      </group>

      <group ref={rightLegRef} position={[-0.2, -0.1, 0]}>
        {/* Massive Quads */}
        <mesh position={[0, -0.38, 0]}>
          <capsuleGeometry args={[0.17, 0.48, 12, 12]} />
          <primitive object={getMaterial('legs')} />
        </mesh>
        <mesh ref={rightCalfRef} position={[0, -0.9, 0]}>
          <capsuleGeometry args={[0.11, 0.48, 10, 10]} />
          <primitive object={anatomicalMaterial} />
        </mesh>
      </group>
    </group>
  );
}
