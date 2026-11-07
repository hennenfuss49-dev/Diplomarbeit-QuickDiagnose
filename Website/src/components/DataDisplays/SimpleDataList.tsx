import "./SimpleDataList.css";
import { displayValue } from "../../Services/DataUtils";
import type { DataSet } from "../../Services/types";
import { NoData } from "./NoData";

interface SimpleDataListProps {
    dataset: DataSet;
    labelKey: string;
    valueKey: string;
    unitKey?: string;
}

export const SimpleDataList = ({
                                   dataset,
                                   labelKey,
                                   valueKey,
                                   unitKey
                               }: SimpleDataListProps) => {

    const datapoints = dataset.datapoints ?? [];

    const hasData = datapoints.some(point => {
        const label = point[labelKey];
        const value = point[valueKey];

        return [label, value].some(
            item =>
                item !== undefined &&
                item !== null &&
                item !== ""
        );
    });

    if (!hasData) {
        return (
            <div className="simpleDataList">
                <NoData />
            </div>
        );
    }

    return (
        <ul className="simpleDataList">
            {datapoints.map((dataPoint, index) => {
                const label = dataPoint[labelKey];
                const value = dataPoint[valueKey];
                const unit = unitKey
                    ? dataPoint[unitKey]
                    : undefined;

                return (
                    <li
                        className="simpleListItem"
                        key={index}
                    >
                        <span>{displayValue(label)}</span>

                        <span>
                            {displayValue(value)}
                            {unit !== undefined && unit !== null
                                ? ` ${displayValue(unit)}`
                                : ""}
                        </span>
                    </li>
                );
            })}
        </ul>
    );
};