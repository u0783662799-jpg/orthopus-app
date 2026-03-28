"use client";

import { useRouter, usePathname } from "next/navigation";

export default function PhysioBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { label: "Pulpit", icon: "🏠", path: "/physio" },
    { label: "Pacjenci", icon: "👥", path: "/physio/patients" },
    { label: "Ćwiczenia", icon: "🏋️", path: "/physio/plans" }, // ← ZMIENIONE
    { label: "Raporty", icon: "📊", path: "/physio/reports" },
  ];

  const isActive = (path: string) => {
    if (path === "/physio") {
      return pathname === "/physio";
    }

    if (path === "/physio/patients") {
      return (
        pathname.startsWith("/physio/patient") ||
        pathname === "/physio/patients"
      );
    }

    if (path === "/physio/plans") {
      return pathname.startsWith("/physio/plans");
    }

    return pathname === path;
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
      {tabs.slice(0, 2).map((tab) => {
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
            }}
          >
            <div style={{ fontSize: 20 }}>{tab.icon}</div>
            {tab.label}
          </div>
        );
      })}

      <div
        onClick={() => router.push("/physio/add-patient")}
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "linear-gradient(135deg,#2563EB,#1E40AF)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          fontWeight: 600,
          color: "white",
          cursor: "pointer",
          marginTop: -30,
          boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
        }}
      >
        +
      </div>

      {tabs.slice(2).map((tab) => {
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