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

  // Human Flesh Material (Realistic skin tone)
  const anatomicalMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#d2b48c', // Tan/Oak skin tone
    roughness: 0.4,
    metalness: 0,
  }), []);

  // Fabric Material for Workout Gear
  const clothingMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2563eb', // Vibrant blue for tank/shorts
    roughness: 0.8,
    metalness: 0,
  }), []);

  // Sneaker Material
  const sneakerMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#111111',
    roughness: 0.5,
    metalness: 0.2,
  }), []);

  // Intense Emerald Glow for active muscles
  const highlightMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#00FF9C',
    emissive: '#00FF9C',
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.6,
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
  const getMaterial = (groupName: string, defaultMat: THREE.Material = anatomicalMaterial) => {
    return isAnimating && activeMuscles.includes(groupName) ? highlightMaterial : defaultMat;
  };

  // ... (Animation logic remains similar but with refined scaling) ...
  useFrame((state, delta) => {
    if (!isAnimating) {
      timeRef.current += delta;
      animateIdle(timeRef.current);
      return;
    }

    timeRef.current += delta * 2.5;
    const t = timeRef.current;

    switch (exercise) {
      case 'squat': animateSquat(t); break;
      case 'pushup': animatePushup(t); break;
      case 'bicepCurl': animateBicepCurl(t); break;
      case 'idle': animateIdle(t); break;
    }
  });

  const animateSquat = (t: number) => {
    const squat = Math.sin(t) * 0.5 + 0.5;
    if (groupRef.current) groupRef.current.position.y = -squat * 0.9;
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
    if (torsoRef.current) torsoRef.current.rotation.x = squat * 0.25;
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
      groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.1;
    }
  };

  return (
    <group ref={groupRef}>
      {/* ===== TORSO (Skin Layer) ===== */}
      <mesh ref={torsoRef} position={[0, 0.6, 0]}>
        <capsuleGeometry args={[0.3, 0.52, 12, 16]} />
        <primitive object={anatomicalMaterial} />
      </mesh>

      {/* Lats (V-Taper Muscle) */}
      <mesh position={[0.22, 0.65, -0.05]} rotation={[0, 0, -0.3]}>
        <capsuleGeometry args={[0.15, 0.35, 12, 12]} />
        <primitive object={anatomicalMaterial} />
      </mesh>
      <mesh position={[-0.22, 0.65, -0.05]} rotation={[0, 0, 0.3]}>
        <capsuleGeometry args={[0.15, 0.35, 12, 12]} />
        <primitive object={anatomicalMaterial} />
      </mesh>

      {/* Trapezius & Neck Muscle */}
      <mesh position={[0, 1, -0.08]} rotation={[0, 0, 0]}>
        <capsuleGeometry args={[0.18, 0.2, 8, 8]} />
        <primitive object={anatomicalMaterial} />
      </mesh>

      {/* Abdominals (Realistic 6-Pack Definition) */}
      <group position={[0, 0.45, 0.18]}>
        {[0, 1, 2].map((i) => (
          <group key={i} position={[0, -i * 0.1, 0]}>
            <mesh position={[0.07, 0, 0.04]} rotation={[0, 0.2, 0]}>
              <capsuleGeometry args={[0.05, 0.05, 8, 8]} />
              <primitive object={getMaterial('abs')} />
            </mesh>
            <mesh position={[-0.07, 0, 0.04]} rotation={[0, -0.2, 0]}>
              <capsuleGeometry args={[0.05, 0.05, 8, 8]} />
              <primitive object={getMaterial('abs')} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Tank Top (Workout Shirt) with Branding */}
      <group position={[0, 0.72, 0]}>
        <mesh>
          <capsuleGeometry args={[0.33, 0.35, 12, 16]} />
          <primitive object={clothingMaterial} />
        </mesh>
        {/* Straps */}
        <mesh position={[0.2, 0.25, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.06, 0.3, 0.32]} />
          <primitive object={clothingMaterial} />
        </mesh>
        <mesh position={[-0.2, 0.25, 0]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.06, 0.3, 0.32]} />
          <primitive object={clothingMaterial} />
        </mesh>
      </group>

      {/* Pectorals (Defined Upper Chest) */}
      <mesh position={[0.15, 0.78, 0.22]} rotation={[0, 0.4, 0]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <primitive object={getMaterial('chest')} />
      </mesh>
      <mesh position={[-0.15, 0.78, 0.22]} rotation={[0, -0.4, 0]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <primitive object={getMaterial('chest')} />
      </mesh>

      {/* ===== HEAD (Hyper-Real Features) ===== */}
      <group position={[0, 1.4, 0]}>
        {/* Face */}
        <mesh>
          <sphereGeometry args={[0.16, 16, 16]} />
          <primitive object={anatomicalMaterial} />
        </mesh>
        {/* Nose Bridge */}
        <mesh position={[0, 0, 0.16]}>
          <capsuleGeometry args={[0.02, 0.05, 4, 8]} />
          <primitive object={anatomicalMaterial} />
        </mesh>
        {/* Eyes (Subtle Depth) */}
        <mesh position={[0.06, 0.04, 0.14]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshStandardMaterial color="#222" roughness={0.1} />
        </mesh>
        <mesh position={[-0.06, 0.04, 0.14]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshStandardMaterial color="#222" roughness={0.1} />
        </mesh>
        {/* Hair (Short Athletic Cut) */}
        <mesh position={[0, 0.08, -0.02]} rotation={[-0.3, 0, 0]}>
          <capsuleGeometry args={[0.17, 0.05, 8, 12]} />
          <meshStandardMaterial color="#1a120b" roughness={0.9} />
        </mesh>
      </group>

      {/* Neck */}
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 0.2, 12]} />
        <primitive object={anatomicalMaterial} />
      </mesh>

      {/* ===== ARMS & BROAD SHOULDERS ===== */}
      <group position={[0.42, 0.92, 0]}>
        {/* Deltoids */}
        <mesh>
          <sphereGeometry args={[0.17, 16, 16]} />
          <primitive object={getMaterial('shoulders')} />
        </mesh>
      </group>
      <group position={[-0.42, 0.92, 0]}>
        <mesh>
          <sphereGeometry args={[0.17, 16, 16]} />
          <primitive object={getMaterial('shoulders')} />
        </mesh>
      </group>

      <group ref={leftArmRef} position={[0.42, 0.92, 0]} rotation={[0, 0, 0.15]}>
        <mesh position={[0.08, -0.22, 0]}>
          <capsuleGeometry args={[0.13, 0.38, 12, 12]} />
          <primitive object={getMaterial('arms')} />
        </mesh>
        <mesh ref={leftForearmRef} position={[0.08, -0.62, 0]}>
          <capsuleGeometry args={[0.09, 0.38, 10, 10]} />
          <primitive object={getMaterial('arms')} />
        </mesh>
      </group>

      <group ref={rightArmRef} position={[-0.42, 0.92, 0]} rotation={[0, 0, -0.15]}>
        <mesh position={[-0.08, -0.22, 0]}>
          <capsuleGeometry args={[0.13, 0.38, 12, 12]} />
          <primitive object={getMaterial('arms')} />
        </mesh>
        <mesh ref={rightForearmRef} position={[-0.08, -0.62, 0]}>
          <capsuleGeometry args={[0.09, 0.38, 10, 10]} />
          <primitive object={getMaterial('arms')} />
        </mesh>
      </group>

      {/* ===== HIPS & SHORTS ===== */}
      <group position={[0, 0.1, 0]}>
        <mesh>
          <capsuleGeometry args={[0.26, 0.2, 12, 12]} />
          <primitive object={clothingMaterial} />
        </mesh>
      </group>

      <group ref={leftLegRef} position={[0.2, -0.1, 0]}>
        {/* Upper Leg with Shorts */}
        <group position={[0, -0.25, 0]}>
          <mesh>
            <capsuleGeometry args={[0.19, 0.32, 12, 12]} />
            <primitive object={clothingMaterial} />
          </mesh>
        </group>
        {/* Knee to Ankle (Skin) */}
        <mesh position={[0, -0.45, 0]}>
          <capsuleGeometry args={[0.15, 0.3, 12, 12]} />
          <primitive object={getMaterial('legs')} />
        </mesh>
        <mesh ref={leftCalfRef} position={[0, -0.9, 0]}>
          <capsuleGeometry args={[0.1, 0.48, 10, 10]} />
          <primitive object={anatomicalMaterial} />
        </mesh>
        {/* Foot / Sneaker */}
        <mesh position={[0, -1.3, 0.1]}>
          <boxGeometry args={[0.15, 0.1, 0.3]} />
          <primitive object={sneakerMaterial} />
        </mesh>
      </group>

      <group ref={rightLegRef} position={[-0.2, -0.1, 0]}>
        {/* Upper Leg with Shorts */}
        <group position={[0, -0.25, 0]}>
          <mesh>
            <capsuleGeometry args={[0.18, 0.3, 12, 12]} />
            <primitive object={clothingMaterial} />
          </mesh>
        </group>
        {/* Knee to Ankle (Skin) */}
        <mesh position={[0, -0.45, 0]}>
          <capsuleGeometry args={[0.15, 0.3, 12, 12]} />
          <primitive object={getMaterial('legs')} />
        </mesh>
        <mesh ref={rightCalfRef} position={[0, -0.9, 0]}>
          <capsuleGeometry args={[0.1, 0.48, 10, 10]} />
          <primitive object={anatomicalMaterial} />
        </mesh>
        {/* Foot / Sneaker */}
        <mesh position={[0, -1.3, 0.1]}>
          <boxGeometry args={[0.15, 0.1, 0.3]} />
          <primitive object={sneakerMaterial} />
        </mesh>
      </group>
    </group>
  );
}
