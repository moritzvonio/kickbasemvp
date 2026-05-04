import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  cta,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  cta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-center py-14 px-6", className)}>
      <div className="size-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 ring-1 ring-primary/20">
        {icon}
      </div>
      <h3 className="font-semibold text-base mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">{description}</p>
      )}
      {cta}
    </div>
  );
}
