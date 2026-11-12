import { act, fireEvent, render, screen } from "@testing-library/react";
import { TextDecoder, TextEncoder } from "util";
import { DataProvider, useVehicleData } from "../context/DataContext";
import { getConnectionType, setConnectionType } from "./ServiceFactory";

function replaceProperty(target: object, key: string, value: unknown): () => void {
    const previous = Object.getOwnPropertyDescriptor(target, key);
    Object.defineProperty(target, key, { configurable: true, value });
    return () => {
        if (previous) Object.defineProperty(target, key, previous);
        else Reflect.deleteProperty(target, key);
    };
}

function ConnectionControl() {
    const { connectService, disconnectService, isConnected, datasets } = useVehicleData();
    return (
        <>
            <button onClick={isConnected ? disconnectService : connectService}>
                {isConnected ? "Disconnect" : "Connect"}
            </button>
            <output>{String(datasets.error_codes?.[0]?.code ?? "")}</output>
        </>
    );
}

test("the existing connection controls can retry a canceled picker and receive BLE data", async () => {
    const characteristic = Object.assign(new EventTarget(), {
        value: new DataView(new ArrayBuffer(0)),
        startNotifications: jest.fn(async () => undefined),
    });
    const device = Object.assign(new EventTarget(), {
        gatt: {
            connected: false,
            async connect() { this.connected = true; },
            disconnect() { this.connected = false; },
            getPrimaryService: async () => ({ getCharacteristic: async () => characteristic }),
        },
    });
    const requestDevice = jest.fn()
        .mockRejectedValueOnce(new DOMException("Picker canceled", "NotFoundError"))
        .mockResolvedValue(device);
    const previousType = getConnectionType();
    const restore = [
        replaceProperty(window, "isSecureContext", true),
        replaceProperty(window, "TextDecoder", TextDecoder),
        replaceProperty(navigator, "bluetooth", { requestDevice }),
    ];
    setConnectionType("bluetooth");
    const view = render(<DataProvider><ConnectionControl /></DataProvider>);

    try {
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Connect" }));
            expect(requestDevice).toHaveBeenCalledTimes(1);
        });
        await act(async () => fireEvent.click(screen.getByRole("button", { name: "Connect" })));
        expect(requestDevice).toHaveBeenCalledTimes(2);
        expect(characteristic.startNotifications).toHaveBeenCalledTimes(1);
        expect(screen.getByRole("button", { name: "Disconnect" })).toBeInTheDocument();

        act(() => {
            const message = { type: "dataset", name: "error_codes", datapoints: [{ code: "P0115" }] };
            const bytes = new TextEncoder().encode(JSON.stringify(message));
            for (let offset = 0; offset < bytes.length; offset += 18) {
                const payload = bytes.subarray(offset, offset + 18);
                const packet = new Uint8Array(2 + payload.length);
                const flags = (offset === 0 ? 0x80 : 0) | (offset + payload.length === bytes.length ? 0x40 : 0);
                packet.set([flags, offset / 18]);
                packet.set(payload, 2);
                characteristic.value = new DataView(packet.buffer);
                characteristic.dispatchEvent(new Event("characteristicvaluechanged"));
            }
        });
        expect(screen.getByText("P0115")).toBeInTheDocument();

        act(() => {
            device.gatt.connected = false;
            device.dispatchEvent(new Event("gattserverdisconnected"));
        });
        expect(screen.getByRole("button", { name: "Connect" })).toBeInTheDocument();
        await act(async () => fireEvent.click(screen.getByRole("button", { name: "Connect" })));
        expect(requestDevice).toHaveBeenCalledTimes(3);
        fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
        expect(device.gatt.connected).toBe(false);
    } finally {
        view.unmount();
        restore.forEach(reset => reset());
        setConnectionType(previousType);
    }
});
