"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ProgressPage() {

  const router = useRouter();

  const [progress, setProgress] = useState(0);
  const [stageStats, setStageStats] = useState<any[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [badges, setBadges] = useState<any[]>([]);
  const [patient, setPatient] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 🔐 GUARD — SPRAWDZENIE ROLI
    const { data: dbUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!dbUser || dbUser.role !== "patient") {
      router.push("/");
      return;
    }

    const { data: patientData } = await supabase
      .from("patients")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(); // 🔥 FIX 406

    if (!patientData) return;
    setPatient(patientData);

    const { data: stagesData } = await supabase
      .from("plan_stages")
      .select("*")
      .eq("plan_id", patientData.plan_id)
      .order("stage_order", { ascending: true });

    const { data: done } = await supabase
      .from("patient_exercises")
      .select("*")
      .eq("patient_id", patientData.id)
      .eq("completed", true);

    const doneIds = done?.map(d => d.exercise_id) || [];

    let total = 0;
    let completed = 0;

    const stats: any[] = [];

    for (let stage of stagesData || []) {

      const { data: ex } = await supabase
        .from("plan_exercises")
        .select("id")
        .eq("stage_id", stage.id);

      const totalStage = ex?.length || 0;
      const doneStage =
        ex?.filter(e => doneIds.includes(e.id)).length || 0;

      total += totalStage;
      completed += doneStage;

      stats.push({
        name: stage.name,
        percent:
          totalStage > 0
            ? Math.round((doneStage / totalStage) * 100)
            : 0
      });
    }

    setStageStats(stats);

    const percent =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    setProgress(percent);

    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);

    const todayStr = today.toISOString().split("T")[0];

    setTodayCount(
      done?.filter(d => d.created_at?.startsWith(todayStr)).length || 0
    );

    setWeekCount(
      done?.filter(d => new Date(d.created_at) >= weekAgo).length || 0
    );

    const { data: badgesData } = await supabase
      .from("badges")
      .select("*")
      .eq("patient_id", patientData.id);

    const unique = Array.from(
      new Map((badgesData || []).map(b => [b.code, b])).values()
    );

    setBadges(unique);
  };

  const getBadgeName = (code: string) => {
    const map: any = {
      first_step: "Pierwszy krok",
      progress_25: "25% ukończone",
      progress_50: "50% ukończone",
      progress_75: "75% ukończone",
      progress_100: "Plan ukończony",
      streak_3: "Systematyczny",
      streak_7: "Dyscyplina"
    };
    return map[code] || code;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#EAF2FF,#DCEBFF)",
        padding: 16
      }}
    >
      {/* HEADER */}
      <div
        style={{
          background: "linear-gradient(135deg,#3B82F6,#2563EB)",
          borderRadius: 24,
          padding: 20,
          color: "white",
          marginBottom: 20,
          boxShadow: "0 10px 30px rgba(37,99,235,0.25)"
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700 }}>
          Twoje postępy
        </div>
      </div>

      {/* KARTA GŁÓWNA */}
      <div
        style={{
          background: "white",
          borderRadius: 22,
          padding: 18,
          marginBottom: 20,
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)"
        }}
      >
        {/* KOŁO */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 14
          }}
        >
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              background: `conic-gradient(#3B82F6 ${progress * 3.6}deg, #E5E7EB 0deg)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                color: "#0F172A"
              }}
            >
              {progress}%
            </div>
          </div>

          <div>
            <div style={{ fontSize: 14, color: "#64748B" }}>
              Postępy rehabilitacji
            </div>
            <div style={{ fontWeight: 600, color: "#0F172A" }}>
              Etap 1 z {stageStats.length}
            </div>
          </div>
        </div>

        {/* ETAPY */}
        {stageStats.map((s, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 13,
                marginBottom: 4,
                color: "#0F172A"
              }}
            >
              {s.name}
            </div>

            <div
              style={{
                height: 6,
                background: "#E5E7EB",
                borderRadius: 10
              }}
            >
              <div
                style={{
                  width: `${s.percent}%`,
                  height: "100%",
                  background: "#3B82F6"
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* BADGES */}
      <div
        style={{
          background: "white",
          borderRadius: 22,
          padding: 18,
          marginBottom: 20,
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)"
        }}
      >
        <div
          style={{
            fontWeight: 700,
            marginBottom: 12,
            color: "#0F172A"
          }}
        >
          Osiągnięcia
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10
          }}
        >
          {badges.map((b, i) => (
            <div
              key={i}
              style={{
                background: "#F8FAFC",
                padding: 12,
                borderRadius: 14,
                textAlign: "center",
                fontSize: 13,
                color: "#0F172A"
              }}
            >
              {getBadgeName(b.code)}
            </div>
          ))}
        </div>
      </div>

      {/* AKTYWNOŚĆ */}
      <div
        style={{
          background: "white",
          borderRadius: 22,
          padding: 18,
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)"
        }}
      >
        <div
          style={{
            fontWeight: 700,
            marginBottom: 14,
            color: "#0F172A"
          }}
        >
          Aktywność
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={box}>
            <div style={label}>Ćwiczeń dziś</div>
            <div style={value}>{todayCount}</div>
          </div>

          <div style={box}>
            <div style={label}>długość</div>
            <div style={value}>{weekCount}</div>
          </div>

          <div style={box}>
            <div style={label}>Seria</div>
            <div style={value}>🔥 {weekCount > 0 ? "OK" : "0"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const box = {
  flex: 1,
  background: "#F1F5F9",
  borderRadius: 14,
  padding: 12,
  textAlign: "center" as const
};

const label = {
  fontSize: 12,
  color: "#64748B"
};

const value = {
  fontSize: 18,
  fontWeight: 700,
  color: "#0F172A"
};