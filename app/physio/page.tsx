"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function PhysioDashboard() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserEmail(user.email ?? "");

      const { data: patientsData } = await supabase
        .from("patients")
        .select("id, full_name, condition, plan_id, adherence")
        .eq("physio_id", user.id);

      if (!patientsData) return;

      const enrichedPatients = await Promise.all(
        patientsData.map(async (p) => {

          // ✅ FIX — było patientData → ma być p
          if (!p.plan_id) {
            console.warn("Brak plan_id dla pacjenta", p.id);
            return {
              ...p,
              progress: 0,
              adherence: p.adherence ?? 0
            };
          }

          const { data: stages } = await supabase
            .from("plan_stages")
            .select("id")
            .eq("plan_id", p.plan_id);

          const stageIds = stages?.map(s => s.id) || [];

          const { data: exercises } = await supabase
            .from("plan_exercises")
            .select("id")
            .in("stage_id", stageIds);

          const total = exercises?.length || 0;

          const { data: done } = await supabase
            .from("patient_exercises")
            .select("created_at")
            .eq("patient_id", p.id)
            .eq("completed", true);

          const completed = done?.length || 0;

          const progress =
            total > 0 ? Math.round((completed / total) * 100) : 0;

          const today = new Date();

          const last3Days = [0, 1, 2].map(d => {
            const date = new Date();
            date.setDate(today.getDate() - d);
            return date.toISOString().split("T")[0];
          });

          const activeDays = new Set(
            done
              ?.map(r => r.created_at?.split("T")[0])
              .filter(d => last3Days.includes(d))
          );

          const adherence =
            p.adherence !== null
              ? p.adherence
              : Math.round((activeDays.size / 3) * 100);

          return {
            ...p,
            progress,
            adherence,
          };
        })
      );

      setPatients(enrichedPatients);
      setLoading(false);
    };

    loadData();
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const attentionPatients = patients.filter(
    (p) => p.progress < 30 || (p.adherence || 0) < 50
  );

  const avgAdherence =
    patients.length > 0
      ? Math.round(
          patients.reduce((sum, p) => sum + (p.adherence || 0), 0) /
            patients.length
        )
      : 0;

  const getStatus = (progress: number) => {
    if (progress >= 75) return { label: "Zielony", color: "#22C55E" };
    if (progress >= 40) return { label: "Żółty", color: "#F59E0B" };
    return { label: "Czerwony", color: "#EF4444" };
  };

  return (
    <div
      className="physio-full"
      style={{
        fontFamily: "'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif"
      }}
    >

      {/* HEADER */}
      <div
        style={{
          background: "linear-gradient(135deg,#3B82F6,#2563EB)",
          padding: "22px 20px 26px 20px",
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          color: "white"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>
            Witaj z powrotem
          </div>
          <div style={{ cursor: "pointer", fontSize: 13, fontWeight: 500 }} onClick={logout}>
            Wyloguj
          </div>
        </div>

        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>
          {userEmail}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
          <StatCard value={patients.length} label="Pacjentów" />
          <StatCard value={attentionPatients.length} label="Alerty" />
          <StatCard value={avgAdherence + "%"} label="Aktywność" />
        </div>
      </div>

      {/* BODY */}
      <div className="physio-body" style={{ marginTop: 20 }}>

        <SectionTitle title="Twoi pacjenci" />

        {patients.slice(0, expanded ? 5 : 2).map((p) => {
          const status = getStatus(p.progress || 0);
          const isAlert = (p.adherence || 0) < 50;

          return (
            <div
              key={p.id}
              onClick={() => router.push(`/physio/patient/${p.id}`)}
              style={{
                background: "linear-gradient(180deg,#FFFFFF,#F8FAFC)",
                border: "1px solid #E2E8F0",
                borderRadius: 20,
                padding: 16,
                marginBottom: 14,
                cursor: "pointer",
                boxShadow: "0 10px 25px rgba(0,0,0,0.06)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 15 }}>
                  {p.full_name || "Bez imienia"}
                </div>

                <div
                  style={{
                    background: `${status.color}15`,
                    color: status.color,
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600
                  }}
                >
                  {status.label}
                </div>
              </div>

              <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
                {p.condition}
              </div>

              <div style={{ fontSize: 12, marginTop: 6, color: "#334155" }}>
                Postęp: {p.progress}% • Aktywność: {p.adherence || 0}%
                {isAlert && " ⚠️"}
              </div>

              <div
                style={{
                  height: 6,
                  background: "#E2E8F0",
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

        {patients.length > 2 && (
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: "#ffffff",
                border: "1px solid #E2E8F0",
                padding: "6px 18px",
                borderRadius: 18,
                fontSize: 13,
                cursor: "pointer",
                fontWeight: 500
              }}
            >
              {expanded ? "Zwiń" : "Rozwiń"}
            </button>
          </div>
        )}

        <SectionTitle title="Wymagają uwagi" />

        {attentionPatients.slice(0, 3).map((p) => (
          <div
            key={p.id}
            style={{
              background: "linear-gradient(180deg,#FFFFFF,#F8FAFC)",
              border: "1px solid rgba(239,68,68,0.25)",
              padding: 16,
              borderRadius: 18,
              marginBottom: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 10px 25px rgba(0,0,0,0.06)"
            }}
          >
            <div>
              <div style={{ fontWeight: 600, color: "#0F172A" }}>
                {p.full_name}
              </div>
              <div style={{ fontSize: 13, color: "#475569" }}>
                Postęp: {p.progress}% • Aktywność: {p.adherence || 0}% ⚠️
              </div>
            </div>

            <div
              onClick={() => router.push(`/physio/patient/${p.id}`)}
              style={{
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                color: "#EF4444"
              }}
            >
              Zobacz →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* KOMPONENTY */

function StatCard({ value, label }: any) {
  return (
    <div
      style={{
        flex: 1,
        background: "linear-gradient(180deg,#FFFFFF,#F8FAFC)",
        border: "1px solid #E2E8F0",
        padding: 14,
        borderRadius: 18,
        textAlign: "center",
        boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
        color: "#0F172A"
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "#64748B" }}>
        {label}
      </div>
    </div>
  );
}

function SectionTitle({ title }: any) {
  return (
    <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 16 }}>
      {title}
    </div>
  );
}