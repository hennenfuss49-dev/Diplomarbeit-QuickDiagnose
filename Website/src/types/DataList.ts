import type { DataSet } from "../Services/types";

export const mockDataList: DataSet = {
    type: "dataset",
    name: "Vehicle Information",
    datapoints: [
        {
            key: "Vehicle Speed",
            value: 84,
            unit: "km/h"
        },
        {
            key: "Engine RPM",
            value: 2450,
            unit: "rpm"
        },
        {
            key: "Coolant Temperature",
            value: 91,
            unit: "°C"
        },
        {
            key: "Battery Voltage",
            value: 13.8,
            unit: "V"
        },
        {
            key: "Throttle Position",
            value: 32,
            unit: "%"
        },
        {
            key: "Fuel Level",
            value: 67,
            unit: "%"
        },
        {
            key: "Intake Air Temperature",
            value: 24,
            unit: "°C"
        },
        {
            key: "Engine Load",
            value: 41,
            unit: "%"
        },
        {
            key: "Fuel Pressure",
            value: 350,
            unit: "kPa"
        },
        {
            key: "Mass Air Flow",
            value: 18.4,
            unit: "g/s"
        }
    ]
};