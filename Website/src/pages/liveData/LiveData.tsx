//styles
import './LiveData.css'
import {NumberRangeDisplay} from "../../components/DataDisplays/NumberRangeDisplay";
import React from "react";

export const LiveData = () => {
    return (
        <div className="liveDataGrid">
            <NumberRangeDisplay
                datakey="rpm"
                lowerBound={0}
                higherBound={8000}
                valueKey="value"
                unitKey="unit"
            />
            <NumberRangeDisplay
                datakey="speed"
                higherBound={240}
                lowerBound={0}
                valueKey="value"
                unitKey="unit"
            />
            <NumberRangeDisplay
                datakey="coolant"
                higherBound={150}
                lowerBound={0}
                valueKey="value"
                unitKey="unit"
            />
            <NumberRangeDisplay
                datakey="engine_load"
                higherBound={20}
                lowerBound={0}
                valueKey="value"
                unitKey="unit"
            />
        </div>
    );
};
