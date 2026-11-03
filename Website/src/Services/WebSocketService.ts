import type { DataMessage } from "./types";
import { ConnectionService } from "./ConnectionService";

export class WebSocketService implements ConnectionService {

    private ws: WebSocket | null = null;

    private listeners: Array<(data: DataMessage) => void> = [];

    private statusListeners = new Set<(connected: boolean) => void>();

    private notifyConnectionChange(connected: boolean) {
        this.statusListeners.forEach(listener => listener(connected));
    }

    constructor(private readonly url: string) {}

    onConnectionChange(listener: (connected: boolean) => void): () => void {
        this.statusListeners.add(listener);

        return () => {
            this.statusListeners.delete(listener);
        };
    }

    connect(): void {

        if(this.url === "") {
            console.log("WebSocket connection not found");
            this.notifyConnectionChange(true);
            return;
        }
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log("WebSocket connected");
            this.notifyConnectionChange(true);
        };

        this.ws.onmessage = (event: MessageEvent) => {

            try {

                const data: DataMessage = JSON.parse(event.data);

                console.log("Received:", data);

                this.listeners.forEach(listener => {
                    listener(data);
                });

            } catch (error) {
                console.error(
                    "Invalid JSON received:",
                    event.data
                );
            }
        };

        this.ws.onclose = () => {
            console.log("WebSocket disconnected");
            this.ws = null;
            this.notifyConnectionChange(false);
        };

        this.ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };
    }

    subscribe(
        listener: (data: DataMessage) => void
    ): () => void {

        this.listeners.push(listener);

        return () => {
            this.listeners = this.listeners.filter(
                currentListener => currentListener !== listener
            );
        };
    }

    disconnect(): void {
        this.ws?.close();
        this.ws = null;
    }
}