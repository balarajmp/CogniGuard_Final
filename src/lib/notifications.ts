/**
 * CognitoShield Browser Notification Utility
 *
 * Provides SSR-safe helpers for:
 * - Detecting browser notification support
 * - Inspecting and requesting permission (without unprompted popups)
 * - Dispatching deduplicated system notifications for Intervention Agent decisions
 * - Focusing dashboard on click
 */

import { InterventionDecision } from "./api";

let lastNotifiedKey: string | number | null = null;

export type NotificationPermissionState =
  | "granted"
  | "denied"
  | "default"
  | "unsupported";

/**
 * Check if the current browser runtime supports native Notifications.
 * SSR-safe: returns false if window or Notification is undefined.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Retrieve the current notification permission state safely.
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) {
    return "unsupported";
  }
  return Notification.permission as NotificationPermissionState;
}

/**
 * Explicitly request notification permission from the user.
 * Must be invoked in response to a direct user action (e.g. clicking a button).
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) {
    return "unsupported";
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionState;
  } catch (err) {
    console.warn("Failed to request notification permission:", err);
    return getNotificationPermission();
  }
}

/**
 * Dispatch a native browser notification for an intervention decision.
 *
 * Deduplication:
 * Prevents firing repeated notifications for the same active intervention
 * across consecutive 30-second polling cycles.
 */
export function sendInterventionNotification(
  decision: InterventionDecision
): boolean {
  if (!isNotificationSupported()) {
    return false;
  }

  if (Notification.permission !== "granted") {
    return false;
  }

  // Deduplication key based on intervention ID or composite parameters
  const currentKey =
    decision.active_intervention_id != null
      ? decision.active_intervention_id
      : `${decision.intervention_type}-${decision.severity}-${decision.reason}`;

  if (lastNotifiedKey === currentKey) {
    // Already alerted user for this intervention
    return false;
  }

  try {
    const durationText = decision.recommended_duration_mins
      ? ` • ${decision.recommended_duration_mins}m recommended`
      : "";

    const notification = new Notification("CognitoShield: Recovery Break", {
      body: `${decision.title}\n${decision.message}\nReason: ${decision.reason}${durationText}`,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: `cognitoshield-intervention-${decision.active_intervention_id ?? decision.intervention_type}`,
    });

    notification.onclick = () => {
      try {
        window.focus();
        window.dispatchEvent(
          new CustomEvent("navigate-tab", { detail: { tab: "recovery" } })
        );
      } catch {
        // window.focus might be restricted in some browser contexts
      }
      notification.close();
    };

    lastNotifiedKey = currentKey;
    return true;
  } catch (err) {
    console.warn("Failed to display native notification:", err);
    return false;
  }
}

/**
 * Reset client-side deduplication tracker when an intervention
 * is acknowledged or dismissed by the user.
 */
export function resetNotificationDeduplication(): void {
  lastNotifiedKey = null;
}
