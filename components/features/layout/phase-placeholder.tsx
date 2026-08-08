import { Topbar } from "@/components/features/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

export function PhasePlaceholder({
  title,
  icon: Icon,
  phase,
  description,
}: {
  title: string;
  icon: LucideIcon;
  phase: string;
  description: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Topbar title={title} />
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="max-w-sm text-center">
          <CardContent className="flex flex-col items-center p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-4 manifest-chip">{phase}</p>
            <h2 className="mt-3 font-display text-lg font-semibold">{title}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
