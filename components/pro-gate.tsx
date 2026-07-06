import Link from "next/link";
import { hasPro } from "@/lib/entitlement";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";

interface ProGateProps {
  userId: string;
  children: React.ReactNode;
  /** Custom upsell title */
  title?: string;
  /** Custom upsell text */
  description?: string;
}

export async function ProGate({
  userId,
  children,
  title = "Pro-Feature",
  description = "Sieh die Kontostände und Max-Gebote aller Manager – 6 € pro Halbserie.",
}: ProGateProps) {
  const ok = await hasPro(userId);
  if (ok) return <>{children}</>;
  return <ProUpsell title={title} description={description} />;
}

export function ProUpsell({
  title = "Pro-Feature",
  description = "Sieh die Kontostände und Max-Gebote aller Manager – 6 € pro Halbserie.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card className="border-primary/30 bg-primary/[0.04]">
      <CardContent className="py-8 text-center">
        <div className="size-10 rounded-full bg-primary/15 mx-auto flex items-center justify-center mb-3">
          <Lock className="size-4 text-primary" />
        </div>
        <h3 className="font-semibold mb-1 flex items-center justify-center gap-1.5">
          <Sparkles className="size-4 text-primary" />
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">{description}</p>
        <Button asChild size="sm">
          <Link href="/upgrade">Pro freischalten</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
