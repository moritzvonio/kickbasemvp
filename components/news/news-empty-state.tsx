import { Newspaper } from "lucide-react";
import { Card } from "@/components/ui/card";

export function NewsEmptyState({
  title = "Noch keine News",
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card>
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
          <Newspaper className="size-6" />
        </div>
        <h3 className="font-semibold mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
        )}
      </div>
    </Card>
  );
}
