"use client";
import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export default function AuthCallback() {
  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetch("/api/ensure-profile", { method: "POST" });
        window.location.replace("/onboarding"); // ✅
      } else {
        window.location.replace("/auth");
      }
    })();
  }, []);
  return <main className="grid place-items-center h-dvh">Procesando autenticación…</main>;
}
