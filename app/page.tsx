"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import { XR, ARButton } from "@react-three/xr";

function Model() {
  const { scene } = useGLTF("/models/KIT GAMEOVERSE.glb");

  return <primitive object={scene} scale={0.3} />;
}

function Scene() {
  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[3, 4, 3]} intensity={2} />

      <Environment preset="city" />

      <Suspense fallback={null}>
        <Model />
      </Suspense>
    </>
  );
}

export default function Home() {
  const [supported, setSupported] = useState<boolean | null>(null);

  async function checkAR() {
    if (!navigator.xr) {
      setSupported(false);
      alert("WebXR tidak tersedia di browser ini");
      return;
    }

    const result = await navigator.xr.isSessionSupported("immersive-ar");
    setSupported(result);

    if (!result) {
      alert("Device kamu tidak support AR");
    }
  }

  return (
    <main style={{ width: "100vw", height: "100vh" }}>
      {/* UI BUTTON MANUAL CHECK */}
      <div style={{ position: "absolute", zIndex: 100, top: 20, left: 20 }}>
        <button
          onClick={checkAR}
          style={{
            padding: "12px 20px",
            borderRadius: 10,
            cursor: "pointer",
            marginRight: 10,
          }}
        >
          Check AR
        </button>

        {/* AR BUTTON hanya muncul kalau support */}
        {supported && <ARButton />}
      </div>

      <Canvas>
        <XR>
          <Scene />
        </XR>
      </Canvas>
    </main>
  );
}