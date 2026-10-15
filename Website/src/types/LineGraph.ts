export interface LineGraphDataPoint {
    xValue: number,
    yValue: number,
}

export interface LineGraphDataSet {
    colorCode: string,
    lineGraphDataPoints: LineGraphDataPoint[];
}

// mock data
export const mockLineGraphData: LineGraphDataSet = {
    colorCode: "#5542da",
    lineGraphDataPoints: [
        { xValue: 105, yValue: 50 },
        { xValue: 110, yValue: 54 },
        { xValue: 115, yValue: 52 },
        { xValue: 120, yValue: 58 },
        { xValue: 125, yValue: 61 },
        { xValue: 130, yValue: 59 },
        { xValue: 135, yValue: 65 },
        { xValue: 140, yValue: 69 },
        { xValue: 145, yValue: 66 },
        { xValue: 150, yValue: 72 },
        { xValue: 155, yValue: 70 },
        { xValue: 160, yValue: 76 },
        { xValue: 165, yValue: 81 },
        { xValue: 170, yValue: 78 },
        { xValue: 205, yValue: 97 },
        { xValue: 210, yValue: 101 },
        { xValue: 215, yValue: 98 },
        { xValue: 220, yValue: 104 },
        { xValue: 225, yValue: 108 },
        { xValue: 230, yValue: 105 },
        { xValue: 235, yValue: 111 },
        { xValue: 240, yValue: 116 },
        { xValue: 245, yValue: 113 },
        { xValue: 250, yValue: 119 },
        { xValue: 255, yValue: 123 },
        { xValue: 260, yValue: 120 },
        { xValue: 265, yValue: 126 },
        { xValue: 270, yValue: 130 },
    ],
};