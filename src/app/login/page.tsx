"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError("Email o password non corretti. Controlla e riprova.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="app-shell flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="grid w-full max-w-3xl overflow-hidden rounded-[2rem] border border-line bg-card sm:grid-cols-[1.05fr_1fr]">
        <div className="flex flex-col justify-between gap-8 bg-brand p-8 text-white">
          <img
            src="/profor-logo.png"
            alt="Profor - Ente di Formazione"
            className="h-9 w-auto self-start rounded-xl bg-white px-3 py-1.5"
          />
          <div>
            <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Simulatore Ufficiale
            </h1>
            <p className="mt-2 text-sm text-white/90">
              Allenati per il test di ammissione alle Professioni Sanitarie: 60 domande, 100 minuti, come il giorno
              della prova.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-8">
          <div>
            <p className="font-display text-xl font-bold">Accedi</p>
            <p className="text-sm text-muted">Usa le credenziali che ti ha dato la segreteria.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-semibold">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-line bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-semibold">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-line bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} className="btn btn-brand mt-2 w-full disabled:opacity-60">
            {isSubmitting ? "Accesso in corso…" : "Accedi"}
          </button>
        </form>
      </div>
    </div>
  );
}
