import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Mit deinem Kickbase-Account einloggen.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  if (session) redirect(sp.next ?? "/leagues");

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-border/50">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm">
              B
            </span>
            BetterBase
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-1">Mit Kickbase einloggen</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Du brauchst kein neues Konto. Nutze die Zugangsdaten deiner Kickbase-App.
          </p>
          <LoginForm next={sp.next} />
          <p className="mt-6 text-xs text-muted-foreground leading-relaxed">
            🔒 Dein Passwort wird <span className="text-foreground font-medium">nicht gespeichert</span>.
            Wir tauschen es einmalig gegen einen Token von Kickbase und werfen es weg. Der Token landet
            verschlüsselt in einem httpOnly-Cookie.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Noch kein Kickbase-Konto?{" "}
            <a
              href="https://www.kickbase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              kickbase.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
