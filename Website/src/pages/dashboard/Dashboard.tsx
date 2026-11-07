//styles
import './Dashboard.css'
import {NumberRangeDisplay} from "../../components/DataDisplays/NumberRangeDisplay";
import {Card} from "../../components/Card";
import {ListDisplay} from "../../components/DataDisplays/ListDisplay";
import {mockErrorCodes} from "../../types/ErrorCodes";
import {SimpleDataList} from "../../components/DataDisplays/SimpleDataList";
import {mockDataList} from "../../types/DataList";
import {LineGraphDisplay} from "../../components/DataDisplays/LineGraphDisplay";
import {mockLineGraphData} from "../../types/LineGraph";
import FilterIcon from '../../assets/img/filter_icon.svg';
import SettingsIcon from '../../assets/img/settings_icon.svg';
import React, {useState} from "react";
import {useVehicleData} from "../../context/DataContext";
import {PDFReportService} from "../../Services/PDFReportService";
import {DataSet} from "../../Services/types";


const initialCards = [
    {
        id: "card-8",
        title: "Card 8",
        span: 2,
        isVisible: true,
        content: (
            <ListDisplay
                datakey="error_codes"
                columns={[
                    { key: "code", label: "Error Code" },
                    { key: "description", label: "Description" },
                    { key: "state", label: "Status" },
                    { key: "timestamp", label: "Time" }
                ]}
            />
        ),
    },
    {
        id: "card-6",
        title: "Card 6",
        isVisible: true,
        content: <SimpleDataList
            dataset={mockDataList}
            labelKey="key"
            valueKey="value"
            unitKey="unit"
        />
    },
    {
        id: "card-1",
        title: "Card 1",
        isVisible: true,
        content: (
            <NumberRangeDisplay
                datakey="rpm"
                lowerBound={0}
                higherBound={8000}
                valueKey="value"
                unitKey="unit"
            />
        ),
    },
    {
        id: "card-2",
        title: "Card 2",
        isVisible: true,
        content: (
            <NumberRangeDisplay
                datakey="speed"
                higherBound={240}
                lowerBound={0}
                valueKey="value"
                unitKey="unit"
            />
        ),
    },
    {
        id: "card-3",
        title: "Card 3",
        isVisible: true,
        content: (
            <NumberRangeDisplay
                datakey="coolant"
                higherBound={150}
                lowerBound={0}
                valueKey="value"
                unitKey="unit"
            />
        ),
    },
    {
        id: "card-5",
        title: "Card 5",
        span: 2,
        isVisible: true,
        content: <LineGraphDisplay dataSet={mockLineGraphData} />,
    },
    {
        id: "card-4",
        title: "Card 4",
        isVisible: true,
        content: (
            <NumberRangeDisplay
                datakey="engine_load"
                higherBound={20}
                lowerBound={0}
                valueKey="value"
                unitKey="unit"
            />
        ),
    },
];

export const Dashboard = () => {
    const [displayOpen, setDisplayOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [cards, setCards] = useState(initialCards);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [displayMode, setDisplayMode] = useState<"grid" | "list">("grid");
    const { datasets, isConnected, connectService, disconnectService } = useVehicleData();

    const handleDragStart = (id: string, e: React.DragEvent) => {
        setDraggedId(id);
        cards.forEach(card => {
            if (card.id === id) return;

            document.getElementById(card.id)?.classList.add("dragZoneOverlay");
        })
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Required so drop works.
        e.currentTarget?.classList.add("dragZoneOverlayActive");
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.currentTarget?.classList.remove("dragZoneOverlayActive");
    }

    const handleDrop = (targetId: string) => {
        if (!draggedId || draggedId === targetId) return;

        const updated = [...cards];

        const from = updated.findIndex((c) => c.id === draggedId);
        const to = updated.findIndex((c) => c.id === targetId);

        const [moved] = updated.splice(from, 1);
        updated.splice(to, 0, moved);

        setCards(updated);
        setDraggedId(null);
    };

    const handleDragEnd = () => {
        cards.forEach(card => {
            if (card.id === draggedId) return;

            document.getElementById(card.id)?.classList.remove("dragZoneOverlay");
            document.getElementById(card.id)?.classList.remove("dragZoneOverlayActive");
        })

        setDraggedId(null);
    }

    const toggleCard = (index: number) => {
        setCards(prev =>
            prev.map((card, i) =>
                i === index
                    ? { ...card, isVisible: !card.isVisible }
                    : card
            )
        );
    };


    async function generatePdfReport() {
        try {
            const reportDatasets: DataSet[] =
                Object.entries(datasets).map(
                    ([name, datapoints]) => ({
                        type: "dataset",
                        name,
                        datapoints
                    })
                );

            console.log("PDF datasets:", reportDatasets);

            await PDFReportService.generateReport({
                title: "QuickDiagnose - Vehicle Report",
                filename: "Vehicle_Diagnosis.pdf",
                datasets: reportDatasets
            });

        } catch (error) {
            console.error("PDF generation failed:", error);
        }
    }

    return (
        <div className="dashboard">
            <div className="dashboard-topBar">

            </div>
            <div className="dashboard-actionBar">
                <div className="left">
                    <div className="actionDropdown">
                        <button
                            className="actionButton filterButton"
                            onMouseEnter={() => setDisplayOpen(true)}
                            onMouseLeave={() => setDisplayOpen(false)}
                        >
                            <img src={FilterIcon} alt="" />
                            Filter
                        </button>

                        {displayOpen && (
                            <div
                                className="actionButtonContent filterContent"
                                onMouseEnter={() => setDisplayOpen(true)}
                                onMouseLeave={() => setDisplayOpen(false)}
                            >
                                <div className="displayType">
                                    <button
                                        className={`displayAsGrid ${displayMode === "grid" ? "selected" : ""}`}
                                        onClick={() => setDisplayMode("grid")}
                                    >
                                        Grid
                                    </button>

                                    <button
                                        className={`displayAsList ${displayMode === "list" ? "selected" : ""}`}
                                        onClick={() => setDisplayMode("list")}
                                    >
                                        List
                                    </button>
                                </div>

                                {cards.map((card, index) => (
                                    <label key={index}>
                                        <input           type="checkbox"
                                                         checked={card.isVisible}
                                                         onChange={() => toggleCard(index)}/>
                                        {card.title}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="actionDropdown">
                        <button
                            className="actionButton filterButton"
                            onClick={() => setSettingsOpen(!settingsOpen)}
                        >
                            <img src={SettingsIcon} alt="" />
                            Settings
                        </button>

                        {settingsOpen && (
                            <div className="actionButtonContent filterContent">
                                <h4>Settings</h4>
                            </div>
                        )}
                    </div>
                </div>

                <div className="right">
                    <button className="actionButton" onClick={generatePdfReport}>
                        <span className="search-icon">⌕</span>
                        <span >Print Report</span>
                    </button>
                    <button className="actionButton" onClick={isConnected ? disconnectService : connectService}>
                        <div className={!isConnected ? "statusDisconnected" : "statusConnected"}></div>
                        {isConnected ? "Disconnect" : "Connect"}
                    </button>
                    <div className="searchbar">
                        <span className="search-icon">⌕</span>
                        <input type="text" placeholder="Search Dashboard"/>
                    </div>
                </div>

            </div>
            <div className={`dashboard-content ${displayMode === "list" ? "list" : "grid"}`}>
                {cards.map((card) => {
                    if (!card.isVisible) return null;

                    return (
                        <div
                            key={card.id}
                            id={card.id}
                            draggable
                            onDragStart={(e) => handleDragStart(card.id, e)}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={() => handleDrop(card.id)}
                            onDragEnd={handleDragEnd}
                            className={`draggable-wrapper ${draggedId === card.id ? "dragging" : ""}`}
                            style={
                                displayMode === "grid" && card.span !== 0
                                    ? { gridColumn: `span ${card.span}` }
                                    : undefined
                            }
                        >
                            <Card title={card.title}>{card.content}</Card>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
