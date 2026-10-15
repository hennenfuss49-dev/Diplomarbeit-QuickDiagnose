//styles
import './NumberRangeDisplay.css'
import {useVehicleData} from "../../context/DataContext";
import {useMemo} from "react";

type NumberRangeDisplay = {
    datakey: string,
    lowerBound: number,
    higherBound: number
}

function Gauge(value: number, max: number) {
    let percentage = value / max;
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

export const NumberRangeDisplay = ({ datakey, lowerBound, higherBound}: NumberRangeDisplay) => {
    const { liveData } = useVehicleData();

    const point = liveData[datakey];



    return (
        <div className="display-container">
            <div className="value">
                {point?.value}
            </div>
            <div className="unit">
                {point?.unit}
            </div>
            <div className="rangeDisplay">
                {Gauge(Number(point?.value), higherBound)}
            </div>
            <div className="bounds">
                <div className="lowerBound">
                    {lowerBound}
                </div>
                <div className="higherBound">
                    {higherBound}
                </div>
            </div>
        </div>
    );
};
