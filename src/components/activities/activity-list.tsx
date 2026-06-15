"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toggleActivityDoneAction } from "@/lib/actions/activities";
import { formatDate } from "@/lib/format";
import { ACTIVITY_TYPE_LABELS, type Activity, type ActivityType } from "@/types/entities";

interface ActivityListProps {
  activities: Array<Activity & { client?: { full_name: string } | null }>;
}

export function ActivityList({ activities }: ActivityListProps) {
  const router = useRouter();

  const handleDone = async (id: string) => {
    await toggleActivityDoneAction(id, true);
    router.refresh();
  };

  if (activities.length === 0) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Rien à faire aujourd&apos;hui.</CardContent></Card>;
  }

  return (
    <div className="space-y-2">
      {activities.map((a) => (
        <Card key={a.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">
                {ACTIVITY_TYPE_LABELS[a.type as ActivityType]} — {a.client?.full_name ?? "Client"}
              </p>
              <p className="text-sm text-muted-foreground">
                {a.due_at ? formatDate(a.due_at) : "—"}
                {a.note && ` · ${a.note}`}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => handleDone(a.id)}>
              <Check className="h-4 w-4" />Fait
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
