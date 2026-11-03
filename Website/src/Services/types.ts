export interface DataSet {
    name: string;
    datapoints: DataPoint[];
}

// for Live-Data
export interface DataPoint {
    name: string;
    value: string;
    unit: string;
}

// for Error Codes
export interface DataPoint {
    code: string;
    description: string;
    state: string;
    timestamp: Date;
}

export interface DataMessage {
    type: string;
    name: string;
    datapoints: DataPoint[];
}