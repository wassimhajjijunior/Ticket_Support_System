"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

import { Button, Card } from "@/components/ui/kit";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[60dvh] place-items-center px-2">
      <Card className="flex max-w-md flex-col items-center px-7 py-12 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-display text-heading text-ink">
          Something went sideways
        </h2>
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-faint">
          The page hit an unexpected error. Your data is safe — try again, or
          head back to the dashboard.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <Button onClick={reset}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Dashboard
            </Link>
          </Button>
        </div>
        {error.digest ? (
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
            Reference {error.digest}
          </p>
        ) : null}
      </Card>
    </div>
  );
}
