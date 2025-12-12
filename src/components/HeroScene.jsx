// HeroScene.jsx - Three.js Hero Scene with Floating Elements
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Environment, Text } from '@react-three/drei';
import './HeroScene.css';

// Element colors matching Genshin
const ELEMENT_COLORS = {
    Pyro: '#ff6b2b',
    Hydro: '#4fc3ff',
    Electro: '#b794ff',
    Cryo: '#a0e7ff',
    Anemo: '#74ffb8',
    Geo: '#ffb84f',
    Dendro: '#a5c83b',
};

// Floating Element Cards
function FloatingCard({ position, elementName, color, index }) {
    const meshRef = useRef();

    useFrame((state) => {
        if (!meshRef.current) return;

        const time = state.clock.elapsedTime;
        // Orbit in circle
        const radius = 2.5;
        const angle = (time * 0.3) + (index * (Math.PI * 2) / 7);
        meshRef.current.position.x = Math.cos(angle) * radius;
        meshRef.current.position.z = Math.sin(angle) * radius;
        meshRef.current.position.y = position[1] + Math.sin(time + index) * 0.3;

        // Face outward
        meshRef.current.rotation.y = -angle;
    });

    return (
        <Float
            speed={2}
            rotationIntensity={0.5}
            floatIntensity={0.5}
        >
            <mesh ref={meshRef} position={position}>
                <planeGeometry args={[1, 1.2]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.5}
                    transparent
                    opacity={0.8}
                />
                <Text
                    position={[0, 0, 0.01]}
                    fontSize={0.2}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    fontWeight="bold"
                >
                    {elementName}
                </Text>
            </mesh>
        </Float>
    );
}

// Main Scene
function Scene({ activeElement = 'Anemo' }) {
    const elements = useMemo(() => [
        { name: 'Pyro', color: ELEMENT_COLORS.Pyro },
        { name: 'Hydro', color: ELEMENT_COLORS.Hydro },
        { name: 'Electro', color: ELEMENT_COLORS.Electro },
        { name: 'Cryo', color: ELEMENT_COLORS.Cryo },
        { name: 'Anemo', color: ELEMENT_COLORS.Anemo },
        { name: 'Geo', color: ELEMENT_COLORS.Geo },
        { name: 'Dendro', color: ELEMENT_COLORS.Dendro },
    ], []);

    return (
        <>
            {/* Lights */}
            <ambientLight intensity={0.4} />
            <pointLight
                position={[0, 5, 0]}
                intensity={1.5}
                color={ELEMENT_COLORS[activeElement] || '#74ffb8'}
                distance={10}
            />
            <pointLight position={[5, 2, 5]} intensity={0.8} color="#4fc3ff" />
            <pointLight position={[-5, 2, -5]} intensity={0.8} color="#b794ff" />

            {/* Floating Element Cards */}
            {elements.map((elem, i) => (
                <FloatingCard
                    key={elem.name}
                    position={[0, 0, 0]}
                    elementName={elem.name}
                    color={elem.color}
                    index={i}
                />
            ))}

            {/* Environment */}
            <Environment preset="night" />

            {/* Camera Controls */}
            <OrbitControls
                enableZoom={false}
                enablePan={false}
                maxPolarAngle={Math.PI / 2}
                minPolarAngle={Math.PI / 3}
                autoRotate
                autoRotateSpeed={0.5}
            />
        </>
    );
}

// Main Component
export default function HeroScene({ activeElement = 'Anemo', className = '' }) {
    return (
        <div className={`hero-scene ${className}`}>
            <Canvas
                camera={{ position: [0, 3, 6], fov: 50 }}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: 'high-performance'
                }}
            >
                <Scene activeElement={activeElement} />
            </Canvas>
        </div>
    );
}
