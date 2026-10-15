//styles
import './SimpleDataList.css'
import {DataListDataSet} from "../../types/DataList";
import React from "react";

type SimpleDataListProps = {
    dataset: DataListDataSet;
};

export const SimpleDataList = ({ dataset }: SimpleDataListProps) => {
    return (
        <ul className="simpleDataList">
            {dataset.data.map((dataPoint) => (
                <li className="simpleListItem" key={dataPoint.key}>
                    <span>{dataPoint.key}</span>
                    <span>{dataPoint.value}</span>
                </li>
            ))}
        </ul>
    );
};