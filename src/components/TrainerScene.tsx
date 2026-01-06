import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { AnimatedTrainer } from './AnimatedTrainer';

interface TrainerSceneProps {
  exercise: 'squat' | 'pushup' | 'bicepCurl' | 'idle';
  isAnimating: boolean;
}

/**
 * 3D Scene containing the animated trainer
 * Includes lighting, shadows, and camera controls
 */
export function TrainerScene({ exercise, isAnimating }: TrainerSceneProps) {
  return (
    <div className="w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden bg-gradient-to-b from-background to-muted/50 border border-border">
      <Canvas
        camera={{ position: [0, 1, 4], fov: 50 }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={1}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-5, 3, -5]} intensity={0.3} />
          
          {/* Accent lights for gym feel */}
          <pointLight position={[2, 3, 0]} intensity={0.5} color="#00FF9C" />
          <pointLight position={[-2, 3, 0]} intensity={0.3} color="#4CC9F0" />

          {/* The animated trainer */}
          <AnimatedTrainer exercise={exercise} isAnimating={isAnimating} />

          {/* Ground shadow */}
          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.4}
            scale={10}
            blur={2}
            far={4}
          />

          {/* Environment for reflections */}
          <Environment preset="studio" />

          {/* Camera controls - limited for better UX */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2}
            target={[0, 0.5, 0]}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
