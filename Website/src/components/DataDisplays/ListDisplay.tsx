// styles
import './ListDisplay.css'
import {ErrorCodeDataSet} from "../../types/ErrorCodes";
import React from "react";
import {DataSet} from "../../Services/types";
import {useVehicleData} from "../../context/DataContext";

function generateDataPointList(dataset: DataSet): React.JSX.Element[] {
    return dataset.datapoints.map((dataPoint) => (
        <li className="listItem" key={`${dataPoint.code}-${dataPoint?.timestamp}`}>
            <span>{dataPoint?.code}</span>
            <span>{dataPoint?.description}</span>
            <span>{dataPoint?.state}</span>
            {/*<span>{dataPoint.timestamp.toLocaleString()}</span>*/}
        </li>
    ));
}


type ListDisplayProps = {
    datakey: string;
    header: string[];
};

export const ListDisplay = ({ datakey, header }: ListDisplayProps) => {
    const { errorCodes } = useVehicleData()


    return (
        <div className={"listContainer"}>
            <div className="listHeader">
                {header.map((e) => (
                    <span key={e}>{e}</span>
                ))}
            </div>

            <ul>
                {generateDataPointList(errorCodes)}
            </ul>
        </div>
    );
};
