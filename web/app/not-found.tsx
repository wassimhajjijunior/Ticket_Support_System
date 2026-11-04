import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/kit";

export default function NotFound() {
  return (
    <div className="grid min-h-[60dvh] place-items-center px-2">
      <div className="max-w-md text-center">
        <p
          aria-hidden="true"
          className="text-gradient font-display text-[72px] font-bold leading-none tracking-[-0.06em]"
        >
          404
        </p>
        <h2 className="mt-3 font-display text-heading text-ink">
          This page slipped out of the queue
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-faint">
          The link may be old, or the page may have moved. Head back to your
          dashboard and pick up the thread.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
