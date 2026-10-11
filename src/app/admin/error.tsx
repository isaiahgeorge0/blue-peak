"use client";

import { useEffect } from "react";
import { LevelIllustration } from "@/components/admin/icons";
import { Card, EmptyState, primaryButton } from "@/components/admin/ui";

export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error("admin: page failed", error.digest ?? error.message);
  }, [error]);

  return (
    <div>
      <h1 className="font-serif text-[2rem] leading-tight tracking-heading text-ink sm:text-[2.5rem]">This page didn&apos;t load</h1>
      <Card className="mt-8">
        <EmptyState
          illustration={<LevelIllustration />}
          title="Something went wrong on our side."
          action={
            <button type="button" className={primaryButton} onClick={() => retry()}>
              Try again
            </button>
          }
        >
          Nothing you saved has been lost. Try again, or use the menu to go to another page.
        </EmptyState>
      </Card>
    </div>
  );
}
