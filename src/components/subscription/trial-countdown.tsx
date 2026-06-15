"use client";

import { useEffect, useState } from "react";

interface TrialCountdownProps {
  trialEndsAt: string;
}

function getRemaining(end: Date) {
  const diff = end.getTime() - Date.now();
  if (diff <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { expired: false, days, hours, minutes, seconds };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function TrialCountdown({ trialEndsAt }: TrialCountdownProps) {
  const end = new Date(trialEndsAt);
  const [remaining, setRemaining] = useState(() => getRemaining(end));

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(getRemaining(end));
    }, 1000);
    return () => clearInterval(timer);
  }, [trialEndsAt]);

  if (remaining.expired) {
    return (
      <p className="text-sm font-medium text-red-700">
        Votre période d&apos;essai est terminée. Activez un abonnement pour continuer.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4">
      {[
        { label: "Jours", value: remaining.days },
        { label: "Heures", value: remaining.hours },
        { label: "Minutes", value: remaining.minutes },
        { label: "Secondes", value: remaining.seconds },
      ].map(({ label, value }) => (
        <div
          key={label}
          className="rounded-lg border bg-background px-2 py-3 text-center sm:px-4"
        >
          <p className="text-2xl font-bold tabular-nums sm:text-3xl">
            {label === "Jours" ? value : pad(value)}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}
