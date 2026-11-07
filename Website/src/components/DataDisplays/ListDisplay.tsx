import "./ListDisplay.css";
import React from "react";
import { useVehicleData } from "../../context/DataContext";
import { displayValue } from "../../Services/DataUtils";
import { NoData } from "./NoData";
import type { DataPoint } from "../../Services/types";

export interface ListColumn {
    key: string;
    label: string;
}

interface ListDisplayProps {
    datakey: string;
    columns: ListColumn[];
}

function generateDataPointList(
    datapoints: DataPoint[],
    columns: ListColumn[]
): React.JSX.Element[] {
    return datapoints.map((dataPoint, index) => (
        <li className="listItem" key={index}>
            {columns.map(column => (
                <span key={column.key}>
                    {displayValue(dataPoint[column.key])}
                </span>
            ))}
        </li>
    ));
}

export const ListDisplay = ({
                                datakey,
                                columns
                            }: ListDisplayProps) => {
    const { datasets } = useVehicleData();

    const datapoints = datasets[datakey] ?? [];

    const hasData =
        columns.length > 0 &&
        datapoints.some(point =>
            columns.some(column => {
                const value = point[column.key];

                return value !== undefined &&
                    value !== null &&
                    value !== "";
            })
        );

    return (
        <div className="listContainer">
            {hasData ? (
                <>
                    <div className="listHeader">
                        {columns.map(column => (
                            <span key={column.key}>
                                {column.label}
                            </span>
                        ))}
                    </div>

                    <ul>
                        {generateDataPointList(datapoints, columns)}
                    </ul>
                </>
            ) : (
                <NoData />
            )}
        </div>
    );
};