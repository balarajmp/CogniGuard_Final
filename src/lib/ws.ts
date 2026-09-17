/**
 * CogniGuard WebSocket Manager
 *
 * Provides a reconnecting WebSocket client for real-time telemetry streaming.
 */

export type WSEventType =
  | "biometric_update"
  | "burnout_alert"
  | "intervention_triggered"
  | "calibration_progress"
  | "connection_status";

export interface WSMessage {
  type: WSEventType;
  payload: Record<string, any>;
  timestamp: string;
}

type WSListener = (message: WSMessage) => void;

export class CogniGuardWS {
  private ws: WebSocket | null = null;
  private path: string;
  private listeners: Map<WSEventType | "*", Set<WSListener>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // ms, doubles each attempt
  private shouldReconnect = true;

  constructor(path = "/ws/telemetry") {
    this.path = path;
  }

  private getUrl(): string {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const envWs = process.env.NEXT_PUBLIC_WS_URL;
      if (envWs && !envWs.includes("localhost") && !envWs.includes("127.0.0.1")) {
        return `${envWs}${this.path}`;
      }
      
      const envApi = process.env.NEXT_PUBLIC_API_URL;
      if (envApi && !envApi.includes("localhost") && !envApi.includes("127.0.0.1")) {
        const wsBase = envApi.replace(/^http/, "ws").replace(/\/api$/, "");
        return `${wsBase}${this.path}`;
      }
      
      return `ws://${hostname}:8000${this.path}`;
    }
    return `ws://localhost:8000${this.path}`;
  }

  /** Connect to the WebSocket server */
  connect(): void {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    const wsUrl = token ? `${this.getUrl()}?token=${token}` : this.getUrl();

    try {
      // Pass token as subprotocol to handle auth handshake correctly
      const protocols = token ? ["cognitoshield-telemetry", token] : undefined;
      this.ws = new WebSocket(wsUrl, protocols);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.emit({
          type: "connection_status",
          payload: { connected: true },
          timestamp: new Date().toISOString(),
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          let message: WSMessage;

          if (data.stress_level !== undefined || data.stressLevel !== undefined) {
            message = {
              type: "biometric_update",
              payload: data,
              timestamp: new Date().toISOString(),
            };
          } else if (data.status === "authenticated") {
            message = {
              type: "connection_status",
              payload: { connected: true, user: data.user, role: data.role },
              timestamp: new Date().toISOString(),
            };
          } else {
            message = {
              type: data.type || "biometric_update",
              payload: data.payload || data,
              timestamp: data.timestamp || new Date().toISOString(),
            };
          }

          this.emit(message);
        } catch {
          console.warn("[CogniGuardWS] Failed to parse message:", event.data);
        }
      };

      this.ws.onclose = () => {
        this.emit({
          type: "connection_status",
          payload: { connected: false },
          timestamp: new Date().toISOString(),
        });
        this.attemptReconnect();
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch (err) {
      console.error("[CogniGuardWS] Connection error:", err);
      this.attemptReconnect();
    }
  }

  /** Disconnect and stop reconnecting */
  disconnect(): void {
    this.shouldReconnect = false;
    this.ws?.close();
    this.ws = null;
  }

  /** Subscribe to a specific event type, or "*" for all */
  on(type: WSEventType | "*", listener: WSListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(type)?.delete(listener);
    };
  }

  /** Send a message to the server */
  send(data: Record<string, any>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  /** Check if connected */
  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private emit(message: WSMessage): void {
    // Notify type-specific listeners
    this.listeners.get(message.type)?.forEach((fn) => fn(message));
    // Notify wildcard listeners
    this.listeners.get("*")?.forEach((fn) => fn(message));
  }

  private attemptReconnect(): void {
    if (
      !this.shouldReconnect ||
      this.reconnectAttempts >= this.maxReconnectAttempts
    ) {
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    setTimeout(() => {
      this.connect();
    }, delay);
  }
}

/** Singleton instance for the biometric stream */
let biometricWS: CogniGuardWS | null = null;

export function getBiometricWS(): CogniGuardWS {
  if (!biometricWS) {
    biometricWS = new CogniGuardWS("/ws/telemetry");
  }
  return biometricWS;
}
