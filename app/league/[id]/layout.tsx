import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { LeagueTabs } from "./LeagueTabs";

export default async function LeagueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/50 backdrop-blur-md bg-background/85">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/leagues" className="flex items-center gap-2 text-sm">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
                B
              </span>
              <span className="font-bold">BetterBase</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/leagues"
              className="text-xs text-muted-foreground hover:text-foreground transition"
            >
              Liga wechseln
            </Link>
            <LogoutButton />
          </div>
        </div>
        <LeagueTabs leagueId={id} />
      </header>
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-6 pb-24">
        {children}
      </main>
    </div>
  );
}
