import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiStatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  href?: string;
  icon?: LucideIcon;
  valueClassName?: string;
  alert?: boolean;
}

export function KpiStatCard({
  title,
  value,
  subtitle,
  href,
  icon: Icon,
  valueClassName,
  alert,
}: KpiStatCardProps) {
  const content = (
    <Card
      className={cn(
        "transition-shadow",
        href && "hover:shadow-md",
        alert && "border-red-200 bg-red-50/40"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <p className={cn("text-2xl font-bold", valueClassName)}>{value}</p>
        {subtitle && (
          <p className={cn("mt-1 text-xs", alert ? "text-red-700" : "text-muted-foreground")}>
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
