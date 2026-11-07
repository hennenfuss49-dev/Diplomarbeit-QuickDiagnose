//styles
import './ErrorCodes.css'
import {ListDisplay} from "../../components/DataDisplays/ListDisplay";
import React from "react";

export const ErrorCodes = () => {
    return (
        <>
            <ListDisplay
                datakey="error_codes"
                columns={[
                    { key: "code", label: "Error Code" },
                    { key: "description", label: "Description" },
                    { key: "state", label: "Status" },
                    { key: "timestamp", label: "Time" }
                ]}
            />
        </>
    );
};
