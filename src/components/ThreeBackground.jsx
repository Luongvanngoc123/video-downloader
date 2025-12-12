import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Sparkles, Cloud } from '@react-three/drei';
import * as THREE from 'three';

function FloatingParticles() {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y = state.clock.elapsedTime * 0.05;
            ref.current.rotation.x = state.clock.elapsedTime * 0.02;
        }
    });

    return (
        <group ref={ref}>
            <Sparkles
                count={200}
                scale={12}
                size={4}
                speed={0.4}
                opacity={0.5}
                color="#ffffff"
            />
            <Sparkles
                count={100}
                scale={10}
                size={6}
                speed={0.3}
                opacity={0.3}
                color="#ffd700" // Gold sparkles
            />
        </group>
    );
}

function BackgroundContent() {
    return (
        <>
            <color attach="background" args={['#0a0a1a']} />
            <fog attach="fog" args={['#0a0a1a', 5, 20]} />

            <Stars
                radius={100}
                depth={50}
                count={5000}
                factor={4}
                saturation={0}
                fade
                speed={1}
            />

            <FloatingParticles />

            <ambientLight intensity={0.5} />
        </>
    );
}

export default function ThreeBackground() {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: -1,
            pointerEvents: 'none',
            background: 'linear-gradient(to bottom, #1a1a2e, #16213e)' // Fallback
        }}>
            <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
                <BackgroundContent />
            </Canvas>
        </div>
    );
}
