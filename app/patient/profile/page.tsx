"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ProfilePage() {

  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);

  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  const [doneCount, setDoneCount] = useState(0);

  const [toast, setToast] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(""), 2200);
  };

  const loadData = async () => {

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUser(user);

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
    setName(patientData.full_name || "");

    const { data: done } = await supabase
      .from("patient_exercises")
      .select("id")
      .eq("patient_id", patientData.id)
      .eq("completed", true);

    setDoneCount(done?.length || 0);
  };

  const saveName = async () => {
    if (!patient) return;

    const { error } = await supabase
      .from("patients")
      .update({ full_name: name })
      .eq("id", patient.id);

    if (error) {
      showToast("Błąd zapisu ❌");
      return;
    }

    showToast("Zapisano ✔");
  };

  const changePassword = async () => {

    if (!newPassword || !repeatPassword) {
      showToast("Wprowadź hasło w obu polach");
      return;
    }

    if (newPassword.length < 6) {
      showToast("Hasło min. 6 znaków");
      return;
    }

    if (newPassword !== repeatPassword) {
      showToast("Hasła nie są takie same");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      showToast("Błąd zmiany hasła ❌");
      return;
    }

    setNewPassword("");
    setRepeatPassword("");
    showToast("Hasło zmienione ✔");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #E2E8F0",
    background: "#F8FAFC",
    color: "#0F172A",
    fontSize: 13,
    marginBottom: 10
  };

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
            Twój profil
          </div>
        </div>
      </div>

      <div style={{ padding: "0 16px 30px" }}>

        {/* 👤 DANE */}
        <div style={{
          background: "white",
          borderRadius: 20,
          padding: 16,
          marginBottom: 16,
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)"
        }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: "#0F172A" }}>
            Imię
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Imię"
            style={inputStyle}
          />

          <div style={{
            fontSize: 12,
            color: "#64748B",
            marginBottom: 6
          }}>
            {user?.email}
          </div>

          <div
            onClick={saveName}
            style={{
              background: "#3B82F6",
              padding: "10px",
              borderRadius: 12,
              textAlign: "center",
              cursor: "pointer",
              fontSize: 13,
              color: "white",
              fontWeight: 600
            }}
          >
            Zapisz
          </div>
        </div>

        {/* 🔒 HASŁO */}
        <div style={{
          background: "white",
          borderRadius: 20,
          padding: 16,
          marginBottom: 16,
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)"
        }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: "#0F172A" }}>
            Zmiana hasła
          </div>

          <input
            type="password"
            placeholder="Nowe hasło"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Powtórz hasło"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            style={inputStyle}
          />

          <div
            onClick={changePassword}
            style={{
              background: "#10B981",
              padding: "10px",
              borderRadius: 12,
              textAlign: "center",
              cursor: "pointer",
              fontSize: 13,
              color: "white",
              fontWeight: 600
            }}
          >
            Zmień hasło
          </div>
        </div>

        {/* 📊 STATYSTYKI */}
        <div style={{
          background: "white",
          borderRadius: 20,
          padding: 16,
          marginBottom: 16,
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)"
        }}>
          <div style={{
            fontWeight: 600,
            color: "#0F172A",
            marginBottom: 4
          }}>
            Aktywność
          </div>

          <div style={{
            fontSize: 13,
            color: "#64748B"
          }}>
            Wykonane ćwiczenia: {doneCount}
          </div>
        </div>

        {/* 🚪 LOGOUT */}
        <div
          onClick={logout}
          style={{
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            color: "#DC2626",
            padding: 12,
            borderRadius: 14,
            textAlign: "center",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13
          }}
        >
          Wyloguj
        </div>

      </div>

      {/* 🔥 TOAST */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#0F172A",
          color: "white",
          padding: "10px 16px",
          borderRadius: 12,
          fontSize: 13,
          zIndex: 9999,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
        }}>
          {toast}
        </div>
      )}

    </div>
  );
}