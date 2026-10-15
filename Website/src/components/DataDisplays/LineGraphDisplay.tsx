//styles
import './LineGraphDisplay.css'
import {useEffect, useRef} from "react";
import {LineGraphDataPoint, LineGraphDataSet} from "../../types/LineGraph";

interface CanvasProps {
    dataSet: LineGraphDataSet;
}

let upperXBound = 0;
let lowerXBound = 0;
let upperYBound = 0;
let lowerYBound = 0;
const leftPadding = 40;
const bottomPadding = 25;

function hexToRgb(hex:string) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function calculateNormalizedPointInCanvas(canvasWidth: number, canvasHeight: number, xValue: number, yValue: number, lowerXBound: number, upperXBound: number, lowerYBound: number, upperYBound: number): LineGraphDataPoint {
    const normalizedX = ((xValue - lowerXBound) / (upperXBound - lowerXBound)) * canvasWidth + leftPadding;
    const normalizedY = ((yValue - lowerYBound * 0.5) / (upperYBound - lowerYBound * 0.5)) * canvasHeight - bottomPadding;
    return {
        xValue: normalizedX,
        yValue: normalizedY,
    }
}

function drawLineGraph(ctx: CanvasRenderingContext2D, dataSet: LineGraphDataSet, width: number, height: number) {
    ctx.beginPath();
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = dataSet.colorCode;
    dataSet.lineGraphDataPoints.forEach(point => {
        point = calculateNormalizedPointInCanvas(width, height, point.xValue, point.yValue, lowerXBound, upperXBound, lowerYBound, upperYBound);
        ctx.lineTo(point.xValue, point.yValue);
        ctx.stroke();
    })

    const grad=ctx.createLinearGradient(0,130, 0,0);
    grad.addColorStop(0, `rgba(${hexToRgb(dataSet.colorCode)?.r}, ${hexToRgb(dataSet.colorCode)?.g}, ${hexToRgb(dataSet.colorCode)?.b}, 0.0)`);
    grad.addColorStop(0.5, `rgba(${hexToRgb(dataSet.colorCode)?.r}, ${hexToRgb(dataSet.colorCode)?.g}, ${hexToRgb(dataSet.colorCode)?.b}, 0.3)`);
    grad.addColorStop(1, `rgba(${hexToRgb(dataSet.colorCode)?.r}, ${hexToRgb(dataSet.colorCode)?.g}, ${hexToRgb(dataSet.colorCode)?.b}, 0.3)`);
    ctx.fillStyle = grad;
    ctx.lineWidth = 0;
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fill();
    ctx.closePath();
}

export const LineGraphDisplay = ({ dataSet }: CanvasProps) => {

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    upperXBound = Math.max(...dataSet.lineGraphDataPoints.map(point => point.xValue));
    lowerXBound = Math.min(...dataSet.lineGraphDataPoints.map(point => point.xValue));
    upperYBound = Math.max(...dataSet.lineGraphDataPoints.map(point => point.yValue));
    lowerYBound = Math.min(...dataSet.lineGraphDataPoints.map(point => point.yValue));

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const container = canvas.parentElement;
        if (!container) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resizeCanvas = () => {
            const rect = container.getBoundingClientRect();

            canvas.width = rect.width;
            canvas.height = rect.height;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const xStep = canvas.width / 10; // 10 vertical grid lines
            const yStep = canvas.height / 8; // 10 horizontal grid lines
            drawCanvasGrid(ctx, xStep, yStep, canvas.width, canvas.height);
            drawLineGraph(ctx, dataSet, canvas.width, canvas.height);

        };

        resizeCanvas();

        const observer = new ResizeObserver(resizeCanvas);
        observer.observe(container);

        return () => observer.disconnect();
    }, []);

    return (
        <div className="canvasContainer">
            <canvas ref={canvasRef} />
        </div>
    );
};

function drawCanvasGrid(
    ctx: CanvasRenderingContext2D,
    xStep: number,
    yStep: number,
    width: number,
    height: number
) {

    const gridWidth = width - leftPadding;
    const gridHeight = height - bottomPadding;

    ctx.beginPath();
    ctx.strokeStyle = "rgba(224,224,224,0.34)";
    ctx.font = "1em Inter";
    ctx.fillStyle = "#fff";

    // Vertical grid lines + X labels
    for (let x = 0; x <= gridWidth; x += xStep) {
        const canvasX = leftPadding + x;

        ctx.moveTo(canvasX, 0);
        ctx.lineTo(canvasX, gridHeight);

        const value = Math.round(
            (x / gridWidth) *
            (upperXBound - lowerXBound) +
            lowerXBound
        );

        if (x === 0) {
            ctx.textAlign = "left";
        } else if (x >= gridWidth) {
            ctx.textAlign = "right";
        } else {
            ctx.textAlign = "center";
        }

        ctx.textBaseline = "top";

        ctx.fillText(
            `${value}`,
            canvasX,
            gridHeight + 5
        );
    }

    // Horizontal grid lines + Y labels
    for (let y = 0; y <= gridHeight; y += yStep) {
        ctx.moveTo(leftPadding, y);
        ctx.lineTo(width, y);

        const value = Math.round(
            (1 - y / gridHeight) *
            (upperYBound - lowerYBound) +
            lowerYBound
        );

        ctx.textAlign = "right";

        if (y === 0) {
            ctx.textBaseline = "top";
        } else if (y >= gridHeight) {
            ctx.textBaseline = "bottom";
        } else {
            ctx.textBaseline = "middle";
        }

        ctx.fillText(
            `${value}`,
            leftPadding - 5,
            y
        );
    }

    ctx.stroke();
}
