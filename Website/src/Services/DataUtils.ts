import type { DataPoint, DataValue } from "./types";

export function getValue(
    point: DataPoint | undefined,
    key: string
): DataValue | undefined {
    return point?.[key];
}

export function displayValue(
    value: DataValue | undefined
): string {
    if (value === undefined || value === null) {
        return "";
    }

    if (typeof value === "object") {
        return JSON.stringify(value);
    }

    return String(value);
}