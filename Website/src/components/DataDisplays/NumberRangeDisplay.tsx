
import "./NumberRangeDisplay.css";
import { useVehicleData } from "../../context/DataContext";
import { displayValue } from "../../Services/DataUtils";
import {NoData} from "./NoData";

interface NumberRangeDisplayProps {
    datakey: string;
    lowerBound: number;
    higherBound: number;

    valueKey?: string;
    unitKey?: string;
}

function Gauge(
    value: number,
    min: number,
    max: number
) {
    const range = max - min;

    const percentage = range > 0
        ? Math.max(0, Math.min(1, (value - min) / range))
        : 0;

    return (
        <svg className="gauge" viewBox="0 0 200 120">
            <path
                className="gauge-background"
                d="M 20 100 A 80 80 0 0 1 180 100"
            />

            <path
                className="gauge-progress"
                pathLength="100"
                d="M 20 100 A 80 80 0 0 1 180 100"
                style={{
                    strokeDasharray: "100",
                    strokeDashoffset: 100 - percentage * 100
                }}
            />
        </svg>
    );
}

export const NumberRangeDisplay = ({
                                       datakey,
                                       lowerBound,
                                       higherBound,
                                       valueKey = "value",
                                       unitKey = "unit"
                                   }: NumberRangeDisplayProps) => {

    const { datasets } = useVehicleData();

    const point = datasets["live_data"]?.find(
        dataPoint => dataPoint.name === datakey
    );

    const rawValue = point?.[valueKey];
    const rawUnit = point?.[unitKey];

    const numericValue = Number(rawValue);
    const validValue =
        rawValue !== undefined &&
        rawValue !== null &&
        rawValue !== "" &&
        Number.isFinite(numericValue);

    const hasData =
        rawValue !== undefined &&
        rawValue !== null &&
        rawValue !== "" &&
        typeof rawValue !== "boolean" &&
        typeof rawValue !== "object" &&
        Number.isFinite(numericValue);

    if (!hasData) {
        return (
            <div className="display-container">
                <NoData message="No measurement available" />
            </div>
        );
    }

    return (
        <div className="display-container">
            <div className="value">
                {displayValue(rawValue)}
            </div>

            <div className="unit">
                {displayValue(rawUnit)}
            </div>

            <div className="rangeDisplay">
                {Gauge(
                    validValue ? numericValue : lowerBound,
                    lowerBound,
                    higherBound
                )}
            </div>
        </div>
    );
};
