"use client";

import { useState, useTransition } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WatchButton({
  playerId,
  initialWatched,
}: {
  playerId: string;
  initialWatched: boolean;
}) {
  const [watched, setWatched] = useState(initialWatched);
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      const action = watched ? "remove" : "add";
      const r = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, action }),
      });
      if (r.ok) setWatched((w) => !w);
    });
  }

  return (
    <Button
      size="sm"
      variant={watched ? "default" : "outline"}
      onClick={toggle}
      disabled={pending}
      aria-pressed={watched}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Star className={"size-4 " + (watched ? "fill-current" : "")} />
      )}
      <span className="hidden sm:inline">{watched ? "Beobachtet" : "Beobachten"}</span>
    </Button>
  );
}
