export interface DataSet {
    name: string;
    datapoints: DataPoint[];
}
export interface DataPoint {
    name: string;
    value: string;
    unit: string;
}
export interface DataMessage {
    type: string;
    name: string;
    datapoints: DataPoint[];
}