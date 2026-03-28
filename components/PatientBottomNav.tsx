"use client";

import { useRouter, usePathname } from "next/navigation";

export default function PatientBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { label: "Ćwiczenia", icon: "🏠", path: "/patient" },
    { label: "Postępy", icon: "📈", path: "/patient/progress" },
    { label: "Plan", icon: "🧭", path: "/patient/plan" }, // 🔥 ZMIANA
    { label: "Profil", icon: "👤", path: "/patient/profile" },
  ];

  const isActive = (path: string) => {
    if (path === "/patient") {
      return pathname === "/patient";
    }
    return pathname.startsWith(path);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 85,
        backdropFilter: "blur(20px)",
        background: "rgba(15,23,42,0.95)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 100,
      }}
    >
      {tabs.map((tab) => {
        const active = isActive(tab.path);

        return (
          <div
            key={tab.path}
            onClick={() => router.push(tab.path)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              fontSize: 12,
              cursor: "pointer",
              color: active ? "#3B82F6" : "rgba(255,255,255,0.6)",
              transition: "0.2s ease",
              transform: active ? "scale(1.05)" : "scale(1)",
            }}
          >
            <div style={{ fontSize: 20 }}>{tab.icon}</div>
            {tab.label}
          </div>
        );
      })}
    </div>
  );
}