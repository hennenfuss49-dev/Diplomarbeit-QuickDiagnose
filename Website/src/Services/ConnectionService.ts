import type {DataMessage} from "./types";

export interface ConnectionService {

    connect(): void;
    subscribe( listener: (data: DataMessage) => void ): () => void;
    disconnect(): void;

    onConnectionChange(listener: (connected: boolean) => void): () => void;
}