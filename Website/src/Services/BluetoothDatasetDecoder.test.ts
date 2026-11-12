import { TextDecoder, TextEncoder } from "util";
import { BluetoothDatasetDecoder } from "./BluetoothDatasetDecoder";

const encoder = new TextEncoder();
const dataset = {
    type: "dataset",
    name: "error_codes",
    datapoints: [{
        code: "P0115",
        description: "Kühlmitteltemperatur",
        state: "stored",
        timestamp: null,
        metadata: { values: [87, true, null] },
    }],
};

function frame(bytes: Uint8Array, utf8Split?: number): DataView[] {
    const fragments: DataView[] = [];
    for (let offset = 0; offset < bytes.length;) {
        let end = Math.min(offset + 18, bytes.length);
        if (utf8Split !== undefined && utf8Split > offset) end = Math.min(end, utf8Split);
        const sequence = fragments.length;
        const flags = (offset === 0 ? 0x80 : 0) | (end === bytes.length ? 0x40 : 0);
        const packet = new Uint8Array(end - offset + 3);
        packet.set([flags | (sequence >> 8), sequence & 0xff], 1);
        packet.set(bytes.subarray(offset, end), 3);
        fragments.push(new DataView(packet.buffer, 1));
        offset = end;
    }
    return fragments;
}

const encoded = (message: unknown) => encoder.encode(JSON.stringify(message));

beforeAll(() => {
    if (typeof globalThis.TextDecoder === "undefined") {
        Object.defineProperty(globalThis, "TextDecoder", { configurable: true, value: TextDecoder });
    }
});

test("reassembles generic datapoints across UTF-8 and high sequence bytes", () => {
    const decoder = new BluetoothDatasetDecoder();
    const message = { ...dataset, datapoints: [{ ...dataset.datapoints[0], details: "x".repeat(5000) }] };
    const bytes = encoded(message);
    const fragments = frame(bytes, bytes.indexOf(0xc3) + 1);

    expect(fragments.length).toBeGreaterThan(256);
    expect(fragments.map(fragment => decoder.accept(fragment))).toEqual([
        ...Array(fragments.length - 1).fill(undefined), message,
    ]);
});

test("drops incomplete frames and recovers at a new start", () => {
    const decoder = new BluetoothDatasetDecoder();
    const fragments = frame(encoded(dataset));
    fragments.filter((_, index) => index !== 1).forEach(fragment => {
        expect(decoder.accept(fragment)).toBeUndefined();
    });
    decoder.accept(fragments[0]);
    expect(fragments.map(fragment => decoder.accept(fragment)).pop()).toEqual(dataset);
});

test("drops malformed or oversized datasets and accepts an empty list", () => {
    const decoder = new BluetoothDatasetDecoder();
    const invalid = frame(encoded({ ...dataset, datapoints: [null] }));
    const oversized = frame(encoded({ ...dataset, datapoints: [{ details: "x".repeat(65536) }] }));
    expect(invalid.map(fragment => decoder.accept(fragment)).pop()).toBeUndefined();
    expect(oversized.map(fragment => decoder.accept(fragment)).pop()).toBeUndefined();
    const empty = { ...dataset, datapoints: [] };
    expect(frame(encoded(empty)).map(fragment => decoder.accept(fragment)).pop()).toEqual(empty);
});
