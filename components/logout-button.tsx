"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton({
  size = "sm",
  variant = "ghost",
}: {
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size={size}
      variant={variant}
      disabled={pending}
      onClick={() => {
        start(async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          router.push("/");
          router.refresh();
        });
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      <span className="hidden sm:inline">Logout</span>
    </Button>
  );
}
