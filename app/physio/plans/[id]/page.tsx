"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";

export default function EditPlanPage() {
  const { id } = useParams();
  const router = useRouter();

  const [plan, setPlan] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [planName, setPlanName] = useState("");

  const [newStageName, setNewStageName] = useState("");
  const [showFormStageId, setShowFormStageId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubtitle, setEditSubtitle] = useState("");

  const dropdownRef = useRef<any>(null);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadPlan = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: planData } = await supabase
      .from("plans")
      .select("*")
      .eq("id", id)
      .single();

    if (!planData) {
      setLoading(false);
      return;
    }

    setPlan(planData);
    setPlanName(planData.name);
    setIsOwner(planData.owner_physio_id === user?.id);

    const { data: stageData } = await supabase
      .from("plan_stages")
      .select("*")
      .eq("plan_id", id)
      .order("stage_order", { ascending: true });

    if (stageData) {
      for (let stage of stageData) {
        const { data: exercises } = await supabase
          .from("plan_exercises")
          .select("*")
          .eq("stage_id", stage.id)
          .order("exercise_order", { ascending: true });

        stage.exercises = exercises || [];
      }
    }

    setStages(stageData || []);
    setLoading(false);
  };

  useEffect(() => {
    loadPlan();
  }, [id]);

  const handleUpdatePlanName = async () => {
    if (!planName.trim()) return;

    await supabase
      .from("plans")
      .update({ name: planName })
      .eq("id", id);

    setPlan({ ...plan, name: planName });
  };

  const handleClonePlan = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !plan) return;

    const { data: newPlan } = await supabase
      .from("plans")
      .insert({
        name: plan.name,
        is_system: false,
        owner_physio_id: user.id,
      })
      .select()
      .single();

    if (!newPlan) return;

    const { data: oldStages } = await supabase
      .from("plan_stages")
      .select("*")
      .eq("plan_id", plan.id);

    for (const stage of oldStages || []) {
      const { data: newStage } = await supabase
        .from("plan_stages")
        .insert({
          plan_id: newPlan.id,
          name: stage.name,
          stage_order: stage.stage_order,
        })
        .select()
        .single();

      const { data: oldExercises } = await supabase
        .from("plan_exercises")
        .select("*")
        .eq("stage_id", stage.id);

      for (const ex of oldExercises || []) {
        await supabase.from("plan_exercises").insert({
          stage_id: newStage.id,
          title: ex.title,
          subtitle: ex.subtitle,
          exercise_order: ex.exercise_order,
        });
      }
    }

    router.push(`/physio/plans/${newPlan.id}`);
  };

  const handleAddStage = async () => {
    if (!newStageName.trim()) return;

    await supabase.from("plan_stages").insert({
      plan_id: id,
      name: newStageName,
      stage_order: stages.length + 1,
    });

    setNewStageName("");
    loadPlan();
  };

  const handleAddExercise = async (stageId: string) => {
    if (!newTitle.trim()) return;

    const stage = stages.find((s) => s.id === stageId);
    const nextOrder = (stage?.exercises.length || 0) + 1;

    await supabase.from("plan_exercises").insert({
      stage_id: stageId,
      title: newTitle,
      subtitle: newSubtitle,
      exercise_order: nextOrder,
    });

    setNewTitle("");
    setNewSubtitle("");
    setShowFormStageId(null);
    loadPlan();
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    await supabase.from("plan_exercises").delete().eq("id", exerciseId);
    setOpenDropdownId(null);
    loadPlan();
  };

  const startEditExercise = (ex: any) => {
    setEditingExerciseId(ex.id);
    setEditTitle(ex.title);
    setEditSubtitle(ex.subtitle);
    setOpenDropdownId(null);
  };

  const handleSaveExerciseEdit = async () => {
    await supabase
      .from("plan_exercises")
      .update({
        title: editTitle,
        subtitle: editSubtitle,
      })
      .eq("id", editingExerciseId);

    setEditingExerciseId(null);
    loadPlan();
  };

  const handleDragEnd = async (result: any, stageId: string) => {
    if (!result.destination || !isOwner) return;

    const updatedStages = [...stages];
    const stage = updatedStages.find((s) => s.id === stageId);
    if (!stage) return;

    const items = Array.from(stage.exercises);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    stage.exercises = items;
    setStages(updatedStages);

    for (let i = 0; i < items.length; i++) {
      await supabase
        .from("plan_exercises")
        .update({ exercise_order: i + 1 })
        .eq("id", items[i].id);
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Ładowanie...</div>;

  return (
    <div className="physio-full">
      <div
        style={{
          background: "linear-gradient(180deg,#1E40AF,#1E3A8A)",
          padding: "24px 20px 30px 20px",
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
          color: "white"
        }}
      >
        {/* BACK */}
        <div
          onClick={() => router.push("/physio/plans")}
          style={{
            marginBottom: 10,
            cursor: "pointer",
            fontSize: 14,
            opacity: 0.9
          }}
        >
          {"<"} Wróć
        </div>

        {/* NAZWA */}
        {isOwner ? (
          <input
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            onBlur={handleUpdatePlanName}
            style={{
              fontSize: 18,
              fontWeight: 700,
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "white"
            }}
          />
        ) : (
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {plan?.name}
          </div>
        )}
      </div>

      {/* RESZTA */}
      <div className="physio-body" style={{ marginTop: 20 }}>
        {/* TU NIC NIE RUSZAŁEM */}
        {stages.map((stage) => (
          <div key={stage.id} style={{ marginBottom: 30 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>
              Etap {stage.stage_order} – {stage.name}
            </div>

            {/* ...cała Twoja reszta bez zmian */}
          </div>
        ))}
      </div>
    </div>
  );
}