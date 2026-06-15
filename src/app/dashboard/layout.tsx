import { requireSession } from "@/lib/auth";
import { DashboardNav } from "@/components/layout/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="flex min-h-screen bg-muted/20">
      <DashboardNav
        organizationName={session.organization.name}
        userName={session.profile.full_name}
      />
      <main className="flex-1 pt-14 lg:pt-0">
        <div className="mx-auto max-w-6xl p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
