// app/ar-scene.tsx
"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  XR,
  ARButton,
  createXRStore,
  useXR,
  useXRHitTest,
} from "@react-three/xr";
import * as THREE from "three";

const store = createXRStore({
  hand: false,
  controller: false,
});

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
  const matrix = useRef(new THREE.Matrix4());
  const pos = useRef(new THREE.Vector3());

  useXRHitTest((results, getWorldMatrix) => {
    if (results.length === 0) {
      if (reticleRef.current) reticleRef.current.visible = false;
      onHit(null);
      return;
    }
    getWorldMatrix(matrix.current, results[0]);
    pos.current.setFromMatrixPosition(matrix.current);
    if (reticleRef.current) {
      reticleRef.current.position.copy(pos.current);
      reticleRef.current.visible = true;
    }
    onHit(pos.current.clone());
  }, "viewer");

  return (
    <mesh ref={reticleRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.05, 0.08, 32]} />
      <meshBasicMaterial color="#00eaff" side={THREE.DoubleSide} />
    </mesh>
  );
}

function SceneContent({
  onHitUpdate,
  placedList,
}: {
  onHitUpdate: (pos: THREE.Vector3 | null) => void;
  placedList: [number, number, number][];
}) {
  const session = useXR((state) => state.session);
  const isPresenting = session != null;

  return (
    <>
      <ambientLight intensity={2} />
      <directionalLight position={[3, 4, 3]} intensity={2} />

      {/* Preview di browser biasa */}
      {!isPresenting && (
        <Suspense fallback={null}>
          <Model position={[0, 0, -1.5]} />
        </Suspense>
      )}

      {/* Mode AR aktif */}
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
  const [placedList, setPlacedList] = useState<[number, number, number][]>([]);
  const [arSupported, setArSupported] = useState<boolean | null>(null);

  // Cek dukungan AR saat mount
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.xr) {
      setArSupported(false);
      return;
    }
    navigator.xr
      .isSessionSupported("immersive-ar")
      .then(setArSupported)
      .catch(() => setArSupported(false));
  }, []);

  function handlePlace() {
    if (currentHit) {
      setPlacedList((prev) => [...prev, [currentHit.x, currentHit.y, currentHit.z]]);
    }
  }

  return (
    <main style={{ width: "100vw", height: "100vh", position: "relative", background: "#0a0a0a" }}>

      {/* === TOMBOL AR === */}
      <div
        style={{
          position: "fixed",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        {/* Tampilkan status AR support */}
        {arSupported === false && (
          <div style={{
            background: "#ff4444",
            color: "white",
            padding: "10px 20px",
            borderRadius: 10,
            fontSize: 13,
            textAlign: "center",
            maxWidth: 260,
          }}>
            ⚠️ AR tidak didukung di browser ini.<br />
            Gunakan Chrome Android dengan ARCore.
          </div>
        )}

        {/* ARButton dari library — auto handle session */}
        <ARButton
          store={store}
          style={{
            padding: "14px 36px",
            borderRadius: 14,
            background: arSupported === false
              ? "#444"
              : "linear-gradient(135deg,#0070f3,#00c6ff)",
            color: "white",
            fontWeight: "bold",
            fontSize: 16,
            border: "none",
            cursor: arSupported === false ? "not-allowed" : "pointer",
            boxShadow: "0 4px 24px rgba(0,112,243,0.45)",
            minWidth: 160,
          }}
        />

        <span style={{ color: "#555", fontSize: 11 }}>
          Butuh Chrome Android + ARCore
        </span>
      </div>

      {/* === TOMBOL TARUH OBJEK (muncul saat hit surface) === */}
      {currentHit && (
        <button
          onClick={handlePlace}
          style={{
            position: "fixed",
            bottom: 130,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 999,
            padding: "14px 32px",
            borderRadius: 12,
            background: "#00eaff",
            color: "#000",
            fontWeight: "bold",
            fontSize: 15,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(0,234,255,0.4)",
          }}
        >
          📍 Taruh Objek di Sini
        </button>
      )}

      {/* === CANVAS === */}
      {/* alpha:true wajib agar kamera AR tembus (tidak hitam) */}
      <Canvas
        camera={{ position: [0, 1.6, 3], fov: 70 }}
        gl={{
          alpha: true,          // ← WAJIB untuk AR passthrough
          antialias: true,
          preserveDrawingBuffer: true,
        }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "transparent", // ← JANGAN "#0a0a0a" di Canvas style
        }}
      >
        <XR store={store}>
          <SceneContent
            onHitUpdate={setCurrentHit}
            placedList={placedList}
          />
        </XR>
      </Canvas>
    </main>
  );
}