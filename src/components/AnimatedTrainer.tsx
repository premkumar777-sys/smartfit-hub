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

  // Holographic blue material for the body
  const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#4CC9F0',
    transparent: true,
    opacity: 0.35,
    roughness: 0.3,
    metalness: 0.8,
    emissive: '#4CC9F0',
    emissiveIntensity: 0.2,
  }), []);

  // Glowing joint nodes
  const jointMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#00FF9C',
    emissive: '#00FF9C',
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.9,
  }), []);

  // Skeletal segment material
  const skeletonMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#00FF9C',
    transparent: true,
    opacity: 0.5,
    emissive: '#00FF9C',
    emissiveIntensity: 0.5,
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
      {/* ===== TORSO - Holographic blueprint ===== */}
      <mesh ref={torsoRef} position={[0, 0.6, 0]}>
        <capsuleGeometry args={[0.32, 0.55, 12, 20]} />
        <primitive object={bodyMaterial} />
      </mesh>

      {/* Lower torso area */}
      <mesh position={[0, 0.2, 0]}>
        <capsuleGeometry args={[0.25, 0.25, 12, 16]} />
        <primitive object={bodyMaterial} />
      </mesh>

      {/* ===== HEAD ===== */}
      <mesh ref={headRef} position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.18, 20, 20]} />
        <primitive object={bodyMaterial} />
      </mesh>

      {/* Neck Joint Node */}
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <primitive object={jointMaterial} />
      </mesh>

      {/* ===== JOINTS & SKELETON (Picture 2 Style) ===== */}

      {/* Center Spine Line */}
      <mesh position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.9, 8]} />
        <primitive object={skeletonMaterial} />
      </mesh>

      {/* Shoulder Line */}
      <mesh position={[0, 0.88, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.9, 8]} />
        <primitive object={skeletonMaterial} />
      </mesh>

      {/* Shoulder Joint Nodes */}
      <mesh position={[0.45, 0.88, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <primitive object={jointMaterial} />
      </mesh>
      <mesh position={[-0.45, 0.88, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <primitive object={jointMaterial} />
      </mesh>

      {/* ===== LEFT ARM - Skeletal ===== */}
      <group ref={leftArmRef} position={[0.45, 0.88, 0]} rotation={[0, 0, 0.12]}>
        {/* Upper arm body */}
        <mesh position={[0.08, -0.18, 0]}>
          <capsuleGeometry args={[0.1, 0.28, 12, 12]} />
          <primitive object={bodyMaterial} />
        </mesh>

        {/* Upper arm bone */}
        <mesh position={[0.08, -0.18, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.35, 8]} />
          <primitive object={skeletonMaterial} />
        </mesh>

        {/* Elbow Joint Node */}
        <group position={[0.08, -0.4, 0]}>
          <mesh>
            <sphereGeometry args={[0.07, 16, 16]} />
            <primitive object={jointMaterial} />
          </mesh>

          {/* Forearm body */}
          <mesh ref={leftForearmRef} position={[0, -0.2, 0]}>
            <capsuleGeometry args={[0.065, 0.28, 10, 10]} />
            <primitive object={bodyMaterial} />
          </mesh>

          {/* Forearm bone */}
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.35, 8]} />
            <primitive object={skeletonMaterial} />
          </mesh>

          {/* Wrist Joint Node */}
          <mesh position={[0, -0.4, 0]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <primitive object={jointMaterial} />
          </mesh>
        </group>
      </group>

      {/* ===== RIGHT ARM - Skeletal ===== */}
      <group ref={rightArmRef} position={[-0.45, 0.88, 0]} rotation={[0, 0, -0.12]}>
        {/* Upper arm body */}
        <mesh position={[-0.08, -0.18, 0]}>
          <capsuleGeometry args={[0.1, 0.28, 12, 12]} />
          <primitive object={bodyMaterial} />
        </mesh>

        {/* Upper arm bone */}
        <mesh position={[-0.08, -0.18, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.35, 8]} />
          <primitive object={skeletonMaterial} />
        </mesh>

        {/* Elbow Joint Node */}
        <group position={[-0.08, -0.4, 0]}>
          <mesh>
            <sphereGeometry args={[0.07, 16, 16]} />
            <primitive object={jointMaterial} />
          </mesh>

          {/* Forearm body */}
          <mesh ref={rightForearmRef} position={[0, -0.2, 0]}>
            <capsuleGeometry args={[0.065, 0.28, 10, 10]} />
            <primitive object={bodyMaterial} />
          </mesh>

          {/* Forearm bone */}
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.35, 8]} />
            <primitive object={skeletonMaterial} />
          </mesh>

          {/* Wrist Joint Node */}
          <mesh position={[0, -0.4, 0]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <primitive object={jointMaterial} />
          </mesh>
        </group>
      </group>

      {/* ===== HIPS / PELVIS ===== */}
      <mesh position={[0, -0.08, 0]}>
        <capsuleGeometry args={[0.22, 0.18, 12, 16]} />
        <primitive object={bodyMaterial} />
      </mesh>

      {/* Hip Line */}
      <mesh position={[0, -0.08, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
        <primitive object={skeletonMaterial} />
      </mesh>

      {/* Hip Joint Nodes */}
      <mesh position={[0.2, -0.08, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <primitive object={jointMaterial} />
      </mesh>
      <mesh position={[-0.2, -0.08, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <primitive object={jointMaterial} />
      </mesh>

      {/* ===== LEFT LEG - Skeletal ===== */}
      <group ref={leftLegRef} position={[0.2, -0.08, 0]}>
        {/* Thigh body */}
        <mesh position={[0, -0.3, 0]}>
          <capsuleGeometry args={[0.13, 0.4, 12, 12]} />
          <primitive object={bodyMaterial} />
        </mesh>

        {/* Thigh bone */}
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
          <primitive object={skeletonMaterial} />
        </mesh>

        {/* Knee Joint Node */}
        <group position={[0, -0.6, 0]}>
          <mesh>
            <sphereGeometry args={[0.09, 16, 16]} />
            <primitive object={jointMaterial} />
          </mesh>

          {/* Calf body */}
          <mesh ref={leftCalfRef} position={[0, -0.3, 0]}>
            <capsuleGeometry args={[0.085, 0.4, 10, 10]} />
            <primitive object={bodyMaterial} />
          </mesh>

          {/* Calf bone */}
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
            <primitive object={skeletonMaterial} />
          </mesh>

          {/* Ankle Joint Node */}
          <mesh position={[0, -0.6, 0]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <primitive object={jointMaterial} />
          </mesh>
        </group>
      </group>

      {/* ===== RIGHT LEG - Skeletal ===== */}
      <group ref={rightLegRef} position={[-0.2, -0.08, 0]}>
        {/* Thigh body */}
        <mesh position={[0, -0.3, 0]}>
          <capsuleGeometry args={[0.13, 0.4, 12, 12]} />
          <primitive object={bodyMaterial} />
        </mesh>

        {/* Thigh bone */}
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
          <primitive object={skeletonMaterial} />
        </mesh>

        {/* Knee Joint Node */}
        <group position={[0, -0.6, 0]}>
          <mesh>
            <sphereGeometry args={[0.09, 16, 16]} />
            <primitive object={jointMaterial} />
          </mesh>

          {/* Calf body */}
          <mesh ref={rightCalfRef} position={[0, -0.3, 0]}>
            <capsuleGeometry args={[0.085, 0.4, 10, 10]} />
            <primitive object={bodyMaterial} />
          </mesh>

          {/* Calf bone */}
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
            <primitive object={skeletonMaterial} />
          </mesh>

          {/* Ankle Joint Node */}
          <mesh position={[0, -0.6, 0]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <primitive object={jointMaterial} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
  );
}
