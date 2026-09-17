import api from "./api";
import type {
  RecoverySessionRecordDTO,
  StartRecoverySessionPayload,
  CompleteRecoverySessionPayload,
  AbortRecoverySessionPayload,
  RecoverySummaryDTO,
} from "@/types/recovery";

/**
 * G-R9 — Persistent Recovery Session Tracking API Client
 */

export async function startRecoverySession(
  payload: StartRecoverySessionPayload
): Promise<RecoverySessionRecordDTO | null> {
  try {
    const res = await api.post<RecoverySessionRecordDTO>(
      "/recovery/sessions/start",
      payload
    );
    return res.data;
  } catch (error) {
    console.warn("[recoveryApi] startRecoverySession failed:", error);
    return null;
  }
}

export async function completeRecoverySession(
  sessionId: number,
  payload: CompleteRecoverySessionPayload
): Promise<RecoverySessionRecordDTO | null> {
  try {
    const res = await api.post<RecoverySessionRecordDTO>(
      `/recovery/sessions/${sessionId}/complete`,
      payload
    );
    return res.data;
  } catch (error) {
    console.warn("[recoveryApi] completeRecoverySession failed:", error);
    return null;
  }
}

export async function abortRecoverySession(
  sessionId: number,
  payload: AbortRecoverySessionPayload
): Promise<RecoverySessionRecordDTO | null> {
  try {
    const res = await api.post<RecoverySessionRecordDTO>(
      `/recovery/sessions/${sessionId}/abort`,
      payload
    );
    return res.data;
  } catch (error) {
    console.warn("[recoveryApi] abortRecoverySession failed:", error);
    return null;
  }
}

export async function getRecentRecoverySessions(
  limit: number = 10
): Promise<RecoverySessionRecordDTO[]> {
  try {
    const res = await api.get<RecoverySessionRecordDTO[]>("/recovery/sessions", {
      params: { limit },
    });
    return res.data || [];
  } catch (error) {
    console.warn("[recoveryApi] getRecentRecoverySessions failed:", error);
    return [];
  }
}

/**
 * G-R10 — Fetch aggregate recovery usage summary for the authenticated user.
 * Returns null when the user has no session history or on any network/auth error.
 */
export async function getRecoverySummary(): Promise<RecoverySummaryDTO | null> {
  try {
    const res = await api.get<RecoverySummaryDTO>("/recovery/history/summary");
    return res.data ?? null;
  } catch (error) {
    console.warn("[recoveryApi] getRecoverySummary failed:", error);
    return null;
  }
}
