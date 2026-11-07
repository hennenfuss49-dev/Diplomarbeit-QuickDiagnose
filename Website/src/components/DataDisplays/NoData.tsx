import "./NoData.css";

interface NoDataProps {
    message?: string;
}

export const NoData = ({
                           message = "No data available"
                       }: NoDataProps) => {
    return (
        <div className="noData">
            <span className="noDataIcon">—</span>
            <span>{message}</span>
        </div>
    );
};