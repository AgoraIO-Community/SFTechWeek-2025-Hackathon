"use client";

import dynamic from "next/dynamic";

const HeyGenTestComponent = dynamic(() => import("./HeyGenTestComponent"), {
  ssr: false,
  loading: () => <div style={{ padding: "2rem" }}>Loading HeyGen SDK...</div>,
});

export default function HeyGenTestPage() {
  return <HeyGenTestComponent />;
}
