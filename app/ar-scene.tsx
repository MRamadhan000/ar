// app/ar-scene.tsx
"use client";

import { Suspense, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { XR, ARButton, createXRStore, useXR, useXRHitTest } from "@react-three/xr";
import * as THREE from "three";

const store = createXRStore();

function Model({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF("/models/KIT GAMEOVERSE.glb");
  const cloned = scene.clone();
  return <primitive object={cloned} position={position} scale={0.3} />;
}

function HitTestManager({
  onHit,
}: {
  onHit: (pos: THREE.Vector3 | null) => void;
}) {
  const reticleRef = useRef<THREE.Mesh>(null!);
  const matrix = new THREE.Matrix4();
  const pos = new THREE.Vector3();

  useXRHitTest(
    (results, getWorldMatrix) => {
      if (results.length === 0) {
        if (reticleRef.current) reticleRef.current.visible = false;
        onHit(null);
        return;
      }
      getWorldMatrix(matrix, results[0]);
      pos.setFromMatrixPosition(matrix);
      if (reticleRef.current) {
        reticleRef.current.position.copy(pos);
        reticleRef.current.visible = true;
      }
      onHit(pos.clone());
    },
    "viewer"
  );

  return (
    <mesh ref={reticleRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.05, 0.08, 32]} />
      <meshBasicMaterial color="#00eaff" side={THREE.DoubleSide} />
    </mesh>
  );
}

function SceneContent({
  onHitUpdate,
}: {
  onHitUpdate: (pos: THREE.Vector3 | null) => void;
}) {
  const [placedList, setPlacedList] = useState<[number, number, number][]>([]);
  const session = useXR((state) => state.session);
  const isPresenting = session != null;

  if (typeof window !== "undefined") {
    (window as any).__placeObject = (p: THREE.Vector3) => {
      setPlacedList((prev) => [...prev, [p.x, p.y, p.z]]);
    };
  }

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[3, 4, 3]} intensity={2} />

      {!isPresenting && (
        <Suspense fallback={null}>
          <Model position={[0, 0, -1.5]} />
        </Suspense>
      )}

      {isPresenting && (
        <>
          <HitTestManager onHit={onHitUpdate} />
          {placedList.map((p, i) => (
            <Suspense key={i} fallback={null}>
              <Model position={p} />
            </Suspense>
          ))}
        </>
      )}
    </>
  );
}

export default function ARScene() {
  const [currentHit, setCurrentHit] = useState<THREE.Vector3 | null>(null);

  function handlePlace() {
    if (currentHit && typeof window !== "undefined") {
      (window as any).__placeObject?.(currentHit);
    }
  }

  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        background: "#0a0a0a",
      }}
    >
      {/* Tombol Enter AR */}
      <div
        style={{
          position: "fixed",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <ARButton
          store={store}
          style={{
            padding: "14px 36px",
            borderRadius: 14,
            background: "linear-gradient(135deg,#0070f3,#00c6ff)",
            color: "white",
            fontWeight: "bold",
            fontSize: 16,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 24px rgba(0,112,243,0.45)",
          }}
        />
        <span style={{ color: "#555", fontSize: 11 }}>
          Chrome Android + ARCore diperlukan
        </span>
      </div>

      {/* Tombol Place — muncul saat permukaan terdeteksi */}
      {currentHit && (
        <button
          onClick={handlePlace}
          style={{
            position: "fixed",
            bottom: 130,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
            padding: "13px 28px",
            borderRadius: 12,
            background: "#00eaff",
            color: "#000",
            fontWeight: "bold",
            fontSize: 15,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(0,234,255,0.35)",
          }}
        >
          📍 Taruh Objek di Sini
        </button>
      )}

      <Canvas
        camera={{ position: [0, 1.6, 3], fov: 70 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <XR store={store}>
          <SceneContent onHitUpdate={setCurrentHit} />
        </XR>
      </Canvas>
    </main>
  );
}