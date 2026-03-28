"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function PhysioPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [systemPlans, setSystemPlans] = useState<any[]>([]);
  const [myPlans, setMyPlans] = useState<any[]>([]);
  const [favoritePlans, setFavoritePlans] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState("system");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadPlans = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .or(`is_system.eq.true,owner_physio_id.eq.${user.id}`);

      if (error) {
        console.error(error);
      }

      setPlans(data || []);

      const system = (data || []).filter(p => p.is_system === true);
      const mine = (data || []).filter(p => p.owner_physio_id === user.id);
      const favorite = (data || []).filter(p => p.is_favorite === true);

      setSystemPlans(system);
      setMyPlans(mine);
      setFavoritePlans(favorite);

      setLoading(false);
    };

    loadPlans();
  }, [router]);

  const handleEdit = (planId: string) => {
    router.push(`/physio/plans/${planId}`);
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Ładowanie...</div>;
  }

  const getFiltered = () => {
    let list: any[] = [];

    if (activeTab === "system") list = systemPlans;
    if (activeTab === "mine") list = myPlans;
    if (activeTab === "fav") list = favoritePlans;

    return list.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  };

  return (
    <div className="physio-full">

      {/* HEADER */}
      <div
        style={{
          background: "linear-gradient(180deg,#1E40AF,#1E3A8A)",
          padding: "24px 20px 30px 20px",
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
          color: "white"
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700 }}>
          Ćwiczenia / Plany
        </div>
      </div>

      <div className="physio-body" style={{ marginTop: 20 }}>
{/* 🔧 SEARCH — JEDNA CZYSTA WARSTWA */}
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 12
  }}
>
  <span style={{ fontSize: 12, opacity: 0.8 }}>🔍</span>

  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Szukaj planu..."
    style={{
      width: "100%",
      fontSize: 12,
      color: "white",
      padding: "6px 10px",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.25)",
      background: "rgba(255,255,255,0.18)",
      outline: "none"
    }}
  />
</div>

        {/* SEGMENT */}
        <div
          style={{
            background: "rgba(255,255,255,0.25)",
            borderRadius: 16,
            display: "flex",
            padding: 4,
            marginBottom: 16
          }}
        >
          <Segment label="Systemowe" active={activeTab === "system"} onClick={() => setActiveTab("system")} />
          <Segment label="Moje" active={activeTab === "mine"} onClick={() => setActiveTab("mine")} />
          <Segment label="Ulubione" active={activeTab === "fav"} onClick={() => setActiveTab("fav")} />
        </div>

        {/* LISTA */}
        {renderCategories(getFiltered(), handleEdit)}

      </div>
    </div>
  );
}

/* SEGMENT */

function Segment({ label, active, onClick }: any) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1,
        textAlign: "center",
        padding: "8px 0",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        borderRadius: 12,
        background: active ? "white" : "transparent",
        color: active ? "#2563EB" : "white",
        transition: "all 0.2s"
      }}
    >
      {label}
    </div>
  );
}

/* KATEGORIE */

function renderCategories(plans: any[], onClick: any) {

  const grouped: any = {
    "Stopa": [],
    "Kolano": [],
    "Bark": [],
    "Kręgosłup": []
  };

  plans.forEach(plan => {
    const name = plan.name.toLowerCase();

    if (name.includes("achilles") || name.includes("stopa")) {
      grouped["Stopa"].push(plan);
    } else if (name.includes("kolano")) {
      grouped["Kolano"].push(plan);
    } else if (name.includes("bark")) {
      grouped["Bark"].push(plan);
    } else {
      grouped["Kręgosłup"].push(plan);
    }
  });

  return Object.entries(grouped).map(([category, items]: any) => {

    if (items.length === 0) return null;

    return (
      <div key={category} style={{ marginBottom: 16 }}>

        <div style={{
          fontSize: 14,
          fontWeight: 700,
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: "white"
        }}>
          {getIcon(category)} {category}
        </div>

        {items.map((plan: any) => (
          <PlanRow key={plan.id} plan={plan} onClick={onClick} />
        ))}

      </div>
    );
  });
}

/* IKONY */

function getIcon(category: string) {
  if (category === "Kolano") return "🦵";
  if (category === "Stopa") return "🦶";
  if (category === "Bark") return "💪";
  return "🦴";
}

/* 🔧 PLAN ROW — MNIEJSZY O ~50% */

function PlanRow({ plan, onClick }: any) {
  return (
    <div
      onClick={() => onClick(plan.id)}
      style={{
        background: "white",
        borderRadius: 14,
        padding: "10px 12px",
        marginBottom: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
        cursor: "pointer"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

        <div style={{ fontSize: 20 }}>🦶</div>

        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: "#0F172A" }}>
            {plan.name}
          </div>

          <div style={{ fontSize: 11, color: "#64748B" }}>
            {plan.is_system ? "Plan systemowy" : "Mój plan"}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 14, color: "#94A3B8" }}>
        →
      </div>
    </div>
  );
}