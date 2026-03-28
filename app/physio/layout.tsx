"use client";

import PhysioBottomNav from "@/components/PhysioBottomNav";

export default function PhysioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        minHeight: "100vh",
        background: "transparent",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          position: "relative",
          background: "transparent",
        }}
      >
        <div style={{ paddingBottom: 100 }}>
          {children}
        </div>

        <PhysioBottomNav />
      </div>
    </div>
  );
}