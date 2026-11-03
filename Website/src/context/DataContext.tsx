import React, {
    createContext,
    useContext,
    useEffect,
    useMemo, useRef,
    useState
} from "react";

import type {DataMessage, DataPoint, DataSet} from "../Services/types";
import { WebSocketService } from "../Services/WebSocketService";
import type { ConnectionService } from "../Services/ConnectionService";
import {createConnection} from "../Services/ServiceFactory";


interface DataContextType {
    datasets: Record<string, DataPoint[]>;   // dataset name -> datapoints
    liveData: Record<string, DataPoint>;     // point.name -> point (aus "live_data")
    errorCodes: DataSet;   // dataset name -> errorCodes

    isConnected: boolean;
    connectService: () => void;
    disconnectService: () => void;
}


const DataContext = createContext<DataContextType | null>(null);


export function DataProvider(
    { children }: { children: React.ReactNode }
) {

    const [datasets, setDatasets] = useState<Record<string, DataPoint[]>>({});
    const [isConnected, setIsConnected] = useState(false);

    const connectionRef = useRef<ConnectionService | null>(null);
    const unsubscribeRef = useRef<(() => void)[]>([]);

    // Disconnect when DataProvider unmounts
    useEffect(() => {
        return () => {
            connectionRef.current?.disconnect();
            connectionRef.current = null;
        };
    }, []);

    const connectService = () => {
        if (connectionRef.current !== null) return;

        const connection = createConnection();
        connectionRef.current = connection;

        const unsubscribeData = connection.subscribe((message: DataMessage) => {
            if (message.type === "dataset") {
                setDatasets(prev => ({
                    ...prev,
                    [message.name]: message.datapoints
                }));
            }
        });

        const unsubscribeStatus = connection.onConnectionChange((connected) => {
            if (connectionRef.current !== connection) return;

            setIsConnected(connected);

            if (!connected) {
                unsubscribeRef.current.forEach(unsubscribe => unsubscribe());
                unsubscribeRef.current = [];
                connectionRef.current = null;
            }
        });

        unsubscribeRef.current = [unsubscribeData, unsubscribeStatus];

        connection.connect();
    };

    const disconnectService = () => {
        unsubscribeRef.current.forEach(unsubscribe => unsubscribe());
        unsubscribeRef.current = [];

        connectionRef.current?.disconnect();
        connectionRef.current = null;

        setIsConnected(false);
    };


    const liveData = useMemo(
        () => Object.fromEntries(
            (datasets["live_data"] ?? []).map(
                point => [point.name, point]
            )
        ),
        [datasets]
    );

    const errorCodes: DataSet = useMemo(
        () => ({
            type: "dataset",
            name: "error_codes",
            datapoints: datasets["error_codes"] ?? []
        }),
        [datasets]
    );

    const value = useMemo(
        () => ({
            datasets,
            liveData,
            errorCodes,
            isConnected,
            connectService,
            disconnectService
        }),
        [datasets, liveData, errorCodes, isConnected]
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