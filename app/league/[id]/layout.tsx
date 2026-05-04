import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { LeagueTabs } from "./LeagueTabs";
import { Logo } from "@/components/ui/logo";

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
      <header className="sticky top-0 z-40 border-b border-border/60 glass">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <Link href="/leagues" className="hover:opacity-90 transition-opacity">
            <Logo size={28} />
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/leagues"
              className="text-xs text-muted-foreground hover:text-foreground hover:bg-accent px-2 py-1.5 rounded-md transition"
            >
              Liga wechseln
            </Link>
            <Link
              href="/account"
              className="text-xs text-muted-foreground hover:text-foreground hover:bg-accent px-2 py-1.5 rounded-md transition"
            >
              Account
            </Link>
            <LogoutButton />
          </div>
        </div>
        <LeagueTabs leagueId={id} />
      </header>
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-6 pb-24">{children}</main>
    </div>
  );
}
