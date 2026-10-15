export interface ErrorCodeDataPoint {
    code: string,
    description: string,
    state: string,
    timestamp: Date
}

export interface ErrorCodeDataSet {
    data: ErrorCodeDataPoint[]
}

export const mockErrorCodes: ErrorCodeDataSet = {
    data: [
        {
            code: "P0300",
            description: "Random/Multiple Cylinder Misfire Detected",
            state: "Active",
            timestamp: new Date("2026-09-02T08:42:15"),
        },
        {
            code: "P0171",
            description: "System Too Lean (Bank 1)",
            state: "Active",
            timestamp: new Date("2026-09-02T08:38:42"),
        },
        {
            code: "P0420",
            description: "Catalyst System Efficiency Below Threshold",
            state: "Pending",
            timestamp: new Date("2026-09-02T07:54:11"),
        },
        {
            code: "P0128",
            description: "Coolant Thermostat Temperature Below Regulating Temperature",
            state: "Resolved",
            timestamp: new Date("2026-09-01T18:23:05"),
        },
        {
            code: "P0455",
            description: "Evaporative Emission System Leak Detected",
            state: "Active",
            timestamp: new Date("2026-09-01T14:16:37"),
        },
        {
            code: "P0302",
            description: "Cylinder 2 Misfire Detected",
            state: "Pending",
            timestamp: new Date("2026-09-01T12:04:51"),
        },
        {
            code: "P0113",
            description: "Intake Air Temperature Sensor Circuit High Input",
            state: "Resolved",
            timestamp: new Date("2026-08-31T21:32:19"),
        },
        {
            code: "P0500",
            description: "Vehicle Speed Sensor Malfunction",
            state: "Active",
            timestamp: new Date("2026-08-31T16:47:03"),
        },
        {
            code: "P0562",
            description: "System Voltage Low",
            state: "Resolved",
            timestamp: new Date("2026-08-30T10:12:44"),
        },
        {
            code: "P0700",
            description: "Transmission Control System Malfunction",
            state: "Pending",
            timestamp: new Date("2026-08-29T17:28:09"),
        },
    ],
};