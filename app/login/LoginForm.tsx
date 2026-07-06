"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { loginDest } from "@/lib/login-dest";

interface ApiError {
  error: string;
  message: string;
}

export function LoginForm({ next, refId }: { next?: string; refId?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, ref: refId }),
    });
    if (!res.ok) {
      const data: ApiError = await res.json().catch(() => ({ error: "UNKNOWN", message: "Login fehlgeschlagen" }));
      setError(data.message ?? "Login fehlgeschlagen");
      return;
    }
    const data: { leagueCount?: number; firstLeagueId?: string } = await res
      .json()
      .catch(() => ({}));
    // Bei genau einer Liga direkt ins Dashboard; next-Param hat Vorrang.
    const dest = loginDest(next, data.leagueCount, data.firstLeagueId);
    startTransition(() => {
      router.push(dest);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">E-Mail</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="du@beispiel.de"
          disabled={isPending}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Passwort</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={isPending}
        />
      </div>
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Einloggen…
          </>
        ) : (
          "Einloggen"
        )}
      </Button>
    </form>
  );
}
