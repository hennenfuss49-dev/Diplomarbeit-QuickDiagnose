export interface DataListDataPoint {
    key: string,
    value: string,
}

export interface DataListDataSet {
    data: DataListDataPoint[]
}


export const mockDataList: DataListDataSet = {
    data: [
        {
            key: "Vehicle Speed",
            value: "84 km/h",
        },
        {
            key: "Engine RPM",
            value: "2450 rpm",
        },
        {
            key: "Coolant Temperature",
            value: "91 °C",
        },
        {
            key: "Battery Voltage",
            value: "13.8 V",
        },
        {
            key: "Throttle Position",
            value: "32 %",
        },
        {
            key: "Fuel Level",
            value: "67 %",
        },
        {
            key: "Intake Air Temperature",
            value: "24 °C",
        },
        {
            key: "Engine Load",
            value: "41 %",
        },
        {
            key: "Fuel Pressure",
            value: "350 kPa",
        },
        {
            key: "Mass Air Flow",
            value: "18.4 g/s",
        },
        {
            key: "Mass Air Flow",
            value: "18.4 g/s",
        },
    ],
};