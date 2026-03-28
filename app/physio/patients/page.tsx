"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    const loadPatients = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

<div style={{ background: "red", padding: 20 }}>
  TEST PACJENCI
</div>

      const { data } = await supabase
        .from("patients")
        .select("id, full_name, condition, progress")
        .eq("physio_id", user.id);

      setPatients(data ?? []);
    };

    loadPatients();
  }, [router]);

  const getStatus = (progress: number) => {
    if (progress >= 75) return { label: "Zielony", color: "#22C55E" };
    if (progress >= 40) return { label: "Żółty", color: "#F59E0B" };
    return { label: "Czerwony", color: "#EF4444" };
  };

  const avgProgress =
    patients.length > 0
      ? Math.round(
          patients.reduce((sum, p) => sum + (p.progress || 0), 0) /
            patients.length
        )
      : 0;

  return (
    <div className="physio-full">

      {/* HEADER */}
<div
  style={{
    background: "linear-gradient(180deg,#1E40AF,#1E3A8A)",
    padding: "20px 18px 24px 18px",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  }}
>
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

    {/* 🔥 DZIUBEK – MINI PREMIUM */}
    <div
      onClick={() => router.push("/physio")}
      style={{
        fontSize: 18,
        fontWeight: 600,
        cursor: "pointer",
        lineHeight: 1,
        opacity: 0.9,
        transform: "translateY(-1px)"
      }}
    >
      {"<"}
    </div>

    <div style={{ fontSize: 18, fontWeight: 700 }}>
      Pacjenci
    </div>

  </div>
</div>

      {/* 🔥 WIDGET – TEN SAM STYL CO KARTY */}
      <div style={{ padding: "16px" }}>
        <div
          style={{
            background: "rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 16
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Podsumowanie
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {patients.length}
              </div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>
                Pacjentów
              </div>
            </div>

            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {avgProgress}%
              </div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>
                Śr. postęp
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LISTA */}
      <div className="physio-body" style={{ marginTop: 6 }}>

        {patients.map((p) => {
          const status = getStatus(p.progress || 0);

          return (
            <div
              key={p.id}
              onClick={() => router.push(`/physio/patient/${p.id}`)}
              style={{
                background: "rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: 14,
                marginBottom: 12,
                cursor: "pointer"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {p.full_name || "Bez imienia"}
                </div>

                <div
                  style={{
                    background: status.color,
                    padding: "3px 9px",
                    borderRadius: 20,
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {status.label}
                </div>
              </div>

              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                {p.condition}
              </div>

              <div
                style={{
                  height: 5,
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  marginTop: 10,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${p.progress || 0}%`,
                    height: "100%",
                    background: status.color,
                  }}
                />
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}