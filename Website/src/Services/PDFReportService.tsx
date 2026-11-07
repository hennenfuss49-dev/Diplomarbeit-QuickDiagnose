
import { pdf } from "@react-pdf/renderer";
import { DiagnosisReport} from "../components/DiagnosisReport";
import type { DataPoint, DataSet } from "./types";

export interface ReportOptions {
    title?: string;
    filename?: string;

    // Complete datasets
    datasets?: DataSet[];

    // Individual datapoints
    datapoints?: DataPoint[];
}

export class PDFReportService {

    static async generateReport(options: ReportOptions): Promise<void> {
        const {
            title = "QuickDiagnose Report",
            filename = "QuickDiagnose_Report.pdf",
            datasets = [],
            datapoints = []
        } = options;

        // Copy datasets so we don't modify the originals
        const reportDatasets: DataSet[] = datasets.map(dataset => ({
            ...dataset,
            datapoints: [...dataset.datapoints]
        }));

        // Add individual datapoints as a separate dataset
        if (datapoints.length > 0) {
            reportDatasets.push({
                name: "Additional Measurements",
                datapoints: [...datapoints]
            });
        }

        // Generate PDF
        const blob = await pdf(
            <DiagnosisReport
                title={title}
                datasets={reportDatasets}
            />
        ).toBlob();

        // Download PDF
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        link.remove();

        // Clean up the temporary URL
        window.setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 60000);
    }
}
