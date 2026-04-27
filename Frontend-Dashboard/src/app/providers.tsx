"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ActivityTimelineProvider } from "@/contexts/ActivityTimelineContext";
import { GoalsPanelProvider } from "@/contexts/GoalsPanelContext";
import { GoalsGlobalChrome } from "@/components/ui/GoalsGlobalChrome";
import { ActivityRouteTracker } from "@/components/activity/ActivityRouteTracker";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ActivityTimelineProvider>
        <ActivityRouteTracker />
        <GoalsPanelProvider>
          {children}
          <GoalsGlobalChrome />
        </GoalsPanelProvider>
      </ActivityTimelineProvider>
    </AuthProvider>
  );
}
