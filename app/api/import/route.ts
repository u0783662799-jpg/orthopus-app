import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { planName, stages } = body;

    if (!planName || !stages) {
      return NextResponse.json({ error: "Brak danych" }, { status: 400 });
    }

    // 🔥 1. TWORZYMY PLAN
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .insert({ name: planName })
      .select()
      .single();

    if (planError) throw planError;

    // 🔥 2. TWORZYMY ETAPY + ĆWICZENIA
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];

      const { data: stageData, error: stageError } = await supabase
        .from("plan_stages")
        .insert({
          plan_id: plan.id,
          name: stage.name,
          stage_order: i
        })
        .select()
        .single();

      if (stageError) throw stageError;

      // ćwiczenia
      for (let j = 0; j < stage.exercises.length; j++) {
        const ex = stage.exercises[j];

        const { error: exError } = await supabase
          .from("plan_exercises")
          .insert({
            stage_id: stageData.id,
            title: ex.title,
            description: ex.description || "",
            video_url: ex.video || "",
            exercise_order: j
          });

        if (exError) throw exError;
      }
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}