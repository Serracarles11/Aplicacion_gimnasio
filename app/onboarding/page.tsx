"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2, Save, LogOut } from "lucide-react";

type Sex = "male" | "female" | "other" | "" ;
type Level = "beginner" | "intermediate" | "advanced" | "" ;

export default function OnboardingPage() {
  // Supabase browser client
  const supabase = useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");

  // ---- form state (profiles) ----
  const [displayName, setDisplayName] = useState("");
  const [birthdate, setBirthdate] = useState<string>("");
  const [heightCm, setHeightCm] = useState<string>(""); // keep as string for input
  const [sex, setSex] = useState<Sex>("");
  const [level, setLevel] = useState<Level>("beginner");
  const [goal, setGoal] = useState("");

  // ---- form state (body_metrics quick add) ----
  const [weightKg, setWeightKg] = useState<string>("");
  const [bodyfatPct, setBodyfatPct] = useState<string>("");
  const [notes, setNotes] = useState("");

  // load session + existing profile
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // si no hay sesión, de vuelta al login
        window.location.replace("/auth");
        return;
      }

      setUserId(session.user.id);
      setEmail(session.user.email || "");

      // Prefill from profiles
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!error && profile) {
        setDisplayName(profile.display_name ?? "");
        setBirthdate(profile.birthdate ?? "");
        setHeightCm(profile.height_cm?.toString() ?? "");
        setSex((profile.sex as Sex) ?? "");
        setLevel((profile.level as Level) ?? "beginner");
        setGoal(profile.goal ?? "");
      }

      setReady(true);
    };

    load();
  }, [supabase]);

  const saveAll = async () => {
    if (!userId) return;
    setSaving(true);

    // --- upsert profiles ---
    const { error: pErr } = await supabase.from("profiles").upsert({
      user_id: userId,
      display_name: displayName || null,
      birthdate: birthdate || null,
      height_cm: heightCm ? Number(heightCm) : null,
      sex: sex || null,
      level: (level || "beginner") as Level,
      goal: goal || null,
    });

    // --- optional: insert one body_metrics entry if weight/any provided ---
    let mErr = null as any;
    if (weightKg || bodyfatPct || notes) {
      const { error } = await supabase.from("body_metrics").insert({
        user_id: userId,
        date: new Date().toISOString().slice(0, 10),
        weight_kg: weightKg ? Number(weightKg) : null,
        bodyfat_pct: bodyfatPct ? Number(bodyfatPct) : null,
        notes: notes || null,
      });
      mErr = error;
    }

    setSaving(false);
    if (pErr || mErr) {
      alert(`Error guardando:\n${pErr?.message ?? ""}\n${mErr?.message ?? ""}`);
    } else {
      alert("¡Datos guardados!");
      setNotes("");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.replace("/auth");
  };

  if (!ready) {
    return (
      <main className="grid place-items-center h-dvh text-white">
        <div className="flex items-center gap-2 opacity-80">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando…
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-6 text-white">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Onboarding</h1>
          <p className="text-white/70 text-sm">Sesión: {email}</p>
        </div>
        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 hover:bg-white/20 border border-white/15"
        >
          <LogOut className="w-4 h-4" /> Salir
        </button>
      </header>

      <section className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-medium text-white/90">Perfil</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/80 mb-1">Nombre visible</label>
            <input
              className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ej. Carles"
            />
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-1">Fecha de nacimiento</label>
            <input
              type="date"
              className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
              value={birthdate ?? ""}
              onChange={(e) => setBirthdate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-1">Altura (cm)</label>
            <input
              inputMode="numeric"
              className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value.replace(/\D/g, ""))}
              placeholder="Ej. 178"
            />
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-1">Sexo</label>
            <select
              className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
              value={sex}
              onChange={(e) => setSex(e.target.value as Sex)}
            >
              <option value="">—</option>
              <option value="male">Hombre</option>
              <option value="female">Mujer</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-1">Nivel</label>
            <select
              className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
              value={level}
              onChange={(e) => setLevel(e.target.value as Level)}
            >
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-white/80 mb-1">Objetivo</label>
            <input
              className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Hipertrofia, fuerza, recomposición…"
            />
          </div>
        </div>
      </section>

      <section className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-5 mt-6">
        <h2 className="font-medium text-white/90">Métrica rápida (hoy)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-white/80 mb-1">Peso (kg)</label>
            <input
              inputMode="decimal"
              className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value.replace(/[^0-9.,]/g, "").replace(",", "."))}
              placeholder="Ej. 72.3"
            />
          </div>
          <div>
            <label className="block text-sm text-white/80 mb-1">% Grasa</label>
            <input
              inputMode="decimal"
              className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
              value={bodyfatPct}
              onChange={(e) => setBodyfatPct(e.target.value.replace(/[^0-9.,]/g, "").replace(",", "."))}
              placeholder="Ej. 15.8"
            />
          </div>
          <div>
            <label className="block text-sm text-white/80 mb-1">Notas</label>
            <input
              className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cómo te sientes hoy…"
            />
          </div>
        </div>
      </section>

      <div className="mt-6 flex gap-3">
        <button
          onClick={saveAll}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 font-semibold px-4 py-2 hover:bg-slate-100 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar
        </button>
      </div>
    </main>
  );
}
