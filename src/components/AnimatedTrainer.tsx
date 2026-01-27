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

  // Solid anatomical gray material (matches reference image)
  const anatomicalMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#d1d5db',
    roughness: 0.5,
    metalness: 0.2,
  }), []);

  // Highlight material for active muscles
  const highlightMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#00FF9C',
    emissive: '#00FF9C',
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.9,
  }), []);

  // Map exercises to target muscles
  const activeMuscles = useMemo(() => {
    switch (exercise) {
      case 'pushup': return ['chest', 'abs', 'arms'];
      case 'squat': return ['legs', 'abs'];
      case 'bicepCurl': return ['arms'];
      default: return [];
    }
  }, [exercise]);

  // Helper to determine material for a muscle group
  const getMaterial = (groupName: string) => {
    return isAnimating && activeMuscles.includes(groupName) ? highlightMaterial : anatomicalMaterial;
  };

  // Animation logic
  useFrame((_, delta) => {
    if (!isAnimating) return;

    timeRef.current += delta * 2;
    const t = timeRef.current;

    // Reset positions first
    if (groupRef.current) {
      groupRef.current.position.y = 0;
    }

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
      groupRef.current.position.y = -squat * 0.8;
    }

    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = squat * 1.2;
      rightLegRef.current.rotation.x = squat * 1.2;
    }

    if (leftCalfRef.current && rightCalfRef.current) {
      leftCalfRef.current.rotation.x = -squat * 1.5;
      rightCalfRef.current.rotation.x = -squat * 1.5;
    }

    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = -squat * 0.8;
      rightArmRef.current.rotation.x = -squat * 0.8;
    }

    if (torsoRef.current) {
      torsoRef.current.rotation.x = squat * 0.2;
    }
  };

  const animatePushup = (t: number) => {
    const pushup = Math.sin(t) * 0.5 + 0.5;

    if (groupRef.current) {
      groupRef.current.rotation.x = -Math.PI / 2 + 0.1;
      groupRef.current.position.y = -1.5 + pushup * 0.4;
      groupRef.current.position.z = 1;
    }

    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.z = 0.3;
      rightArmRef.current.rotation.z = -0.3;
    }

    if (leftForearmRef.current && rightForearmRef.current) {
      leftForearmRef.current.rotation.x = pushup * 1.2;
      rightForearmRef.current.rotation.x = pushup * 1.2;
    }
  };

  const animateBicepCurl = (t: number) => {
    const curl = Math.sin(t) * 0.5 + 0.5;

    if (groupRef.current) {
      groupRef.current.position.y = 0;
      groupRef.current.rotation.x = 0;
    }

    if (leftForearmRef.current && rightForearmRef.current) {
      leftForearmRef.current.rotation.x = -curl * 2.5;
      rightForearmRef.current.rotation.x = -curl * 2.5;
    }

    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = curl * 0.2;
      rightArmRef.current.rotation.x = curl * 0.2;
      leftArmRef.current.rotation.z = 0.1;
      rightArmRef.current.rotation.z = -0.1;
    }
  };

  const animateIdle = (t: number) => {
    if (torsoRef.current) {
      torsoRef.current.scale.y = 1 + Math.sin(t * 0.5) * 0.02;
    }

    if (groupRef.current) {
      groupRef.current.position.y = 0;
      groupRef.current.rotation.x = 0;
    }

    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.set(0, 0, 0.12);
      rightArmRef.current.rotation.set(0, 0, -0.12);
    }

    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = 0;
      rightLegRef.current.rotation.x = 0;
    }
  };

  return (
    <group ref={groupRef}>
      {/* ===== TORSO & CORE ===== */}
      <mesh ref={torsoRef} position={[0, 0.6, 0]}>
        <capsuleGeometry args={[0.3, 0.5, 12, 16]} />
        <primitive object={anatomicalMaterial} />
      </mesh>

      {/* Abdominals (Core) - 6 Pack Highlight */}
      <group position={[0, 0.45, 0.15]}>
        {[0, 1, 2].map((i) => (
          <group key={i} position={[0, -i * 0.12, 0]}>
            <mesh position={[0.07, 0, 0]}>
              <capsuleGeometry args={[0.05, 0.04, 8, 8]} />
              <primitive object={getMaterial('abs')} />
            </mesh>
            <mesh position={[-0.07, 0, 0]}>
              <capsuleGeometry args={[0.05, 0.04, 8, 8]} />
              <primitive object={getMaterial('abs')} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Pectorals (Chest) */}
      <mesh position={[0.13, 0.75, 0.2]} rotation={[0, 0.2, 0]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <primitive object={getMaterial('chest')} />
      </mesh>
      <mesh position={[-0.13, 0.75, 0.2]} rotation={[0, -0.2, 0]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <primitive object={getMaterial('chest')} />
      </mesh>

      {/* ===== HEAD ===== */}
      <mesh position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <primitive object={anatomicalMaterial} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.2, 12]} />
        <primitive object={anatomicalMaterial} />
      </mesh>

      {/* ===== ARMS & HIGHLIGHTS ===== */}
      <group ref={leftArmRef} position={[0.45, 0.88, 0]} rotation={[0, 0, 0.12]}>
        {/* Upper Arm / Bicep Highlight */}
        <mesh position={[0.08, -0.2, 0]}>
          <capsuleGeometry args={[0.11, 0.3, 12, 12]} />
          <primitive object={getMaterial('arms')} />
        </mesh>
        <mesh ref={leftForearmRef} position={[0.08, -0.55, 0]}>
          <capsuleGeometry args={[0.07, 0.3, 10, 10]} />
          <primitive object={getMaterial('arms')} />
        </mesh>
      </group>

      <group ref={rightArmRef} position={[-0.45, 0.88, 0]} rotation={[0, 0, -0.12]}>
        {/* Upper Arm / Bicep Highlight */}
        <mesh position={[-0.08, -0.2, 0]}>
          <capsuleGeometry args={[0.11, 0.3, 12, 12]} />
          <primitive object={getMaterial('arms')} />
        </mesh>
        <mesh ref={rightForearmRef} position={[-0.08, -0.55, 0]}>
          <capsuleGeometry args={[0.07, 0.3, 10, 10]} />
          <primitive object={getMaterial('arms')} />
        </mesh>
      </group>

      {/* ===== HIPS & LEGS ===== */}
      <mesh position={[0, 0.1, 0]}>
        <capsuleGeometry args={[0.22, 0.2, 12, 12]} />
        <primitive object={anatomicalMaterial} />
      </mesh>

      <group ref={leftLegRef} position={[0.18, -0.1, 0]}>
        {/* Thigh / Quad Highlight */}
        <mesh position={[0, -0.35, 0]}>
          <capsuleGeometry args={[0.14, 0.45, 12, 12]} />
          <primitive object={getMaterial('legs')} />
        </mesh>
        <mesh ref={leftCalfRef} position={[0, -0.85, 0]}>
          <capsuleGeometry args={[0.09, 0.45, 10, 10]} />
          <primitive object={anatomicalMaterial} />
        </mesh>
      </group>

      <group ref={rightLegRef} position={[-0.18, -0.1, 0]}>
        {/* Thigh / Quad Highlight */}
        <mesh position={[0, -0.35, 0]}>
          <capsuleGeometry args={[0.14, 0.45, 12, 12]} />
          <primitive object={getMaterial('legs')} />
        </mesh>
        <mesh ref={rightCalfRef} position={[0, -0.85, 0]}>
          <capsuleGeometry args={[0.09, 0.45, 10, 10]} />
          <primitive object={anatomicalMaterial} />
        </mesh>
      </group>
    </group>
  );
}
