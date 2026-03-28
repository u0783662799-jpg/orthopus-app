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

    // ✅ FIX (jedyna zmiana)
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