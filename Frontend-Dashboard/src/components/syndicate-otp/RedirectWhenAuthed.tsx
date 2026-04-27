"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { hasSimpleAuthSessionClient } from "@/lib/portal-api";

/** Sends users who already have a session to the app so browser Back from `/` does not land on auth screens. */
export default function RedirectWhenAuthed() {
  const router = useRouter();
  useLayoutEffect(() => {
    if (!hasSimpleAuthSessionClient()) return;
    router.replace("/");
  }, [router]);
  return null;
}
