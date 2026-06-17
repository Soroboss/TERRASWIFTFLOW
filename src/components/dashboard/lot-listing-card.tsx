import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  formatLotNumberReference,
  getLotPhotoUrl,
} from "@/lib/catalog-visibility";
import { propertyStatusColorClass } from "@/lib/property-status";
import type { PropertyStatus } from "@/types/database";

interface LotListingCardProps {
  href: string;
  lotNumber?: string | null;
  reference?: string | null;
  title?: string | null;
  status: PropertyStatus;
  statusLabel: string;
  priceLabel: string;
  photos?: string[] | null;
  footer?: ReactNode;
}

export function LotListingCard({
  href,
  lotNumber,
  reference,
  title,
  status,
  statusLabel,
  priceLabel,
  photos,
  footer,
}: LotListingCardProps) {
  const { number, reference: refLine } = formatLotNumberReference({
    lot_number: lotNumber,
    reference,
    title,
  });
  const photoUrl = getLotPhotoUrl(photos);

  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
        {photoUrl ? (
          <Image src={photoUrl} alt="" fill className="object-cover" sizes="64px" unoptimized />
        ) : (
          <div className={`h-full w-full ${propertyStatusColorClass(status)}`} aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1">
        {number && <p className="truncate font-medium">{number}</p>}
        {refLine && (
          <p className="truncate text-xs text-muted-foreground">{refLine}</p>
        )}
        <p className="text-xs font-medium">
          {statusLabel} · {priceLabel}
        </p>
        {footer}
      </div>
    </Link>
  );
}
