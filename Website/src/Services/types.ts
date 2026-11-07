export type DataValue =
    | string
    | number
    | boolean
    | null
    | DataValue[]
    | { [key: string]: DataValue };

export interface DataPoint {
    [key: string]: DataValue;
}

export interface DataSet {
    type?: string;
    name: string;
    datapoints: DataPoint[];
}

export interface DataMessage {
    type: string;
    name: string;
    datapoints: DataPoint[];
}