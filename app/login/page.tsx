"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"patient" | "physio" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (role && emailRef.current) {
      setTimeout(() => {
        emailRef.current?.focus();
      }, 200);
    }
  }, [role]);

  // 🔥 REGISTER (BEZ ZMIAN)
  const handleRegister = async () => {
    setErrorMessage("");

    if (!email || !password || !role) {
      setErrorMessage("Uzupełnij dane i wybierz rolę");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const userId = data.user?.id;

    await supabase.from("users").insert({
      id: userId,
      email: email,
      role: role,
      full_name: null,
    });

    if (role === "patient") {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");

      await supabase.from("patients").insert({
        user_id: userId,
        plan_id: ref,
        stage: 0,
        session: 0,
        status: "aktywny",
      });
    }

    router.push(role === "physio" ? "/physio" : "/patient");
  };

  // 🔵 LOGIN (BEZ ZMIAN)
  const handleLogin = async () => {
    setErrorMessage("");

    if (!email || !password || !role) {
      setErrorMessage("Uzupełnij dane i wybierz rolę");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage("Nieprawidłowe dane logowania");
      return;
    }

    const user = data.user;

    const { data: dbUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", user?.id)
      .single();

    if (!dbUser) {
      setErrorMessage("Błąd pobierania użytkownika");
      return;
    }

    router.push(dbUser.role === "physio" ? "/physio" : "/patient");
  };

  const inputStyle = {
    width: "100%",
    padding: "13px 14px",
    borderRadius: 14,
    border: "1px solid #E2E8F0",
    background: "white",
    color: "#0F172A",
    fontSize: 14,
    outline: "none"
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg,#EAF2FF,#DCEBFF)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: 16
    }}>

      {/* LOGO */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
        <div className="logo-float">
          <Image src="/octopus-logo.png" alt="logo" width={200} height={200} />
        </div>
      </div>

      {/* BRAND */}
      <div className={`brand ${mounted ? "show" : ""}`}>
        <div className="brand-title">Orthopus</div>
        <div className="brand-sub">Wracaj do sprawności krok po kroku</div>
      </div>

      {/* CONTENT */}
      <div className={`fade ${mounted ? "show" : ""}`}>

        {!role && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => setRole("patient")} style={cardStyle}>
              🧑‍🦽 Jestem pacjentem
            </button>
            <button onClick={() => setRole("physio")} style={cardStyle}>
              🩺 Jestem administratorem
            </button>
          </div>
        )}

        {role && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              isRegistering ? handleRegister() : handleLogin();
            }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >

            {/* 🔥 LABEL (WRÓCIŁ) */}
            <div style={{
              fontSize: 13,
              color: isRegistering ? "#059669" : "#2563EB",
              textAlign: "center",
              fontWeight: 600
            }}>
              {isRegistering ? "Tworzenie konta" : "Logowanie"}
            </div>

            <input
              ref={emailRef}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />

            <input
              type="password"
              placeholder="Hasło"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />

            {errorMessage && (
              <div style={{
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                padding: "10px",
                borderRadius: 12,
                fontSize: 13,
                textAlign: "center",
                color: "#DC2626"
              }}>
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              style={{
                ...primaryBtn,
                background: isRegistering
                  ? "linear-gradient(135deg,#10B981,#059669)"
                  : "linear-gradient(135deg,#3B82F6,#2563EB)"
              }}
            >
              {isRegistering ? "Zarejestruj się" : "Zaloguj się"}
            </button>

            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              style={cardStyle}
            >
              {isRegistering
                ? "Mam już konto — logowanie"
                : "Nie mam konta — rejestracja"}
            </button>

            {/* 🔙 POWRÓT */}
            <button
              type="button"
              onClick={() => {
                setRole(null);
                setErrorMessage("");
                setIsRegistering(false);
              }}
              style={secondaryBtn}
            >
              ← Wybierz inną rolę
            </button>

          </form>
        )}
      </div>

      {/* STYLE */}
      <style jsx>{`
        .brand {
          text-align: center;
          margin-bottom: 28px;
          opacity: 0;
          transform: translateY(10px);
        }
        .brand.show {
          opacity: 1;
          transform: translateY(0);
          transition: all 0.5s ease;
        }
        .brand-title {
          font-size: 32px;
          font-weight: 800;
          background: linear-gradient(135deg,#3B82F6,#2563EB);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .brand-sub {
          font-size: 13px;
          color: #64748B;
          margin-top: 6px;
        }
        .fade {
          opacity: 0;
          transform: translateY(20px);
        }
        .fade.show {
          opacity: 1;
          transform: translateY(0);
          transition: all 0.4s ease;
        }
        .logo-float {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}

const cardStyle = {
  background: "white",
  borderRadius: 16,
  padding: 14,
  border: "none",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
};

const primaryBtn = {
  padding: "14px",
  borderRadius: 16,
  border: "none",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 6px 20px rgba(59,130,246,0.25)"
};

const secondaryBtn = {
  background: "#F1F5F9",
  borderRadius: 16,
  padding: 14,
  border: "none",
  cursor: "pointer"
};