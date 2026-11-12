import { BluetoothDatasetDecoder } from "./BluetoothDatasetDecoder";
import type { ConnectionService } from "./ConnectionService";
import type { DataMessage } from "./types";

const DEVICE_NAME = "QuickDiagnose-BLE";
const SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const NOTIFY_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

interface BluetoothCharacteristic extends EventTarget {
    readonly value?: DataView;
    startNotifications(): Promise<BluetoothCharacteristic>;
}

interface BluetoothGattServer {
    readonly connected: boolean;
    connect(): Promise<BluetoothGattServer>;
    disconnect(): void;
    getPrimaryService(uuid: string): Promise<{
        getCharacteristic(uuid: string): Promise<BluetoothCharacteristic>;
    }>;
}

interface BluetoothDevice extends EventTarget {
    readonly gatt?: BluetoothGattServer;
}

interface BluetoothAdapter {
    requestDevice(options: {
        filters: { name: string }[];
        optionalServices: string[];
    }): Promise<BluetoothDevice>;
}

interface BluetoothSession {
    readonly decoder: BluetoothDatasetDecoder;
    readonly onDisconnect: () => void;
    readonly onNotification: () => void;
    device?: BluetoothDevice;
    characteristic?: BluetoothCharacteristic;
}

export class BluetoothService implements ConnectionService {
    private readonly listeners = new Set<(data: DataMessage) => void>();
    private readonly statusListeners = new Set<(connected: boolean) => void>();
    private session?: BluetoothSession;

    subscribe(listener: (data: DataMessage) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    onConnectionChange(listener: (connected: boolean) => void): () => void {
        this.statusListeners.add(listener);
        return () => this.statusListeners.delete(listener);
    }

    connect(): void {
        if (this.session) return;

        const bluetooth = (navigator as Navigator & { bluetooth?: BluetoothAdapter }).bluetooth;
        if (!window.isSecureContext || !bluetooth) {
            console.error("Web Bluetooth requires a supported browser and a page opened on localhost or HTTPS.");
            this.notifyConnectionChange(false);
            return;
        }

        const session: BluetoothSession = {
            decoder: new BluetoothDatasetDecoder(),
            onDisconnect: () => {
                if (this.session === session && !session.device?.gatt?.connected) this.disconnect();
            },
            onNotification: () => {
                if (this.session !== session) return;
                const fragment = session.characteristic?.value;
                if (fragment) {
                    const message = session.decoder.accept(fragment);
                    if (message) this.listeners.forEach(listener => listener(message));
                }
            },
        };
        this.session = session;

        // Start the picker while the Dashboard click still grants user activation.
        void this.open(bluetooth, session).catch(error => {
            if (this.session !== session) return;
            this.disconnect();
            if (!(error instanceof DOMException && error.name === "NotFoundError")) {
                console.error("Bluetooth connection failed:", error);
            }
        });
    }

    disconnect(): void {
        const session = this.session;
        if (!session) return;
        this.session = undefined;

        const { device, characteristic } = session;
        characteristic?.removeEventListener("characteristicvaluechanged", session.onNotification);
        device?.removeEventListener("gattserverdisconnected", session.onDisconnect);
        session.decoder.reset();
        if (device?.gatt?.connected) device.gatt.disconnect();
        this.notifyConnectionChange(false);
    }

    private async open(bluetooth: BluetoothAdapter, session: BluetoothSession): Promise<void> {
        const device = await bluetooth.requestDevice({
            filters: [{ name: DEVICE_NAME }],
            optionalServices: [SERVICE_UUID],
        });
        if (this.session !== session) return;

        const server = device.gatt;
        if (!server) throw new Error("The selected device has no GATT server.");
        session.device = device;
        await server.connect();
        if (this.session !== session) {
            if (this.session?.device !== device && server.connected) server.disconnect();
            return;
        }

        device.addEventListener("gattserverdisconnected", session.onDisconnect);
        const service = await server.getPrimaryService(SERVICE_UUID);
        if (this.session !== session) return;
        const characteristic = await service.getCharacteristic(NOTIFY_UUID);
        if (this.session !== session) return;

        session.characteristic = characteristic;
        characteristic.addEventListener("characteristicvaluechanged", session.onNotification);
        await characteristic.startNotifications();
        if (this.session !== session) return;
        if (!server.connected) throw new Error("The Bluetooth connection ended during setup.");
        this.notifyConnectionChange(true);
    }

    private notifyConnectionChange(connected: boolean): void {
        this.statusListeners.forEach(listener => listener(connected));
    }
}
