"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh } from "three";

interface GeomProps {
  position: [number, number, number];
  rotationSpeed: [number, number, number];
  floatAmp?: number;
  floatSpeed?: number;
  color?: string;
  materialOpacity?: number;
  emissiveIntensity?: number;
}

function FloatingMesh({
  position,
  rotationSpeed,
  floatAmp = 0.3,
  floatSpeed = 1,
  color = "#c8ff00",
  materialOpacity = 0.25,
  emissiveIntensity = 0.4,
  children,
}: GeomProps & { children: React.ReactNode }) {
  const ref = useRef<Mesh>(null);
  const tRef = useRef(0);
  const initY = position[1];

  useFrame((_, delta) => {
    if (!ref.current) return;
    tRef.current += delta;
    ref.current.rotation.x += rotationSpeed[0];
    ref.current.rotation.y += rotationSpeed[1];
    ref.current.rotation.z += rotationSpeed[2];
    ref.current.position.y = initY + Math.sin(tRef.current * floatSpeed) * floatAmp;
  });

  return (
    <mesh ref={ref} position={position}>
      {children}
      <meshStandardMaterial
        color={color}
        wireframe
        transparent
        opacity={materialOpacity}
        emissive={color}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  );
}

export function FloatingGeometry({ isMobile }: { isMobile: boolean }) {
  const torusPosition: [number, number, number] = isMobile
    ? [-0.1, 2, -0.75]
    : [-0.5, 1.8, -1];

  const torusKnotPosition: [number, number, number] = isMobile
    ? [1, -3, -0.95]
    : [2.5, 0.5, -1];

  const torusArgs = isMobile
    ? ([0.45, 0.16, 18, 56] as [number, number, number, number])
    : ([0.35, 0.12, 16, 48] as [number, number, number, number]);

  const torusFloatAmp = isMobile ? 0.18 : 0.15;
  const torusMaterialOpacity = isMobile ? 0.33 : 0.25;
  const torusEmissiveIntensity = isMobile ? 0.65 : 0.4;

  return (
    <group>
      <FloatingMesh
        position={torusKnotPosition}
        rotationSpeed={[0.003, 0.005, 0.001]}
        floatSpeed={0.7}
        floatAmp={0.25}
        color="#c8ff00"
      >
        <torusKnotGeometry args={[0.5, 0.15, 128, 16]} />
      </FloatingMesh>

      <FloatingMesh
        position={[-2.8, -0.3, -0.5]}
        rotationSpeed={[0.004, 0.002, 0.003]}
        floatSpeed={0.9}
        floatAmp={0.35}
        color="#7b61ff"
      >
        <icosahedronGeometry args={[0.7, 1]} />
      </FloatingMesh>

      <FloatingMesh
        position={[0.8, -2.0, 0.5]}
        rotationSpeed={[0.002, 0.006, 0.002]}
        floatSpeed={1.1}
        floatAmp={0.2}
        color="#ff6b35"
      >
        <octahedronGeometry args={[0.5, 0]} />
      </FloatingMesh>

      <FloatingMesh
        position={torusPosition}
        rotationSpeed={isMobile ? [0.004, 0.003, 0.004] : [0.005, 0.003, 0.004]}
        floatSpeed={1.3}
        floatAmp={torusFloatAmp}
        color="#c8ff00"
        materialOpacity={torusMaterialOpacity}
        emissiveIntensity={torusEmissiveIntensity}
      >
        <torusGeometry args={torusArgs} />
      </FloatingMesh>
    </group>
  );
}
