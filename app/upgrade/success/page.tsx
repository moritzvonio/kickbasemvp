import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSessionOrRedirect } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { setEntitlement, type Plan } from "@/lib/entitlement";
import { currentHalfSeason, halfSeasonEnd } from "@/lib/season";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = { title: "Willkommen bei Pro" };
export const dynamic = "force-dynamic";

export default async function UpgradeSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const sp = await searchParams;
  const session = await requireSessionOrRedirect("/upgrade/success");
  const stripe = getStripe();

  if (!stripe || !sp.session_id) {
    redirect("/upgrade");
  }

  // Checkout-Session prüfen und Entitlement setzen.
  let plan: Plan = currentHalfSeason().key;
  let exp = Math.floor(currentHalfSeason().end.getTime() / 1000);
  try {
    const cs = await stripe.checkout.sessions.retrieve(sp.session_id);
    if (cs.client_reference_id !== session.userId) {
      throw new Error("Session belongs to a different user");
    }
    if (cs.status !== "complete" || cs.payment_status !== "paid") {
      throw new Error("Checkout nicht abgeschlossen");
    }
    const meta = cs.metadata?.plan;
    if (meta === "hinrunde-2627" || meta === "rueckrunde-2627") plan = meta;

    // Zugang gilt bis zum Ende der gekauften Halbserie (exakt, nicht „rough").
    const end =
      plan === "hinrunde-2627" || plan === "rueckrunde-2627"
        ? halfSeasonEnd(plan)
        : currentHalfSeason().end;
    exp = Math.floor(end.getTime() / 1000);

    await setEntitlement({ userId: session.userId, plan, exp });
  } catch {
    redirect("/upgrade");
  }

  const planLabel =
    plan === "rueckrunde-2627" ? "Pro Rückrunde 26/27" : "Pro Hinrunde 26/27";

  return (
    <div className="flex-1 mx-auto max-w-md px-4 py-20 text-center">
      <div className="size-16 rounded-full bg-primary/15 mx-auto flex items-center justify-center mb-6">
        <Sparkles className="size-8 text-primary" />
      </div>
      <h1 className="text-3xl font-bold mb-2">Willkommen bei Pro</h1>
      <p className="text-muted-foreground mb-8">
        Plan: <span className="text-foreground font-medium">{planLabel}</span>
        <br />
        Zugang bis {new Date(exp * 1000).toLocaleDateString("de-DE")}.
      </p>
      <Button asChild>
        <Link href="/leagues">Zu deinen Ligen</Link>
      </Button>
    </div>
  );
}
