"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AddPatient() {
  const router = useRouter();

  const [plan, setPlan] = useState("");
  const [plans, setPlans] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔥 POBIERZ PLANY Z DB
  useEffect(() => {
    const loadPlans = async () => {
      const { data } = await supabase
        .from("plans")
        .select("id, name");

      setPlans(data || []);
    };

    loadPlans();
  }, []);

  const generateInvite = async () => {
    if (!plan) return;

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: physio } = await supabase
      .from("physios")
      .select("id")
      .eq("id", user?.id)
      .single();

    const { data, error } = await supabase
      .from("invites")
      .insert({
        physio_id: physio?.id,
        plan: plan, // 🔥 TU ID (UUID), NIE "ACL"
      })
      .select()
      .single();

    if (error || !data) {
      console.log("INVITE ERROR:", error);
      setLoading(false);
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const inviteLink = `${baseUrl}/register?ref=${data.id}`;

    const readyMessage = `Cześć 👋

To Twój indywidualny link do rozpoczęcia rehabilitacji:

${inviteLink}

Po rejestracji zobaczysz swój plan ćwiczeń.

– Twój fizjoterapeuta`;

    setMessage(readyMessage);
    setLoading(false);
  };

  return (
    <div className="app">
      <div className="screen" style={{ position: "relative" }}>

        <button
          className="back-btn"
          onClick={() => router.back()}
          style={{ top: 20, left: 0 }}
        >
          ←
        </button>

        <div className="logo-wrapper">
          <Image
            src="/octopus-logo.png"
            alt="Orthopus logo"
            width={300}
            height={100}
            priority
            className="logo-animated"
            style={{ width: "160px", height: "auto" }}
          />
        </div>

        {/* 🔥 DYNAMICZNY SELECT */}
        <div className="select-wrapper" style={{ marginBottom: 20 }}>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          >
            <option value="">Wybierz plan ćwiczeń</option>

            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <button
          className="primary-button"
          onClick={generateInvite}
          disabled={!plan || loading}
        >
          {loading ? "Tworzenie..." : "Generuj link"}
        </button>

        {message && (
          <div
            style={{
              marginTop: 32,
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div
              style={{
                alignSelf: "flex-start",
                background: "rgba(255,255,255,0.14)",
                padding: "18px 20px",
                borderRadius: "24px 24px 24px 8px",
                fontSize: 14,
                whiteSpace: "pre-wrap",
              }}
            >
              {message}
            </div>

            <button
              className="primary-button"
              onClick={() => {
                navigator.clipboard.writeText(message);
              }}
            >
              📋 Kopiuj wiadomość
            </button>
          </div>
        )}
      </div>
    </div>
  );
}