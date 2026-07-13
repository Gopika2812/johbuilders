import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, SoftShadows } from '@react-three/drei';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// --- UTILITIES ---
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
const mapRange = (val, inMin, inMax) => clamp((val - inMin) / (inMax - inMin), 0, 1);
const easeInOut = gsap.parseEase("power2.inOut");
const easeOut = gsap.parseEase("expo.out");

// --- FALLBACK COMPONENTS ---
const LoadingFallback = () => (
  <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', color: '#fff', zIndex: -1 }}>
    <p style={{ fontFamily: 'sans-serif', letterSpacing: '2px', textTransform: 'uppercase' }}>Loading 3D Background...</p>
  </div>
);

const ReducedMotionFallback = () => (
  <div style={{ position: 'fixed', inset: 0, zIndex: -1, backgroundColor: '#000' }}>
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to bottom, #1e293b, #000)' }} />
  </div>
);


// --- 3D SCENE ---
const HouseScene = ({ progressRef }) => {
  const basementRef = useRef(null);
  const foundationRef = useRef(null);
  const groundFrameRef = useRef(null);
  const upperFrameRef = useRef(null);
  const roofRef = useRef(null);
  const wallsRef = useRef(null);
  const windowsRef = useRef(null);
  const landscapingRef = useRef(null);

  const lightRef = useRef(null);
  const cameraRef = useRef(null);

  useFrame(() => {
    const p = progressRef.current.value;

    // 10–20%: Excavation pit + basement walls extrude upward
    const pBasement = easeInOut(mapRange(p, 0.1, 0.2));
    if (basementRef.current) {
      basementRef.current.position.y = -1 + (pBasement * 0.5); 
      basementRef.current.visible = p > 0.05;
    }

    // 20–30%: Foundation slab fades/slides in
    const pFoundation = easeOut(mapRange(p, 0.2, 0.3));
    if (foundationRef.current) {
      foundationRef.current.position.y = -0.5 + (pFoundation * 0.5);
      foundationRef.current.visible = p > 0.18;
      foundationRef.current.children.forEach(c => {
         if (c.material) c.material.opacity = pFoundation;
      });
    }

    // 30–45%: Ground floor structural frame rises 
    const pGroundFrame = easeOut(mapRange(p, 0.3, 0.45));
    if (groundFrameRef.current) {
      groundFrameRef.current.scale.y = pGroundFrame;
      groundFrameRef.current.position.y = (pGroundFrame - 1) * 0.5;
      groundFrameRef.current.visible = p > 0.28;
    }

    // 45–60%: Upper floor frame builds
    const pUpperFrame = easeOut(mapRange(p, 0.45, 0.6));
    if (upperFrameRef.current) {
      upperFrameRef.current.scale.y = pUpperFrame;
      upperFrameRef.current.position.y = 1 + (pUpperFrame - 1) * 0.5;
      upperFrameRef.current.visible = p > 0.43;
    }

    // 60–70%: Roof structure assembles
    const pRoof = easeOut(mapRange(p, 0.6, 0.7));
    if (roofRef.current) {
      roofRef.current.position.y = 5 - (pRoof * 2); 
      roofRef.current.visible = p > 0.58;
    }

    // 70–80%: Exterior walls/glass fade in 
    const pWalls = easeInOut(mapRange(p, 0.7, 0.8));
    if (wallsRef.current) {
      wallsRef.current.position.y = -0.5 + (pWalls * 0.5);
      wallsRef.current.children.forEach(c => {
        if (c.material) c.material.opacity = pWalls;
      });
      wallsRef.current.visible = p > 0.68;
    }

    // 80–90%: Details pop in
    const pWindows = easeOut(mapRange(p, 0.8, 0.9));
    if (windowsRef.current) {
      windowsRef.current.scale.setScalar(pWindows);
      windowsRef.current.visible = p > 0.78;
    }

    // 90–100%: Landscaping + lighting shifts
    const pLandscaping = easeInOut(mapRange(p, 0.9, 1.0));
    if (landscapingRef.current) {
      landscapingRef.current.scale.setScalar(pLandscaping);
      landscapingRef.current.position.y = (pLandscaping - 1) * 0.5;
      landscapingRef.current.visible = p > 0.88;
    }

    // Premium Lighting shift: Cool Blue to Warm Golden Hour
    if (lightRef.current) {
        const lightProgress = mapRange(p, 0.7, 1.0);
        lightRef.current.intensity = 1 + (lightProgress * 1.5);
        lightRef.current.color.setHSL(0.58 - (lightProgress * 0.48), 0.5 + (lightProgress * 0.3), 0.8 - (lightProgress * 0.2));
    }

    // Premium Camera Movement: Push the model right to keep it behind content, and orbit
    if (cameraRef.current) {
        // Add a slow continuous rotation based on time so it's always 'alive'
        const time = performance.now() * 0.0001;
        const scrollAngle = p * Math.PI * 0.3; 
        const camAngle = scrollAngle + time; 
        
        const radius = 15 - (p * 5); // Dolly in
        
        // Offset the X position so the house is slightly off-center (great for a background!)
        // Adjust the Math.sin addition to move it further to the right or left of the text content.
        cameraRef.current.position.x = Math.sin(camAngle) * radius - 2; 
        cameraRef.current.position.z = Math.cos(camAngle) * radius;
        cameraRef.current.position.y = 4 - (p * 2); 
        cameraRef.current.lookAt(-2, 1, 0); // Keep looking at the offset house
    }
  });

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[-2, 4, 15]} fov={45} />
      
      <SoftShadows size={20} samples={16} focus={0.5} />
      <Environment preset="city" />
      
      <directionalLight 
        ref={lightRef} 
        position={[10, 15, 10]} 
        intensity={1} 
        color="#aaccff" 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <ambientLight intensity={0.4} />

      {/* 0-10%: Plot (Made it a bit more visible with wireframe grid) */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.51, 0]}>
        <planeGeometry args={[40, 40, 10, 10]} />
        <meshStandardMaterial color="#ff0000" roughness={0.5} wireframe={false} opacity={0.8} transparent />
      </mesh>

      {/* BIG FLOATING CUBE TO BE 100% SURE IT'S RENDERING */}
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[4, 4, 4]} />
        <meshStandardMaterial color="#00ff00" />
      </mesh>

      <group ref={basementRef}>
        <mesh castShadow receiveShadow position={[0, -0.5, 0]}>
          <boxGeometry args={[8, 1, 6]} />
          <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
        </mesh>
      </group>

      <group ref={foundationRef}>
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[8.4, 0.2, 6.4]} />
          <meshStandardMaterial color="#555" roughness={0.8} transparent opacity={0} />
        </mesh>
      </group>

      <group ref={groundFrameRef}>
        <mesh castShadow position={[0, 0.6, 0]}>
          <boxGeometry args={[8, 1, 6]} />
          <meshStandardMaterial color="#4a3728" wireframe />
        </mesh>
      </group>

      <group ref={upperFrameRef}>
        <mesh castShadow position={[0, 1.6, 0]}>
          <boxGeometry args={[8, 1, 6]} />
          <meshStandardMaterial color="#4a3728" wireframe />
        </mesh>
      </group>

      <group ref={roofRef}>
        <mesh castShadow position={[0, 3, 0]}>
          <coneGeometry args={[5, 2, 4]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
      </group>

      <group ref={wallsRef}>
        <mesh castShadow position={[0, 1.1, 0]}>
          <boxGeometry args={[8.2, 2, 6.2]} />
          <meshPhysicalMaterial 
            color="#ffffff" 
            transmission={0.95}
            opacity={0} 
            transparent 
            roughness={0.05} 
            metalness={0.1}
            ior={1.5}
            thickness={0.5}
          />
        </mesh>
      </group>

      <group ref={windowsRef}>
        <mesh position={[0, 0.5, 3.11]} castShadow>
          <boxGeometry args={[1.2, 2, 0.1]} />
          <meshStandardMaterial color="#2d1c10" roughness={0.4} />
        </mesh>
      </group>

      <group ref={landscapingRef}>
        <group position={[4.5, 0, 4.5]}>
          <mesh castShadow position={[0, 1.5, 0]}>
            <sphereGeometry args={[1.2, 16, 16]} />
            <meshStandardMaterial color="#1e3d1a" roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.2, 0.3, 1]} />
            <meshStandardMaterial color="#3a2818" />
          </mesh>
        </group>
      </group>
    </>
  );
};

// --- MAIN WRAPPER COMPONENT ---
export default function SiteBackgroundHouse() {
  const progressRef = useRef({ value: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const onChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    // Listen to the scroll of the entire document
    const st = ScrollTrigger.create({
      trigger: document.documentElement,
      start: "top top",
      end: "bottom bottom",
      scrub: 1, 
      onUpdate: (self) => {
        progressRef.current.value = self.progress;
      }
    });

    return () => st.kill();
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return <ReducedMotionFallback />;
  }

  return (
    <div 
      style={{ 
        position: 'fixed', // Fixed to the viewport
        top: 0,
        left: 0,
        width: '100vw', 
        height: '100vh', 
        zIndex: 9999, // FORCING HIGH Z-INDEX TO DEBUG VISIBILITY
        pointerEvents: 'none', // Ensures users can click links/text layered on top
        opacity: 1 // Fully opaque
      }}
    >
      <Suspense fallback={<LoadingFallback />}>
        <Canvas shadows gl={{ antialias: true, pixelRatio: Math.min(window.devicePixelRatio, 2) }}>
          <HouseScene progressRef={progressRef} />
        </Canvas>
      </Suspense>
    </div>
  );
}
