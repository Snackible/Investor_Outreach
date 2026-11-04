"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

/** Goes back to wherever you came from (keeping its filters), or to a sensible page when opened directly. */
export function BackLink({ fallback, label = "Back" }: { fallback: string; label?: string }) {
  const router = useRouter();
  return (
    <Link
      href={fallback}
      className="back"
      onClick={(e) => {
        if (window.history.length > 1) {
          e.preventDefault();
          router.back();
        }
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
        <path d="M8 2 L4 6 L8 10" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
      {label}
    </Link>
  );
}
