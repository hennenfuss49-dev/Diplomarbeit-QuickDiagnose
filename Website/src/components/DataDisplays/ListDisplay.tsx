// styles
import './ListDisplay.css'
import {ErrorCodeDataSet} from "../../types/ErrorCodes";
import React from "react";

function generateDataPointList(dataset: ErrorCodeDataSet): React.JSX.Element[] {
    return dataset.data.map((dataPoint) => (
        <li className="listItem" key={`${dataPoint.code}-${dataPoint.timestamp.getTime()}`}>
            <span>{dataPoint.code}</span>
            <span>{dataPoint.description}</span>
            <span>{dataPoint.state}</span>
            <span>{dataPoint.timestamp.toLocaleString()}</span>
        </li>
    ));
}


type ListDisplayProps = {
    dataset: ErrorCodeDataSet;
    header: string[];
};

export const ListDisplay = ({ dataset, header }: ListDisplayProps) => {
    return (
        <div className={"listContainer"}>
            <div className="listHeader">
                {header.map((e) => (
                    <span key={e}>{e}</span>
                ))}
            </div>

            <ul>
                {generateDataPointList(dataset)}
            </ul>
        </div>
    );
};
