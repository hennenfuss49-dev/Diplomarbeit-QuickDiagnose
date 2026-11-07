import type { ConnectionService } from "./ConnectionService";
import { WebSocketService } from "./WebSocketService";
// import { BluetoothService } from "./BluetoothService";

export type ConnectionType = "websocket" | "bluetooth";

let connectionType: ConnectionType = "websocket";

export function setConnectionType( type: ConnectionType) {
    connectionType = type;
    console.log(type)
}

export function getConnectionType(): ConnectionType {
    return connectionType;
}

export function createConnection(): ConnectionService {
    switch (connectionType) {
        case "websocket":
            return new WebSocketService("ws://127.0.0.100:80/ws");

        case "bluetooth":
            // return new BluetoothService();
            return new WebSocketService("bluetooth");
    }
}