"use client";

import { useRouter } from "next/navigation";

type Props = {
  id: string;
  initials: string;
  name: string;
  condition: string;
  progress: number;
  status: string;
  color: string;
};

export default function PatientCard({
  id,
  initials,
  name,
  condition,
  progress,
  status,
  color,
}: Props) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/physio/patient/${id}`)}
      style={{
        cursor: "pointer",
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
        padding: 18,
        borderRadius: 22,
        marginBottom: 18,
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        transition: "transform 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#4AB3F4,#1A56C4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {initials}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{name}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>{condition}</div>
        </div>

        <div
          style={{
            fontSize: 11,
            padding: "6px 12px",
            borderRadius: 20,
            background: color,
            fontWeight: 600,
          }}
        >
          {status}
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          height: 8,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: color,
            borderRadius: 20,
          }}
        />
      </div>

      <div
        style={{
          fontSize: 11,
          marginTop: 6,
          opacity: 0.6,
          textAlign: "right",
        }}
      >
        {progress}% ukończono
      </div>
    </div>
  );
}