import Link from "next/link";
import { getSession } from "@/lib/session";
import { Logo } from "@/components/ui/logo";

/**
 * Schlanker, geteilter App-Header für Seiten ohne eigene Navigation
 * (/news, /upgrade, /impressum, /datenschutz). Logo führt zur Startseite;
 * rechts je nach Session „Zu deinen Ligen" oder Login.
 */
export async function AppHeader() {
  const session = await getSession();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 glass">
      <div className="mx-auto max-w-4xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="hover:opacity-90 transition">
          <Logo size={28} />
        </Link>
        {session ? (
          <Link
            href="/leagues"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            Zu deinen Ligen
          </Link>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
