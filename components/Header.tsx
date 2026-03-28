"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Props = {
  name: string;
  info: string;
};

export default function Header({ name, info }: Props) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div
      style={{
        position: "relative",
        marginBottom: 40,
        textAlign: "center",
      }}
    >
      {/* WYLOGUJ */}
      <button
        onClick={handleLogout}
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          background: "transparent",
          border: "none",
          color: "white",
          cursor: "pointer",
          fontSize: 13,
          opacity: 0.7,
        }}
      >
        Wyloguj
      </button>

      <div
        style={{
          fontSize: 11,
          letterSpacing: 1,
          opacity: 0.6,
        }}
      >
        WITAJ Z POWROTEM
      </div>

      <h2
        style={{
          fontSize: 22,
          marginTop: 6,
          fontWeight: 700,
        }}
      >
        {name}
      </h2>

      <div
        style={{
          fontSize: 13,
          opacity: 0.6,
          marginTop: 6,
        }}
      >
        {info}
      </div>
    </div>
  );
}