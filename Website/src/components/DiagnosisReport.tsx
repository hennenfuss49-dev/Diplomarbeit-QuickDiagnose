
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet
} from "@react-pdf/renderer";

import type { DataSet } from "../Services/types";

interface DiagnosisReportProps {
    title: string;
    datasets: DataSet[];
}

const styles = StyleSheet.create({
    page: {
        padding: 35,
        paddingBottom: 55,
        fontSize: 10,
        fontFamily: "Helvetica",
        color: "#222222"
    },

    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 8
    },

    subtitle: {
        fontSize: 9,
        color: "#777777",
        marginBottom: 25
    },

    section: {
        marginBottom: 20
    },

    sectionTitle: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: "#cccccc"
    },

    row: {
        flexDirection: "row",
        paddingVertical: 6,
        borderBottomWidth: 0.5,
        borderBottomColor: "#eeeeee"
    },

    name: {
        width: "35%",
        paddingRight: 10,
        color: "#666666"
    },

    value: {
        width: "65%"
    },

    record: {
        marginBottom: 12
    },

    recordTitle: {
        fontSize: 11,
        fontWeight: "bold",
        marginBottom: 5
    },

    nested: {
        marginLeft: 12,
        marginTop: 5
    },

    empty: {
        fontSize: 9,
        color: "#999999"
    },

    footer: {
        position: "absolute",
        bottom: 20,
        left: 35,
        right: 35,
        fontSize: 8,
        color: "#999999",
        textAlign: "center"
    }
});

// Format field names
function formatLabel(key: string): string {
    return key
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, char => char.toUpperCase());
}

// Convert values to printable text
function formatValue(value: unknown): string {
    if (value === null || value === undefined) {
        return "-";
    }

    if (typeof value === "boolean") {
        return value ? "Yes" : "No";
    }

    if (typeof value === "object") {
        return JSON.stringify(value);
    }

    return String(value);
}

// Render any datapoint, regardless of structure
function renderDataPoint(
    point: Record<string, unknown>,
    index: number
) {
    const fields = Object.entries(point);

    return (
        <View
            key={index}
            style={styles.record}
        >
            {fields.map(([key, value]) => (
                <View
                    key={key}
                    style={styles.row}
                    wrap={false}
                >
                    <Text style={styles.name}>
                        {formatLabel(key)}
                    </Text>

                    <Text style={styles.value}>
                        {formatValue(value)}
                    </Text>
                </View>
            ))}
        </View>
    );
}

export const DiagnosisReport = ({
                                    title,
                                    datasets
                                }: DiagnosisReportProps) => {

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Header */}
                <Text style={styles.title}>
                    {title}
                </Text>

                <Text style={styles.subtitle}>
                    Generated: {new Date().toLocaleString("de-AT")}
                </Text>

                {/* All datasets */}
                {datasets.map((dataset, index) => (
                    <View
                        key={`${dataset.name}-${index}`}
                        style={styles.section}
                    >
                        <Text style={styles.sectionTitle}>
                            {formatLabel(dataset.name)}
                        </Text>

                        {dataset.datapoints.length === 0 ? (
                            <Text style={styles.empty}>
                                No data available
                            </Text>
                        ) : (
                            dataset.datapoints.map((point, i) =>
                                renderDataPoint(point, i)
                            )
                        )}
                    </View>
                ))}

                {/* Footer */}
                <Text
                    style={styles.footer}
                    fixed
                    render={({ pageNumber, totalPages }) =>
                        `QuickDiagnose | Page ${pageNumber} of ${totalPages}`
                    }
                />

            </Page>
        </Document>
    );
};
