import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";

import type { DataMessage, DataPoint } from "../Services/types";
import { WebSocketService } from "../Services/WebSocketService";


interface DataContextType {
    datasets: Record<string, DataPoint[]>;   // dataset name -> datapoints
    liveData: Record<string, DataPoint>;     // point.name -> point (aus "live_data")
}


const DataContext = createContext<DataContextType | null>(null);


export function DataProvider(
    { children }: { children: React.ReactNode }
) {

    const [datasets, setDatasets] = useState<Record<string, DataPoint[]>>({});

    useEffect(() => {

        const websocket = new WebSocketService(
            "ws://192.168.4.1/ws"
        );

        websocket.connect();

        const unsubscribe = websocket.subscribe(
            (message: DataMessage) => {
                if (message.type === "dataset") {
                    setDatasets(prev => ({
                        ...prev,
                        [message.name]: message.datapoints,
                    }));
                }
            }
        );

        return () => {
            unsubscribe();
            websocket.disconnect();
        };

    }, []);


    const liveData = useMemo(
        () =>
            Object.fromEntries(
                (datasets["live_data"] ?? []).map(point => [point.name, point])
            ),
        [datasets]
    );

    const value = useMemo(
        () => ({ datasets, liveData }),
        [datasets, liveData]
    );


    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}


export function useVehicleData(): DataContextType {

    const context = useContext(DataContext);

    if (!context) {
        throw new Error(
            "useVehicleData must be used inside DataProvider"
        );
    }

    return context;
}