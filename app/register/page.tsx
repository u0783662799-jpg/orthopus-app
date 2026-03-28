"use client";

import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const ref = searchParams.get("ref");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [plan, setPlan] = useState<string | null>(null); // UUID
  const [planName, setPlanName] = useState<string | null>(null); // NAZWA
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadInvite = async () => {
      if (!ref) return;

      const { data } = await supabase
        .from("invites")
        .select("plan, used")
        .eq("id", ref)
        .single();

      if (data && !data.used) {
        setPlan(data.plan); // UUID

        // 🔥 pobierz nazwę planu
        const { data: planData } = await supabase
          .from("plans")
          .select("name")
          .eq("id", data.plan)
          .single();

        if (planData) {
          setPlanName(planData.name);
        }
      }
    };

    loadInvite();
  }, [ref]);

  const handleRegister = async () => {
    if (!email || !password || !ref || !fullName) {
      setError("Brak danych.");
      return;
    }

    setLoading(true);
    setError("");

    // 🔎 invite
    const { data: invite, error: inviteError } = await supabase
      .from("invites")
      .select("*")
      .eq("id", ref)
      .single();

    if (inviteError || !invite) {
      setError("Nieprawidłowe zaproszenie.");
      setLoading(false);
      return;
    }

    if (invite.used) {
      setError("To zaproszenie zostało już wykorzystane.");
      setLoading(false);
      return;
    }

    // 🔐 auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message || "Błąd rejestracji.");
      setLoading(false);
      return;
    }

    const user = data.user;

    // 👤 users
    await supabase.from("users").insert({
      id: user.id,
      email,
      role: "patient",
    });

    // 🔗 patients (FINAL FIX)
    const { error: patientError } = await supabase
      .from("patients")
      .insert({
        user_id: user.id,
        physio_id: invite.physio_id,
        full_name: fullName,
        condition: planName, // tylko opis
        plan_id: invite.plan, // 🔥 UUID → KLUCZ DO PLANU
        status: "aktywny",
        progress: 0,
        adherence: 0,
      });

    if (patientError) {
      console.log("PATIENT INSERT ERROR:", patientError);
      setError("Błąd tworzenia pacjenta.");
      setLoading(false);
      return;
    }

    // 🟢 invite used
    await supabase
      .from("invites")
      .update({ used: true })
      .eq("id", ref);

    setLoading(false);

    router.push("/patient");
  };

  return (
    <div className="app">
      <div className="screen">

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

        {planName && (
          <div style={{ marginBottom: 20 }}>
            Plan rehabilitacji: <b>{planName}</b>
          </div>
        )}

        <input
          placeholder="Twoje imię"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <input
          placeholder="Twój email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Utwórz hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div style={{ marginTop: 10, color: "#ff6b6b" }}>
            {error}
          </div>
        )}

        <button
          className="primary-button"
          onClick={handleRegister}
          disabled={loading}
          style={{ marginTop: 20 }}
        >
          {loading ? "Tworzenie..." : "Załóż konto"}
        </button>

      </div>
    </div>
  );
}