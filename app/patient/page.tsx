"use client";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PatientPage() {
  const router = useRouter();

  const [userName, setUserName] = useState("Pacjent");
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);

  const [patient, setPatient] = useState<any>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  const [doneIds, setDoneIds] = useState<number[]>([]);
  const [totalExercises, setTotalExercises] = useState(0);

  const [unlockedBadge, setUnlockedBadge] = useState<string | null>(null);

  const badgeLabels: any = {
    first_step: "Pierwszy krok",
    progress_25: "25% ukończone",
    progress_50: "50% ukończone",
    progress_75: "75% ukończone",
    progress_100: "Plan ukończony"
  };

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

   setUserName(user.email?.split("@")[0] || "");

    const { data: patientData } = await supabase
      .from("patients")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!patientData) return;
    setPatient(patientData);

    const { data: stagesData } = await supabase
      .from("plan_stages")
      .select("*")
      .eq("plan_id", patientData.plan_id)
      .order("stage_order", { ascending: true });

    setStages(stagesData || []);

    const { data: done } = await supabase
      .from("patient_exercises")
      .select("exercise_id")
      .eq("patient_id", patientData.id)
      .eq("completed", true);

    const doneIdsArr = done?.map(d => d.exercise_id) || [];
    setDoneIds(doneIdsArr);

    let total = 0;
    for (let s of stagesData || []) {
      const { data: ex } = await supabase
        .from("plan_exercises")
        .select("id")
        .eq("stage_id", s.id);
      total += ex?.length || 0;
    }
    setTotalExercises(total);

    for (let i = 0; i < (stagesData || []).length; i++) {
      const { data: ex } = await supabase
        .from("plan_exercises")
        .select("id")
        .eq("stage_id", stagesData[i].id);

      const total = ex?.length || 0;
      const completed = ex?.filter(e => doneIdsArr.includes(e.id)).length || 0;

      if (completed < total) {
        setCurrentStageIndex(i);
        loadExercises(stagesData[i].id);
        return;
      }
    }

    if (stagesData?.[0]) {
      loadExercises(stagesData[0].id);
    }
  };

  const loadExercises = async (stageId: string) => {
    const { data } = await supabase
      .from("plan_exercises")
      .select("*")
      .eq("stage_id", stageId)
      .order("exercise_order", { ascending: true });

    setExercises(data || []);
  };

  const refreshDone = async () => {
    const { data } = await supabase
      .from("patient_exercises")
      .select("exercise_id")
      .eq("patient_id", patient.id)
      .eq("completed", true);

    return data?.map(d => d.exercise_id) || [];
  };

  const awardBadge = async (code: string) => {
    if (!patient) return;

    const { data } = await supabase
      .from("badges")
      .select("id")
      .eq("patient_id", patient.id)
      .eq("code", code)
      .maybeSingle();

    if (data) return;

    await supabase.from("badges").insert({
      patient_id: patient.id,
      code
    });

    setUnlockedBadge(code);
    setTimeout(() => setUnlockedBadge(null), 2500);
  };

  const checkStageCompletion = async (updatedIds: number[]) => {
    const doneCount = exercises.filter(e => updatedIds.includes(e.id)).length;

    if (doneCount === exercises.length && exercises.length > 0) {
      const next = currentStageIndex + 1;

      if (next < stages.length) {
        setTimeout(async () => {
          setCurrentStageIndex(next);
          await loadExercises(stages[next].id);
        }, 400);
      }
    }
  };

  const toggleExercise = async (index: number, fromModal = false) => {
    const exercise = exercises[index];
    if (!exercise || !patient) return;

    const isDone = doneIds.includes(exercise.id);

    if (isDone) {
      await supabase
        .from("patient_exercises")
        .delete()
        .eq("patient_id", patient.id)
        .eq("exercise_id", exercise.id);
    } else {
      await supabase
        .from("patient_exercises")
        .upsert({
          patient_id: patient.id,
          exercise_id: exercise.id,
          completed: true
        });
    }

    const updated = await refreshDone();
    setDoneIds(updated);

    await checkStageCompletion(updated);

    const percent =
      totalExercises > 0
        ? Math.round((updated.length / totalExercises) * 100)
        : 0;

    if (percent >= 25) await awardBadge("progress_25");
    if (percent >= 50) await awardBadge("progress_50");
    if (percent >= 75) await awardBadge("progress_75");
    if (percent === 100) await awardBadge("progress_100");
    if (updated.length === 1) await awardBadge("first_step");

    if (fromModal) {
      const nextIndex = index + 1;
      if (nextIndex < exercises.length) {
        setSelectedExercise({ ...exercises[nextIndex], index: nextIndex });
      } else {
        setSelectedExercise(null);
      }
    }
  };

  const progress =
    totalExercises > 0
      ? Math.round((doneIds.length / totalExercises) * 100)
      : 0;

  const currentColor = "#22C55E";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg,#EAF2FF,#DCEBFF)"
    }}>

     {/* 🔥 HEADER – UPGRADE (BEZ USUWANIA NICZEGO) */}
<div style={{ padding: 16 }}>
  <div style={{
    background: "linear-gradient(135deg,#3B82F6,#2563EB)",
    borderRadius: 24,
    padding: 18,
    color: "white"
  }}>

    {/* GÓRA */}
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <div style={{ fontSize: 20, fontWeight: 700 }}>
        Witaj {userName},
      </div>

     <img
  src="/octopus-logo.png"
  alt="logo"
  style={{
    width: 90,
    height: 90,
    objectFit: "contain",
    animation: "pulseLogo 2.5s ease-in-out infinite"
  }}
/>
    </div>

    {/* PROGRESS */}
    <div style={{ marginTop: 6, fontSize: 14 }}>
      {progress}% ukończone
    </div>

    {/* 🔥 MOTYWACJA */}
    <div style={{
      marginTop: 10,
      fontSize: 13,
      opacity: 0.9
    }}>
      {progress < 25 && "Najtrudniejszy jest pierwszy krok — działaj 💪"}
      {progress >= 25 && progress < 50 && "Świetnie idzie, nie przerywaj 🔥"}
      {progress >= 50 && progress < 75 && "Jesteś na dobrej drodze 🚀"}
      {progress >= 75 && progress < 100 && "Końcówka — dociśnij 🔥"}
      {progress === 100 && "Plan ukończony — ogromna robota 🏆"}
    </div>

    {/* 🔥 MINI INFO (NOWE) */}
    <div style={{
      marginTop: 12,
      background: "rgba(255,255,255,0.15)",
      borderRadius: 12,
      padding: "8px 10px",
      fontSize: 12,
      display: "inline-block"
    }}>
      Etap {currentStageIndex + 1} z {stages.length}
    </div>

  </div>
</div>
{/* 🎬 VIDEO INTRO */}
<div style={{ padding: "0 16px 12px" }}>
  <div style={{
    width: "100%",
    height: 200,
    borderRadius: 20,
    background: "linear-gradient(135deg,#0F172A,#1E293B)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: 14,
    position: "relative",
    overflow: "hidden"
  }}>

    {/* ▶️ PLAY */}
    <div style={{
      width: 56,
      height: 56,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.15)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backdropFilter: "blur(6px)"
    }}>
      ▶
    </div>

    {/* 🔥 LABEL */}
    <div style={{
      position: "absolute",
      bottom: 10,
      left: 12,
      fontSize: 12,
      opacity: 0.8
    }}>
      Wprowadzenie do aplikacji
    </div>

  </div>
</div>
      {/* 🔙 COFANIE – PRZYWRÓCONE */}
      {currentStageIndex > 0 && (
        <div style={{ padding: "0 16px 12px" }}>
          <div
            onClick={async () => {
              const prev = currentStageIndex - 1;
              setCurrentStageIndex(prev);
              await loadExercises(stages[prev].id);
            }}
            style={{
              background: "#FFFFFF",
              borderRadius: 14,
              padding: "10px 14px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              cursor: "pointer",
              color: "#334155",
              fontWeight: 500,
              fontSize: 14
            }}
          >
            ← Poprzedni etap
          </div>
        </div>
      )}

      {/* 🏆 BADGE POPUP (ZOSTAJE) */}
      {unlockedBadge && (
        <div style={{
          position: "fixed",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#111827",
          color: "white",
          padding: "12px 18px",
          borderRadius: 14
        }}>
          🏆 {badgeLabels[unlockedBadge]}
        </div>
      )}

      {/* LISTA */}
      <div style={{ padding: "0 16px" }}>
        <div style={{
          background: "#F8FAFC",
          borderRadius: 22,
          padding: 18
        }}>
          {exercises.map((ex, i) => {
            const done = doneIds.includes(ex.id);

            return (
              <div
                key={i}
                onClick={() => setSelectedExercise({ ...ex, index: i })}
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: "12px 14px",
                  marginBottom: 10,
                  display: "flex",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ color: "#0F172A" }}>{ex.title}</div>

                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExercise(i);
                  }}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    border: `2px solid ${currentColor}`,
                    background: done ? currentColor : "transparent",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {done ? "✓" : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🔥 WIDGET */}
      <div style={{ padding: "16px" }}>
        <div
          onClick={() => router.push("/patient/progress")}
          style={{
            background: "#ffffff",
            borderRadius: 22,
            padding: 18,
            display: "flex",
            alignItems: "center",
            cursor: "pointer"
          }}
        >
          <div style={{
            width: 70,
            height: 70,
            borderRadius: "50%",
            background: `conic-gradient(${currentColor} ${progress}%, #f6f6f6 ${progress}%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              color: "#0F172A"
            }}>
              {progress}%
            </div>
          </div>

          <div style={{ marginLeft: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 16, color: "#0F172A" }}>
              Twój plan rehabilitacji
            </div>
            <div style={{ fontSize: 13, color: "#050505" }}>
              Ukończono {progress}% planu
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 MAPA ETAPÓW – PREMIUM FIX */}
<div style={{ padding: "0 16px 20px" }}>
  <div style={{
    background: "white",
    borderRadius: 20,
    padding: 18,
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)"
  }}>
    <div style={{ fontWeight: 600, marginBottom: 16 }}>
      Twój progres etapów
    </div>

    <div style={{
      display: "flex",
      alignItems: "center"
    }}>
      {stages.map((_, i) => {
        const active = i === currentStageIndex;
        const done = i < currentStageIndex;

        return (
          <div key={i} style={{
            flex: 1,
            display: "flex",
            alignItems: "center"
          }}>

            {/* 🔵 KROPKA */}
            <div
              onClick={async () => {
                setCurrentStageIndex(i);
                await loadExercises(stages[i].id);
              }}
              style={{
                width: active ? 32 : 26,
                height: active ? 32 : 26,
                borderRadius: "50%",
                background: done
                  ? "linear-gradient(135deg,#22C55E,#16A34A)"
                  : active
                  ? "linear-gradient(135deg,#3B82F6,#2563EB)"
                  : "#E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                boxShadow: active
                  ? "0 0 0 4px rgba(59,130,246,0.15)"
                  : done
                  ? "0 4px 10px rgba(34,197,94,0.4)"
                  : "none",
                transition: "all 0.25s ease"
              }}
            >
              {done ? "✓" : i + 1}
            </div>

            {/* 🔥 SEGMENT (linia między punktami) */}
            {i !== stages.length - 1 && (
              <div style={{
                flex: 1,
                height: 4,
                margin: "0 6px",
                borderRadius: 999,
                background: done
                  ? "linear-gradient(90deg,#22C55E,#4ADE80)"
                  : "#E2E8F0",
                transition: "all 0.3s ease"
              }} />
            )}
          </div>
        );
      })}
    </div>

    {/* 🔥 PODPISY */}
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      marginTop: 10
    }}>
      {stages.map((_, i) => (
        <div key={i} style={{
          flex: 1,
          textAlign: "center",
          fontSize: 11,
          color: i === currentStageIndex ? "#2563EB" : "#64748B",
          fontWeight: i === currentStageIndex ? 600 : 400
        }}>
          Etap {i + 1}
        </div>
      ))}
    </div>

  </div>
</div>

      {/* MODAL */}
      {selectedExercise && (
        <div
          onClick={() => setSelectedExercise(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "92%",
              maxWidth: 420,
              borderRadius: 24,
              background: "white"
            }}
          >
            <div style={{
              background: "linear-gradient(135deg,#3B82F6,#2563EB)",
              padding: 16,
              color: "white"
            }}>
              {selectedExercise.title}
            </div>

            <div style={{
              height: 200,
              background: "#0F172A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white"
            }}>
              ▶️ Video ćwiczenia
            </div>

            <div style={{ padding: 16 }}>
              <button
                onClick={() =>
                  toggleExercise(selectedExercise.index, true)
                }
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 14,
                  background: "#10B981",
                  color: "white"
                }}
              >
                ✔ Oznacz jako wykonane
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}