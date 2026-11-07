
import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    useCallback
} from "react";

import type { DataMessage, DataPoint } from "../Services/types";
import type { ConnectionService } from "../Services/ConnectionService";
import { createConnection } from "../Services/ServiceFactory";

export type DatasetStore = Record<string, DataPoint[]>;

interface DataContextType {
    datasets: DatasetStore;

    isConnected: boolean;
    connectService: () => void;
    disconnectService: () => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({
                                 children
                             }: {
    children: React.ReactNode;
}) {
    const [datasets, setDatasets] = useState<DatasetStore>({});
    const [isConnected, setIsConnected] = useState(false);

    const connectionRef = useRef<ConnectionService | null>(null);
    const unsubscribeRef = useRef<Array<() => void>>([]);

    const cleanupSubscriptions = useCallback(() => {
        unsubscribeRef.current.forEach(unsubscribe => unsubscribe());
        unsubscribeRef.current = [];
    }, []);

    const disconnectService = useCallback(() => {
        cleanupSubscriptions();

        const connection = connectionRef.current;
        connectionRef.current = null;

        connection?.disconnect();
        setIsConnected(false);
    }, [cleanupSubscriptions]);

    // Disconnect when the provider unmounts
    useEffect(() => {
        return () => {
            cleanupSubscriptions();

            connectionRef.current?.disconnect();
            connectionRef.current = null;
        };
    }, [cleanupSubscriptions]);

    const connectService = useCallback(() => {
        if (connectionRef.current !== null) return;

        const connection = createConnection();
        connectionRef.current = connection;

        const unsubscribeData = connection.subscribe(
            (message: DataMessage) => {
                if (connectionRef.current !== connection) return;

                if (
                    message.type === "dataset" &&
                    Array.isArray(message.datapoints)
                ) {
                    setDatasets(prev => ({
                        ...prev,
                        [message.name]: message.datapoints
                    }));
                }
            }
        );

        const unsubscribeStatus = connection.onConnectionChange(
            (connected: boolean) => {
                if (connectionRef.current !== connection) return;

                setIsConnected(connected);

                if (!connected) {
                    cleanupSubscriptions();
                    connectionRef.current = null;
                }
            }
        );

        unsubscribeRef.current = [
            unsubscribeData,
            unsubscribeStatus
        ];

        try {
            connection.connect();
        } catch (error) {
            cleanupSubscriptions();
            connectionRef.current = null;
            setIsConnected(false);
            console.error("Connection failed:", error);
        }
    }, [cleanupSubscriptions]);

    const value = useMemo<DataContextType>(
        () => ({
            datasets,
            isConnected,
            connectService,
            disconnectService
        }),
        [
            datasets,
            isConnected,
            connectService,
            disconnectService
        ]
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
