"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace("/auth");
      setLoading(false);
    });
  }, [router]);

  if (loading) return <main className="min-h-screen bg-black text-white grid place-items-center">Cargando…</main>;

  return <main className="min-h-screen bg-black text-white p-8">Dashboard</main>;
}
