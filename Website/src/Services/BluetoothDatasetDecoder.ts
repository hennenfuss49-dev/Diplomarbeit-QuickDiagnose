import type { DataMessage } from "./types";

const START = 0x80;
const END = 0x40;
const SEQUENCE_MASK = 0x3f;
const MAX_SEQUENCE = 0x3fff;
const HEADER_SIZE = 2;
const MAX_PAYLOAD_SIZE = 18;
const MAX_DATASET_SIZE = 64 * 1024;

export class BluetoothDatasetDecoder {
    private readonly buffer = new Uint8Array(MAX_DATASET_SIZE);
    private readonly decoder = new TextDecoder("utf-8", { fatal: true });
    private length = 0;
    private nextSequence: number | undefined;

    accept(fragment: DataView): DataMessage | undefined {
        const payloadSize = fragment.byteLength - HEADER_SIZE;
        if (payloadSize < 1 || payloadSize > MAX_PAYLOAD_SIZE) {
            this.reset();
            return;
        }

        const header = fragment.getUint8(0);
        const sequence = ((header & SEQUENCE_MASK) << 8) | fragment.getUint8(1);

        if (header & START) {
            this.reset();
            this.nextSequence = 0;
        }
        if (sequence !== this.nextSequence || this.length + payloadSize > this.buffer.length) {
            this.reset();
            return;
        }

        const payload = new Uint8Array(fragment.buffer, fragment.byteOffset + HEADER_SIZE, payloadSize);
        this.buffer.set(payload, this.length);
        this.length += payloadSize;
        this.nextSequence = sequence + 1;

        if (header & END) {
            const message = this.buffer.subarray(0, this.length);
            this.reset();
            return this.decode(message);
        }
        if (sequence === MAX_SEQUENCE || this.length === this.buffer.length) this.reset();
    }

    reset(): void {
        this.length = 0;
        this.nextSequence = undefined;
    }

    private decode(bytes: Uint8Array): DataMessage | undefined {
        try {
            const message: Partial<DataMessage> | null = JSON.parse(this.decoder.decode(bytes));
            if (
                message?.type === "dataset" &&
                typeof message.name === "string" &&
                Array.isArray(message.datapoints) &&
                message.datapoints.every(point => point !== null && typeof point === "object" && !Array.isArray(point))
            ) {
                return { type: message.type, name: message.name, datapoints: message.datapoints };
            }
        } catch {
            // Drop malformed UTF-8 and JSON. The next START begins a new dataset.
        }
    }
}
