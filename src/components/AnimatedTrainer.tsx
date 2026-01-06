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

  // Athletic skin tone
  const skinMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#c9a080',
    roughness: 0.6,
    metalness: 0.05,
  }), []);

  // Tank top / workout shirt
  const shirtMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#00FF9C',
    roughness: 0.7,
    metalness: 0.05,
  }), []);

  // Athletic shorts
  const shortsMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a1a2e',
    roughness: 0.85,
    metalness: 0,
  }), []);

  // Hair material
  const hairMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a1a1a',
    roughness: 0.9,
    metalness: 0.1,
  }), []);

  // Shoes material
  const shoesMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2d2d2d',
    roughness: 0.6,
    metalness: 0.2,
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
      {/* ===== TORSO - Athletic V-Shape ===== */}
      {/* Upper chest / shoulders - wide and muscular */}
      <mesh ref={torsoRef} position={[0, 0.6, 0]}>
        <capsuleGeometry args={[0.32, 0.55, 12, 20]} />
        <primitive object={shirtMaterial} />
      </mesh>
      
      {/* Chest muscles - added definition */}
      <mesh position={[0.12, 0.7, 0.22]}>
        <sphereGeometry args={[0.14, 12, 12]} />
        <primitive object={shirtMaterial} />
      </mesh>
      <mesh position={[-0.12, 0.7, 0.22]}>
        <sphereGeometry args={[0.14, 12, 12]} />
        <primitive object={shirtMaterial} />
      </mesh>
      
      {/* Shoulders / Deltoids - muscular caps */}
      <mesh position={[0.38, 0.88, 0]}>
        <sphereGeometry args={[0.14, 12, 12]} />
        <primitive object={shirtMaterial} />
      </mesh>
      <mesh position={[-0.38, 0.88, 0]}>
        <sphereGeometry args={[0.14, 12, 12]} />
        <primitive object={shirtMaterial} />
      </mesh>
      
      {/* Lower torso / abs area */}
      <mesh position={[0, 0.2, 0]}>
        <capsuleGeometry args={[0.25, 0.25, 12, 16]} />
        <primitive object={shirtMaterial} />
      </mesh>

      {/* ===== HEAD - Athletic Face ===== */}
      <mesh ref={headRef} position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.18, 20, 20]} />
        <primitive object={skinMaterial} />
      </mesh>
      
      {/* Jaw / chin - more defined */}
      <mesh position={[0, 1.22, 0.06]}>
        <boxGeometry args={[0.14, 0.08, 0.1]} />
        <primitive object={skinMaterial} />
      </mesh>
      
      {/* Hair - short athletic cut */}
      <mesh position={[0, 1.42, -0.02]}>
        <sphereGeometry args={[0.17, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <primitive object={hairMaterial} />
      </mesh>
      
      {/* Ears */}
      <mesh position={[0.17, 1.32, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <primitive object={skinMaterial} />
      </mesh>
      <mesh position={[-0.17, 1.32, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <primitive object={skinMaterial} />
      </mesh>

      {/* Neck - thick and muscular */}
      <mesh position={[0, 1.08, 0]}>
        <cylinderGeometry args={[0.09, 0.12, 0.14, 12]} />
        <primitive object={skinMaterial} />
      </mesh>
      
      {/* Trapezius muscles */}
      <mesh position={[0.12, 1.0, -0.02]} rotation={[0, 0, 0.4]}>
        <capsuleGeometry args={[0.06, 0.12, 8, 8]} />
        <primitive object={skinMaterial} />
      </mesh>
      <mesh position={[-0.12, 1.0, -0.02]} rotation={[0, 0, -0.4]}>
        <capsuleGeometry args={[0.06, 0.12, 8, 8]} />
        <primitive object={skinMaterial} />
      </mesh>

      {/* ===== LEFT ARM - Muscular ===== */}
      <group ref={leftArmRef} position={[0.48, 0.85, 0]} rotation={[0, 0, 0.12]}>
        {/* Upper arm / Bicep - thick */}
        <mesh position={[0.08, -0.18, 0]}>
          <capsuleGeometry args={[0.1, 0.28, 12, 12]} />
          <primitive object={skinMaterial} />
        </mesh>
        {/* Bicep peak */}
        <mesh position={[0.08, -0.12, 0.06]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <primitive object={skinMaterial} />
        </mesh>
        {/* Tricep */}
        <mesh position={[0.08, -0.2, -0.05]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <primitive object={skinMaterial} />
        </mesh>
        {/* Forearm - defined */}
        <mesh ref={leftForearmRef} position={[0.08, -0.48, 0]}>
          <capsuleGeometry args={[0.065, 0.28, 10, 10]} />
          <primitive object={skinMaterial} />
        </mesh>
        {/* Hand */}
        <mesh position={[0.08, -0.72, 0]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <primitive object={skinMaterial} />
        </mesh>
      </group>

      {/* ===== RIGHT ARM - Muscular ===== */}
      <group ref={rightArmRef} position={[-0.48, 0.85, 0]} rotation={[0, 0, -0.12]}>
        {/* Upper arm / Bicep */}
        <mesh position={[-0.08, -0.18, 0]}>
          <capsuleGeometry args={[0.1, 0.28, 12, 12]} />
          <primitive object={skinMaterial} />
        </mesh>
        {/* Bicep peak */}
        <mesh position={[-0.08, -0.12, 0.06]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <primitive object={skinMaterial} />
        </mesh>
        {/* Tricep */}
        <mesh position={[-0.08, -0.2, -0.05]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <primitive object={skinMaterial} />
        </mesh>
        {/* Forearm */}
        <mesh ref={rightForearmRef} position={[-0.08, -0.48, 0]}>
          <capsuleGeometry args={[0.065, 0.28, 10, 10]} />
          <primitive object={skinMaterial} />
        </mesh>
        {/* Hand */}
        <mesh position={[-0.08, -0.72, 0]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <primitive object={skinMaterial} />
        </mesh>
      </group>

      {/* ===== HIPS / WAIST ===== */}
      <mesh position={[0, -0.08, 0]}>
        <capsuleGeometry args={[0.22, 0.18, 12, 16]} />
        <primitive object={shortsMaterial} />
      </mesh>

      {/* ===== LEFT LEG - Athletic ===== */}
      <group ref={leftLegRef} position={[0.14, -0.28, 0]}>
        {/* Thigh - powerful quads */}
        <mesh position={[0, -0.22, 0]}>
          <capsuleGeometry args={[0.13, 0.36, 12, 12]} />
          <primitive object={shortsMaterial} />
        </mesh>
        {/* Quad definition */}
        <mesh position={[0, -0.18, 0.08]}>
          <sphereGeometry args={[0.09, 10, 10]} />
          <primitive object={shortsMaterial} />
        </mesh>
        {/* Calf - defined */}
        <mesh ref={leftCalfRef} position={[0, -0.62, 0]}>
          <capsuleGeometry args={[0.085, 0.36, 10, 10]} />
          <primitive object={skinMaterial} />
        </mesh>
        {/* Calf muscle bulge */}
        <mesh position={[0, -0.54, -0.04]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <primitive object={skinMaterial} />
        </mesh>
        {/* Ankle */}
        <mesh position={[0, -0.92, 0]}>
          <cylinderGeometry args={[0.05, 0.055, 0.08, 8]} />
          <primitive object={skinMaterial} />
        </mesh>
        {/* Shoe */}
        <mesh position={[0, -1.0, 0.04]}>
          <boxGeometry args={[0.1, 0.08, 0.18]} />
          <primitive object={shoesMaterial} />
        </mesh>
      </group>

      {/* ===== RIGHT LEG - Athletic ===== */}
      <group ref={rightLegRef} position={[-0.14, -0.28, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.22, 0]}>
          <capsuleGeometry args={[0.13, 0.36, 12, 12]} />
          <primitive object={shortsMaterial} />
        </mesh>
        {/* Quad definition */}
        <mesh position={[0, -0.18, 0.08]}>
          <sphereGeometry args={[0.09, 10, 10]} />
          <primitive object={shortsMaterial} />
        </mesh>
        {/* Calf */}
        <mesh ref={rightCalfRef} position={[0, -0.62, 0]}>
          <capsuleGeometry args={[0.085, 0.36, 10, 10]} />
          <primitive object={skinMaterial} />
        </mesh>
        {/* Calf muscle bulge */}
        <mesh position={[0, -0.54, -0.04]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <primitive object={skinMaterial} />
        </mesh>
        {/* Ankle */}
        <mesh position={[0, -0.92, 0]}>
          <cylinderGeometry args={[0.05, 0.055, 0.08, 8]} />
          <primitive object={skinMaterial} />
        </mesh>
        {/* Shoe */}
        <mesh position={[0, -1.0, 0.04]}>
          <boxGeometry args={[0.1, 0.08, 0.18]} />
          <primitive object={shoesMaterial} />
        </mesh>
      </group>
    </group>
  );
}
