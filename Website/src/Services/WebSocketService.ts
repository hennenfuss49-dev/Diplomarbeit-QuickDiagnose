import type { DataMessage } from "./types";

export class WebSocketService {

    private ws: WebSocket | null = null;

    private listeners: Array<(data: DataMessage) => void> = [];

    constructor(private readonly url: string) {}

    connect(): void {

        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log("WebSocket connected");
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