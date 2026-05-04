"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function CheckoutButton({
  plan,
  disabled,
  variant = "default",
}: {
  plan: "monthly" | "season";
  disabled?: boolean;
  variant?: "default" | "outline" | "secondary";
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        variant={variant}
        disabled={disabled || pending}
        onClick={() => {
          setError(null);
          start(async () => {
            const r = await fetch("/api/stripe/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ plan }),
            });
            if (!r.ok) {
              const data = await r.json().catch(() => ({}));
              setError(data.message ?? "Checkout konnte nicht gestartet werden.");
              return;
            }
            const { url } = await r.json();
            if (url) window.location.href = url;
          });
        }}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {plan === "monthly" ? "Monatlich starten" : "Saison sichern"}
      </Button>
      {error && (
        <p className="text-xs text-destructive text-center">{error}</p>
      )}
    </div>
  );
}
