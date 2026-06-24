// app/page.tsx
import dynamic from "next/dynamic";

// Semua logic AR/3D di-load client-only → fix SSR error Vercel
const ARScene = dynamic(() => import("./ar-scene"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#555",
        fontSize: 14,
        fontFamily: "sans-serif",
      }}
    >
      Loading...
    </div>
  ),
});

export default function Home() {
  return <ARScene />;
}