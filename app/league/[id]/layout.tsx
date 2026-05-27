import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { LeagueTabs } from "./LeagueTabs";
import { TrackPageView } from "@/components/track-page-view";
import { Logo } from "@/components/ui/logo";
import { UserAvatar } from "@/components/ui/user-avatar";
import { getSession } from "@/lib/session";
import { kb } from "@/lib/kickbase/api";
import { ArrowLeftRight, Settings, ChevronRight } from "lucide-react";

export default async function LeagueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  // Lightweight league name lookup (cached at request layer is OK)
  let leagueName: string | null = null;
  if (session) {
    try {
      const list = await kb.leagues(session.token);
      leagueName = list.it?.find((l) => l.i === id)?.n ?? null;
    } catch {
      leagueName = null;
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TrackPageView />
      <header className="sticky top-0 z-40 border-b border-border/60 glass">
        {/* Top brand bar */}
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/leagues" className="hover:opacity-90 transition-opacity shrink-0">
              <Logo size={28} />
            </Link>
            {leagueName && (
              <>
                <ChevronRight className="size-3.5 text-muted-foreground/60 shrink-0 hidden sm:block" />
                <Link
                  href="/leagues"
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-foreground hover:bg-accent transition-colors max-w-[260px] truncate"
                  title="Liga wechseln"
                >
                  <span className="truncate">{leagueName}</span>
                  <ArrowLeftRight className="size-3 text-muted-foreground shrink-0" />
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/leagues"
              className="sm:hidden inline-flex size-8 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition"
              title="Liga wechseln"
              aria-label="Liga wechseln"
            >
              <ArrowLeftRight className="size-4" />
            </Link>
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition"
              title="Account"
            >
              {session?.name ? (
                <UserAvatar name={session.name} size="xs" />
              ) : (
                <Settings className="size-4" />
              )}
              <span className="hidden md:inline max-w-[90px] truncate">
                {session?.name ?? "Account"}
              </span>
            </Link>
            <LogoutButton />
          </div>
        </div>

        {/* Tabs row — pill-style segmented control */}
        <LeagueTabs leagueId={id} />
      </header>

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-6 pb-24">{children}</main>
    </div>
  );
}
