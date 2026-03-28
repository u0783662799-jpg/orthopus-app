"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

export default function PatientDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params?.id as string;

  const [patient, setPatient] = useState<any | null>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [doneIds, setDoneIds] = useState<number[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [yesterdayCount, setYesterdayCount] = useState(0);

  useEffect(() => {
    const loadPatient = async () => {

      const { data: patientData } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();

      if (!patientData) return;

      setPatient(patientData);

      // 🔥 wszystkie wykonane ćwiczenia
      const { data: done } = await supabase
        .from("patient_exercises")
        .select("*")
        .eq("patient_id", patientId)
        .eq("completed", true);

      const doneIdsList = done?.map(d => d.exercise_id) || [];
      setDoneIds(doneIdsList);

      // 🔥 aktywność
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      const todayStr = today.toISOString().split("T")[0];
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const todayExercises =
        done?.filter(d => d.created_at?.startsWith(todayStr)).length || 0;

      const yesterdayExercises =
        done?.filter(d => d.created_at?.startsWith(yesterdayStr)).length || 0;

      setTodayCount(todayExercises);
      setYesterdayCount(yesterdayExercises);

      // 🔥 etapy
      const { data: stages } = await supabase
        .from("plan_stages")
        .select("*")
        .eq("plan_id", patientData.plan_id)
        .order("stage_order", { ascending: true });

      if (!stages || stages.length === 0) return;

      // 🔥 aktualny etap
      let currentStage = stages[0];

      for (let stage of stages) {

        const { data: ex } = await supabase
          .from("plan_exercises")
          .select("id")
          .eq("stage_id", stage.id);

        const total = ex?.length || 0;

        const completed =
          ex?.filter(e => doneIdsList.includes(e.id)).length || 0;

        if (completed < total) {
          currentStage = stage;
          break;
        }

        currentStage = stage;
      }

      // 🔥 ćwiczenia aktualnego etapu
      const { data: exercisesData } = await supabase
        .from("plan_exercises")
        .select("*")
        .eq("stage_id", currentStage.id)
        .order("exercise_order", { ascending: true });

      setExercises(exercisesData || []);
    };

    if (patientId) loadPatient();

  }, [patientId]);

  const getStatus = (progress: number) => {
    if (progress >= 75) return { label: "Zielony", color: "#22C55E" };
    if (progress >= 40) return { label: "Żółty", color: "#F59E0B" };
    return { label: "Czerwony", color: "#EF4444" };
  };

  if (!patient) {
    return (
      <div className="physio-full">
        <div className="physio-body">Ładowanie...</div>
      </div>
    );
  }

  const status = getStatus(patient.progress || 0);
  const isAlert = (patient.adherence || 0) < 50;

  return (
    <div className="physio-full">

      {/* HEADER */}
      <div
        style={{
          background: "linear-gradient(180deg,#1E40AF,#1E3A8A)",
          padding: "24px 20px 30px 20px",
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Image
            src="/octopus-logo.png"
            alt="Orthopus"
            width={50}
            height={50}
          />

          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {patient.full_name || "Bez imienia"}
            </div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              {patient.condition}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            display: "inline-block",
            background: status.color,
            padding: "6px 14px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {status.label}
        </div>

        <div style={{ marginTop: 10, fontSize: 13 }}>
          Postęp: {patient.progress || 0}% • Aktywność: {patient.adherence || 0}% {isAlert && "⚠️"}
        </div>

        <div
          style={{
            height: 8,
            background: "rgba(255,255,255,0.2)",
            borderRadius: 10,
            marginTop: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${patient.progress || 0}%`,
              height: "100%",
              background: status.color,
            }}
          />
        </div>
      </div>

      {/* BODY */}
      <div className="physio-body" style={{ marginTop: 20 }}>

        {/* STATY */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <InfoBox label="Dziś" value={todayCount} />
          <InfoBox label="Wczoraj" value={yesterdayCount} />
          <InfoBox label="Adherencja" value={(patient.adherence || 0) + "%"} />
        </div>

        {/* ĆWICZENIA */}
        <SectionTitle title="Ćwiczenia (aktualny etap)" />

        {exercises.map((ex) => (
          <ExerciseItem
            key={ex.id}
            title={ex.title}
            done={doneIds.includes(ex.id)}
          />
        ))}

        {/* BACK */}
        <button
          onClick={() => router.back()}
          style={{
            marginTop: 30,
            width: "100%",
            padding: 14,
            borderRadius: 14,
            border: "none",
            background: "rgba(255,255,255,0.15)",
            cursor: "pointer",
          }}
        >
          Wróć
        </button>
      </div>
    </div>
  );
}

/* COMPONENTS */

function InfoBox({ label, value }: any) {
  return (
    <div
      style={{
        flex: 1,
        background: "rgba(255,255,255,0.08)",
        padding: 14,
        borderRadius: 14,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600 }}>{value}</div>
      <div style={{ fontSize: 11, opacity: 0.7 }}>{label}</div>
    </div>
  );
}

function SectionTitle({ title }: any) {
  return (
    <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>
      {title}
    </div>
  );
}

function ExerciseItem({ title, done }: any) {
  return (
    <div
      style={{
        background: done
          ? "rgba(34,197,94,0.15)"
          : "rgba(255,255,255,0.08)",
        padding: 14,
        borderRadius: 14,
        marginBottom: 10,
      }}
    >
      {done ? "✔ " : "○ "} {title}
    </div>
  );
}