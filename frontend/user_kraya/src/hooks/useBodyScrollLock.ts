"use client";

import { useEffect } from "react";

// Reference-counted body scroll lock. Multiple components can request a lock
// concurrently (e.g., LoginModal opened while CartOverlay is open); the body
// stays locked until the last consumer releases it. Previously each consumer
// raced to set/unset `document.body.style.overflow`, so closing one modal
// could un-lock the body while another was still open.
let lockCount = 0;
let previousOverflow: string | null = null;

function acquire() {
  if (typeof document === "undefined") return;
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;
}

function release() {
  if (typeof document === "undefined") return;
  if (lockCount <= 0) return;
  lockCount -= 1;
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow ?? "";
    previousOverflow = null;
  }
}

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    acquire();
    return release;
  }, [locked]);
}
