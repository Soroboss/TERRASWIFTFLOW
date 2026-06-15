import { getSessionContext } from "@/lib/auth";
import { PlatformNav } from "@/components/platform/platform-nav";
import { PageBackNav } from "@/components/layout/page-back-nav";
import { requirePlatformSession } from "@/lib/platform/auth";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const platformSession = await requirePlatformSession();
  const tenantSession = await getSessionContext();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <PlatformNav
        userName={platformSession.platformUser.full_name}
        role={platformSession.platformUser.role}
        hasTenantAccess={Boolean(tenantSession)}
      />
      <main className="flex-1 pt-14 lg:pt-0">
        <div className="mx-auto max-w-7xl p-4 sm:p-6">
          <PageBackNav homeHref="/platform" homeLabel="Vue d'ensemble" />
          {children}
        </div>
      </main>
    </div>
  );
}
