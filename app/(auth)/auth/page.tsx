"use client";

import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Loader2,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Github,
  Chrome,
} from "lucide-react";
import type { Database } from "../../../src/types/supabase";

// ---- SUPABASE CLIENT (browser) ----
function useSupabase() {
  const supabase = useMemo(
    () =>
      createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );
  return supabase;
}

// ---- GUARDA/ACTUALIZA EN BBDD TRAS LOGIN/SIGNUP ----
async function ensureProfileClient(supabase: any) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  const u = session.user;
  const displayName =
    (u.user_metadata?.full_name as string) ||
    (u.user_metadata?.name as string) ||
    null;

  // Espejo (opcional): si tu tabla public.users tiene policies de INSERT
  const { error: usersErr } = await supabase
    .from("users" as any)
    .upsert(
      {
        id: u.id,
        email: u.email ?? "",
      } as any
    );

  if (usersErr) {
    console.warn("users upsert error:", usersErr.message);
  }

  // Perfil principal
  const { error: profErr } = await supabase
    .from("profiles" as any)
    .upsert(
      {
        user_id: u.id,
        display_name: displayName,
      } as any
    );

  if (profErr) {
    console.error("profiles upsert error:", profErr.message);
  }
}

// ---- TOAST SIMPLE ----
function Toast({
  message,
  type,
}: {
  message: string;
  type: "success" | "error" | "info";
}) {
  const color =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-slate-600";
  return (
    <div
      className={`fixed top-4 right-4 z-50 text-white px-4 py-2 rounded-xl shadow-lg ${color}`}
    >
      {message}
    </div>
  );
}

export default function AuthPage() {
  const supabase = useSupabase();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const notify = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ---- LOGIN ----
  const handleLogin = async () => {
    if (!email || !password)
      return notify("Rellena email y contraseña", "error");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setLoading(false);
      return notify(error.message, "error");
    }

    await supabase.auth.refreshSession();
    await ensureProfileClient(supabase);
    setLoading(false);
    notify("¡Bienvenido!", "success");
    window.location.replace("/onboarding");
  };

  // ---- MAGIC LINK ----
  const handleMagicLink = async () => {
    if (!email) return notify("Escribe tu email", "error");
    setLoading(true);

    await supabase.auth.signOut();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) return notify(error.message, "error");
    notify("Te enviamos un enlace mágico. Revisa tu correo.", "success");
  };

  // ---- SIGNUP ----
  const handleSignup = async () => {
    if (!email || !password)
      return notify("Email y contraseña son obligatorios", "error");
    setLoading(true);

    await supabase.auth.signOut();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (
      error?.message === "User already registered" ||
      (error as any)?.code === "user_already_exists"
    ) {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setLoading(false);
      if (resendError) return notify(resendError.message, "error");
      return notify(
        "La cuenta ya existía. Te reenviamos el correo de confirmación.",
        "success"
      );
    }

    if (error) {
      setLoading(false);
      return notify(error.message, "error");
    }

    if (data.session) {
      await ensureProfileClient(supabase);
      setLoading(false);
      notify("Cuenta creada.", "success");
      return window.location.replace("/onboarding");
    }

    setLoading(false);
    notify("Cuenta creada. Revisa tu email para confirmar el acceso.", "success");
  };

  // ---- OAUTH ----
  const signWithProvider = async (provider: "google" | "github") => {
    setLoading(true);
    await supabase.auth.signOut();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) notify(error.message, "error");
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-slate-950">
      {toast && <Toast {...toast} />}

      {/* Background decor */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-1/3 -left-1/4 h-[60vh] w-[60vh] rounded-full blur-3xl opacity-20 bg-indigo-500" />
        <div className="absolute -bottom-1/3 -right-1/4 h-[60vh] w-[60vh] rounded-full blur-3xl opacity-20 bg-fuchsia-500" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06),rgba(2,6,23,0.6))]" />
      </div>

      {/* Card */}
      <div className="relative h-full w-full grid place-items-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-[0_10px_60px_rgba(0,0,0,0.5)] p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-white text-3xl font-semibold tracking-tight">
                prueba
              </h1>
              <p className="text-slate-300 text-sm">
                Accede a tu progreso y rutinas
              </p>
            </div>
          </div>

          {/* Mode switch */}
          <div className="grid grid-cols-2 gap-2 bg-white/10 p-1 rounded-2xl mb-6">
            <button
              onClick={() => setMode("login")}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                mode === "login"
                  ? "bg-white text-slate-900"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                mode === "signup"
                  ? "bg-white text-slate-900"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Crear cuenta
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <label className="text-sm text-white/90">Nombre</label>
                <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-2xl px-3">
                  <UserPlus className="w-4 h-4 text-white/70" />
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full bg-transparent py-3 text-white placeholder:text-white/40 outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm text-white/90">Email</label>
              <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-2xl px-3">
                <Mail className="w-4 h-4 text-white/70" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full bg-transparent py-3 text-white placeholder:text-white/40 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/90">Contraseña</label>
              <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-2xl px-3">
                <LockKeyhole className="w-4 h-4 text-white/70" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent py-3 text-white placeholder:text-white/40 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="text-white/70 hover:text-white"
                >
                  {showPwd ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-white/50">
                Mínimo 8 caracteres. O usa enlace mágico.
              </p>
            </div>

            {mode === "login" ? (
              <div className="grid gap-3">
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-slate-900 font-semibold py-3 hover:bg-slate-100 transition disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  Entrar
                </button>
                <button
                  onClick={handleMagicLink}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-transparent border border-white/20 text-white font-semibold py-3 hover:bg-white/10 transition disabled:opacity-60"
                >
                  <Mail className="w-4 h-4" /> Enlace mágico al email
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignup}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white text-slate-900 font-semibold py-3 hover:bg-slate-100 transition disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Crear cuenta
              </button>
            )}

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-white/15" />
              <span className="text-white/60 text-xs">o continúa con</span>
              <div className="h-px flex-1 bg-white/15" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => signWithProvider("google")}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-slate-900 font-semibold py-3 hover:bg-slate-100 transition disabled:opacity-60"
              >
                <Chrome className="w-4 h-4" /> Google
              </button>
              <button
                onClick={() => signWithProvider("github")}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 text-white border border-white/15 font-semibold py-3 hover:bg-white/20 transition disabled:opacity-60"
              >
                <Github className="w-4 h-4" /> GitHub
              </button>
            </div>

            <p className="text-[11px] text-white/60 text-center mt-2">
              Al continuar aceptas nuestros Términos y la Política de
              Privacidad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
