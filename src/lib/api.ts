import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

/**
 * CogniGuard API Client
 *
 * Axios instance pre-configured with:
 * - Base URL from environment
 * - JWT token injection via request interceptor
 * - 401 auto-logout via response interceptor
 * - Typed error extraction
 */

export function getApiUrl(): string {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    return `http://${hostname}:8000/api`;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
}

const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor: attach JWT ─────────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.baseURL = getApiUrl();
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 & token refresh ──────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ detail?: string }>) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      if (typeof window !== "undefined") {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          try {
            const apiURL = getApiUrl();
            const response = await axios.post(`${apiURL}/auth/refresh`, {
              refresh_token: refreshToken,
            });
            
            const { access_token, refresh_token } = response.data;
            localStorage.setItem("token", access_token);
            if (refresh_token) {
              localStorage.setItem("refreshToken", refresh_token);
            }
            
            // Retry the original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
            }
            return api(originalRequest);
          } catch (refreshError) {
            // Refresh token is expired or invalid
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("authenticated");
            localStorage.removeItem("guestMode");
            localStorage.removeItem("calibrated");
            window.location.href = "/login";
          }
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("authenticated");
          localStorage.removeItem("guestMode");
          localStorage.removeItem("calibrated");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);


// ── Typed API helpers ───────────────────────────────────────────────────────

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || error.message || "An error occurred";
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

export interface ApiResponse<T> {
  data: T;
  status: number;
}

// ── Intervention Agent Data Contracts ────────────────────────────────────────

export interface InterventionDecision {
  intervention_needed: boolean;
  severity: "NONE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  intervention_type: string;
  title: string;
  message: string;
  reason: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  confidence: number;
  recommended_duration_mins: number;
  delivery_channels: string[];
  cooldown_active: boolean;
  cooldown_remaining_seconds: number;
  active_intervention_id?: number | null;
  evaluated_at: string;
}

export interface InterventionResponse {
  id: number;
  user_id: number;
  triggered_at: string;
  intervention_type: string;
  message: string;
  stress_level_at_trigger: number;
  risk_tier_at_trigger: string;
  severity?: string;
  priority?: string;
  confidence?: number;
  recommended_duration_mins?: number;
  delivery_channel?: string;
  reason?: string | null;
  was_acknowledged: boolean;
  acknowledged_at?: string | null;
  was_dismissed: boolean;
  dismissed_at?: string | null;
  dismissal_reason?: string | null;
  was_aborted?: boolean;
  aborted_at?: string | null;
  abort_reason?: string | null;
  effectiveness_result?: string | null;
  effectiveness_score?: number | null;
  effectiveness_evaluated_at?: string | null;
  effectiveness_summary?: string | null;
  decision_context?: string | null;
}

export interface InterventionMLTuple {
  intervention_id: number;
  user_id: number;
  triggered_at?: string | null;
  state: Record<string, any>;
  action: {
    intervention_type: string;
    severity?: string | null;
    priority?: string | null;
    confidence?: number | null;
    recommended_duration_mins?: number | null;
    delivery_channel?: string | null;
    message?: string | null;
    reason?: string | null;
  };
  user_response: "completed" | "dismissed" | "aborted" | "pending";
  outcome: {
    response_at?: string | null;
    dismissal_reason?: string | null;
    abort_reason?: string | null;
    effectiveness_result?: string | null;
    effectiveness_score?: number | null;
    effectiveness_evaluated_at?: string | null;
    effectiveness_metrics?: Record<string, any> | null;
    effectiveness_summary?: string | null;
  };
}

export interface MetricDelta {
  before?: number | null;
  after?: number | null;
  delta_pct?: number | null;
  improved?: boolean | null;
}

export interface InterventionEffectiveness {
  intervention_id: number;
  intervention_type: string;
  acknowledged_at?: string | null;
  evaluated_at: string;
  result: "IMPROVED" | "STABLE" | "DECLINED" | "INSUFFICIENT_DATA";
  summary: string;
  score?: number | null;
  has_sufficient_data: boolean;
  observation_window_mins: number;
  metrics: Record<string, MetricDelta>;
}

// ── Service layer placeholders ──────────────────────────────────────────────

export const biometricsApi = {
  getLatest: () => api.get("/biometrics/latest"),
  getHistory: (days?: number) =>
    api.get("/biometrics/history", { params: { days } }),
};

export const interventionsApi = {
  evaluate: (params?: { test_strain?: boolean; test_stress?: number; bypass_cooldown?: boolean }) =>
    api.get<InterventionDecision>("/interventions/evaluate", { params }),
  getActive: () => api.get<InterventionResponse | null>("/interventions/active"),
  acknowledge: (intervention_id: number) =>
    api.post<InterventionResponse>("/interventions/acknowledge", { intervention_id }),
  dismiss: (intervention_id: number, reason?: string) =>
    api.post<InterventionResponse>("/interventions/dismiss", { intervention_id, reason }),
  abort: (intervention_id: number, reason?: string) =>
    api.post<InterventionResponse>("/interventions/abort", { intervention_id, reason }),
  getHistory: (limit = 20) =>
    api.get<InterventionResponse[]>("/interventions/", { params: { limit } }),
  getEffectiveness: (intervention_id: number) =>
    api.get<InterventionEffectiveness>(`/interventions/${intervention_id}/effectiveness`),
  getLatestEffectiveness: () =>
    api.get<InterventionEffectiveness | null>("/interventions/latest-effectiveness"),
  getMLTuples: (limit = 50) =>
    api.get<InterventionMLTuple[]>("/interventions/ml-tuples", { params: { limit } }),
  getMLTuple: (intervention_id: number) =>
    api.get<InterventionMLTuple>(`/interventions/${intervention_id}/ml-tuple`),
};

export const analyticsApi = {
  getDashboard: () => api.get("/analytics/dashboard"),
  getBurnoutForecast: () => api.get("/analytics/burnout-forecast"),
};

export default api;
