import { Newspaper, AtSign, Shield, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NewsSourceType } from "@/lib/news/types";

const TYPE_META: Record<
  NewsSourceType,
  { label: string; icon: typeof Newspaper; color: string }
> = {
  club: { label: "Verein", icon: Shield, color: "text-emerald-700 bg-emerald-50" },
  reporter: { label: "Reporter", icon: AtSign, color: "text-sky-700 bg-sky-50" },
  media: { label: "Medien", icon: Newspaper, color: "text-indigo-700 bg-indigo-50" },
  community: {
    label: "Community",
    icon: Users,
    color: "text-violet-700 bg-violet-50",
  },
};

export function NewsSourceBadge({
  type,
  name,
  className,
}: {
  type: NewsSourceType;
  name: string;
  className?: string;
}) {
  const meta = TYPE_META[type] ?? TYPE_META.media;
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ring-current/10",
        meta.color,
        className
      )}
      title={`${meta.label}: ${name}`}
    >
      <Icon className="size-3" />
      <span className="truncate max-w-[120px]">{name}</span>
    </span>
  );
}
