import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AnimatedTrainerProps {
  exercise: 'squat' | 'pushup' | 'bicepCurl' | 'idle';
  isAnimating: boolean;
}

/**
 * 3D Animated Human Trainer
 * Uses procedural animation on a simplified human figure
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

  // Skin-like material
  const skinMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#e8beac',
    roughness: 0.7,
    metalness: 0.1,
  }), []);

  // Workout clothes material
  const shirtMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#00FF9C',
    roughness: 0.8,
    metalness: 0.1,
  }), []);

  const shortsMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a1a2e',
    roughness: 0.9,
    metalness: 0,
  }), []);

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
    const squat = Math.sin(t) * 0.5 + 0.5; // 0 to 1
    
    // Lower the body
    if (groupRef.current) {
      groupRef.current.position.y = -squat * 0.8;
    }
    
    // Bend knees
    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = squat * 1.2;
      rightLegRef.current.rotation.x = squat * 1.2;
    }
    
    // Bend calves back
    if (leftCalfRef.current && rightCalfRef.current) {
      leftCalfRef.current.rotation.x = -squat * 1.5;
      rightCalfRef.current.rotation.x = -squat * 1.5;
    }
    
    // Arms forward for balance
    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = -squat * 0.8;
      rightArmRef.current.rotation.x = -squat * 0.8;
    }
    
    // Slight torso lean
    if (torsoRef.current) {
      torsoRef.current.rotation.x = squat * 0.2;
    }
  };

  const animatePushup = (t: number) => {
    const pushup = Math.sin(t) * 0.5 + 0.5;
    
    // Rotate entire body to horizontal
    if (groupRef.current) {
      groupRef.current.rotation.x = -Math.PI / 2 + 0.1;
      groupRef.current.position.y = -1.5 + pushup * 0.4;
      groupRef.current.position.z = 1;
    }
    
    // Bend arms
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
    
    // Keep body upright
    if (groupRef.current) {
      groupRef.current.position.y = 0;
      groupRef.current.rotation.x = 0;
    }
    
    // Curl forearms
    if (leftForearmRef.current && rightForearmRef.current) {
      leftForearmRef.current.rotation.x = -curl * 2.5;
      rightForearmRef.current.rotation.x = -curl * 2.5;
    }
    
    // Slight arm movement
    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = curl * 0.2;
      rightArmRef.current.rotation.x = curl * 0.2;
      leftArmRef.current.rotation.z = 0.1;
      rightArmRef.current.rotation.z = -0.1;
    }
  };

  const animateIdle = (t: number) => {
    // Gentle breathing motion
    if (torsoRef.current) {
      torsoRef.current.scale.y = 1 + Math.sin(t * 0.5) * 0.02;
    }
    
    // Reset positions
    if (groupRef.current) {
      groupRef.current.position.y = 0;
      groupRef.current.rotation.x = 0;
    }
    
    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.set(0, 0, 0.15);
      rightArmRef.current.rotation.set(0, 0, -0.15);
    }
    
    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = 0;
      rightLegRef.current.rotation.x = 0;
    }
  };

  return (
    <group ref={groupRef}>
      {/* Torso */}
      <mesh ref={torsoRef} position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.35, 0.8, 8, 16]} />
        <primitive object={shirtMaterial} />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <primitive object={skinMaterial} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.15, 8]} />
        <primitive object={skinMaterial} />
      </mesh>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[0.45, 0.85, 0]} rotation={[0, 0, 0.15]}>
        {/* Upper arm */}
        <mesh position={[0.15, -0.2, 0]}>
          <capsuleGeometry args={[0.08, 0.35, 8, 8]} />
          <primitive object={shirtMaterial} />
        </mesh>
        {/* Forearm */}
        <mesh ref={leftForearmRef} position={[0.15, -0.55, 0]}>
          <capsuleGeometry args={[0.06, 0.3, 8, 8]} />
          <primitive object={skinMaterial} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[-0.45, 0.85, 0]} rotation={[0, 0, -0.15]}>
        {/* Upper arm */}
        <mesh position={[-0.15, -0.2, 0]}>
          <capsuleGeometry args={[0.08, 0.35, 8, 8]} />
          <primitive object={shirtMaterial} />
        </mesh>
        {/* Forearm */}
        <mesh ref={rightForearmRef} position={[-0.15, -0.55, 0]}>
          <capsuleGeometry args={[0.06, 0.3, 8, 8]} />
          <primitive object={skinMaterial} />
        </mesh>
      </group>

      {/* Hips */}
      <mesh position={[0, -0.1, 0]}>
        <capsuleGeometry args={[0.3, 0.2, 8, 16]} />
        <primitive object={shortsMaterial} />
      </mesh>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[0.18, -0.35, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.25, 0]}>
          <capsuleGeometry args={[0.12, 0.4, 8, 8]} />
          <primitive object={shortsMaterial} />
        </mesh>
        {/* Calf */}
        <mesh ref={leftCalfRef} position={[0, -0.7, 0]}>
          <capsuleGeometry args={[0.08, 0.4, 8, 8]} />
          <primitive object={skinMaterial} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[-0.18, -0.35, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.25, 0]}>
          <capsuleGeometry args={[0.12, 0.4, 8, 8]} />
          <primitive object={shortsMaterial} />
        </mesh>
        {/* Calf */}
        <mesh ref={rightCalfRef} position={[0, -0.7, 0]}>
          <capsuleGeometry args={[0.08, 0.4, 8, 8]} />
          <primitive object={skinMaterial} />
        </mesh>
      </group>
    </group>
  );
}
