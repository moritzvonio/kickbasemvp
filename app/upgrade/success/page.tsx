import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSessionOrRedirect } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { setEntitlement, type Plan } from "@/lib/entitlement";
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

  // Verify checkout session and set entitlement
  let plan: Plan = "monthly";
  let exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
  try {
    const cs = await stripe.checkout.sessions.retrieve(sp.session_id, {
      expand: ["subscription"],
    });
    if (cs.client_reference_id !== session.userId) {
      throw new Error("Session belongs to a different user");
    }
    const meta = cs.metadata?.plan;
    if (meta === "season" || meta === "monthly") plan = meta;

    if (cs.mode === "subscription" && cs.subscription) {
      const sub = typeof cs.subscription === "string"
        ? await stripe.subscriptions.retrieve(cs.subscription)
        : cs.subscription;
      const periodEnd = (sub.items?.data?.[0] as { current_period_end?: number } | undefined)?.current_period_end;
      if (periodEnd) exp = periodEnd;
    } else if (cs.mode === "payment") {
      // Season pass — give until end of May next year (rough)
      const now = new Date();
      const nextMay = new Date(now.getFullYear() + (now.getMonth() > 4 ? 1 : 0), 4, 31);
      exp = Math.floor(nextMay.getTime() / 1000);
    }

    await setEntitlement({ userId: session.userId, plan, exp });
  } catch {
    redirect("/upgrade");
  }

  return (
    <div className="flex-1 mx-auto max-w-md px-4 py-20 text-center">
      <div className="size-16 rounded-full bg-primary/15 mx-auto flex items-center justify-center mb-6">
        <Sparkles className="size-8 text-primary" />
      </div>
      <h1 className="text-3xl font-bold mb-2">Willkommen bei Pro</h1>
      <p className="text-muted-foreground mb-8">
        Plan: <span className="text-foreground font-medium">{plan === "season" ? "Pro Saison" : "Pro Monatlich"}</span>
        <br />
        Zugang bis {new Date(exp * 1000).toLocaleDateString("de-DE")}.
      </p>
      <Button asChild>
        <Link href="/leagues">Zu deinen Ligen</Link>
      </Button>
    </div>
  );
}
