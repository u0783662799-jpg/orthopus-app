"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PlanPage() {

  const [stages, setStages] = useState<any[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: patient } = await supabase
      .from("patients")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!patient) return;

    const { data: stagesData } = await supabase
      .from("plan_stages")
      .select("*")
      .eq("plan_id", patient.plan_id)
      .order("stage_order", { ascending: true });

    if (!stagesData) return;

    const { data: done } = await supabase
      .from("patient_exercises")
      .select("exercise_id")
      .eq("patient_id", patient.id)
      .eq("completed", true);

    const doneIds = done?.map(d => d.exercise_id) || [];

    let total = 0;
    let completed = 0;

    const enriched: any[] = [];

    for (let i = 0; i < stagesData.length; i++) {

      const stage = stagesData[i];

      const { data: ex } = await supabase
        .from("plan_exercises")
        .select("id")
        .eq("stage_id", stage.id);

      const totalStage = ex?.length || 0;
      const doneStage =
        ex?.filter(e => doneIds.includes(e.id)).length || 0;

      total += totalStage;
      completed += doneStage;

      let status = "locked";

      if (doneStage === totalStage && totalStage > 0) {
        status = "done";
      } else if (doneStage > 0 || i === 0) {
        status = "current";
        setCurrentStageIndex(i);
      }

      enriched.push({
        ...stage,
        total: totalStage,
        done: doneStage,
        status
      });
    }

    setStages(enriched);

    setProgress(
      total > 0 ? Math.round((completed / total) * 100) : 0
    );
  };

  const remainingDays =
    stages.length > 0
      ? Math.max((stages.length - currentStageIndex - 1) * 7, 0)
      : 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg,#EAF2FF,#DCEBFF)"
    }}>

      {/* HEADER */}
      <div style={{ padding: 16 }}>
        <div style={{
          background: "linear-gradient(135deg,#3B82F6,#2563EB)",
          borderRadius: 24,
          padding: 18,
          color: "white",
          boxShadow: "0 10px 30px rgba(37,99,235,0.25)"
        }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            Twój plan
          </div>

          <div style={{ marginTop: 10, fontSize: 14, opacity: 0.9 }}>
            {progress}% ukończone • {remainingDays} dni do końca
          </div>

          <div style={{
            height: 6,
            background: "rgba(255,255,255,0.25)",
            borderRadius: 10,
            marginTop: 10,
            overflow: "hidden"
          }}>
            <div style={{
              width: `${progress}%`,
              height: "100%",
              background: "#10B981"
            }} />
          </div>
        </div>
      </div>

      {/* PLAN */}
      <div style={{ padding: "0 16px" }}>
        <div style={{
          background: "white",
          borderRadius: 22,
          padding: 18,
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)"
        }}>

          {/* CURRENT */}
          {stages[currentStageIndex] && (
            <div style={{
              marginBottom: 18,
              padding: 14,
              borderRadius: 16,
              background: "#EFF6FF",
              border: "1px solid #BFDBFE"
            }}>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Aktualny etap
              </div>
              <div style={{
                fontWeight: 600,
                color: "#0F172A",
                marginTop: 2
              }}>
                {stages[currentStageIndex].name || `Etap ${currentStageIndex + 1}`}
              </div>
            </div>
          )}

          {/* TIMELINE */}
          {stages.map((stage, i) => {

            const isCurrent = i === currentStageIndex;

            return (
              <div
                key={stage.id}
                style={{
                  display: "flex",
                  gap: 12,
                  marginBottom: 16,
                  padding: 12,
                  borderRadius: 16,
                  background: isCurrent ? "#F8FAFF" : "transparent",
                  border: isCurrent ? "1px solid #E0E7FF" : "1px solid transparent",
                  boxShadow: isCurrent ? "0 4px 14px rgba(59,130,246,0.08)" : "none",
                  transition: "all 0.2s ease",
                  opacity: stage.status === "locked" ? 0.4 : 1
                }}
              >

                {/* DOT */}
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  marginTop: 6,
                  background:
                    stage.status === "done"
                      ? "#10B981"
                      : isCurrent
                      ? "#3B82F6"
                      : "#CBD5F5"
                }} />

                {/* CONTENT */}
                <div style={{ flex: 1 }}>

                  <div style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: "#0F172A"
                  }}>
                    {stage.name || `Etap ${stage.stage_order}`}
                  </div>

                  <div style={{
                    fontSize: 12,
                    color: "#64748B",
                    marginTop: 2
                  }}>
                    {stage.done} / {stage.total} ćwiczeń
                  </div>

                </div>

                {/* STATUS */}
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color:
                    stage.status === "done"
                      ? "#10B981"
                      : isCurrent
                      ? "#3B82F6"
                      : "#94A3B8"
                }}>
                  {stage.status === "done" && "✓"}
                  {isCurrent && "AKTYWNY"}
                  {stage.status === "locked" && "🔒"}
                </div>

              </div>
            );
          })}

        </div>
      </div>

      {/* MOTYWACJA */}
      <div style={{ padding: "14px 16px 30px" }}>
        <div style={{
          background: "white",
          borderRadius: 22,
          padding: 18,
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)"
        }}>

          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#0F172A",
            marginBottom: 6
          }}>
            💡 Wskazówka
          </div>

          <div style={{
            fontSize: 13,
            color: "#64748B",
            lineHeight: 1.5
          }}>
            Największe efekty daje konsekwencja. Nie musisz robić więcej — rób regularnie.
          </div>

        </div>
      </div>

    </div>
  );
}